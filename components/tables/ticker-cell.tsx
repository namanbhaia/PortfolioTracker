/**
 * @file ticker-cell.tsx
 * @description Renders a table cell for stock tickers with a link to Screener.in and ISIN display.
 */

import React from 'react';

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
    return (
        <td className={`px-3 py-3 transition-colors ${className || ''}`}>
            <div className="font-bold text-blue-700 dark:text-blue-400 transition-colors">
                <a
                    href={`https://www.screener.in/company/${ticker}/`}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    {ticker}
                </a>
            </div>
            <div className="text-[10px] text-slate-400 dark:text-slate-500 transition-colors">{isin}</div>
        </td>
    );
}
