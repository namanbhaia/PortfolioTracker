"use client"

import React from 'react';

export default function CommentCell({ comment }: { comment: string | null }) {
    if (!comment) return <span className="text-gray-400">-</span>;

    return (
        <div className="relative group/comment inline-block max-w-[150px]">
            {/* Truncated main text */}
            <p className="truncate text-gray-500 italic">
                {comment}
            </p>

            {/* Hover Banner (Tooltip) */}
            <div className="absolute bottom-full left-0 mb-2 hidden group-hover/comment:block w-64 bg-slate-900 text-white text-[11px] p-3 rounded-lg shadow-2xl z-50 pointer-events-none animate-in fade-in zoom-in-95 duration-200">
                <p className="leading-relaxed whitespace-normal font-normal">
                    {comment}
                </p>
                {/* Tooltip Arrow */}
                <div className="absolute top-full left-4 border-8 border-transparent border-t-slate-900"></div>
            </div>
        </div>
    );
}