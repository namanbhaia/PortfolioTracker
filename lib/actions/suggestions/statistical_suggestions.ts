"use server"

import YahooFinance from 'yahoo-finance2';

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

export async function getStatisticalSuggestions(holdings: any[]): Promise<{
    concentration: ConcentrationAlert[],
    volatility: VolatilityAlert[]
}> {
    const activeHoldings = holdings.filter(h => Number(h.balance_qty) > 0);

    // 1. Calculate Portfolio Concentration
    const totalPortfolioValue = activeHoldings.reduce((sum, h) => sum + (Number(h.balance_qty) * Number(h.current_price || h.average_price)), 0);

    const concentration: ConcentrationAlert[] = [];
    if (totalPortfolioValue > 0) {
        for (const h of activeHoldings) {
            const value = Number(h.balance_qty) * Number(h.current_price || h.average_price);
            const percentage = (value / totalPortfolioValue) * 100;

            // Flag if a single stock is more than 20% of the portfolio
            if (percentage > 20) {
                concentration.push({
                    ticker: h.ticker,
                    stock_name: h.stock_name,
                    value,
                    percentage,
                    warning: `High Concentration Risk: This asset makes up ${percentage.toFixed(1)}% of your portfolio.`
                });
            }
        }
    }
    concentration.sort((a, b) => b.percentage - a.percentage);

    // 2. Calculate Volatility / Beta using Yahoo Finance
    const volatility: VolatilityAlert[] = [];

    // To respect rate limits and speed, we might only check the top 10 positions by value
    const topHoldings = [...activeHoldings]
        .sort((a, b) => (Number(b.balance_qty) * Number(b.current_price || b.average_price)) - (Number(a.balance_qty) * Number(a.current_price || a.average_price)))
        .slice(0, 10);

    const tickersToFetch = topHoldings.map(a => {
        const t = a.ticker.toUpperCase();
        if (t.includes('.')) return t;
        const isBse = /^\d+$/.test(t);
        return isBse ? `${t}.BO` : `${t}.NS`;
    });

    try {
        if (tickersToFetch.length > 0) {
            const quotes = await YahooFinance.quote(tickersToFetch);
            const quoteArray = Array.isArray(quotes) ? quotes : [quotes];

            for (const q of quoteArray) {
                const beta = q.beta;
                if (beta !== undefined) {
                    const cleanTicker = q.symbol.replace('.NS', '').replace('.BO', '');
                    const holding = topHoldings.find(h => h.ticker.toUpperCase() === cleanTicker);

                    if (holding) {
                        if (beta > 1.5) {
                            volatility.push({
                                ticker: holding.ticker,
                                stock_name: holding.stock_name,
                                beta,
                                warning: `High Volatility: A Beta of ${beta.toFixed(2)} means this stock is highly sensitive to market swings.`
                            });
                        } else if (beta < 0.5 && beta >= 0) {
                            volatility.push({
                                ticker: holding.ticker,
                                stock_name: holding.stock_name,
                                beta,
                                warning: `Low Volatility (Defensive): A Beta of ${beta.toFixed(2)} indicates this stock may act as a stabilizer during market downturns.`
                            });
                        }
                    }
                }
            }
        }
    } catch (e) {
        console.error("Failed to fetch beta values from Yahoo Finance", e);
    }
    volatility.sort((a, b) => b.beta - a.beta);

    return {
        concentration,
        volatility
    };
}
