"use client";

import { useEffect, useState, useRef } from 'react';
import { Bell, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { TriggeredAlertsSheet } from './triggered-alerts-sheet';

export function AlertsBell({ className, showLabel }: { className?: string, showLabel?: boolean }) {
    const supabase = createClient();
    const [triggeredAlerts, setTriggeredAlerts] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [userId, setUserId] = useState<string | null>(null);
    const [toastMessage, setToastMessage] = useState<{ id: string, message: string } | null>(null);
    const dialogRef = useRef<HTMLDialogElement>(null);

    const refreshAlerts = async (uid: string) => {
        const { data, error } = await supabase
            .from('price_alerts')
            .select('*')
            .eq('user_id', uid)
            .eq('is_triggered', true)
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error("Error refetching alerts:", error);
            return;
        }

        if (data) {
            setTriggeredAlerts(prev => {
                const newTriggers = data.filter(alert => !prev.some(p => p.id === alert.id));
                if (newTriggers.length > 0) {
                    const latest = newTriggers[0];
                    setToastMessage({ id: latest.id, message: `Alert: ${latest.ticker}` });
                    setTimeout(() => setToastMessage(null), 5000);
                }
                return data;
            });
            setUnreadCount(data.length);
        }
    };

    useEffect(() => {
        const fetchInitial = async () => {
             const { data: { user } } = await supabase.auth.getUser();
             if (user) {
                 setUserId(user.id);
                 refreshAlerts(user.id);
             }
        };
        fetchInitial();
    }, [supabase]);

    useEffect(() => {
        const handleGlobalRefresh = async () => {
            let uid = userId;
            if (!uid) {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    setUserId(user.id);
                    uid = user.id;
                }
            }

            if (uid) {
                refreshAlerts(uid);
            }
        };

        window.addEventListener('dashboard-refresh', handleGlobalRefresh);

        return () => {
            window.removeEventListener('dashboard-refresh', handleGlobalRefresh);
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

            <TriggeredAlertsSheet 
                dialogRef={dialogRef} 
                alerts={triggeredAlerts} 
                onRemove={removeAlertFromState} 
            />

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
