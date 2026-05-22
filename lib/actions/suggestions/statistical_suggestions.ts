"use server"

// import YahooFinance from 'yahoo-finance2';

/**
 * @file statistical_suggestions.ts
 * @description Analyzes portfolio diversification and risk metrics to provide concentration and volatility alerts.
 */

export interface ConcentrationAlert {
    ticker: string;
    stock_name: string;
    value: number;
    percentage: number;
    warning: string;
}

export interface VolatilityAlert {
    ticker: string;
    stock_name: string;
    beta: number;
    warning: string;
}

export interface PledgedVolatilityAlert {
    ticker: string;
    stock_name: string;
    pledged_qty: number;
    beta: number;
    warning: string;
}

/**
 * Calculates concentration, volatility, and pledged asset alerts for the given holdings and pledges.
 * @param {any[]} holdings - The user's active portfolio holdings.
 * @param {any[]} pledges - The user's active pledges.
 * @returns {Promise<{concentration: ConcentrationAlert[], volatility: VolatilityAlert[], pledgedVolatility: PledgedVolatilityAlert[]}>}
 */
export async function getStatisticalSuggestions(
    holdings: any[],
    pledges: any[] = []
): Promise<{
    concentration: ConcentrationAlert[],
    volatility: VolatilityAlert[],
    pledgedVolatility: PledgedVolatilityAlert[]
}> {
    const activeHoldings = holdings.filter(h => Number(h.balance_qty) > 0);

    // Group pledges by ticker
    const pledgedMap = new Map<string, number>();
    for (const p of pledges) {
        pledgedMap.set(p.ticker, (pledgedMap.get(p.ticker) || 0) + Number(p.pledged_qty));
    }

    // Group by ticker for concentration and deduplication
    const tickerGroups = new Map<string, { ticker: string, stock_name: string, total_value: number, beta: number }>();
    let totalPortfolioValue = 0;

    for (const h of activeHoldings) {
        const value = h.market_value ? Number(h.market_value) : Number(h.balance_qty) * Number(h.market_rate || h.rate || 0);
        totalPortfolioValue += value;
        
        if (!tickerGroups.has(h.ticker)) {
            tickerGroups.set(h.ticker, {
                ticker: h.ticker,
                stock_name: h.stock_name,
                total_value: 0,
                beta: Number(h.beta)
            });
        }
        tickerGroups.get(h.ticker)!.total_value += value;
    }

    const concentration: ConcentrationAlert[] = [];
    const volatility: VolatilityAlert[] = [];
    const pledgedVolatility: PledgedVolatilityAlert[] = [];

    if (totalPortfolioValue > 0) {
        for (const group of tickerGroups.values()) {
            const percentage = (group.total_value / totalPortfolioValue) * 100;

            // 1. Calculate Portfolio Concentration
            // Flag if a single stock is more than 20% of the portfolio
            if (percentage > 20) {
                concentration.push({
                    ticker: group.ticker,
                    stock_name: group.stock_name,
                    value: group.total_value,
                    percentage,
                    warning: `High Concentration Risk: This asset makes up ${percentage.toFixed(1)}% of your portfolio.`
                });
            }

            // 2. Portfolio Health / Risks (Beta, Yield, etc.)
            const beta = group.beta;
            if (beta && !isNaN(beta)) {
                if (beta > 1.5) {
                    volatility.push({
                        ticker: group.ticker,
                        stock_name: group.stock_name,
                        beta,
                        warning: `High Volatility: A Beta of ${beta.toFixed(2)} means this stock is highly sensitive to market swings.`
                    });
                } else if (beta < 0.5 && beta >= 0) {
                    volatility.push({
                        ticker: group.ticker,
                        stock_name: group.stock_name,
                        beta,
                        warning: `Low Volatility (Defensive): A Beta of ${beta.toFixed(2)} indicates this stock may act as a stabilizer during market downturns.`
                    });
                }

                // 3. Pledged Asset Volatility Alert
                const pledgedQty = pledgedMap.get(group.ticker) || 0;
                if (pledgedQty > 0 && beta > 1.5) {
                    pledgedVolatility.push({
                        ticker: group.ticker,
                        stock_name: group.stock_name,
                        pledged_qty: pledgedQty,
                        beta,
                        warning: `High-Risk Pledge: You have pledged ${pledgedQty.toLocaleString('en-IN')} shares of ${group.ticker} which is highly volatile (Beta: ${beta.toFixed(2)}). A sharp price drop could trigger a margin call or automatic liquidation by your broker.`
                    });
                }
            }
        }
    }
    
    concentration.sort((a, b) => b.percentage - a.percentage);
    volatility.sort((a, b) => b.beta - a.beta);
    pledgedVolatility.sort((a, b) => b.beta - a.beta);

    return {
        concentration,
        volatility,
        pledgedVolatility
    };
}
