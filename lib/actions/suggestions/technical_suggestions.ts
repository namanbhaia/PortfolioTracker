"use server"

/**
 * @file technical_suggestions.ts
 * @description Analyzes technical indicators like DMA, yearly highs/lows, and volume to provide trade setup alerts.
 */

export interface TechnicalSuggestion {
    ticker: string;
    stock_name: string;
    current_price: number;
    category: 'YEARLY_RANGE' | 'VOLUME' | 'VALUATION';
    type: string;
    value: string;
    description: string;
}

/**
 * Generates technical alerts based on moving averages, price range, volume, and valuation.
 * @param {any[]} holdings - The user's active portfolio holdings.
 * @returns {Promise<{
 *   aboveDMA: TechnicalSuggestion[],
 *   belowDMA: TechnicalSuggestion[],
 *   aboveHigh: TechnicalSuggestion[],
 *   belowLow: TechnicalSuggestion[],
 *   highVolume: TechnicalSuggestion[],
 *   lowVolume: TechnicalSuggestion[],
 *   highPE: TechnicalSuggestion[],
 *   lowPE: TechnicalSuggestion[]
 * }>} - Categorized technical suggestions.
 */
export async function getTechnicalSuggestions(holdings: any[]): Promise<{
    aboveHigh: TechnicalSuggestion[],
    belowLow: TechnicalSuggestion[],
    highVolume: TechnicalSuggestion[],
    lowVolume: TechnicalSuggestion[],
    highPE: TechnicalSuggestion[],
    lowPE: TechnicalSuggestion[]
}> {
    const activeHoldings = holdings.filter(h => Number(h.balance_qty) > 0);

    // Deduplicate by ticker (multiple purchases of same ticker)
    const uniqueStocks = Array.from(new Map(activeHoldings.map(h => [h.ticker, h])).values());

    const aboveHigh: TechnicalSuggestion[] = [];
    const belowLow: TechnicalSuggestion[] = [];
    const highVolume: TechnicalSuggestion[] = [];
    const lowVolume: TechnicalSuggestion[] = [];
    const highPE: TechnicalSuggestion[] = [];
    const lowPE: TechnicalSuggestion[] = [];

    for (const h of uniqueStocks) {
        const price = Number(h.current_price || h.market_rate);
        const high52 = Number(h.fifty_two_week_high);
        const low52 = Number(h.fifty_two_week_low);
        const vol = Number(h.market_volume);
        const avgVol = Number(h.avg_volume);
        const pe = Number(h.trailing_pe);

        if (!price) continue;

        // 2. Above yearly high (or very close to it)
        if (high52 && price >= high52 * 0.99) {
            aboveHigh.push({
                ticker: h.ticker,
                stock_name: h.stock_name,
                current_price: price,
                category: 'YEARLY_RANGE',
                type: 'Near/Above Yearly High',
                value: `52W High: ${high52.toFixed(2)}`,
                description: `Momentum: Asset is trading at or near its 52-week high of ${high52.toFixed(2)}.`
            });
        }

        // 4. Below yearly low
        if (low52 && price <= low52 * 1.01) {
            belowLow.push({
                ticker: h.ticker,
                stock_name: h.stock_name,
                current_price: price,
                category: 'YEARLY_RANGE',
                type: 'Near/Below Yearly Low',
                value: `52W Low: ${low52.toFixed(2)}`,
                description: `Support/Weakness: Asset is trading at or near its 52-week low of ${low52.toFixed(2)}.`
            });
        }

        // 5. Very high volume
        if (vol && avgVol && vol > avgVol * 1.5) {
            const ratio = (vol / avgVol).toFixed(1);
            highVolume.push({
                ticker: h.ticker,
                stock_name: h.stock_name,
                current_price: price,
                category: 'VOLUME',
                type: 'High Relative Volume',
                value: `${ratio}x Avg`,
                description: `Strong Interest: Today's volume is ${ratio} times higher than the 3-month average.`
            });
        }

        // 6. Very low volume
        if (vol && avgVol && vol < avgVol * 0.4) {
            const ratio = (vol / avgVol).toFixed(2);
            lowVolume.push({
                ticker: h.ticker,
                stock_name: h.stock_name,
                current_price: price,
                category: 'VOLUME',
                type: 'Low Relative Volume',
                value: `${ratio}x Avg`,
                description: `Low Liquidity: Today's volume is significantly lower (${ratio}x) than the 3-month average.`
            });
        }

        // 9. High Price to earning ratio (PE)
        if (pe && pe > 50) {
            highPE.push({
                ticker: h.ticker,
                stock_name: h.stock_name,
                current_price: price,
                category: 'VALUATION',
                type: 'High P/E Ratio',
                value: `P/E: ${pe.toFixed(1)}`,
                description: `Premium Valuation: The stock is trading at a high Price-to-Earnings ratio of ${pe.toFixed(1)}.`
            });
        }

        // 10. Low Price to earning ratio (PE)
        if (pe && pe > 0 && pe < 15) {
            lowPE.push({
                ticker: h.ticker,
                stock_name: h.stock_name,
                current_price: price,
                category: 'VALUATION',
                type: 'Low P/E Ratio',
                value: `P/E: ${pe.toFixed(1)}`,
                description: `Value Opportunity: The stock is trading at a low Price-to-Earnings ratio of ${pe.toFixed(1)}.`
            });
        }
    }

    return {
        aboveHigh,
        belowLow,
        highVolume,
        lowVolume,
        highPE,
        lowPE
    };
}
