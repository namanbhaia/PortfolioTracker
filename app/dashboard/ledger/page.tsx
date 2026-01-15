import { TransactionForm } from "@/components/forms/transaction-form";
import { createClient } from "@/lib/supabase/server";

export default async function LedgerPage() {
    const supabase = await createClient();

    // Fetch clients for the dropdown
    const { data: clients } = await supabase.from('clients').select('client_name, trading_id, dp_id');


    return (
        <div className="p-8 max-w-2xl mx-auto">
            <header className="mb-8 text-center">
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Record Transaction</h1>
                <p className="text-slate-500 mt-2">Add new purchases or close out existing positions.</p>
            </header>

            <TransactionForm clients={clients || []} />
        </div>
    );
}