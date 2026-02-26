"use client"

import React from 'react';
import { Wrench, ShieldAlert } from 'lucide-react';
import BulkAssetUpdate from '@/components/admin/bulk-asset-update';
import BulkPurchaseAdd from '@/components/admin/bulk-purchase-add';
import BulkSalesAdd from '@/components/admin/bulk-sales-add';
import { useUser } from '@/components/helper/user-context';

export default function AdminPage() {
    const { profile, loading } = useUser();

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
                <div className="animate-pulse flex flex-col items-center">
                    <div className="h-12 w-12 bg-slate-200 rounded-full mb-4" />
                    <div className="h-6 w-32 bg-slate-200 rounded-md mb-2" />
                    <div className="h-4 w-48 bg-slate-100 rounded-md" />
                </div>
            </div>
        );
    }

    if (!profile?.advanced_mode) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
                <div className="p-4 bg-rose-50 text-rose-600 rounded-full mb-4">
                    <ShieldAlert size={48} />
                </div>
                <h1 className="text-2xl font-bold text-slate-900">Access Restricted</h1>
                <p className="text-slate-500 mt-2 max-w-md">
                    You do not have permission to access Admin Controls. Please contact the system administrator if you believe this is an error.
                </p>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-12 animate-in fade-in duration-500">
            <header className="flex items-center justify-between border-b border-slate-200 pb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                        <Wrench className="text-rose-600" size={32} />
                        Admin Controls
                    </h1>
                    <p className="text-slate-500 mt-2">
                        Advanced tools for system-wide data management and bulk operations.
                    </p>
                </div>
                <div className="px-4 py-2 bg-rose-50 border border-rose-100 rounded-full flex items-center gap-2">
                    <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
                    <span className="text-xs font-bold text-rose-700 uppercase tracking-wider">Advanced Mode Active</span>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Column 1: Asset Management */}
                <div className="space-y-8">
                    <section>
                        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Asset Management</h2>
                        <BulkAssetUpdate />
                    </section>
                </div>

                {/* Column 2: Transaction Management */}
                <div className="space-y-8">
                    <section>
                        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Ledger Management</h2>
                        <BulkPurchaseAdd />
                        <div className="mt-8" />
                        <BulkSalesAdd />
                    </section>
                </div>
            </div>

            <footer className="pt-12 border-t border-slate-100 text-center">
                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">
                    Handle with Care • All actions are logged and irreversible
                </p>
            </footer>
        </div>
    );
}
