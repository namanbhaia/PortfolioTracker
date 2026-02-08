"use server"
import YahooFinance  from 'yahoo-finance2';

const yf = new YahooFinance();


export async function getTickerDetailsFromYahoo(query: string) {
  try {
    // 1. Search for the symbol
    const searchResults = await yf.search(query);
    
    if (!searchResults.quotes || searchResults.quotes.length === 0) {
      return null;
    }

    const symbol = searchResults.quotes[0].symbol;

    // 2. Fetch the actual price for that symbol
    const quote = await yf.quote(symbol);

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
