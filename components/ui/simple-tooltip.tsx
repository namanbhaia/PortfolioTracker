"use client"

import React from 'react';
import { cn } from "@/lib/utils";

interface SimpleTooltipProps {
    content: React.ReactNode;
    children: React.ReactNode;
    className?: string;
}

export function SimpleTooltip({ content, children, className }: SimpleTooltipProps) {
    return (
        <div className={cn("relative group inline-block", className)}>
            {children}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 bg-slate-900 dark:bg-slate-950 text-white text-[11px] p-2 rounded-lg shadow-2xl z-50 pointer-events-none animate-in fade-in zoom-in-95 duration-200 transition-colors">
                <div className="leading-relaxed whitespace-normal font-normal">
                    {content}
                </div>
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900 dark:border-t-slate-950 transition-colors"></div>
            </div>
        </div>
    );
}
