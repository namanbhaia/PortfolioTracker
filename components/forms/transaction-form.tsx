"use client"

import React, { useState } from 'react';
import { CheckCircle2, ShoppingCart, Tag } from 'lucide-react';
import { PurchaseForm } from './purchase-form';
import { SaleForm } from './sale-form';
import { useUser } from '@/components/helper/user-context';

export function TransactionForm() {
    const { clients } = useUser(); // Access the clients list directly from context
    const [success, setSuccess] = useState(false);
    const [activeTab, setActiveTab] = useState<'purchase' | 'sale'>('purchase');

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden max-w-2xl mx-auto transition-colors">
            {/* TAB NAVIGATION */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 transition-colors">
                <button
                    onClick={() => setActiveTab('purchase')}
                    className={`flex-1 flex items-center justify-center gap-2 py-4 font-bold transition-all ${activeTab === 'purchase'
                            ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400"
                            : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                        }`}
                >
                    <ShoppingCart size={18} />
                    Purchase (Buy)
                </button>
                <button
                    onClick={() => setActiveTab('sale')}
                    className={`flex-1 flex items-center justify-center gap-2 py-4 font-bold transition-all ${activeTab === 'sale'
                            ? "bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 border-b-2 border-rose-600 dark:border-rose-400"
                            : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                        }`}
                >
                    <Tag size={18} />
                    Sale (Sell)
                </button>
            </div>

            <div className="p-4 md:p-8">
                {activeTab === 'purchase' ? (
                    <PurchaseForm clients={clients} setSuccess={setSuccess} />
                ) : (
                    <SaleForm clients={clients} setSuccess={setSuccess} />
                )}

                {success && (
                    <div className="mt-6 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-xl flex items-center justify-center gap-2 animate-in fade-in zoom-in duration-300">
                        <CheckCircle2 size={20} /> Transaction Recorded Successfully!
                    </div>
                )}
            </div>

        </div>
    );
}