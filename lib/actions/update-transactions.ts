"use server"

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { TransactionEditor } from '@/lib/actions/transaction-editor'; // Adjust path if necessary

export async function updateTransaction(id: string, type: 'purchase' | 'sale', data: any, currentPath: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized" };

    const editor = new TransactionEditor(supabase);
    const table = type === 'purchase' ? 'purchases' : 'sales';
    
    // 1. Fetch Original Record to compare changes and get context
    // We need client_name, ticker, and original dates for the re-process logic
    const { data: original, error: fetchError } = await supabase
        .from(table)
        .select('*')
        .eq('trx_id', id)
        .single();

    if (fetchError || !original) {
        return { error: `Transaction not found: ${fetchError?.message}` };
    }

    // 2. Normalize Inputs
    const newRate = Number(data.rate);
    const newQty = Number(data.qty || data.sale_qty || data.purchase_qty); // Handle varying form field names
    const newDate = data.date;
    const newComments = data.comments;

    try {
        if (type === 'purchase') {
            // --- PURCHASE LOGIC ---

            // A. Rate Change (Updates Profit on linked sales)
            if (newRate !== original.rate) {
                await editor.editPurchaseRate(id, newRate);
            }

            // B. Quantity Change (Complex Validation)
            // Note: We check if newQty is different. 
            if (newQty !== original.qty && newQty !== original.purchase_qty) {
                await editor.editPurchaseQty(
                    id, 
                    newQty, 
                    original.client_name, 
                    original.ticker, 
                    original.date
                );
            }

            // C. Date Change (Reprocesses Ledger)
            if (newDate !== original.date) {
                await editor.editPurchaseDate(
                    id, 
                    newDate, 
                    original.date, 
                    original.client_name, 
                    original.ticker
                );
            }

            // D. Comments / Metadata (Simple Update)
            if (newComments !== original.comments) {
                await supabase.from('purchases').update({ comments: newComments }).eq('trx_id', id);
            }

        } else {
            // --- SALE LOGIC ---
            // Sales are grouped by 'custom_id'. The UI sends the 'trx_id' of one split,
            // but the Editor methods expect 'custom_id' to update the whole batch.

            const customId = original.custom_id;
            if (!customId) throw new Error("Sale record missing Custom ID");

            // A. Rate Change
            if (newRate !== original.rate) {
                await editor.editSaleRate(customId, newRate);
            }

            // B. Quantity Change
            // Note: original.qty might be the split qty. The editor expects the TOTAL sale qty for the batch.
            // However, the form usually edits the specific record. 
            // If your UI allows editing the total, pass that. 
            // If your UI edits just this split, the logic below assumes 'newQty' is the intended TOTAL for the sale batch
            // OR we assume the user is updating the specific split and we need to aggregate.
            // *Based on transaction-editor.ts editSaleQty implementation*, it overrides the whole batch with newQty.
            if (newQty !== original.sale_qty) {
                 await editor.editSaleQty(
                     customId, 
                     newQty, 
                     original.client_name, 
                     original.ticker, 
                     original.date
                 );
            }

            // C. Date Change
            if (newDate !== original.date) {
                await editor.editSaleDate(
                    customId, 
                    newDate, 
                    original.date, 
                    original.client_name, 
                    original.ticker
                );
            }

            // D. Comments (Update all splits with this custom_id)
            if (newComments !== original.comments) {
                await supabase
                    .from('sales')
                    .update({ comments: newComments })
                    .eq('custom_id', customId);
            }
        }

        revalidatePath(currentPath);
        return { success: true };

    } catch (err: any) {
        console.error("Update Transaction Error:", err);
        return { error: err.message || "Failed to update transaction" };
    }
}