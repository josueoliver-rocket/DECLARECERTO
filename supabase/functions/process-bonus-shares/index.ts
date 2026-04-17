import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Optional: process only for a specific user
    let userId: string | null = null;
    try {
      const body = await req.json();
      userId = body?.user_id || null;
    } catch {
      // No body, process all users
    }

    // 1. Fetch all ticker_changes that have a bonus
    const { data: bonusEvents, error: eventsError } = await supabase
      .from('ticker_changes')
      .select('*')
      .not('bonus_ticker', 'is', null)
      .not('bonus_ratio', 'is', null);

    if (eventsError) {
      throw new Error(`Error fetching bonus events: ${eventsError.message}`);
    }

    if (!bonusEvents || bonusEvents.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No bonus events found', processed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${bonusEvents.length} bonus events to process`);

    let totalInserted = 0;
    const results: Array<{ ticker: string; bonus_ticker: string; users_processed: number; shares_created: number }> = [];

    for (const event of bonusEvents) {
      const { old_ticker, new_ticker, bonus_ticker, bonus_ratio, bonus_price, change_date } = event;

      // The source ticker is new_ticker (the current name of the asset)
      // Users may hold it under old_ticker OR new_ticker
      const sourceTickers = [old_ticker, new_ticker].filter((v, i, a) => a.indexOf(v) === i);

      // 2. For each bonus event, find all users who had positions in the source asset
      // on or before the change_date
      let operacoesQuery = supabase
        .from('operacoes')
        .select('user_id, ativo, tipo, quantidade, created_at')
        .in('ativo', sourceTickers)
        .lte('created_at', `${change_date}T23:59:59Z`)
        .order('created_at', { ascending: true });

      if (userId) {
        operacoesQuery = operacoesQuery.eq('user_id', userId);
      }

      const { data: operacoes, error: opsError } = await operacoesQuery;

      if (opsError) {
        console.error(`Error fetching operations for ${new_ticker}:`, opsError);
        continue;
      }

      if (!operacoes || operacoes.length === 0) {
        console.log(`No operations found for ${sourceTickers.join('/')} before ${change_date}`);
        continue;
      }

      // 3. Calculate position per user on the record date
      const userPositions: Record<string, number> = {};
      for (const op of operacoes) {
        if (!userPositions[op.user_id]) {
          userPositions[op.user_id] = 0;
        }
        if (op.tipo === 'C') {
          userPositions[op.user_id] += Number(op.quantidade);
        } else {
          userPositions[op.user_id] -= Number(op.quantidade);
        }
      }

      let usersProcessed = 0;
      let sharesCreated = 0;

      for (const [uid, position] of Object.entries(userPositions)) {
        if (position <= 0) continue;

        // Calculate bonus shares
        const bonusShares = Math.floor(position * bonus_ratio);
        if (bonusShares <= 0) continue;

        // 4. Check if bonus was already inserted (avoid duplicates)
        const { data: existing } = await supabase
          .from('operacoes')
          .select('id')
          .eq('user_id', uid)
          .eq('ativo', bonus_ticker)
          .eq('tipo', 'C')
          .eq('quantidade', bonusShares)
          .eq('preco_unitario', 0)
          .limit(1);

        if (existing && existing.length > 0) {
          console.log(`Bonus already exists for user ${uid}: ${bonusShares} ${bonus_ticker}`);
          continue;
        }

        // 5. Insert bonus operation with official price from corporate event
        const unitPrice = bonus_price ? Number(bonus_price) : 0;
        const totalValue = unitPrice * bonusShares;
        const { error: insertError } = await supabase
          .from('operacoes')
          .insert({
            user_id: uid,
            ativo: bonus_ticker,
            tipo: 'C',
            quantidade: bonusShares,
            preco_unitario: unitPrice,
            valor_total: totalValue,
            created_at: `${change_date}T12:00:00Z`,
          });

        if (insertError) {
          console.error(`Error inserting bonus for user ${uid}:`, insertError);
          continue;
        }

        console.log(`Inserted ${bonusShares} ${bonus_ticker} for user ${uid} (from ${position} ${new_ticker})`);
        usersProcessed++;
        sharesCreated += bonusShares;
        totalInserted++;
      }

      results.push({
        ticker: new_ticker,
        bonus_ticker: bonus_ticker!,
        users_processed: usersProcessed,
        shares_created: sharesCreated,
      });
    }

    return new Response(
      JSON.stringify({ 
        message: `Processed ${totalInserted} bonus insertions`,
        results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error processing bonus shares:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
