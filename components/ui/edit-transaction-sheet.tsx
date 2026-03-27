"use client"

/**
 * @file edit-transaction-sheet.tsx
 * @description Renders a modal dialog for editing purchase or sale transaction records.
 */

import { useRef, useState, useEffect } from 'react';
import { Edit2, X, Save, Loader2, Info, IndianRupee, Calendar } from "lucide-react";
import { updateTransaction } from '@/lib/actions/update-transactions';
import { usePathname, useSearchParams } from 'next/navigation';

/**
 * Component for editing a single transaction record via a modal.
 * @param {Object} props - Component props.
 * @param {any} props.row - The transaction data object.
 * @param {'purchase' | 'sale'} props.type - The type of transaction being edited.
 */
export default function EditTransactionSimple({ row, type }: { row: any, type: 'purchase' | 'sale' }) {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const [loading, setLoading] = useState(false);

    // Capture current URL state
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const currentFullUrl = `${pathname}?${searchParams.toString()}`;

    // Standardized fields based on your DB columns
    const initialDate = row.date || row.sale_date;
    const initialQty = type === 'purchase' ? row.purchase_qty : row.sale_qty;
    const initialRate = row.rate || row.sale_rate;

    // State for live calculation
    const [liveQty, setLiveQty] = useState(initialQty || 0);
    const [liveRate, setLiveRate] = useState(initialRate || 0);

    useEffect(() => {
        setLiveQty(initialQty || 0);
        setLiveRate(initialRate || 0);
    }, [initialQty, initialRate]);

    const openModal = () => dialogRef.current?.showModal();
    const closeModal = () => dialogRef.current?.close();

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);
        const data = Object.fromEntries(formData.entries());
        const result = await updateTransaction(row.trx_id, type, data, currentFullUrl);
        setLoading(false);
        if (result.success) closeModal();
        else alert(result.error);
    }

    return (
        <>
            <button onClick={openModal} className="p-2 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all active:scale-90 border border-transparent hover:border-indigo-100 dark:hover:border-indigo-900/50">
                <Edit2 size={15} />
            </button>

            <dialog
                ref={dialogRef}
                className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] p-0 backdrop:bg-slate-900/60 border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200 font-normal text-left dark:bg-slate-900"
            >
                <div className="bg-white dark:bg-slate-900 transition-colors">
                    {/* Header */}
                    <div className="bg-slate-50 dark:bg-slate-800/50 px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-xl ${type === 'purchase' ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400' : 'bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400'}`}>
                                <Edit2 size={18} />
                            </div>
                            <div>
                                {/* 2. Heading is explicitly bold as requested */}
                                <h3 className="font-bold text-slate-900 dark:text-white leading-tight capitalize text-lg">
                                    Edit {type} Record
                                </h3>
                                <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500 uppercase tracking-tighter mt-0.5">
                                    {row.trx_id}
                                </p>
                            </div>
                        </div>
                        <button onClick={closeModal} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full text-slate-400 dark:text-slate-500 transition-colors">
                            <X size={18} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-8 space-y-5">
                        {/* Ticker Section (Read Only) */}
                        <div className="bg-slate-50/80 dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <div className="space-y-0.5">
                                <label className="text-[10px] uppercase text-slate-400 dark:text-slate-500 tracking-wider">Asset</label>
                                <p className="text-slate-700 dark:text-slate-300 font-medium">{row.ticker}</p>
                            </div>
                            <div className="text-right">
                                <input type="hidden" name="ticker" value={row.ticker} />
                            </div>
                        </div>

                        {/* Date & Rate Row */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px]  uppercase text-slate-500 dark:text-slate-400 ml-1">Date</label>
                                <div className="relative">
                                    <input
                                        name="date"
                                        type="date"
                                        autoComplete="off"
                                        className="w-full border-slate-200 dark:border-slate-700 rounded-xl p-2.5 pl-3 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all dark:bg-slate-800 dark:text-white"
                                        defaultValue={
                                            initialDate && !isNaN(new Date(initialDate).getTime())
                                                ? new Date(initialDate).toISOString().split('T')[0]
                                                : ''
                                        }
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] uppercase text-slate-500 dark:text-slate-400 font-normal ml-1">Trade Rate</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-slate-400 dark:text-slate-500 text-xs font-normal">₹</span>
                                    <input
                                        name="rate"
                                        type="number"
                                        step="0.01"
                                        autoComplete="off"
                                        value={liveRate}
                                        onChange={(e) => setLiveRate(Number(e.target.value))}
                                        className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 pl-7 text-sm outline-none bg-white dark:bg-slate-800 font-normal text-slate-900 dark:text-white transition-colors"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Qty & Live Value */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] uppercase text-slate-500 dark:text-slate-400 font-normal ml-1">Quantity</label>
                                <input
                                    name="qty"
                                    type="number"
                                    step="any"
                                    autoComplete="off"
                                    value={liveQty}
                                    onChange={(e) => setLiveQty(Number(e.target.value))}
                                    className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm outline-none bg-white dark:bg-slate-800 font-normal text-slate-900 dark:text-white transition-colors"
                                    required
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] uppercase text-slate-500 dark:text-slate-400 ml-1 text-right block">Calculated Total</label>
                                <div className="p-2.5 rounded-xl bg-indigo-50/50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-sm text-right border border-indigo-100/50 dark:border-indigo-900/30">
                                    ₹{(liveQty * liveRate).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </div>
                            </div>
                        </div>

                        {/* Comments */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] uppercase text-slate-500 dark:text-slate-400 ml-1">Audit Comments</label>
                            <textarea name="comments" rows={2} className="w-full border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all bg-white dark:bg-slate-800 dark:text-white dark:placeholder-slate-500" placeholder="Reason for edit..." defaultValue={row.comments} />
                        </div>

                        {/* Actions */}
                        <div className="pt-4 border-t border-slate-50 dark:border-slate-800 flex flex-col gap-3">
                            <button
                                disabled={loading}
                                type="submit"
                                className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-3.5 rounded-2xl hover:bg-black dark:hover:bg-slate-100 flex justify-center items-center gap-2 shadow-lg shadow-slate-200 dark:shadow-none transition-all active:scale-[0.98] disabled:opacity-70"
                            >
                                {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                                Commit Changes
                            </button>
                            <button type="button" onClick={closeModal} className="w-full text-slate-400 dark:text-slate-500 text-xs hover:text-slate-600 dark:hover:text-slate-300 transition-colors">Discard Changes</button>
                        </div>
                    </form>
                </div>
            </dialog>
        </>
    );
}