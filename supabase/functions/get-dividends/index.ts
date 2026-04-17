import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const tickerMapping: Record<string, string> = {
  'FII GGRCOVEP': 'GGRC11', 'GGRC11': 'GGRC11',
  'FII VINCI SC': 'VISC11', 'VISC11': 'VISC11',
  'CEMIG': 'CMIG4', 'CMIG4': 'CMIG4',
  'ITAUSA': 'ITSA4', 'ITSA4': 'ITSA4', 'ITSA3': 'ITSA3',
  'PETR4': 'PETR4', 'PETROBRAS': 'PETR4',
  'VALE3': 'VALE3', 'VALE': 'VALE3',
  'BBDC4': 'BBDC4', 'BRADESCO': 'BBDC4',
  'BBAS3': 'BBAS3', 'BANCO DO BRASIL': 'BBAS3',
  'WEGE3': 'WEGE3', 'WEG': 'WEGE3',
  'ABEV3': 'ABEV3', 'AMBEV': 'ABEV3',
  'TAEE11': 'TAEE11', 'TAESA': 'TAEE11',
  'KLBN11': 'KLBN11', 'KLABIN': 'KLBN11',
  'SUZB3': 'SUZB3', 'SUZANO': 'SUZB3',
  'EGIE3': 'EGIE3', 'ENGIE': 'EGIE3',
  'BBSE3': 'BBSE3', 'BBSEGURIDADE': 'BBSE3', 'BB SEGURIDADE': 'BBSE3',
  'BRCO11': 'BRCO11', 'FII BRESCO': 'BRCO11', 'BRESCO': 'BRCO11',
  'HGLG11': 'HGLG11', 'FII HGLG PAX': 'HGLG11', 'CSHG LOGISTICA': 'HGLG11',
  'KNRI11': 'KNRI11', 'FII KINEA UN': 'KNRI11', 'FII KINEA': 'KNRI11',
  'MCCI11': 'MCCI11', 'FII MAUA': 'MCCI11', 'MAUA CAPITAL': 'MCCI11', 'MAUA11': 'MCCI11',
  'XPML11': 'XPML11', 'FII XP MALLS': 'XPML11', 'XP MALLS': 'XPML11',
  'PRIO3': 'PRIO3', 'PETRORIO': 'PRIO3',
  'UNIP6': 'UNIP6', 'UNIPAR': 'UNIP6',
  'WIZC3': 'WIZC3', 'WIZ CO': 'WIZC3', 'WIZS3': 'WIZC3',
  'AXIA6': 'AXIA6', 'ELET6': 'AXIA6', 'ELETROBRAS': 'AXIA6',
  'AXIA7': 'AXIA7',
  'ELET3': 'ELET3',
  'GARE11': 'GARE11', 'GUARD11': 'GARE11',
  'VAMO3': 'VAMO3', 'VAMOS': 'VAMO3',
  'MOTV3': 'MOTV3', 'CCRO3': 'MOTV3',
  'PMLL11': 'PMLL11', 'MALL11': 'PMLL11',
};

function isBrazilianTicker(ticker: string): boolean {
  return /^[A-Z]{4}\d{1,2}$/.test(ticker.trim().toUpperCase());
}

function normalizeTickerName(name: string): string {
  const normalized = name.trim().toUpperCase();
  const withoutF = normalized.endsWith('F') ? normalized.slice(0, -1) : normalized;
  if (tickerMapping[normalized]) return tickerMapping[normalized];
  if (tickerMapping[withoutF]) return tickerMapping[withoutF];
  if (/^[A-Z]{4}\d{1,2}$/.test(withoutF)) return withoutF;
  return withoutF;
}

interface DividendEvent {
  date: string;
  amount: number;
}

interface CorporateEvent {
  date: string;
  type: string;
  description: string;
  ratio?: string;
  numerator?: number;
  denominator?: number;
  adjustmentFactor?: number;
}

interface TickerChange {
  old_ticker: string;
  new_ticker: string;
  change_date: string;
  reason: string;
  bonus_ticker: string | null;
  bonus_ratio: number | null;
  description: string | null;
}

async function fetchTickerChanges(ticker: string): Promise<TickerChange[]> {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
      .from('ticker_changes')
      .select('*')
      .or(`old_ticker.eq.${ticker},new_ticker.eq.${ticker}`)
      .order('change_date', { ascending: true });

    if (error) {
      console.error('Error fetching ticker changes:', error);
      return [];
    }
    return data || [];
  } catch (error) {
    console.error('Error fetching ticker changes:', error);
    return [];
  }
}

async function fetchDividendsAndEvents(ticker: string): Promise<{ dividends: DividendEvent[]; corporateEvents: CorporateEvent[] }> {
  try {
    const yahooTicker = isBrazilianTicker(ticker) ? `${ticker}.SA` : ticker;
    const now = Math.floor(Date.now() / 1000);
    const tenYearsAgo = now - (10 * 365 * 24 * 60 * 60);

    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooTicker}?period1=${tenYearsAgo}&period2=${now}&interval=1mo&events=div%7Csplit%7CcapitalGains`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      console.log(`Yahoo Finance error for ${ticker}: ${response.status}`);
      return { dividends: [], corporateEvents: [] };
    }

    const data = await response.json();
    const events = data.chart?.result?.[0]?.events;

    const dividends: DividendEvent[] = [];
    if (events?.dividends) {
      for (const div of Object.values(events.dividends) as any[]) {
        dividends.push({
          date: new Date(div.date * 1000).toISOString().split('T')[0],
          amount: div.amount,
        });
      }
      dividends.sort((a, b) => b.date.localeCompare(a.date));
    }

    const corporateEvents: CorporateEvent[] = [];

    if (events?.splits) {
      for (const split of Object.values(events.splits) as any[]) {
        const date = new Date(split.date * 1000).toISOString().split('T')[0];
        const numerator = split.numerator;
        const denominator = split.denominator;
        const ratio = `${numerator}:${denominator}`;
        const adjustmentFactor = numerator / denominator;

        let type = 'Desdobramento';
        let description = `Desdobramento ${ratio} — cada ação virou ${(numerator / denominator).toFixed(2)} ações`;

        if (numerator > denominator) {
          type = numerator / denominator >= 1.5 ? 'Desdobramento' : 'Bonificação';
          if (type === 'Bonificação') {
            description = `Bonificação de ${((numerator / denominator - 1) * 100).toFixed(0)}% (${ratio}) — quantidade multiplicada por ${(numerator / denominator).toFixed(2)}`;
          } else {
            description = `Desdobramento ${ratio} — cada ação virou ${(numerator / denominator).toFixed(0)} ações`;
          }
        } else if (numerator < denominator) {
          type = 'Grupamento';
          description = `Grupamento ${ratio} — cada ${denominator} ações viraram ${numerator}`;
        }

        corporateEvents.push({ date, type, description, ratio, numerator, denominator, adjustmentFactor });
      }
    }

    if (events?.capitalGains) {
      for (const cg of Object.values(events.capitalGains) as any[]) {
        const date = new Date(cg.date * 1000).toISOString().split('T')[0];
        corporateEvents.push({
          date,
          type: 'Rendimento',
          description: `Rendimento de capital: R$ ${cg.amount.toFixed(4)} por ação`,
        });
      }
    }

    corporateEvents.sort((a, b) => a.date.localeCompare(b.date));

    return { dividends, corporateEvents };
  } catch (error) {
    console.error(`Error fetching data for ${ticker}:`, error);
    return { dividends: [], corporateEvents: [] };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { ticker } = await req.json();

    if (!ticker) {
      return new Response(
        JSON.stringify({ error: 'Ticker is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const normalizedTicker = normalizeTickerName(ticker);
    console.log(`Fetching data for ${ticker} -> ${normalizedTicker}`);

    // Fetch ticker changes from database
    const tickerChanges = await fetchTickerChanges(normalizedTicker);

    // Convert ticker changes to corporate events for the timeline
    const tickerChangeEvents: CorporateEvent[] = tickerChanges
      .filter(tc => tc.old_ticker !== tc.new_ticker) // Only actual changes
      .map(tc => ({
        date: tc.change_date,
        type: 'Mudança de Ticker',
        description: tc.description || `${tc.old_ticker} → ${tc.new_ticker}: ${tc.reason}`,
      }));

    const { dividends, corporateEvents } = await fetchDividendsAndEvents(normalizedTicker);

    // Merge ticker change events into corporate events
    const allCorporateEvents = [...corporateEvents, ...tickerChangeEvents]
      .sort((a, b) => a.date.localeCompare(b.date));

    return new Response(
      JSON.stringify({ 
        dividends, 
        corporateEvents: allCorporateEvents, 
        tickerChanges,
        ticker: normalizedTicker 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', dividends: [], corporateEvents: [], tickerChanges: [] }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
