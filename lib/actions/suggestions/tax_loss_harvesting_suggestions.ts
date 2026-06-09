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
    purchase_price: number;
    market_rate: number;
    current_value: number;
}

export interface TaxGainSuggestion {
    ticker: string;
    stock_name: string;
    gain_amount: number;
    gain_percent: number;
    balance_qty: number;
    purchase_date: string;
    trx_id: string;
    purchase_price: number;
    market_rate: number;
    current_value: number;
}

/**
 * Identifies potential positions for tax-loss and tax-gain harvesting based on FIFO rules.
 * @param {any[]} holdings - The user's active portfolio holdings.
 * @returns {Promise<{ shortTerm: TaxLossSuggestion[], longTerm: TaxLossSuggestion[], totalLossVal: number, longTermGains: TaxGainSuggestion[], totalGainVal: number }>}
 */
export async function getTaxLossHarvestingSuggestions(
    holdings: any[]
): Promise<{
    shortTerm: TaxLossSuggestion[],
    longTerm: TaxLossSuggestion[],
    totalLossVal: number,
    longTermGains: TaxGainSuggestion[],
    totalGainVal: number
}> {

    const activeHoldings = holdings.filter(h => Number(h.balance_qty) > 0);

    // Group by ticker
    const tickerGroups = new Map<string, any[]>();
    for (const h of activeHoldings) {
        if (!tickerGroups.has(h.ticker)) {
            tickerGroups.set(h.ticker, []);
        }
        tickerGroups.get(h.ticker)!.push(h);
    }

    const lossSuggestions: TaxLossSuggestion[] = [];
    const gainSuggestions: TaxGainSuggestion[] = [];

    // For each ticker, evaluate FIFO queue
    for (const lots of tickerGroups.values()) {
        // Sort lots by date ascending (oldest first)
        lots.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        // Under FIFO, the oldest lot is sold first.
        const oldestLot = lots[0];

        // If the oldest lot is at a loss, it is a valid harvest opportunity
        if (Number(oldestLot.pl) < 0) {
            lossSuggestions.push({
                ticker: oldestLot.ticker,
                stock_name: oldestLot.stock_name,
                loss_amount: Math.abs(Number(oldestLot.pl)),
                loss_percent: oldestLot.pl_percent,
                is_long_term: oldestLot.long_term,
                balance_qty: Number(oldestLot.balance_qty),
                purchase_date: oldestLot.date,
                trx_id: oldestLot.trx_id,
                purchase_price: Number(oldestLot.rate) || 0,
                market_rate: Number(oldestLot.market_rate) || 0,
                current_value: Number(oldestLot.market_value) || (Number(oldestLot.balance_qty) * (Number(oldestLot.market_rate) || 0)),
            });
        } else if (oldestLot.long_term && Number(oldestLot.pl) > 0) {
            // Oldest lot is long-term and has unrealized profit -> Tax Gain Harvesting opportunity
            gainSuggestions.push({
                ticker: oldestLot.ticker,
                stock_name: oldestLot.stock_name,
                gain_amount: Number(oldestLot.pl),
                gain_percent: Number(oldestLot.pl_percent),
                balance_qty: Number(oldestLot.balance_qty),
                purchase_date: oldestLot.date,
                trx_id: oldestLot.trx_id,
                purchase_price: Number(oldestLot.rate) || 0,
                market_rate: Number(oldestLot.market_rate) || 0,
                current_value: Number(oldestLot.market_value) || (Number(oldestLot.balance_qty) * (Number(oldestLot.market_rate) || 0)),
            });
        }
    }

    // Sort loss suggestions by largest loss amount first
    lossSuggestions.sort((a, b) => b.loss_amount - a.loss_amount);
    
    // Sort gain suggestions by largest gain amount first
    gainSuggestions.sort((a, b) => b.gain_amount - a.gain_amount);

    const shortTerm = lossSuggestions.filter(s => !s.is_long_term);
    const longTerm = lossSuggestions.filter(s => s.is_long_term);

    const totalLossVal = lossSuggestions.reduce((acc, curr) => acc + curr.loss_amount, 0);
    const totalGainVal = gainSuggestions.reduce((acc, curr) => acc + curr.gain_amount, 0);

    return {
        shortTerm,
        longTerm,
        totalLossVal,
        longTermGains: gainSuggestions,
        totalGainVal
    };
}
