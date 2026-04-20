"use client";

import { useEffect, useState, useRef } from 'react';
import { Bell, X, Info } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { TriggeredAlertsSheet } from './triggered-alerts-sheet';

export function AlertsBell({ className, showLabel }: { className?: string, showLabel?: boolean }) {
    const supabase = createClient();
    const [triggeredAlerts, setTriggeredAlerts] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [userId, setUserId] = useState<string | null>(null);
    const [toastMessage, setToastMessage] = useState<{ id: string, message: string } | null>(null);
    const dialogRef = useRef<HTMLDialogElement>(null);

    useEffect(() => {
        const fetchInitial = async () => {
             const { data: { user } } = await supabase.auth.getUser();
             if (user) {
                 setUserId(user.id);
                 const { data } = await supabase
                     .from('price_alerts')
                     .select('*')
                     .eq('user_id', user.id)
                     .eq('is_triggered', true)
                     .order('created_at', { ascending: false });
                 
                 if (data) {
                     setTriggeredAlerts(data);
                     setUnreadCount(data.length);
                 }
             }
        };
        fetchInitial();
    }, [supabase]);

    useEffect(() => {
        if (!userId) return;

        const channel = supabase.channel(`price_alerts_changes_${userId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'price_alerts',
            }, (payload) => {
                console.log("🔔 [DEBUG] ANY REALTIME PAYLOAD RECEIVED:", payload);
                const newRecord = payload.new as any;
                const oldRecord = payload.old as any;
                
                if (!newRecord) {
                    console.log("Empty newRecord in payload.");
                    return;
                }
                
                console.log(`Payload details - Ticker: ${newRecord.ticker}, Triggered: ${newRecord.is_triggered}, Record UserID: ${newRecord.user_id}, Local UserID: ${userId}`);

                // Proceed even if mismatch during debug
                if (newRecord.is_triggered && (!oldRecord || !oldRecord.is_triggered)) {
                    console.log("Trigger condition met in Realtime payload!");
                    setTriggeredAlerts((prev) => {
                        const exists = prev.find(a => a.id === newRecord.id);
                        if (exists) return prev;
                        return [newRecord, ...prev];
                    });
                    setUnreadCount((prev) => prev + 1);
                    
                    setToastMessage({
                        id: newRecord.id,
                        message: `Alert Triggered: ${newRecord.ticker} ${newRecord.note ? '- ' + newRecord.note : ''}`
                    });
                    
                    setTimeout(() => setToastMessage(null), 5000);
                }
                
                // --- UPDATE to DISMISSED/SNOOZED ---
                if (!newRecord.is_triggered && oldRecord?.is_triggered) {
                    console.log("Dismiss condition met in Realtime payload!");
                    setTriggeredAlerts((prev) => {
                        const exists = prev.some(a => a.id === newRecord.id);
                        if (!exists) return prev;
                        
                        setUnreadCount((prevCount) => Math.max(0, prevCount - 1));
                        return prev.filter(a => a.id !== newRecord.id);
                    });
                }
            })
            .subscribe((status) => {
                console.log(`📡 Alert Sync Status for ${userId}:`, status);
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [userId, supabase]);

    const openModal = () => dialogRef.current?.showModal();

    const removeAlertFromState = (id: string) => {
        setTriggeredAlerts((prev) => {
            const exists = prev.some(a => a.id === id);
            if (!exists) return prev;
            setUnreadCount((count) => Math.max(0, count - 1));
            return prev.filter(a => a.id !== id);
        });
    };

    return (
        <>
            <button onClick={openModal} className={`relative flex items-center gap-2 transition-all outline-none ${className || 'p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                <div className="relative">
                    <Bell size={20} />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-rose-500 text-[8px] text-white font-bold animate-in zoom-in">
                            {unreadCount}
                        </span>
                    )}
                </div>
                {showLabel && <span className="text-sm font-medium">Alerts</span>}
            </button>

            {/* Slide-out Sheet using dialog */}
            <TriggeredAlertsSheet 
                dialogRef={dialogRef} 
                alerts={triggeredAlerts} 
                onRemove={removeAlertFromState} 
            />

            {/* Custom Toast Pop-up */}
            {toastMessage && (
                <div className="fixed bottom-4 right-4 z-[9999] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl p-4 flex gap-4 items-center animate-in slide-in-from-bottom-5 fade-in duration-300">
                    <div className="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 p-2 rounded-xl">
                        <Bell size={20} className="animate-bounce" />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">Price Alert</h4>
                        <p className="text-xs text-slate-500">{toastMessage.message}</p>
                    </div>
                    <button onClick={() => setToastMessage(null)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 transition-colors">
                        <X size={16} />
                    </button>
                </div>
            )}
        </>
    );
}
