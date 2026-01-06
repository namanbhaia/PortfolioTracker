/**
 * Calculations Library for Portfolio Tracking (INR)
 * Handles: Tax Logic, Unrealized/Realized Gains, and Concentration
 */

export const TAX_RULES = {
    STCG_RATE: 0.20,      // 20% for Short Term (Current 2024-26 Rules)
    LTCG_RATE: 0.125,     // 12.5% for Long Term
    LTCG_EXEMPTION: 125000, // INR 1.25 Lakh exemption limit
};

/**
 * Check if an investment is Long Term (Held for > 365 days)
 */
export const isLongTerm = (purchaseDate: Date, saleDate: Date = new Date()): boolean => {
    const diffTime = Math.abs(saleDate.getTime() - purchaseDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 365;
};

/**
 * Calculate Capital Gains and Tax Payable
 */
export const calculateTax = (purchaseRate: number, saleRate: number, qty: number, purchaseDate: Date, saleDate: Date) => {
    const profit = (saleRate - purchaseRate) * qty;

    if (profit <= 0) return { profit, tax: 0, type: 'LOSS' };

    const longTerm = isLongTerm(purchaseDate, saleDate);
    const taxRate = longTerm ? TAX_RULES.LTCG_RATE : TAX_RULES.STCG_RATE;

    // Note: LTCG exemption usually applies to total annual gains, 
    // but for per-trade tracking, we calculate the potential liability.
    const tax = profit * taxRate;

    return {
        profit,
        tax,
        type: longTerm ? 'LTCG' : 'STCG'
    };
};

/**
 * Calculate potential profit and "Drift" from target
 */
export const calculateHoldingsStats = (purchaseRate: number, marketRate: number, qty: number) => {
    const costValue = purchaseRate * qty;
    const marketValue = marketRate * qty;
    const unrealizedProfit = marketValue - costValue;
    const profitPercentage = (unrealizedProfit / costValue) * 100;

    return {
        marketValue,
        unrealizedProfit,
        profitPercentage
    };
};

/**
* Suggests the next investment amount to reach a target %
*/
export const suggestNextInvestment = (
    ticker: string,
    currentValue: number,
    totalPortfolioValue: number,
    targetPercentage: number // e.g., 0.10 for 10%
) => {
    const currentPercentage = currentValue / totalPortfolioValue;

    if (currentPercentage < targetPercentage) {
        const requiredAmount = (targetPercentage * totalPortfolioValue) - currentValue;
        return {
            action: 'BUY',
            ticker,
            suggestedINR: requiredAmount,
            reason: `Underweight: Currently ${(currentPercentage * 100).toFixed(1)}%, Target ${targetPercentage * 100}%`
        };
    }

    return { action: 'HOLD', reason: 'Allocation within target range' };
};