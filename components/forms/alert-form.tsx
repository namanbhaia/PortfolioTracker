"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { createAlert } from "@/lib/actions/price-alerts";
import { SubmitButton } from "@/components/ui/submit-button";

export function AlertForm() {
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [successMsg, setSuccessMsg] = useState("");
    
    const { register, handleSubmit, watch, reset } = useForm<any>({
        defaultValues: {
            condition: "greater_than",
            target_type: "manual"
        }
    });
    const condition = watch("condition");
    const targetType = watch("target_type");

    const onSubmit = async (data: any) => {
        setLoading(true);
        setErrorMsg("");
        setSuccessMsg("");
        try {
            // Clean up optional fields
            const payload = {
                ticker: data.ticker.toUpperCase(),
                condition: data.condition,
                target_type: data.target_type,
                target_value: data.target_value ? Number(data.target_value) : 1, // Fallback for 0
                is_one_time: data.is_one_time === "true",
                note: data.note || undefined,
                expires_at: data.expires_at || undefined,
            };

            await createAlert(payload as any);
            setSuccessMsg("Alert successfully active.");
            reset();
        } catch (err: any) {
            setErrorMsg(err.message || "Failed to create alert.");
        } finally {
            setLoading(false);
            setTimeout(() => setSuccessMsg(""), 3000);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-slate-500">Ticker</label>
                <input 
                    {...register("ticker", { required: true })} 
                    placeholder="e.g. RELIANCE" 
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 ring-indigo-500/20 dark:bg-slate-800 dark:border-slate-700" 
                    required 
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-slate-500">Condition</label>
                    <select {...register("condition")} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none dark:bg-slate-800 dark:border-slate-700" required>
                        <option value="greater_than">Greater Than</option>
                        <option value="less_than">Less Than</option>
                        <option value="crossing_up">Crossing Up</option>
                        <option value="crossing_down">Crossing Down</option>
                        <option value="volume_spike">Volume Spike</option>
                        <option value="percentage_change_up">Percentage Jump</option>
                        <option value="percentage_change_down">Percentage Drop</option>
                    </select>
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-slate-500">Target Against</label>
                    <select {...register("target_type")} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none dark:bg-slate-800 dark:border-slate-700" required>
                        <option value="manual">Manual Number</option>
                        {(condition === 'percentage_change_up' || condition === 'percentage_change_down' || condition === 'greater_than' || condition === 'less_than') && (
                            <>
                                <option value="today_open">Today's Open</option>
                                <option value="fifty_two_week_high">52-Week High</option>
                                <option value="fifty_two_week_low">52-Week Low</option>
                            </>
                        )}
                        {condition === 'volume_spike' && (
                            <option value="avg_volume">Average Volume</option>
                        )}
                    </select>
                </div>
            </div>

            <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-slate-500">
                    {targetType === 'manual' ? 'Price Target (₹)' : condition === 'volume_spike' ? 'Multiplier (e.g. 1.5 for 150%)' : condition?.includes('percentage') ? 'Percentage (%)' : 'Offset / Value'}
                </label>
                <input 
                    type="number" 
                    step="any"
                    {...register("target_value", { required: true })} 
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none dark:bg-slate-800 dark:border-slate-700" 
                    required 
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-slate-500">Behavior</label>
                    <select {...register("is_one_time")} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none dark:bg-slate-800 dark:border-slate-700">
                        <option value="false">Recurring (Snoozable)</option>
                        <option value="true">One-Time Only</option>
                    </select>
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-slate-500">Expires At (Optional)</label>
                    <input 
                        type="date"
                        {...register("expires_at")}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none dark:bg-slate-800 dark:border-slate-700" 
                    />
                </div>
            </div>

            <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-slate-500">Note / Reason</label>
                <textarea 
                    {...register("note")}
                    placeholder="e.g. Sell 50 shares to lock in profits..." 
                    className="w-full p-2.5 h-20 bg-slate-50 border border-slate-200 rounded-lg outline-none dark:bg-slate-800 dark:border-slate-700 resize-none" 
                />
            </div>

            {errorMsg && <p className="text-sm text-rose-600 bg-rose-50 p-3 rounded-lg border border-rose-200">{errorMsg}</p>}
            {successMsg && <p className="text-sm text-emerald-600 bg-emerald-50 p-3 rounded-lg border border-emerald-200">{successMsg}</p>}

            <SubmitButton 
                isPending={loading} 
                label="Save Alert Configuration"
                loadingText="Saving..."
                classname="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition"
            />
        </form>
    );
}
