"use server"

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import YahooFinance from 'yahoo-finance2';

/**
 * @file sync-assets.ts
 * @description Background action to sync market data for all assets using Yahoo Finance.
 */

const yf = new YahooFinance();

/**
 * Helper to split an array into smaller chunks for batch processing.
 * @param {T[]} array - The source array.
 * @param {number} size - Maximum size of each chunk.
 * @returns {T[][]} - Array of chunks.
 */
const chunkArray = <T>(array: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

/**
 * Orchestrates the synchronization of asset metadata and prices from Yahoo Finance to the database.
 * @returns {Promise<{success: boolean, message?: string, error?: string}>}
 */
export async function syncAssetsAction() {
  const supabase = await createClient();
  const BATCH_SIZE = 100;

  try {
    const { data: assets, error: fetchError } = await supabase
      .from('assets')
      .select('ticker, stock_name');

    if (fetchError || !assets) throw new Error("DB Fetch failed");

    const assetChunks = chunkArray(assets, BATCH_SIZE);
    let totalSynced = 0;

    for (const chunk of assetChunks) {
      // 1. Map to Yahoo Tickers: If numeric, it's BSE (.BO), otherwise NSE (.NS)
      const tickersToFetch = chunk.map(a => {
        const t = a.ticker.toUpperCase();
        if (t.includes('.')) return t; // Already has suffix
        const isBse = /^\d+$/.test(t); // Check if ticker is purely numeric
        return isBse ? `${t}.BO` : `${t}.NS`;
      });

      const quotes = await yf.quote(tickersToFetch);

      // 2. Process quotes and match back to clean tickers
      const upsertData = (Array.isArray(quotes) ? quotes : [quotes])
        .filter(q => q.regularMarketPrice != null)
        .map(q => {
          // Remove suffix to match your DB 'ticker' column
          const cleanTicker = q.symbol.replace('.NS', '').replace('.BO', '');
          const original = chunk.find(a => a.ticker.toUpperCase() === cleanTicker);

          return {
            ticker: cleanTicker,
            stock_name: original?.stock_name,
            current_price: Number(q.regularMarketPrice),
            beta: q.beta,
            trailing_pe: q.trailingPE,
            forward_pe: q.forwardPE,
            peg_ratio: q.pegRatio,
            dividend_yield: q.dividendYield,
            fifty_day_avg: q.fiftyDayAverage,
            two_hundred_day_avg: q.twoHundredDayAverage,
            fifty_two_week_high: q.fiftyTwoWeekHigh,
            fifty_two_week_low: q.fiftyTwoWeekLow,
            market_cap: q.marketCap,
            market_volume: q.regularMarketVolume,
            avg_volume: q.averageDailyVolume3Month,
            last_updated: new Date().toISOString()
          };
        });

      if (upsertData.length > 0) {
        const { error: upsertError } = await supabase
          .from('assets')
          .upsert(upsertData, { onConflict: 'ticker' });

        if (upsertError) throw upsertError;
        totalSynced += upsertData.length;
      }
    }

    revalidatePath('/');
    return { success: true, message: `Successfully synced ${totalSynced} assets.` };

  } catch (error: any) {
    console.error("Sync Error:", error.message);
    return { success: false, error: error.message };
  }
}
