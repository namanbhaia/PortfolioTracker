import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
    try {
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // 1. Fetch all active tickers from your Assets table
        const { data: assets, error: fetchError } = await supabase
            .from('assets')
            .select('ticker, isin')

        if (fetchError) throw fetchError

        // 2. Loop and Update (Using a professional Indian market provider)
        for (const asset of assets) {
            // In 2026, using a provider like Dhan or RapidAPI is standard for NSE/BSE
            const response = await fetch(`https://api.example.com/quotes/${asset.ticker}`, {
                headers: { "Authorization": `Bearer ${Deno.env.get('MARKET_API_KEY')}` }
            })
            const data = await response.json()

            const newPrice = data.last_price

            // 3. Update the database
            const { error: updateError } = await supabase
                .from('assets')
                .update({
                    current_price: newPrice,
                    last_updated: new Date().toISOString()
                })
                .eq('ticker', asset.ticker)

            if (updateError) console.error(`Failed update for ${asset.ticker}`)

            // Respect rate limits of your API provider
            await new Promise(r => setTimeout(r, 200));
        }

        return new Response(JSON.stringify({ message: "Update successful" }), {
            headers: { "Content-Type": "application/json" },
        })

    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 })
    }
})