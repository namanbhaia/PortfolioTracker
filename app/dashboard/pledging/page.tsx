import { PledgeForm } from "@/components/forms/pledge-form";
import { createClient } from "@/lib/supabase/server";

export default async function PledgingPage() {
    const supabase = await createClient();

    // Fetch unique client names for the dropdown
    const { data: clients } = await supabase.from('clients').select('client_name');

    return (
        <div className="p-8 max-w-2xl mx-auto">
            <header className="mb-8 text-center">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight transition-colors">Pledge Management</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-2 transition-colors">Manage collateral by pledging or unpledging shares against total holdings.</p>
            </header>

            <PledgeForm clients={clients || []} />
        </div>
    );
}