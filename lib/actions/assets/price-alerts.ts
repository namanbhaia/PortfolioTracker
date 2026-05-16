"use server";

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export type AlertCondition = 'greater_than' | 'less_than' | 'crossing_up' | 'crossing_down' | 'volume_spike' | 'percentage_change_up' | 'percentage_change_down';

export interface PriceAlert {
    id?: string;
    ticker: string;
    condition: AlertCondition;
    target_type: string;
    target_value: number;
    is_one_time: boolean;
    note?: string;
    expires_at?: string;
    is_active?: boolean;
    is_triggered?: boolean;
    snoozed_until?: string;
}

async function getAuthSession() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");
    return { supabase, user };
}

export async function getAlerts() {
    const { supabase, user } = await getAuthSession();

    const { data, error } = await supabase
        .from('price_alerts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
}

export async function createAlert(alertData: PriceAlert) {
    const { supabase, user } = await getAuthSession();

    const { data, error } = await supabase
        .from('price_alerts')
        .insert({
            user_id: user.id,
            ...alertData
        })
        .select()
        .single();

    if (error) throw error;
    revalidatePath('/dashboard/alerts');
    return { success: true, data };
}

export async function updateAlert(id: string, updates: Partial<PriceAlert>) {
    const { supabase, user } = await getAuthSession();

    const { data, error } = await supabase
        .from('price_alerts')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select();

    if (error) throw error;
    if (!data || data.length === 0) {
        throw new Error("Target alert not found or you don't have permission to update it.");
    }

    revalidatePath('/dashboard/alerts');
    return { success: true };
}

export async function deleteAlert(id: string) {
    const { supabase, user } = await getAuthSession();

    const { error } = await supabase
        .from('price_alerts')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

    if (error) throw error;
    revalidatePath('/dashboard/alerts');
    return { success: true };
}

export async function snoozeAlert(id: string, hours: number) {
    const snoozedUntil = new Date();
    snoozedUntil.setHours(snoozedUntil.getHours() + hours);

    return await updateAlert(id, { 
        snoozed_until: snoozedUntil.toISOString(),
        is_triggered: false // Reset triggered state when snoozed
    });
}

export async function markAlertAsRead(id: string) {
    return await updateAlert(id, { is_triggered: false });
}
