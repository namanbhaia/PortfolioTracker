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
    const model = "gemini-3-flash-preview";

    const systemPrompt = `You are a SEBI-registered portfolio manager and financial advisor in the Indian Stock Market.
    You generated 5 specific recommendations for the user based on their portfolio.
    The user is now discussing these recommendations, or their portfolio in general, with you.
    ANSWER THEIR QUESTIONS Professionally, concisely, and with specific references to their portfolio data. Keep responses user-friendly and formatted in markdown.
    
    Current User Portfolio:
    Positions: \${JSON.stringify(positions.filter(p => Number(p.balance_qty) > 0), null, 2)}
    Transactions (Last 50): \${JSON.stringify(transactions.slice(0, 50), null, 2)}
    
    The AI Recommendations you just successfully gave them:
    \${JSON.stringify(suggestions, null, 2)}
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
