"use server"
import { GoogleGenAI, Type } from "@google/genai";
import { Transaction, StockPosition, Suggestion } from "@/lib/actions/types";

export async function getStockSuggestions(
    transactions: Transaction[],
    positions: StockPosition[]
): Promise<Suggestion[]> {
    if (!process.env.GEMINI_API_KEY) {
        console.error("GEMINI_API_KEY is not defined in environment variables");
        return [];
    }
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const model = "gemini-1.5-pro"; // Using a more stable model name

    const prompt = `
    Analyze this Indian stock portfolio and provide exactly 3 actionable suggestions (buy more, sell to take profit, or sell to cut losses).
    You MUST return exactly 3 items in the JSON array. Do not return an empty array.
    If the portfolio is empty, suggest 3 popular Indian stocks to buy.

    Portfolio Transactions:
    ${JSON.stringify(transactions.slice(0, 50), null, 2)}
    
    Current Active Positions:
    ${JSON.stringify(positions.filter(p => Number(p.balance_qty) > 0), null, 2)}
    
    Consider:
    1. Average buy price vs current price to identify profit/loss.
    2. Overexposure to a single stock.
    3. General market sentiment for Indian stocks (Nifty 50, etc.).
    `;

    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        symbol: { type: Type.STRING },
                        action: { type: Type.STRING, description: "BUY, SELL, or HOLD" },
                        confidence: { type: Type.NUMBER, description: "0 to 1" },
                        reasoning: { type: Type.STRING, description: "Detailed explanation for the suggestion" },
                        targetPrice: { type: Type.NUMBER, description: "Optional target price" }
                    },
                    required: ["symbol", "action", "confidence", "reasoning"]
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