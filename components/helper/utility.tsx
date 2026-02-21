import { SupabaseClient } from '@supabase/supabase-js';

// 1. Helper to get today's date in YYYY-MM-DD format (Local Timezone)
export const getTodayDate = () => {
  const date = new Date();
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - (offset * 60 * 1000));
  return localDate.toISOString().split('T')[0];
};

/**
 * @function isLongTerm
 * @description Checks if an investment is "Long Term" by comparing the holding period against 365 days.
 * @param {Date | string} purchaseDate - The date the asset was purchased.
 * @param {Date | string} saleDate - The date the asset was sold (defaults to current date for unrealized checks).
 * @returns {boolean} - True if the holding period is greater than 365 days.
 */
export const isLongTerm = (purchaseDate: string | Date, saleDate: string | Date = new Date()): boolean => {
  // Normalize inputs to Date objects
  const start = new Date(purchaseDate);
  const end = new Date(saleDate);

  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays > 365;
};

/**
 * @function isSquareOff
 * @description Checks if a trade is a "Square Off" (bought and sold on the same day).
 * @param {Date | string} purchaseDate 
 * @param {Date | string} saleDate 
 * @returns {boolean}
 */
export const isSquareOff = (purchaseDate: string | Date, saleDate: string | Date): boolean => {
  const p = new Date(purchaseDate).toISOString().split('T')[0];
  const s = new Date(saleDate).toISOString().split('T')[0];
  return p === s;
};

/**
 * Fetches the Grandfathered (Cutoff) Rate for a Ticker from the Assets table.
 * @param supabase - The Supabase client instance
 * @param ticker - The stock symbol
 * @returns The cutoff price or null if not found/set
 */
export async function getGrandfatheredRate(
  supabase: SupabaseClient,
  ticker: string
): Promise<number | null> {
  const { data, error } = await supabase
    .from('assets')
    .select('cutoff')
    .eq('ticker', ticker)
    .single();

  if (error || !data) return null;
  return Number(data.cutoff);
}

/**
 * Calculates Standard and Adjusted Profit.
 * * Logic:
 * - Standard Profit: (Sale Rate - Purchase Rate) * Qty
 * - Adjusted Profit: Applies Grandfathering if purchase date < Feb 1, 2018.
 * New Cost Basis = Max(Purchase Rate, Min(Sale Rate, Cutoff Rate))
 * * @param purchasePrice - Rate at which asset was bought
 * @param purchaseDate - Date of purchase (string or Date object)
 * @param salePrice - Rate at which asset was sold
 * @param cutoffPrice - The grandfathered rate (Jan 31, 2018 price), can be null
 * @param quantity - Number of units (default 1)
 */
export function calculateProfitMetrics(
  purchasePrice: number,
  purchaseDate: string | Date,
  salePrice: number,
  cutoffPrice: number | null,
  quantity: number = 1
) {
  const pDate = new Date(purchaseDate);
  const grandFatherDate = new Date('2018-02-01');

  // 1. Standard Profit
  const standardProfit = (salePrice - purchasePrice) * quantity;

  // 2. Adjusted Profit (Grandfathering Logic)
  let adjustedProfit = standardProfit;

  // Only apply logic if bought before cutoff and a valid cutoff price exists
  if (pDate < grandFatherDate && cutoffPrice !== null && cutoffPrice > 0) {
    if (salePrice > purchasePrice && salePrice < cutoffPrice) adjustedProfit = 0;
    else if (salePrice > cutoffPrice) adjustedProfit = (salePrice - purchasePrice) * quantity;
  }

  return {
    profit: standardProfit,
    adjusted_profit: adjustedProfit
  };
}