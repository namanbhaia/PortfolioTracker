"use client"

import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

export default function TrxIdCell({ id }: { id: string }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        navigator.clipboard.writeText(id);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="relative group/id flex items-center gap-1">
            <button 
                onClick={handleCopy}
                className="font-mono text-[10px] text-slate-400 hover:text-blue-600 transition-colors flex items-center gap-1 focus:outline-none"
                title="Click to copy ID"
            >
                {id.substring(0, 3)}...
                {copied ? (
                    <Check size={10} className="text-green-500" />
                ) : (
                    <Copy size={10} className="opacity-0 group-hover/id:opacity-100" />
                )}
            </button>

            {/* Hover Banner (Tooltip) */}
            <div className="absolute bottom-full left-0 mb-2 hidden group-hover/id:block bg-slate-900 text-white text-[10px] py-1 px-2 rounded shadow-xl whitespace-nowrap z-50 pointer-events-none">
                {id}
                <div className="absolute top-full left-2 border-4 border-transparent border-t-slate-900"></div>
            </div>
        </div>
    );
}