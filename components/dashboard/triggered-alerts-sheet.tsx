"use client";

import { X, Clock, Check, BellOff, Info } from 'lucide-react';
import { snoozeAlert, markAlertAsRead } from '@/lib/actions/price-alerts';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export function TriggeredAlertsSheet({ 
    dialogRef, 
    alerts, 
    onRemove 
}: { 
    dialogRef: React.RefObject<HTMLDialogElement | null>, 
    alerts: any[],
    onRemove: (id: string) => void
}) {
    const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());
    const router = useRouter();

    const closeModal = () => dialogRef.current?.close();

    const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
        if (e.target === dialogRef.current) {
            closeModal();
        }
    };

    const handleSnooze = async (id: string, hours: number) => {
        setLoadingIds(prev => new Set(prev).add(id));
        try {
            await snoozeAlert(id, hours);
            onRemove(id);
        } catch (e) {
            console.error("Failed to snooze alert:", e);
            alert("Failed to snooze alert.");
        } finally {
            setLoadingIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(id);
                return newSet;
            });
        }
    };

    const handleDismiss = async (id: string) => {
        setLoadingIds(prev => new Set(prev).add(id));
        try {
            await markAlertAsRead(id);
            onRemove(id);
        } catch (e) {
            console.error("Failed to dismiss alert:", e);
            alert("Failed to dismiss alert. Check console for details.");
        } finally {
            setLoadingIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(id);
                return newSet;
            });
        }
    };

    return (
        <dialog
            ref={dialogRef as React.RefObject<HTMLDialogElement>}
            onClick={handleBackdropClick}
            className="fixed top-0 right-0 h-full max-h-screen w-full sm:w-[400px] m-0 translate-x-full open:translate-x-0 transition-transform duration-300 shadow-2xl p-0 backdrop:bg-slate-900/40 border-l border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white ml-auto"
        >
            <div className="h-full flex flex-col">
                <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                        <span className="p-2 bg-rose-100 dark:bg-rose-900/50 text-rose-600 rounded-xl">
                            <BellOff size={18} />
                        </span>
                        Triggered Alerts
                    </h3>
                    <button onClick={closeModal} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {alerts.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 opacity-60">
                            <Check size={48} className="mb-4" />
                            <p>You have no triggered alerts right now.</p>
                        </div>
                    ) : (
                        alerts.map(alert => (
                            <div key={alert.id} className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm transition-opacity ${loadingIds.has(alert.id) ? 'opacity-50 pointer-events-none' : ''}`}>
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h4 className="font-bold text-lg">{alert.ticker}</h4>
                                        <p className="text-xs text-slate-500 capitalize">{alert.condition.replace(/_/g, ' ')}</p>
                                    </div>
                                    <span className="text-[10px] font-bold px-2 py-1 bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400 rounded-md">
                                        Triggered
                                    </span>
                                </div>
                                {alert.note && (
                                    <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm flex gap-2">
                                        <Info size={16} className="text-indigo-500 shrink-0 mt-0.5" />
                                        <span className="text-slate-600 dark:text-slate-300">{alert.note}</span>
                                    </div>
                                )}
                                <div className="mt-4 flex flex-wrap gap-2">
                                    <button onClick={() => handleDismiss(alert.id)} className="flex-1 py-2 px-3 text-sm font-bold bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl hover:opacity-90 transition-opacity">
                                        Dismiss
                                    </button>
                                    <button onClick={() => handleSnooze(alert.id, 1)} className="py-2 px-3 text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-slate-600 dark:text-slate-300 transition-colors flex items-center justify-center gap-1">
                                        <Clock size={14} /> 1H
                                    </button>
                                    <button onClick={() => handleSnooze(alert.id, 24)} className="py-2 px-3 text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-slate-600 dark:text-slate-300 transition-colors flex items-center justify-center gap-1">
                                        <Clock size={14} /> 1D
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
                <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
                    <button 
                        onClick={() => { closeModal(); router.push('/dashboard/alerts'); }}
                        className="w-full py-3 text-sm font-bold border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                        Manage All Alerts &rarr;
                    </button>
                </div>
            </div>
            
            {/* Custom CSS to animate the standard dialog like a sheet */}
            <style jsx>{`
                dialog[open] {
                    transform: translateX(0);
                    margin-left: auto;
                    margin-right: 0;
                }
                dialog::backdrop {
                    background: rgba(0, 0, 0, 0.4);
                }
            `}</style>
        </dialog>
    );
}
