"use client"
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, TrendingUp, TrendingDown, Minus, Clock, ShieldAlert, Send, MessageCircle, X, Maximize2, Minimize2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import ReactMarkdown from 'react-markdown';
import { getStockSuggestions } from '@/lib/actions/suggestions/gemini_suggestions';
import { sendRecommendationChat, ChatMessage } from '@/lib/actions/suggestions/gemini_chat';

export default function GeminiTab({ holdings, transactions, clients }: { holdings: any[], transactions: any[], clients: any[] }) {
    const [loading, setLoading] = useState(false);
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);

    // Chat State
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [chatInput, setChatInput] = useState("");
    const [isChatting, setIsChatting] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);

    const handleGenerate = async () => {
        setLoading(true);
        setError(null);
        try {
            // Clean and minimize data on the client side to avoid Next.js Server Action 1MB limit
            const cleanedTransactions = (transactions || []).slice(0, 30).map(t => ({
                id: t.id,
                ticker: t.ticker,
                action: t.action,
                quantity: Number(t.quantity || 0),
                price: Number(t.price || 0),
                date: t.date || ''
            }));

            const cleanedHoldings = (holdings || [])
                .filter(h => Number(h.balance_qty || h.quantity || 0) > 0)
                .map(h => ({
                    ticker: h.ticker,
                    stock_name: h.stock_name,
                    balance_qty: h.balance_qty !== undefined ? Number(h.balance_qty) : undefined,
                    quantity: Number(h.quantity ?? h.balance_qty ?? 0),
                    rate: h.rate !== undefined ? Number(h.rate) : undefined,
                    averagePrice: Number(h.averagePrice ?? h.rate ?? 0),
                    market_rate: h.market_rate !== undefined ? Number(h.market_rate) : undefined,
                    currentPrice: h.currentPrice !== undefined ? Number(h.currentPrice) : undefined,
                    market_value: h.market_value !== undefined ? Number(h.market_value) : undefined,
                    pl: h.pl !== undefined ? Number(h.pl) : undefined,
                    pl_percent: h.pl_percent !== undefined ? Number(h.pl_percent) : undefined,
                    long_term: h.long_term,
                    date: h.date
                }));

            const result = await getStockSuggestions(cleanedTransactions, cleanedHoldings);
            if (result && result.length > 0) {
                setSuggestions(result);
            } else {
                setError("No actionable suggestions received from AI at this time.");
            }
        } catch (e: any) {
            console.error("AI Generation Error:", e);
            setError("Failed to generate insights. Please check server logs.");
        } finally {
            setLoading(false);
        }
    }

    const handleSendMessage = async () => {
        if (!chatInput.trim() || isChatting) return;

        const newUserMsg: ChatMessage = { role: "user", parts: [{ text: chatInput }] };
        const updatedHistory = [...chatHistory, newUserMsg];
        
        setChatHistory(updatedHistory);
        setChatInput("");
        setIsChatting(true);
        
        try {
            const cleanedTransactions = (transactions || []).slice(0, 30).map(t => ({
                id: t.id,
                ticker: t.ticker,
                action: t.action,
                quantity: Number(t.quantity || 0),
                price: Number(t.price || 0),
                date: t.date || ''
            }));

            const cleanedHoldings = (holdings || [])
                .filter(h => Number(h.balance_qty || h.quantity || 0) > 0)
                .map(h => ({
                    ticker: h.ticker,
                    stock_name: h.stock_name,
                    balance_qty: h.balance_qty !== undefined ? Number(h.balance_qty) : undefined,
                    quantity: Number(h.quantity ?? h.balance_qty ?? 0),
                    rate: h.rate !== undefined ? Number(h.rate) : undefined,
                    averagePrice: Number(h.averagePrice ?? h.rate ?? 0),
                    market_rate: h.market_rate !== undefined ? Number(h.market_rate) : undefined,
                    currentPrice: h.currentPrice !== undefined ? Number(h.currentPrice) : undefined,
                    market_value: h.market_value !== undefined ? Number(h.market_value) : undefined,
                    pl: h.pl !== undefined ? Number(h.pl) : undefined,
                    pl_percent: h.pl_percent !== undefined ? Number(h.pl_percent) : undefined,
                    long_term: h.long_term,
                    date: h.date
                }));

            const result = await sendRecommendationChat(
                chatHistory, 
                newUserMsg.parts[0].text, 
                cleanedTransactions, 
                cleanedHoldings, 
                suggestions
            );

            if (result.success && result.message) {
                setChatHistory([...updatedHistory, { role: "model", parts: [{ text: result.message }] }]);
            } else {
                setChatHistory([...updatedHistory, { role: "model", parts: [{ text: "Sorry, I encountered an error: " + result.error }] }]);
            }
        } catch (e: any) {
            setChatHistory([...updatedHistory, { role: "model", parts: [{ text: "Failed to connect to the advisor." }] }]);
        } finally {
            setIsChatting(false);
        }
    };

    return (
        <div className="space-y-6">
            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div className="space-y-1">
                        <CardTitle className="text-xl text-slate-900 dark:text-white flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-indigo-400" />
                            AI-Powered Insights
                        </CardTitle>
                        <CardDescription className="text-slate-500 dark:text-slate-400">
                            Get personalized buy, sell, or hold recommendations based on your transaction history, current holdings, and general Indian market sentiment.
                        </CardDescription>
                    </div>
                    <Button
                        onClick={handleGenerate}
                        disabled={loading}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-6 rounded-xl shadow-lg shadow-indigo-500/30 transition-all hover:scale-105 active:scale-95"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Processing Portfolio...
                            </>
                        ) : (
                            <>
                                <Sparkles className="mr-2 h-4 w-4" />
                                Generate Insights
                            </>
                        )}
                    </Button>
                </CardHeader>
            </Card>

            {error && (
                <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400">
                    {error}
                </div>
            )}

            {suggestions.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {suggestions.map((suggestion, index) => {
                        const isBuy = suggestion.action === 'BUY';
                        const isSell = suggestion.action === 'SELL';

                        return (
                            <Card key={index} className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 overflow-hidden relative group hover:border-indigo-400 dark:hover:border-indigo-500 transition-all shadow-sm hover:shadow-md">
                                <div className={`absolute top-0 left-0 w-1 h-full ${isBuy ? 'bg-emerald-500' : isSell ? 'bg-rose-500' : 'bg-slate-400 dark:bg-slate-600'}`} />
                                <CardHeader className="pb-3 pl-6">
                                    <div className="flex justify-between items-start">
                                        <CardTitle className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                                            {suggestion.symbol}
                                        </CardTitle>
                                        <div className={`px-3 py-1 text-xs font-bold rounded-full flex items-center gap-1.5 ${isBuy ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                            isSell ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                                                'bg-slate-100 text-slate-600 border border-slate-200'
                                            }`}>
                                            {isBuy && <TrendingUp className="h-3 w-3" />}
                                            {isSell && <TrendingDown className="h-3 w-3" />}
                                            {!isBuy && !isSell && <Minus className="h-3 w-3" />}
                                            {suggestion.action}
                                        </div>
                                    </div>
                                    {suggestion.targetPrice && (
                                        <div className="text-sm font-medium text-slate-400 mt-1">
                                            Target: ₹{suggestion.targetPrice.toLocaleString('en-IN')}
                                        </div>
                                    )}
                                </CardHeader>
                                <CardContent className="pl-6">
                                    <div className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                                        {suggestion.reasoning}
                                    </div>

                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {suggestion.timeframe && (
                                            <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700">
                                                <Clock className="w-3 h-3" />
                                                <span>{suggestion.timeframe}</span>
                                            </div>
                                        )}
                                        {suggestion.riskLevel && (
                                            <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700">
                                                <ShieldAlert className="w-3 h-3" />
                                                <span>{suggestion.riskLevel} Risk</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-1.5 pt-4 border-t border-slate-100 dark:border-slate-800">
                                        <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 border-t-0 p-0 m-0">
                                            <span>AI Confidence</span>
                                            <span className="font-semibold text-slate-900 dark:text-white">{Math.round(suggestion.confidence * 100)}%</span>
                                        </div>
                                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-1000 ${suggestion.confidence > 0.8 ? 'bg-indigo-500' :
                                                    suggestion.confidence > 0.5 ? 'bg-indigo-400' : 'bg-indigo-300/50'
                                                    }`}
                                                style={{ width: `${suggestion.confidence * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            )}
            
            {suggestions.length > 0 && (
                <>
                    {/* Floating Chat Button */}
                    {!isChatOpen && (
                        <button
                            onClick={() => setIsChatOpen(true)}
                            className="fixed bottom-6 right-6 z-50 bg-indigo-600 text-white p-4 rounded-full shadow-xl hover:bg-indigo-700 transition-all hover:scale-105 active:scale-95 flex items-center justify-center group"
                        >
                            <MessageCircle className="w-7 h-7" />
                        </button>
                    )}

                    {/* Active Chat Window */}
                    {isChatOpen && (
                        <div className={`fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300 transition-all ${isExpanded ? 'w-[800px] max-w-[90vw]' : 'w-full max-w-[400px]'}`}>
                            <Card className={`bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden rounded-2xl flex flex-col transition-all duration-300 ${isExpanded ? 'h-[80vh]' : 'h-[500px]'}`}>
                                <CardHeader className="py-3 px-4 border-b border-indigo-700 bg-indigo-600 text-white flex flex-row items-center justify-between shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <button 
                                            onClick={() => setIsExpanded(!isExpanded)}
                                            className="text-indigo-200 hover:text-white transition-colors focus:outline-none"
                                            title={isExpanded ? "Collapse" : "Expand"}
                                        >
                                            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                                        </button>
                                        <div className="flex items-center gap-2">
                                            <Sparkles className="w-4 h-4 text-indigo-200" />
                                            <CardTitle className="text-md font-semibold m-0 p-0 text-white">
                                                AI Advisor
                                            </CardTitle>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => setIsChatOpen(false)}
                                        className="text-indigo-200 hover:text-white transition-colors ml-auto focus:outline-none"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </CardHeader>
                                <CardContent className="p-0 flex flex-col flex-1 overflow-hidden">
                                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-950 transition-colors">
                                        {chatHistory.length === 0 ? (
                                            <div className="h-full flex items-center justify-center text-slate-400 text-sm text-center px-4 italic">
                                                Ask me anything about your current recommendations or portfolio structure!
                                            </div>
                                        ) : (
                                            chatHistory.map((msg, idx) => (
                                                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                                    <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                                                        msg.role === 'user' 
                                                            ? 'bg-indigo-600 text-white rounded-br-sm shadow-md' 
                                                            : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-bl-sm shadow-sm'
                                                    }`}>
                                                        <ReactMarkdown
                                                            components={{
                                                                p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                                                                strong: ({node, ...props}) => <strong className="font-semibold text-inherit" {...props} />,
                                                                ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-2 space-y-1" {...props} />,
                                                                ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-2 space-y-1" {...props} />,
                                                                li: ({node, ...props}) => <li className="" {...props} />,
                                                                a: ({node, ...props}) => <a className="underline hover:text-indigo-400" {...props} />
                                                            }}
                                                        >
                                                            {msg.parts[0].text}
                                                        </ReactMarkdown>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                        {isChatting && (
                                            <div className="flex justify-start">
                                                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm shadow-sm flex items-center gap-2">
                                                    <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                                                    Thinking...
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex gap-2 transition-colors">
                                        <input 
                                            type="text"
                                            placeholder="Type a message..." 
                                            value={chatInput}
                                            onChange={(e) => setChatInput(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                            className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 dark:text-white dark:placeholder-slate-500 transition-colors"
                                        />
                                        <Button 
                                            onClick={handleSendMessage} 
                                            disabled={!chatInput.trim() || isChatting}
                                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 rounded-lg shadow-sm"
                                        >
                                            <Send className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
