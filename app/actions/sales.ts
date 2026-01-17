"use server"

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function processSale(formData: FormData) {
    const supabase = await createClient();

    const saleData = {
        client_id: formData.get('client_id') as string,
        ticker: formData.get('ticker') as string,
        sale_date: new Date(formData.get('sale_date') as string),
        sale_rate: parseFloat(formData.get('sale_rate') as string),
        sale_qty: parseFloat(formData.get('sale_qty') as string),
        comments: formData.get('comments') as string,
    };

    // 1. Fetch all purchase lots for the client and ticker, ordered by date (FIFO)
    const { data: purchaseLots, error: fetchError } = await supabase
        .from('purchases')
        .select('*')
        .eq('client_id', saleData.client_id)
        .eq('ticker', saleData.ticker)
        .gt('balance_qty', 0)
        .order('date', { ascending: true });

    if (fetchError) {
        return { success: false, message: "Failed to fetch purchase history." };
    }

    // 2. Check if the client has enough balance
    const totalBalance = purchaseLots.reduce((acc, lot) => acc + lot.balance_qty, 0);
    if (totalBalance < saleData.sale_qty) {
        return { success: false, message: `Insufficient balance. Only ${totalBalance} shares available.` };
    }

    let remainingQtyToSell = saleData.sale_qty;
    const salesToInsert = [];
    const purchasesToUpdate = [];

    for (const lot of purchaseLots) {
        if (remainingQtyToSell <= 0) break;

        const qtyToSellFromLot = Math.min(lot.balance_qty, remainingQtyToSell);

        // 5. Determine if the transaction is long term
        const purchaseDate = new Date(lot.date);
        const saleDate = saleData.sale_date;
        const oneYear = 1000 * 60 * 60 * 24 * 365;
        const isLongTerm = (saleDate.getTime() - purchaseDate.getTime()) > oneYear;

        // 4. Prepare sales record
        salesToInsert.push({
            purchase_trx_id: lot.trx_id,
            user_id: lot.user_id, // Inherit user_id from purchase
            date: saleData.sale_date.toISOString(),
            rate: saleData.sale_rate,
            sale_qty: qtyToSellFromLot,
            comments: saleData.comments,
            long_term: isLongTerm
        });

        // 3. Prepare purchase balance update
        purchasesToUpdate.push({
            trx_id: lot.trx_id,
            balance_qty: lot.balance_qty - qtyToSellFromLot
        });

        remainingQtyToSell -= qtyToSellFromLot;
    }

    // Execute the transaction
    const { error: rpcError } = await supabase.rpc('record_sale_transaction', {
        sales_to_insert: salesToInsert,
        purchases_to_update: purchasesToUpdate
    });

    if (rpcError) {
        console.error("RPC Error:", rpcError);
        return { success: false, message: `Transaction failed: ${rpcError.message}` };
    }

    revalidatePath('/dashboard/sales');
    revalidatePath('/dashboard/holdings');
    return { success: true, message: "Sale recorded successfully!" };
}
