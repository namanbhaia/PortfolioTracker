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
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden max-w-2xl mx-auto">
            {/* TAB NAVIGATION */}
            <div className="flex border-b border-slate-200 bg-slate-50/50">
                <button
                    onClick={() => setActiveTab('purchase')}
                    className={`flex-1 flex items-center justify-center gap-2 py-4 font-bold transition-all ${activeTab === 'purchase'
                            ? "bg-white text-indigo-600 border-b-2 border-indigo-600"
                            : "text-slate-500 hover:text-slate-700"
                        }`}
                >
                    <ShoppingCart size={18} />
                    Purchase (Buy)
                </button>
                <button
                    onClick={() => setActiveTab('sale')}
                    className={`flex-1 flex items-center justify-center gap-2 py-4 font-bold transition-all ${activeTab === 'sale'
                            ? "bg-white text-rose-600 border-b-2 border-rose-600"
                            : "text-slate-500 hover:text-slate-700"
                        }`}
                >
                    <Tag size={18} />
                    Sale (Sell)
                </button>
            </div>

            <div className="p-8">
                {activeTab === 'purchase' ? (
                    <PurchaseForm clients={clients} setSuccess={setSuccess} />
                ) : (
                    <SaleForm clients={clients} setSuccess={setSuccess} />
                )}

                {success && (
                    <div className="mt-6 p-4 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center gap-2 animate-in fade-in zoom-in duration-300">
                        <CheckCircle2 size={20} /> Transaction Recorded Successfully!
                    </div>
                )}
            </div>

        </div>
    );
}