"use client"

/**
 * @file refresh-button.tsx
 * @description A button that triggers a manual data refresh by revalidating the current route.
 */

import { useRouter } from 'next/navigation';
import { RefreshCw } from 'lucide-react';
import { useState } from 'react';

/**
 * Button component for triggering a server-side data refresh.
 */
export function RefreshButton() {
    const router = useRouter();
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleRefresh = () => {
        setIsRefreshing(true);
        // router.refresh() triggers a server-side re-fetch of the current route
        router.refresh();

        // Dispatch a custom event so other components can refresh their state
        window.dispatchEvent(new CustomEvent('dashboard-refresh'));

        // Simulating a brief loading state for user feedback
        setTimeout(() => setIsRefreshing(false), 1000);
    };

    return (
        <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm active:scale-95 disabled:opacity-50"
        >
            <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
            {isRefreshing ? "Updating..." : "Refresh Data"}
        </button>
    );
}