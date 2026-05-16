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
    purchase_date: string;
    trx_id: string;
}

/**
 * Identifies potential positions for tax-loss harvesting based on FIFO rules.
 * @param {any[]} holdings - The user's active portfolio holdings.
 * @returns {Promise<{ shortTerm: TaxLossSuggestion[], longTerm: TaxLossSuggestion[], totalLossVal: number }>}
 */
export async function getTaxLossHarvestingSuggestions(
    holdings: any[]
): Promise<{ shortTerm: TaxLossSuggestion[], longTerm: TaxLossSuggestion[], totalLossVal: number }> {

    const activeHoldings = holdings.filter(h => Number(h.balance_qty) > 0);

    // Group by ticker
    const tickerGroups = new Map<string, any[]>();
    for (const h of activeHoldings) {
        if (!tickerGroups.has(h.ticker)) {
            tickerGroups.set(h.ticker, []);
        }
        tickerGroups.get(h.ticker)!.push(h);
    }

    const suggestions: TaxLossSuggestion[] = [];

    // For each ticker, evaluate FIFO queue
    for (const lots of tickerGroups.values()) {
        // Sort lots by date ascending (oldest first)
        lots.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        // Under FIFO, the oldest lot is sold first.
        const oldestLot = lots[0];

        // If the oldest lot is at a loss, it is a valid harvest opportunity
        if (Number(oldestLot.pl) < 0) {
            suggestions.push({
                ticker: oldestLot.ticker,
                stock_name: oldestLot.stock_name,
                loss_amount: Math.abs(Number(oldestLot.pl)),
                loss_percent: oldestLot.pl_percent,
                is_long_term: oldestLot.long_term,
                balance_qty: Number(oldestLot.balance_qty),
                purchase_date: oldestLot.date,
                trx_id: oldestLot.trx_id
            });
        }
    }

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
