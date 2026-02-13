
import React from 'react';

interface TickerCellProps {
    ticker: string;
    isin: string;
    className?: string; // Allow passing extra classes if needed
}

export default function TickerCell({ ticker, isin, className }: TickerCellProps) {
    return (
        <td className={`px-3 py-3 ${className || ''}`}>
            <div className="font-bold text-blue-700">
                <a
                    href={`https://www.screener.in/company/${ticker}/`}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    {ticker}
                </a>
            </div>
            <div className="text-[10px] text-gray-400">{isin}</div>
        </td>
    );
}
