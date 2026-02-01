// "use server"

// import { createClient } from '@/lib/supabase/server'; 
// import { revalidatePath } from 'next/cache';

// import YahooFinance from 'yahoo-finance2';

// // Create the instance once at the top level of the file
// const yf = new YahooFinance();

// export async function syncAssetsAction() {
//   const supabase = await createClient();

//   try {
    
//     // 1. Fetch both ticker AND stock_name so we have the names handy
//     const { data: assets, error: fetchError } = await supabase
//       .from('assets')
//       .select('ticker, stock_name');

//     if (fetchError || !assets) throw new Error("DB Fetch failed");

//     // 2. Slice for testing
//     const tickersToFetch = assets.map(a => 
//       a.ticker.includes('.') ? a.ticker.toUpperCase() : `${a.ticker.toUpperCase()}.NS`
//     );

//     // 3. Fetch from Yahoo
//     const quotes = await yf.quote(tickersToFetch);

//     // 4. Map results AND re-inject the stock_name
//     const upsertData = quotes
//       .filter(q => q.regularMarketPrice != null)
//       .map(q => {
//         const cleanTicker = q.symbol.replace('.NS', '');
        
//         // Find the original asset to get its name
//         const original = assets.find(a => a.ticker === cleanTicker);

//         return {
//           ticker: cleanTicker,
//           stock_name: original?.stock_name, // RE-INJECT NAME HERE
//           current_price: Number(q.regularMarketPrice),
//           last_updated: new Date().toISOString()
//         };
//       });


//       // 5. Update Database (standard upsert now works because names aren't null)
//     const { error: upsertError } = await supabase
//       .from('assets')
//       .upsert(upsertData, { onConflict: 'ticker' });

//     if (upsertError) throw upsertError;

//     revalidatePath('/');
//     return { success: true, message: "Sync successful!" };

//   } catch (error: any) {
//     console.error("Sync Error:", error.message);
//     return { success: false, error: error.message };
//   }
// }

"use server"

import { createClient } from '@/lib/supabase/server'; 
import { revalidatePath } from 'next/cache';
import YahooFinance from 'yahoo-finance2';

const yf = new YahooFinance();

// Helper to split array into chunks
const chunkArray = <T>(array: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

export async function syncAssetsAction() {
  const supabase = await createClient();
  const BATCH_SIZE = 100;

  try {
    // 1. Fetch assets
    const { data: assets, error: fetchError } = await supabase
      .from('assets')
      .select('ticker, stock_name');

    if (fetchError || !assets) throw new Error("DB Fetch failed");

    // 2. Prepare Chunks
    const assetChunks = chunkArray(assets, BATCH_SIZE);
    let totalSynced = 0;

    // 3. Process each batch
    for (const chunk of assetChunks) {
      const tickersToFetch = chunk.map(a => 
        a.ticker.includes('.') ? a.ticker.toUpperCase() : `${a.ticker.toUpperCase()}.NS`
      );

      // Fetch quotes for this batch
      const quotes = await yf.quote(tickersToFetch);

      // Map data for Supabase
      const upsertData = (Array.isArray(quotes) ? quotes : [quotes])
        .filter(q => q.regularMarketPrice != null)
        .map(q => {
          const cleanTicker = q.symbol.replace('.NS', '');
          const original = chunk.find(a => a.ticker === cleanTicker);

          return {
            ticker: cleanTicker,
            stock_name: original?.stock_name,
            current_price: Number(q.regularMarketPrice),
            last_updated: new Date().toISOString()
          };
        });

      // 4. Upsert this batch
      if (upsertData.length > 0) {
        const { error: upsertError } = await supabase
          .from('assets')
          .upsert(upsertData, { onConflict: 'ticker' });

        if (upsertError) throw upsertError;
        totalSynced += upsertData.length;
      }
    }

    revalidatePath('/');
    return { success: true, message: `Successfully synced ${totalSynced} assets in batches.` };

  } catch (error: any) {
    console.error("Sync Error:", error.message);
    return { success: false, error: error.message };
  }
}