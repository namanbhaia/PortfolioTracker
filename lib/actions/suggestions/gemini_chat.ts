"use server"
import { GoogleGenAI, Type } from "@google/genai";
import { Transaction, StockPosition, Suggestion } from "@/lib/actions/types";

export interface ChatMessage {
    role: "user" | "model";
    parts: { text: string }[];
}

export async function sendRecommendationChat(
    history: ChatMessage[],
    newMessage: string,
    transactions: Transaction[],
    positions: StockPosition[],
    suggestions: Suggestion[]
) {
    if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY is not defined");
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const model = "gemini-3.5-flash";

    const activeHoldings = positions.filter(p => {
        const qty = p.balance_qty !== undefined ? Number(p.balance_qty) : Number(p.quantity || 0);
        return qty > 0;
    });

    let totalCost = 0;
    let totalValue = 0;
    let totalLtcgUnrealized = 0;
    let totalStcgUnrealized = 0;
    let totalLtLossUnrealized = 0;
    let totalStLossUnrealized = 0;

    const formattedPositions = activeHoldings.map(h => {
        const qty = h.balance_qty !== undefined ? Number(h.balance_qty) : Number(h.quantity || 0);
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

    const systemPrompt = `You are an expert portfolio manager and financial advisor in the Indian Stock Market.
    You generated 5 specific recommendations for the user based on their portfolio.
    The user is now discussing these recommendations, or their portfolio in general, with you.
    Answer their questions professionally, concisely, and with specific references to their portfolio metrics. Format your answers in markdown.
    
    --- PORTFOLIO SUMMARY ---
    Total Portfolio Value: ₹${totalValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
    Total Cost Basis: ₹${totalCost.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
    Net Unrealized P&L: ₹${netPl.toLocaleString('en-IN', { maximumFractionDigits: 2 })} (${netPlPercent.toFixed(2)}%)
    
    --- TAX METRICS ---
    Unrealized LTCG: ₹${totalLtcgUnrealized.toLocaleString('en-IN', { maximumFractionDigits: 2 })} (Tax-free up to ₹1,00,000/year)
    Unrealized STCG: ₹${totalStcgUnrealized.toLocaleString('en-IN', { maximumFractionDigits: 2 })} (Taxed at 20%)
    Unrealized Long-Term Capital Loss: ₹${totalLtLossUnrealized.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
    Unrealized Short-Term Capital Loss: ₹${totalStLossUnrealized.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
    
    --- PORTFOLIO HOLDINGS ---
    ${JSON.stringify(formattedPositions, null, 2)}
    
    --- RECENT TRANSACTIONS ---
    ${JSON.stringify(transactions.slice(0, 30), null, 2)}
    
    --- THE AI RECOMMENDATIONS RECENTLY GENERATED ---
    ${JSON.stringify(suggestions, null, 2)}
    `;

    try {
        let contents = history.map(h => ({
            role: h.role,
            parts: h.parts
        }));

        contents.push({
            role: "user",
            parts: [{ text: newMessage }]
        });

        const response = await ai.models.generateContent({
            model: model,
            contents: contents,
            config: {
                systemInstruction: systemPrompt,
            }
        });

        return {
            success: true,
            message: response.text || "I was unable to process your request."
        };
    } catch (error: any) {
        console.error("Gemini Chat Error:", error);
        return {
            success: false,
            error: error.message || "An error occurred while communicating with the AI."
        };
    }
}
