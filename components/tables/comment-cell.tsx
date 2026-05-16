"use client"

/**
 * @file comment-cell.tsx
 * @description Renders a table cell for comments with a tooltip for long text.
 */

import React from 'react';

/**
 * Component for displaying comments in a table cell.
 * @param {Object} props - Component props.
 * @param {string | null} props.comment - The comment text to display.
 */
export default function CommentCell({ comment }: { comment: string | null }) {
    if (!comment) return <span className="text-gray-400 dark:text-slate-600 transition-colors">-</span>;

    return (
        <div className="relative group/comment inline-block max-w-[150px]">
            {/* Truncated main text */}
            <p className="truncate text-gray-500 dark:text-slate-400 italic transition-colors">
                {comment}
            </p>

            {/* Hover Banner (Tooltip) */}
            <div className="absolute bottom-full left-0 mb-2 hidden group-hover/comment:block w-64 bg-slate-900 dark:bg-slate-950 text-white text-[11px] p-3 rounded-lg shadow-2xl z-50 pointer-events-none animate-in fade-in zoom-in-95 duration-200 transition-colors">
                <p className="leading-relaxed whitespace-normal font-normal">
                    {comment}
                </p>
                {/* Tooltip Arrow */}
                <div className="absolute top-full left-4 border-8 border-transparent border-t-slate-900 dark:border-t-slate-950 transition-colors"></div>
            </div>
        </div>
    );
}