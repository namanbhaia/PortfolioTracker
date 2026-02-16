"use server"
import { createClient } from '@/lib/supabase/server'; 

export const upsertInAsset = async (assetData: {
    ticker: string,
    name: string,
    price: number,
    isin: string,
    cutoff: number
}) => {
    const supabase = await createClient(); // Ensure you use the server-side client here
    
    const { data, error } = await supabase
        .from('assets')
        .upsert({
            ticker: assetData.ticker.toUpperCase(),
            stock_name: assetData.name,
            current_price: assetData.price,
            isin: assetData.isin,
            cutoff: assetData.cutoff,
            last_updated: new Date().toISOString()
        }, { onConflict: 'ticker' })
        .select()
        .single();

    if (error) throw error;
    return data;
};