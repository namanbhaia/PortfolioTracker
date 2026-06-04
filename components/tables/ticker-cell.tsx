/**
 * @file ticker-cell.tsx
 * @description Renders a table cell for stock tickers with a link to Screener.in and ISIN display.
 */

"use client"

import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface TickerCellProps {
    ticker: string;
    isin: string;
    className?: string; // Allow passing extra classes if needed
}

/**
 * Component for displaying a stock ticker and its ISIN in a table cell.
 * @param {TickerCellProps} props - Component props.
 */
export default function TickerCell({ ticker, isin, className }: TickerCellProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        navigator.clipboard.writeText(ticker);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <td className={`px-3 py-3 transition-colors group/ticker ${className || ''}`}>
            <div className="flex items-center gap-2">
                <div className="font-bold text-blue-700 dark:text-blue-400 transition-colors">
                    <a
                        href={`https://www.screener.in/company/${ticker}/`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline"
                    >
                        {ticker}
                    </a>
                </div>
                <button
                    onClick={handleCopy}
                    className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 transition-all opacity-0 group-hover/ticker:opacity-100 focus:opacity-100 focus:ring-1 focus:ring-indigo-500 outline-none"
                    aria-label={`Copy ticker ${ticker}`}
                    title="Copy Ticker"
                >
                    {copied ? (
                        <Check size={12} className="text-green-500 animate-in zoom-in duration-200" />
                    ) : (
                        <Copy size={12} className="hover:text-indigo-500 transition-colors" />
                    )}
                </button>
            </div>
            <div className="text-[10px] text-slate-400 dark:text-slate-500 transition-colors">{isin}</div>
        </td>
    );
}
