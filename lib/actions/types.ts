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
}

export interface Suggestion {
    symbol: string;
    action: 'BUY' | 'SELL' | 'HOLD';
    confidence: number;
    reasoning: string;
    targetPrice?: number;
}
