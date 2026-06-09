"use server"
import { GoogleGenAI, Type } from "@google/genai";
import { Transaction, StockPosition, Suggestion } from "@/lib/actions/types";

/**
 * @file gemini_suggestions.ts
 * @description Integrates with Google Gemini AI to provide actionable investment suggestions based on portfolio state.
 */

/**
 * Generates stock suggestions using the Gemini API.
 * @param {Transaction[]} transactions - REcent transaction history.
 * @param {StockPosition[]} positions - Current active positions.
 * @returns {Promise<Suggestion[]>} - Array of AI-generated suggestions.
 */
export async function getStockSuggestions(
    transactions: Transaction[],
    positions: StockPosition[]
): Promise<Suggestion[]> {
    if (!process.env.GEMINI_API_KEY) {
        console.error("GEMINI_API_KEY is not defined in environment variables");
        return [];
    }
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const model = "gemini-2.5-flash";

    const activeHoldings = positions.filter(p => Number(p.balance_qty) > 0);

    let totalCost = 0;
    let totalValue = 0;
    let totalLtcgUnrealized = 0;
    let totalStcgUnrealized = 0;
    let totalLtLossUnrealized = 0;
    let totalStLossUnrealized = 0;

    const formattedPositions = activeHoldings.map(h => {
        const qty = Number(h.balance_qty || h.quantity || 0);
        const buyRate = Number(h.rate || h.averagePrice || 0);
        const currentRate = Number(h.market_rate || h.currentPrice || 0);
        const costBasis = qty * buyRate;
        const currentVal = h.market_value ? Number(h.market_value) : qty * currentRate;
        const plVal = h.pl !== undefined ? Number(h.pl) : (currentVal - costBasis);
        const plPct = h.pl_percent !== undefined ? Number(h.pl_percent) : (buyRate > 0 ? (plVal / costBasis) * 100 : 0);
        const isLt = h.long_term !== undefined ? Boolean(h.long_term) : false;

        totalCost += costBasis;
        totalValue += currentVal;

        if (plVal > 0) {
            if (isLt) totalLtcgUnrealized += plVal;
            else totalStcgUnrealized += plVal;
        } else {
            if (isLt) totalLtLossUnrealized += Math.abs(plVal);
            else totalStLossUnrealized += Math.abs(plVal);
        }

        const holdingDays = h.date ? Math.ceil(Math.abs(new Date().getTime() - new Date(h.date).getTime()) / (1000 * 60 * 60 * 24)) : undefined;

        return {
            ticker: h.ticker,
            stock_name: h.stock_name || '',
            quantity: qty,
            purchase_price: buyRate,
            current_price: currentRate,
            current_value: currentVal,
            cost_basis: costBasis,
            unrealized_pl: plVal,
            unrealized_pl_percentage: plPct,
            purchase_date: h.date || '',
            holding_period_days: holdingDays,
            is_long_term: isLt
        };
    });

    const netPl = totalValue - totalCost;
    const netPlPercent = totalCost > 0 ? (netPl / totalCost) * 100 : 0;

    const systemPrompt = `You are an expert SEBI-registered portfolio manager and financial advisor specializing in the Indian Stock Market (NSE/BSE).
    Analyze the user's stock portfolio and suggest the top 5 most urgent and actionable recommendations using the following 7 advanced strategies:
    
    1. Sector Diversification & Rebalancing: Identify if the portfolio is heavily skewed towards one sector (e.g., >40%) or a single stock (>20%). Suggest reallocating to diversify.
    2. Tax-Loss Harvesting: Identify bleeding stocks (unrealized losses) that can be sold to offset taxable gains.
    3. Tax-Gain Harvesting & Profit Booking: Identify long-term holdings (held > 365 days) with gains that can be harvested up to the ₹1,00,000 tax-free LTCG limit, or book profits in overvalued/fully-valued positions.
    4. Averaging Down Opportunities: Identify fundamentally strong stocks trading below the user's average purchase rate to average down.
    5. Portfolio Risk & Volatility: Analyze the mix of high-beta vs defensive stocks. Recommend adding defensive low-beta stocks if the overall risk is too high.
    6. Position Sizing (Anti-Clutter): Identify tiny 'dust' holdings (positions making up < 2% of the portfolio, e.g., 1-2 shares of many different stocks) and suggest consolidating them into high-conviction positions.
    7. Opportunity Cost / Stagnant Capital: Identify stagnant stocks (zero or negative returns over 6+ months in a bull market) and suggest moving that capital to momentum plays or Index ETFs.
    
    Guidelines for Recommendations:
    - Focus on NSE/BSE listed equities.
    - Each recommendation MUST include specific, concrete target ranges or percentage weights (e.g., "reduce position weight from 22% to 15%", or "accumulate in the range of ₹450-₹475").
    - Incorporate Indian tax rules (LTCG exempt up to ₹1 Lakh/year, STCG taxed higher) when recommending tax actions.
    - Maintain a highly professional, objective, SEBI-compliant advisor tone. Avoid hype and buzzwords. Provide specific mathematical or fundamental rationale for every action.`;

    const prompt = `
    You MUST analyze the following portfolio metrics and return EXACTLY 5 actionable recommendations in the JSON schema.
    If the portfolio is empty, suggest 5 high-conviction, fundamentally strong Indian stocks across different sectors (e.g., HDFC Bank, Reliance Industries, TCS) for a new investor to BUY.

    --- PORTFOLIO SUMMARY ---
    Total Portfolio Value: ₹${totalValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
    Total Cost Basis: ₹${totalCost.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
    Net Unrealized P&L: ₹${netPl.toLocaleString('en-IN', { maximumFractionDigits: 2 })} (${netPlPercent.toFixed(2)}%)
    
    --- TAX METRICS (INDIAN INCOME TAX RULES) ---
    Unrealized Long-Term Capital Gains (LTCG): ₹${totalLtcgUnrealized.toLocaleString('en-IN', { maximumFractionDigits: 2 })} (Tax-free up to ₹1,00,000/year)
    Unrealized Short-Term Capital Gains (STCG): ₹${totalStcgUnrealized.toLocaleString('en-IN', { maximumFractionDigits: 2 })} (Taxed at 20%)
    Unrealized Long-Term Capital Loss: ₹${totalLtLossUnrealized.toLocaleString('en-IN', { maximumFractionDigits: 2 })} (Can offset LTCG)
    Unrealized Short-Term Capital Loss: ₹${totalStLossUnrealized.toLocaleString('en-IN', { maximumFractionDigits: 2 })} (Can offset STCG/LTCG)
    
    --- PORTFOLIO HOLDINGS ---
    ${JSON.stringify(formattedPositions, null, 2)}
    
    --- RECENT TRANSACTIONS ---
    ${JSON.stringify(transactions.slice(0, 30), null, 2)}
    `;

    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
            systemInstruction: systemPrompt,
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        symbol: { type: Type.STRING },
                        action: { type: Type.STRING, description: "Exactly 'BUY', 'SELL', or 'HOLD'" },
                        confidence: { type: Type.NUMBER, description: "A float between 0.0 and 1.0 representing conviction" },
                        reasoning: { type: Type.STRING, description: "Detailed, professional 2-3 sentence explanation with specific metrics." },
                        targetPrice: { type: Type.NUMBER, description: "Optional realistic target price" },
                        timeframe: { type: Type.STRING, description: "'Short Term' (1-3 mos), 'Medium Term' (3-12 mos), or 'Long Term' (1yr+)" },
                        riskLevel: { type: Type.STRING, description: "Risk level of this action: 'Low', 'Medium', or 'High'" }
                    },
                    required: ["symbol", "action", "confidence", "reasoning", "riskLevel", "timeframe"]
                }
            }
        }
    });

    try {
        return JSON.parse(response.text || "[]");
    } catch (e) {
        console.error("Failed to parse Gemini response", e);
        return [];
    }
}