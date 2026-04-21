import { Metadata } from "next";
import { getAlerts } from "@/lib/actions/price-alerts";
import { AlertForm } from "@/components/forms/alert-form";
import { Clock, CheckCircle2, AlertTriangle, Info } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DeleteAlertButton } from "@/components/dashboard/alerts/delete-alert-button";

export const metadata: Metadata = {
    title: "Price Alerts | Portfolio Tracker",
};

export const dynamic = 'force-dynamic';

export default async function AlertsPage() {
    let alerts: any[] = [];
    try {
        alerts = await getAlerts();
    } catch (e) {
        console.error(e);
    }

    const activeAlerts = alerts.filter(a => a.is_active || a.snoozed_until);
    const triggeredAlerts = alerts.filter(a => a.is_triggered);

    return (
        <div className="p-4 md:p-8 space-y-8 animate-in fade-in pb-20">
            <header>
                <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Price Alerts</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-2xl">
                    Configure automated notifications for when your holdings breach key pricing or volume thresholds.
                </p>
            </header>

            <Tabs defaultValue="dashboard" className="w-full">
                <div className="flex justify-start mb-8">
                    <TabsList className="h-12 bg-slate-100/50 dark:bg-slate-800/30 p-1 rounded-2xl border border-slate-200/50 dark:border-slate-700/50">
                        <TabsTrigger value="dashboard" className="rounded-xl px-8 h-full text-sm font-bold data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-indigo-600 dark:data-[state=active]:text-indigo-400 data-[state=active]:shadow-sm transition-all duration-300">
                            Dashboard
                        </TabsTrigger>
                        <TabsTrigger value="create" className="rounded-xl px-8 h-full text-sm font-bold data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-indigo-600 dark:data-[state=active]:text-indigo-400 data-[state=active]:shadow-sm transition-all duration-300">
                            Create Alert
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="dashboard" className="space-y-6 focus:outline-none animate-in slide-in-from-bottom-2 fade-in duration-300">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
                            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Active Configs</h3>
                            <p className="text-3xl font-black">{activeAlerts.length}</p>
                        </div>
                        <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
                            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Recently Triggered</h3>
                            <p className="text-3xl font-black text-rose-600">{triggeredAlerts.length}</p>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
                        <h2 className="text-lg font-bold mb-6">Manage Alerts</h2>
                        
                        {alerts.length === 0 ? (
                            <div className="text-center p-10 text-slate-500 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl">
                                <CheckCircle2 size={32} className="mx-auto mb-3 opacity-50" />
                                <p>You haven't set up any alerts yet.</p>
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {alerts.map(a => (
                                    <div key={a.id} className={`p-4 border rounded-2xl flex items-center justify-between ${a.is_triggered ? 'border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-900/10' : 'border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20'}`}>
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-bold">{a.ticker}</h4>
                                                {a.is_triggered && <span className="text-[10px] bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full font-bold">TRIGGERED</span>}
                                                {a.snoozed_until && new Date(a.snoozed_until) > new Date() && <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold flex items-center gap-1"><Clock size={10} /> SNOOZED</span>}
                                            </div>
                                            <p className="text-xs text-slate-500">
                                                {a.condition.replace(/_/g, ' ')} {a.target_type === 'manual' ? a.target_value : a.target_type.replace(/_/g, ' ')} 
                                                {a.target_type !== 'manual' && a.target_value ? ` * ${a.target_value}` : ''}
                                            </p>
                                            {a.note && <p className="text-xs mt-2 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 w-fit px-2 py-1 rounded inline-flex items-center gap-1"><Info size={10} /> {a.note}</p>}
                                        </div>
                                        <div className="pl-4 border-l border-slate-200 dark:border-slate-800 flex items-center justify-center">
                                            <DeleteAlertButton id={a.id} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="create" className="focus:outline-none animate-in slide-in-from-bottom-2 fade-in duration-300">
                    <div className="mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm max-w-3xl">
                        <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
                            <span className="p-2.5 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 rounded-xl">
                                <AlertTriangle size={20} />
                            </span>
                            Create New Alert
                        </h2>
                        <div className="pt-2">
                            <AlertForm />
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
