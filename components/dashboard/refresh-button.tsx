"use client"

import { useRouter } from 'next/navigation';
import { RefreshCw } from 'lucide-react';
import { useState } from 'react';

export function RefreshButton() {
    const router = useRouter();
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleRefresh = () => {
        setIsRefreshing(true);
        // router.refresh() triggers a server-side re-fetch of the current route
        router.refresh();
        
        // Simulating a brief loading state for user feedback
        setTimeout(() => setIsRefreshing(false), 1000);
    };

    return (
        <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all shadow-sm active:scale-95 disabled:opacity-50"
        >
            <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
            {isRefreshing ? "Updating..." : "Refresh Data"}
        </button>
    );
}