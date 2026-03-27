"use client";

/**
 * @file sort-arrow.tsx
 * @description Renders a sort direction indicator for table headers.
 */

import React from 'react';

interface SortArrowProps {
    field: string;
    currentSort?: string;
    currentOrder?: 'asc' | 'desc';
}

/**
 * Component for displaying a sort arrow indicator.
 * @param {SortArrowProps} props - Component props.
 */
export default function SortArrow({ field, currentSort, currentOrder }: SortArrowProps) {
    if (currentSort !== field) return <span className="text-slate-300 dark:text-slate-700 ml-1 transition-colors">↕</span>;
    return currentOrder === 'asc' ? <span className="ml-1 text-indigo-600 dark:text-indigo-400 transition-colors">↑</span> : <span className="ml-1 text-indigo-600 dark:text-indigo-400 transition-colors">↓</span>;
}
