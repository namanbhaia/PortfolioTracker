import { TransactionForm } from "@/components/forms/transaction-form";

export default async function LedgerPage() {
    return (
        <div className="p-4 md:p-8 max-w-2xl mx-auto">
            <header className="mb-8 text-center">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight transition-colors">Record Transaction</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-2 transition-colors">Add new purchases or close out existing positions.</p>
            </header>

            <TransactionForm/>
        </div>
    );
}