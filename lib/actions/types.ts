export interface Transaction {
    id: string;
    ticker: string;
    action: string;
    quantity: number;
    price: number;
    date: string;
    // Add other relevant fields if needed
}

export interface StockPosition {
    ticker: string;
    quantity: number;
    averagePrice: number;
    currentPrice?: number;
    balance_qty?: number;
    rate?: number;
    market_rate?: number;
    market_value?: number;
    pl?: number;
    pl_percent?: number;
    long_term?: boolean;
    stock_name?: string;
    date?: string;
}

export interface Suggestion {
    symbol: string;
    action: 'BUY' | 'SELL' | 'HOLD';
    confidence: number;
    reasoning: string;
    targetPrice?: number;
    timeframe?: string;
    riskLevel?: 'Low' | 'Medium' | 'High';
}
