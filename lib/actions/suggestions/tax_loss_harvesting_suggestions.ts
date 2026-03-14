"use server"

/**
 * @file tax_loss_harvesting_suggestions.ts
 * @description Identifies tax-loss harvesting opportunities by analyzing loss-making positions.
 */

export interface TaxLossSuggestion {
    ticker: string;
    stock_name: string;
    loss_amount: number;
    loss_percent: number;
    is_long_term: boolean;
    balance_qty: number;
}

/**
 * Identifies potential positions for tax-loss harvesting.
 * @param {any[]} holdings - The user's active portfolio holdings.
 * @returns {Promise<{ shortTerm: TaxLossSuggestion[], longTerm: TaxLossSuggestion[], totalLossVal: number }>}
 */
export async function getTaxLossHarvestingSuggestions(
    holdings: any[]
): Promise<{ shortTerm: TaxLossSuggestion[], longTerm: TaxLossSuggestion[], totalLossVal: number }> {

    // Filter out active holdings (qty > 0) that have a negative PL
    const lossMakingHoldings = holdings.filter(h =>
        Number(h.balance_qty) > 0 && Number(h.pl) < 0
    );

    const suggestions: TaxLossSuggestion[] = lossMakingHoldings.map(h => ({
        ticker: h.ticker,
        stock_name: h.stock_name,
        loss_amount: Math.abs(Number(h.pl)),
        loss_percent: h.pl_percent,
        is_long_term: h.long_term,
        balance_qty: Number(h.balance_qty)
    }));

    // Sort by largest loss amount first
    suggestions.sort((a, b) => b.loss_amount - a.loss_amount);

    const shortTerm = suggestions.filter(s => !s.is_long_term);
    const longTerm = suggestions.filter(s => s.is_long_term);

    const totalLossVal = suggestions.reduce((acc, curr) => acc + curr.loss_amount, 0);

    return {
        shortTerm,
        longTerm,
        totalLossVal
    };
}
