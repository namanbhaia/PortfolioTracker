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
    if (currentSort !== field) return <span className="text-gray-300 ml-1">↕</span>;
    return currentOrder === 'asc' ? <span className="ml-1">↑</span> : <span className="ml-1">↓</span>;
}
