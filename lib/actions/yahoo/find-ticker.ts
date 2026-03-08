"use server"
import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance();

export async function getTickerDetailsFromYahoo(query: string) {
  try {
    // 1. Search for the symbol
    // Disable validation to handle minor schema mismatches from Yahoo side
    const searchResults = (await yahooFinance.search(query, {}, {
      validation: { logErrors: false }
    } as any)) as any;

    if (!searchResults?.quotes || searchResults.quotes.length === 0) {
      return null;
    }

    const symbol = searchResults.quotes[0].symbol as string;

    // 2. Fetch the actual price for that symbol
    const quote = (await yahooFinance.quote(symbol, {}, {
      validation: { logErrors: false }
    } as any)) as any;

    return {
      symbol: symbol,
      shortName: searchResults.quotes[0].shortname || searchResults.quotes[0].longname,
      // regularMarketPrice is the standard field for live price
      price: quote?.regularMarketPrice || 0
    };
  } catch (error) {
    console.error("Details fetch error:", error);
    throw error;
  }
}


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
