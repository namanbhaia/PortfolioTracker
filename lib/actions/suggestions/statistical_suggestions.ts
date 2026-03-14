"use server"

import YahooFinance from 'yahoo-finance2';

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

/**
 * Calculates concentration and volatility alerts for the given holdings.
 * @param {any[]} holdings - The user's active portfolio holdings.
 * @returns {Promise<{concentration: ConcentrationAlert[], volatility: VolatilityAlert[]}>}
 */
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

    // 2. Portfolio Health / Risks (Beta, Yield, etc.)
    const volatility: VolatilityAlert[] = [];

    // We already have Beta in the holdings via the client_holdings view (which joins with assets)
    for (const h of activeHoldings) {
        const beta = Number(h.beta);
        if (beta && !isNaN(beta)) {
            if (beta > 1.5) {
                volatility.push({
                    ticker: h.ticker,
                    stock_name: h.stock_name,
                    beta,
                    warning: `High Volatility: A Beta of ${beta.toFixed(2)} means this stock is highly sensitive to market swings.`
                });
            } else if (beta < 0.5 && beta >= 0) {
                volatility.push({
                    ticker: h.ticker,
                    stock_name: h.stock_name,
                    beta,
                    warning: `Low Volatility (Defensive): A Beta of ${beta.toFixed(2)} indicates this stock may act as a stabilizer during market downturns.`
                });
            }
        }
    }

    volatility.sort((a, b) => b.beta - a.beta);

    return {
        concentration,
        volatility
    };
}
