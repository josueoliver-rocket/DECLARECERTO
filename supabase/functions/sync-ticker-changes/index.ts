import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json().catch(() => ({}));
    const userId = body.user_id; // Optional - if not provided, sync ALL users

    // Get all ticker changes (renames and corrections)
    const { data: tickerChanges, error: changesError } = await supabase
      .from('ticker_changes')
      .select('old_ticker, new_ticker')
      .in('reason', ['Mudança de ticker', 'Mudança de nome', 'Ticker correto']);

    if (changesError) {
      console.error('Error fetching ticker changes:', changesError);
      throw changesError;
    }

    const updatedTickers: string[] = [];

    // Process each ticker change for ALL users or specific user
    for (const change of tickerChanges || []) {
      const { old_ticker, new_ticker } = change;

      // Build query - with or without user filter
      let query = supabase
        .from('operacoes')
        .update({ ativo: new_ticker })
        .eq('ativo', old_ticker);

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error: updateError } = await query.select('id');

      if (updateError) {
        console.error(`Error updating ${old_ticker} to ${new_ticker}:`, updateError);
      } else if (data && data.length > 0) {
        updatedTickers.push(`${old_ticker} → ${new_ticker} (${data.length} ops)`);
        console.log(`Updated ${data.length} operations: ${old_ticker} → ${new_ticker}`);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        updated: updatedTickers,
        scope: userId ? `user: ${userId}` : 'all users',
        message: updatedTickers.length > 0 
          ? `Sincronizados: ${updatedTickers.join(', ')}`
          : 'Todos os tickers estão corretos'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in sync-ticker-changes:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
