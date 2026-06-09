"use client"

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { cn } from "@/lib/utils";

interface SimpleTooltipProps {
    content: React.ReactNode;
    children: React.ReactNode;
    className?: string;
}

/**
 * Portal-based tooltip that renders outside overflow-clipping ancestors.
 * Uses fixed positioning relative to the viewport so it is never cropped
 * by tables or other scrollable containers.
 */
export function SimpleTooltip({ content, children, className }: SimpleTooltipProps) {
    const [visible, setVisible] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0 });
    const triggerRef = useRef<HTMLDivElement>(null);
    const [mounted, setMounted] = useState(false);

    // Ensure we only use createPortal on the client
    useEffect(() => {
        setMounted(true);
    }, []);

    const updatePosition = useCallback(() => {
        if (!triggerRef.current) return;
        const rect = triggerRef.current.getBoundingClientRect();
        setCoords({
            // Position above the trigger; the tooltip itself will be shifted up via CSS
            top: rect.top + window.scrollY,
            left: rect.left + rect.width / 2 + window.scrollX,
        });
    }, []);

    const handleMouseEnter = useCallback(() => {
        updatePosition();
        setVisible(true);
    }, [updatePosition]);

    const handleMouseLeave = useCallback(() => {
        setVisible(false);
    }, []);

    const tooltip = mounted && visible ? createPortal(
        <div
            style={{
                position: 'fixed',
                // Place the bottom of the tooltip 8px above the trigger's top
                top: coords.top - 8,
                left: coords.left,
                transform: 'translate(-50%, -100%)',
                zIndex: 9999,
                pointerEvents: 'none',
            }}
            className="w-48 bg-slate-900 dark:bg-slate-950 text-white text-[11px] p-2 rounded-lg shadow-2xl animate-in fade-in zoom-in-95 duration-200 transition-colors"
        >
            <div className="leading-relaxed whitespace-normal font-normal">
                {content}
            </div>
            {/* Arrow pointing downward toward the trigger */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900 dark:border-t-slate-950 transition-colors" />
        </div>,
        document.body
    ) : null;

    return (
        <div
            ref={triggerRef}
            className={cn("relative inline-block", className)}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {children}
            {tooltip}
        </div>
    );
}
