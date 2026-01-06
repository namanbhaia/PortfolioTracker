"use client"
import { useForm } from "react-hook-form";
import { calculateTax } from "@/lib/calculations";

export function SaleModal({ purchase, isOpen, onClose }) {
    const { register, handleSubmit, watch } = useForm({
        defaultValues: {
            sale_qty: purchase.balance_qty,
            sale_date: new Date().toISOString().split('T')[0],
            sale_rate: purchase.market_rate // Pre-fill with current market price
        }
    });

    const watchedRate = watch("sale_rate");
    const watchedQty = watch("sale_qty");

    // Real-time tax preview
    const taxPreview = calculateTax(
        purchase.purchase_rate,
        watchedRate,
        watchedQty,
        new Date(purchase.purchase_date),
        new Date()
    );

    const onSubmit = async (data) => {
        // Logic: POST to /api/sales
        // Ensure data.sale_qty <= purchase.balance_qty
        console.log("Recording Sale for Purchase ID:", purchase.trx_id, data);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-xl">
                <h2 className="text-xl font-bold mb-2">Sell {purchase.ticker}</h2>
                <p className="text-sm text-gray-500 mb-4">
                    Selling from batch bought on {purchase.purchase_date} at ₹{purchase.purchase_rate}
                </p>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold uppercase">Qty to Sell</label>
                            <input
                                {...register("sale_qty", { max: purchase.balance_qty })}
                                type="number"
                                className="w-full border p-2 rounded"
                            />
                            <span className="text-[10px] text-gray-400">Max: {purchase.balance_qty}</span>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold uppercase">Sale Rate (INR)</label>
                            <input {...register("sale_rate")} type="number" className="w-full border p-2 rounded" />
                        </div>
                    </div>

                    {/* Real-time Impact Logic */}
                    <div className="bg-slate-50 p-3 rounded border border-dashed">
                        <div className="flex justify-between text-sm">
                            <span>Est. Profit:</span>
                            <span className={taxPreview.profit >= 0 ? "text-green-600" : "text-red-600"}>
                                ₹{taxPreview.profit.toLocaleString()}
                            </span>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500">
                            <span>Tax Category:</span>
                            <span>{taxPreview.type}</span>
                        </div>
                    </div>

                    <textarea {...register("comments")} placeholder="Reason for selling..." className="w-full border p-2 rounded" />

                    <div className="flex gap-2">
                        <button type="button" onClick={onClose} className="flex-1 py-2 border rounded">Cancel</button>
                        <button type="submit" className="flex-1 py-2 bg-red-600 text-white rounded">Confirm Sale</button>
                    </div>
                </form>
            </div>
        </div>
    );
}