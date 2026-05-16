"use client";

import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * @file global-spinner.tsx
 * @description A full-screen loading overlay to provide visual feedback and block interactions during navigation or heavy processing.
 */

interface GlobalSpinnerProps {
    message?: string;
}

export default function GlobalSpinner({ message = "Loading Page..." }: GlobalSpinnerProps) {
    return (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-900/60 backdrop-blur-sm transition-all duration-300">
            <div className="relative flex flex-col items-center">
                {/* Outer Glow */}
                <div className="absolute inset-0 bg-indigo-500/20 blur-3xl rounded-full scale-150 animate-pulse" />
                
                {/* Main Spinner */}
                <div className="relative bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col items-center gap-4">
                    <div className="relative">
                        <Loader2 className="w-12 h-12 text-indigo-600 dark:text-indigo-400 animate-spin" />
                        <div className="absolute inset-0 w-12 h-12 border-4 border-indigo-500/10 rounded-full" />
                    </div>
                    
                    <div className="flex flex-col items-center text-center">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">{message}</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Please wait while we fetch your data</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
