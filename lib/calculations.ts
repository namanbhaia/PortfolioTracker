/**
 * @file Calculations Library for Portfolio Tracking (INR)
 * @description This file contains utility functions for handling Indian tax logic,
 * calculating unrealized/realized gains, and providing investment suggestions.
 * All financial calculations are performed in Indian Rupees (INR).
 */

/**
 * @constant TAX_RULES
 * @description Defines the tax rates and exemption limits based on the Indian Union Budget for 2024-26.
 * - STCG_RATE: Short-Term Capital Gains tax rate.
 * - LTCG_RATE: Long-Term Capital Gains tax rate.
 * - LTCG_EXEMPTION: The annual exemption limit for Long-Term Capital Gains.
 */
export const TAX_RULES = {
	STCG_RATE: 0.2, // 20% for Short Term (Current 2024-26 Rules)
	LTCG_RATE: 0.125, // 12.5% for Long Term
	LTCG_EXEMPTION: 125000, // INR 1.25 Lakh exemption limit
};

/**
 * @function isLongTerm
 * @description Checks if an investment is "Long Term" by comparing the holding period against 365 days.
 * @param {Date} purchaseDate - The date the asset was purchased.
 * @param {Date} saleDate - The date the asset was sold (defaults to current date for unrealized checks).
 * @returns {boolean} - True if the holding period is greater than 365 days.
 */
export const isLongTerm = (purchaseDate: Date, saleDate: Date = new Date()): boolean => {
	const diffTime = Math.abs(saleDate.getTime() - purchaseDate.getTime());
	const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
	return diffDays > 365;
};

/**
 * @function calculateTax
 * @description Calculates the capital gains and the corresponding tax payable for a single transaction.
 * @param {number} purchaseRate - The cost per share/unit at the time of purchase.
 * @param {number} saleRate - The price per share/unit at the time of sale.
 * @param {number} qty - The quantity of shares/units sold.
 * @param {Date} purchaseDate - The date of the original purchase.
 * @param {Date} saleDate - The date of the sale.
 * @returns {{profit: number, tax: number, type: string}} - An object containing the profit, tax liability, and gain type ('LTCG', 'STCG', or 'LOSS').
 */
export const calculateTax = (purchaseRate: number, saleRate: number, qty: number, purchaseDate: Date, saleDate: Date) => {
	const profit = (saleRate - purchaseRate) * qty;

	if (profit <= 0) return { profit, tax: 0, type: "LOSS" };

	const longTerm = isLongTerm(purchaseDate, saleDate);
	const taxRate = longTerm ? TAX_RULES.LTCG_RATE : TAX_RULES.STCG_RATE;

	// Note: LTCG exemption usually applies to total annual gains,
	// but for per-trade tracking, we calculate the potential liability.
	const tax = profit * taxRate;

	return {
		profit,
		tax,
		type: longTerm ? "LTCG" : "STCG",
	};
};

/**
 * @function calculateHoldingsStats
 * @description Calculates unrealized profit/loss and the percentage gain for a given holding.
 * @param {number} purchaseRate - The average cost of the holding.
 * @param {number} marketRate - The current market price.
 * @param {number} qty - The quantity of the holding.
 * @returns {{marketValue: number, unrealizedProfit: number, profitPercentage: number}} - Stats for the holding.
 */
export const calculateHoldingsStats = (purchaseRate: number, marketRate: number, qty: number) => {
	const costValue = purchaseRate * qty;
	const marketValue = marketRate * qty;
	const unrealizedProfit = marketValue - costValue;
	const profitPercentage = (unrealizedProfit / costValue) * 100;

	return {
		marketValue,
		unrealizedProfit,
		profitPercentage,
	};
};

/**
 * @function suggestNextInvestment
 * @description Provides a "BUY" or "HOLD" suggestion to help align a portfolio with target allocations.
 * @param {string} ticker - The stock/asset symbol.
 * @param {number} currentValue - The current market value of the holding.
 * @param {number} totalPortfolioValue - The total market value of the entire portfolio.
 * @param {number} targetPercentage - The desired allocation for this ticker (e.g., 0.10 for 10%).
 * @returns {{action: string, ticker?: string, suggestedINR?: number, reason: string}} - An action-oriented suggestion.
 */
export const suggestNextInvestment = (ticker: string, currentValue: number, totalPortfolioValue: number, targetPercentage: number) => {
	const currentPercentage = currentValue / totalPortfolioValue;

	if (currentPercentage < targetPercentage) {
		const requiredAmount = targetPercentage * totalPortfolioValue - currentValue;
		return {
			action: "BUY",
			ticker,
			suggestedINR: requiredAmount,
			reason: `Underweight: Currently ${(currentPercentage * 100).toFixed(1)}%, Target ${targetPercentage * 100}%`,
		};
	}

	return { action: "HOLD", reason: "Allocation within target range" };
};