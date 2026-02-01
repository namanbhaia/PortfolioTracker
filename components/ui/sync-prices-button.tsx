"use client"

import { useRouter } from 'next/navigation';
import { RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { syncAssetsAction } from '@/lib/actions/sync-assets';

export function SyncPricesButton() {
    const router = useRouter();
    const [isRefreshing, setIsRefreshing] = useState(false);
  
    const handleRefresh = async () => {
        setIsRefreshing(true);
        const a = await syncAssetsAction();
        setTimeout(() => setIsRefreshing(false), 1000);
    };

    return (
        <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all shadow-sm active:scale-95 disabled:opacity-50"
        >
            <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
            {isRefreshing ? "Syncing Market Prices..." : "Sync Prices"}
        </button>
    );
}