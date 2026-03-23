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
    const model = "gemini-3-flash-preview";

    const systemPrompt = `You are an expert SEBI-registered portfolio manager and financial advisor specializing in the Indian Stock Market (NSE/BSE).
    Analyze the user's stock portfolio using the following 7 advanced strategies. You MUST select and return EXACTLY the top 5 most urgent and actionable recommendations from these 7 areas:
    
    1. Sector Diversification & Rebalancing: If heavily skewed towards one sector, suggest reallocating.
    2. Tax-Loss Harvesting or Profit Booking: Identify bleeding stocks to sell for tax loss, or highly profitable ones to book profits.
    3. Averaging Down Opportunities: Identify fundamentally strong stocks trading below the user's average buy price to buy more.
    4. Portfolio Risk & Volatility: Analyze the mix of Large Cap vs Mid/Small Cap and suggest adding stability if it's too risky.
    5. Dividend Yield Strategies: Suggest rotating stagnant capital into high dividend-yielding stocks if appropriate.
    6. Position Sizing (Anti-Clutter): If the user holds 'micro-positions' (e.g. 1-2 shares of many companies making up < 2% of the portfolio), suggest liquidating them to concentrate capital in high-conviction stocks.
    7. Opportunity Cost / Dead Money: Identify capital tied up in old, stagnant stocks with 0% return over long periods during bull runs, and suggest moving it to Index ETFs or momentum plays.
    
    Instructions for Reasoning:
    1. Be specific: Mention exact percentages, prices, and refer to specific portfolio allocations if relevant.
    2. Sound professional and calm, avoiding hype.
    3. Include technical or fundamental reasoning if the stock is well known.`;

    const prompt = `
    You MUST return EXACTLY 5 items. Pick the 5 most impactful recommendations. Do not return an empty array.
    If the portfolio is empty, suggest 5 high-conviction, fundamentally strong Indian stocks across different sectors and market caps for a new investor to 'BUY'.

    Portfolio History (Recent Transactions):
    \${JSON.stringify(transactions.slice(0, 50), null, 2)}
    
    Current Active Holdings:
    \${JSON.stringify(positions.filter(p => Number(p.balance_qty) > 0), null, 2)}
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