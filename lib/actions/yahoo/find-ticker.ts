"use server"
import YahooFinance from 'yahoo-finance2';

/**
 * @file find-ticker.ts
 * @description Helpers for fetching stock metadata and prices from Yahoo Finance.
 */

const yahooFinance = new YahooFinance();

/**
 * Fetches real-time price and metadata for a stock based on a search query.
 * @param {string} query - The search term (e.g., "RELIANCE" or "INFY.NS").
 * @returns {Promise<{symbol: string, shortName: string, price: number} | null>} - Stock details or null if not found.
 */
export async function getTickerDetailsFromYahoo(isins: string[]) {
  try {
    // STEP 1: Translate all ISINs to Symbols at once
    const translationTasks = isins.map(async (isin) => {
      const search = await yahooFinance.search(isin, {}, { validation: false } as any);
      const firstQuote = search?.quotes?.[0];
      return firstQuote?.symbol ? { isin, symbol: firstQuote.symbol } : null;
    });

    // 1. Fire off all searches
    const results = await Promise.all(translationTasks);

    // 2. Debug: Log the raw results before filtering
    console.log("Raw Search Results:", JSON.stringify(results, null, 2));

    // 3. Filter and cast
    const mappings = results.filter((item): item is { isin: string; symbol: string } => {
      return item !== null && typeof item.symbol === 'string';
    });

    console.log("Filtered Mappings count:", mappings.length);

    if (mappings.length === 0) {
      console.warn("⚠️ Mappings is empty! Check the ISINs and Yahoo API response.");
      return [];
    }


    // STEP 2: Fetch all prices in ONE single call
    const symbols = mappings.map(m => m.symbol);
    const quotes = await yahooFinance.quote(symbols, {}, { validation: false } as any);
    const quotesArray = Array.isArray(quotes) ? quotes : [quotes];

    // Merge them back together
    return mappings.map(m => {
      const priceData = quotesArray.find(q => q.symbol === m.symbol);
      return {
        isin: m.isin,
        symbol: m.symbol,
        price: priceData?.regularMarketPrice || 0
      };
    });
  } catch (error) {
    console.error("Fetch failed:", error);
    return [];
  }
}

/**
 * Normalizes a ticker and fetches its current market quote.
 * @param {string} ticker - The stock ticker symbol.
 * @returns {Promise<{success: boolean, suggestion?: {ticker: string, name: string, price: number}, error?: string}>}
 */
export async function getStockSuggestion(ticker: string) {
  try {
    let yfSearchTicker = ticker.toUpperCase().trim();
    if (!yfSearchTicker.includes('.')) {
      const isNumeric = /^\d+$/.test(yfSearchTicker);
      yfSearchTicker = isNumeric ? `${yfSearchTicker}.BO` : `${yfSearchTicker}.NS`;
    }

    const quote = (await yahooFinance.quote(yfSearchTicker, {}, {
      validation: { logErrors: false }
    } as any)) as any;

    if (!quote) throw new Error("Stock not found");

    return {
      success: true,
      suggestion: {
        ticker: ticker.toUpperCase().replace('.NS', '').replace('.BO', ''),
        name: quote.shortName || quote.longName,
        price: quote.regularMarketPrice,
      }
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
