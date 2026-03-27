"use client"

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { createClient } from '@/lib/supabase/client';
import { getTodayDate } from '../helper/utility';
import { Button } from "@/components/ui/button";
import { SubmitButton } from '@/components/ui/submit-button';
import { upsertInAsset } from '@/lib/actions/update-assets-table';
import { getStockSuggestion as getStockInformation } from '@/lib/actions/yahoo/find-ticker';
import { revalidateDashboard } from '@/lib/actions/cache-revalidate';
import { AlertCircle } from 'lucide-react';

const supabase = createClient();

export function PurchaseForm({ clients, setSuccess }: { clients: any[], setSuccess: (success: boolean) => void }) {
    const [loading, setLoading] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    // This holds the data fetched from Yahoo Finance before it's saved to the DB
    const [pendingAsset, setPendingAsset] = useState<{
        ticker: string;
        name: string;
        price: number;
    } | null>(null);

    // Controls whether the Modal is visible or not
    const [showAssetModal, setShowAssetModal] = useState(false);

    // Initialize useForm with defaultValues
    const { register, handleSubmit, reset, watch, setValue } = useForm({
        defaultValues: {
            purchase_date: getTodayDate(), // Sets the default on mount
            purchase_rate: '',
            purchase_qty: '',
            ticker: '',
            purchase_client_name: '',
            comments: '',
            dp_id: '',
            trading_id: '',
            client_id: ''
        }
    });

    const purchaseClient = watch("purchase_client_name");

    // Auto-populate DP and Trading ID logic...
    useEffect(() => {
        const client = clients.find(
            c => c.client_name?.trim() === purchaseClient?.trim()
        );

        if (client) {
            setValue("dp_id", client.dp_id);
            setValue("trading_id", client.trading_id);
            setValue("client_id", client.client_id);
        } else {
            setValue("dp_id", '');
            setValue("trading_id", '');
            setValue("client_id", '');
        }
    }, [purchaseClient, clients, setValue]);

    const onPurchaseSubmit = async (data: any) => {
        setLoading(true);
        setFormError(null);

        // Validate form fields first
        if (!data.purchase_client_name || !data.ticker || !data.purchase_date || !data.purchase_rate || !data.purchase_qty) {
            setFormError("Please fill all required fields before proceeding.");
            setLoading(false);
            return;
        }

        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            setFormError("You must be logged in to record a purchase.");
            setLoading(false);
            return;
        }
        // 1. Check if asset exists in your local state or DB
        const { data: existingAsset } = await supabase
            .from('assets')
            .select('*')
            .eq('ticker', data.ticker.toUpperCase())
            .maybeSingle();

        if (!existingAsset) {
            const res = await getStockInformation(data.ticker);

            if (res.success && res.suggestion) {
                setPendingAsset({
                    ticker: res.suggestion.ticker,
                    name: String(res.suggestion.name || ""),
                    price: Number(res.suggestion.price || 0)
                });
            } else {
                // Fallback: If YF fails, we still open the modal but with empty fields
                setPendingAsset({
                    ticker: data.ticker.toUpperCase(),
                    name: "", // User will fill this in
                    price: 0  // User will fill this in
                });
            }
            setShowAssetModal(true);
            setLoading(false);
            return;
        }

        const payload = {
            user_id: user.id,
            client_id: data.client_id,
            client_name: data.purchase_client_name,
            ticker: data.ticker?.toUpperCase(),
            date: data.purchase_date,
            rate: parseFloat(data.purchase_rate),
            purchase_qty: parseFloat(data.purchase_qty),
            balance_qty: parseFloat(data.purchase_qty),
            comments: data.comments
        };

        const { error } = await supabase.from('purchases').insert([payload]);

        if (error) {
            setFormError(error.message);
        } else {
            setSuccess(true);
            reset({
                ...data, // Optional: keep some data, or just reset to defaults:
                purchase_date: getTodayDate(),
                ticker: '',
                purchase_rate: '',
                purchase_qty: '',
                comments: ''
            });
            await revalidateDashboard();
            setTimeout(() => setSuccess(false), 3000);
        }
        setLoading(false);
    };

    const handleSaveNewAsset = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        const priceValue = formData.get("price");
        const isinValue = formData.get("isin")?.toString().trim();

        // 1. Mandate Check
        if (!priceValue || parseFloat(priceValue.toString()) <= 0) {
            setFormError("Please enter a valid Price.");
            setLoading(false);
            return;
        }

        if (!isinValue || isinValue.length < 12) {
            setFormError("Please enter a valid 12-digit ISIN.");
            setLoading(false);
            return;
        }

        try {
            if (!pendingAsset) return;

            await upsertInAsset({
                ticker: pendingAsset.ticker,
                name: formData.get("name") as string,
                price: parseFloat(priceValue.toString()),
                isin: isinValue,
                cutoff: parseFloat(formData.get("cutoff") as string)
            });

            setFormError(null);
            setShowAssetModal(false);
            setPendingAsset(null);

            // Re-trigger the main purchase submission
            await onPurchaseSubmit(watch());

        } catch (err: any) {
            alert("Failed to save asset: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <form onSubmit={handleSubmit(onPurchaseSubmit)} className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Client</label>
                        <select
                            {...register("purchase_client_name", { required: true })}
                            required
                            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 ring-indigo-500 dark:text-white transition-colors"
                        >
                            <option value="">Select Client</option>
                            {clients.map((c, index) => (
                                <option
                                    key={c.client_id || `client-${index}`}
                                    value={c.client_name}
                                >
                                    {c.client_name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Ticker</label>
                        <input {...register("ticker", { required: true })} required autoComplete="off" placeholder="Ticker" className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white dark:placeholder-slate-500 transition-colors" />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label htmlFor="dp_id" className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">DP ID</label>
                        <input
                            id="dp_id"
                            {...register("dp_id")}
                            placeholder="DP ID"
                            className="w-full p-2.5 bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-600 dark:text-slate-400 dark:placeholder-slate-600 cursor-not-allowed transition-colors"
                            readOnly
                            data-testid="dp-id-input"
                        />
                    </div>
                    <div className="space-y-1">
                        <label htmlFor="trading_id" className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Trading ID</label>
                        <input
                            id="trading_id"
                            {...register("trading_id")}
                            placeholder="Trading ID"
                            className="w-full p-2.5 bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-600 dark:text-slate-400 dark:placeholder-slate-600 cursor-not-allowed transition-colors"
                            readOnly
                            data-testid="trading-id-input"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Purchase Date</label>
                        <input
                            type="date"
                            required
                            autoComplete="off"
                            {...register("purchase_date", { required: true })}
                            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 ring-indigo-500 dark:text-white transition-colors"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Purchase Rate (₹)</label>
                        <input
                            type="number"
                            step="0.01"
                            required
                            autoComplete="off"
                            {...register("purchase_rate", { required: true, min: 0.01 })}
                            placeholder="0.00"
                            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 ring-indigo-500 dark:text-white dark:placeholder-slate-500 transition-colors"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Purchase Quantity</label>
                        <input
                            type="number"
                            required
                            autoComplete="off"
                            {...register("purchase_qty", { required: true, min: 0.01 })}
                            placeholder="0"
                            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 ring-indigo-500 dark:text-white dark:placeholder-slate-500 transition-colors"
                        />
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Notes</label>
                    <textarea
                        {...register("comments")}
                        placeholder="Strategy, conviction, etc..."
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg h-24 outline-none focus:ring-2 ring-indigo-500 dark:text-white dark:placeholder-slate-500 transition-colors"
                    />
                </div>

                {formError && (
                    <div className="p-3 text-sm text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-900/30 rounded-xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 transition-colors">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <p>{formError}</p>
                    </div>
                )}

                <SubmitButton
                    isPending={loading}
                    label="Confirm Purchase"
                    classname="w-full py-3 bg-indigo-600 dark:bg-indigo-500 text-white rounded-xl font-bold hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20"
                    loadingText='Recording Purchase'
                />
            </form>

            {showAssetModal && (
                /* The backdrop: items-center and justify-center keep the modal in the dead center */
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <div
                        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 fade-in duration-200 border border-slate-200 dark:border-slate-800"
                        onClick={(e) => e.stopPropagation()} // Prevents clicks inside modal from closing it
                    >
                        <div className="bg-indigo-600 dark:bg-indigo-700 p-5 text-white">
                            <h3 className="text-xl font-bold">New Asset Details</h3>
                            <p className="text-xs opacity-90 text-indigo-100 dark:text-indigo-200 mt-1">
                                We found {pendingAsset?.ticker} but need a few more details to save it.
                            </p>
                        </div>

                        <form onSubmit={handleSaveNewAsset} className="p-6 space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                {/* Stock Name Field - Flexible wrapping */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Stock Name</label>
                                    {pendingAsset?.name ? (
                                        <div className="w-full p-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl border border-transparent text-sm font-medium leading-tight min-h-[48px] flex items-center">
                                            {pendingAsset.name}
                                            {/* Ensures the name is still sent with the form submit */}
                                            <input type="hidden" name="name" value={pendingAsset.name} />
                                        </div>
                                    ) : (
                                        <input
                                            name="name"
                                            required
                                            placeholder="Enter Full Name"
                                            className="w-full p-3 bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-900/50 rounded-xl outline-none focus:ring-2 ring-indigo-500 transition-all text-sm dark:text-white dark:placeholder-slate-500"
                                        />
                                    )}
                                </div>

                                {/* Price Field - Mandated */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Price (₹) *</label>
                                    <input
                                        name="price"
                                        type="number"
                                        step="0.01"
                                        required
                                        defaultValue={pendingAsset?.price || ""}
                                        readOnly={!!pendingAsset?.price && pendingAsset?.price !== 0}
                                        placeholder="0.00"
                                        className={`w-full p-3 border rounded-xl outline-none transition-all text-sm ${pendingAsset?.price
                                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-not-allowed border-transparent'
                                            : 'bg-white dark:bg-slate-900 border-indigo-200 dark:border-indigo-900/50 focus:ring-2 ring-indigo-500 dark:text-white'
                                            }`}
                                    />
                                </div>
                            </div>

                            {/* ISIN Field - Mandated */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">ISIN Number *</label>
                                <input
                                    name="isin"
                                    required
                                    placeholder="e.g. INE002A01018"
                                    className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 ring-indigo-500 outline-none transition-all text-sm dark:text-white dark:placeholder-slate-500"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Cutoff / Price Band (₹)</label>
                                <input
                                    name="cutoff"
                                    type="number"
                                    step="0.01"
                                    required
                                    placeholder="Price of the stock on Feb 1, 2018"
                                    className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 ring-indigo-500 outline-none transition-all dark:text-white dark:placeholder-slate-500"
                                />
                            </div>

                            {formError && (
                                <div className="p-3 text-sm text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-900/30 rounded-xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 transition-colors">
                                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                    <p>{formError}</p>
                                </div>
                            )}

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowAssetModal(false);
                                        setPendingAsset(null);
                                        setFormError(null);
                                    }}
                                    className="flex-1 py-3 font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 font-bold bg-indigo-600 dark:bg-indigo-500 text-white rounded-xl hover:bg-indigo-700 dark:hover:bg-indigo-600 shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20 active:scale-[0.98] transition-all"
                                >
                                    Save & Continue
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );

}