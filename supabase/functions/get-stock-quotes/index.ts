import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Mapeamento de nomes completos para tickers oficiais da B3
const tickerMapping: Record<string, string> = {
  // ── FIIs ──
  'AGFF11': 'AGFF11', 'ALZR11': 'ALZR11', 'BBPO11': 'BBPO11',
  'BCFF11': 'BCFF11', 'BPFF11': 'BPFF11', 'BTLG11': 'BTLG11',
  'FII BTLG': 'BTLG11',
  'CPTS11': 'CPTS11', 'CVBI11': 'CVBI11',
  'GGRC11': 'GGRC11', 'FII GGRCOVEP': 'GGRC11',
  'HFOF11': 'HFOF11', 'HGLG11': 'HGLG11', 'FII HGLG PAX': 'HGLG11',
  'HGRE11': 'HGRE11', 'HGRU11': 'HGRU11',
  'HSML11': 'HSML11',
  'IRDM11': 'IRDM11', 'FII IRIDIUM': 'IRDM11',
  'KNCR11': 'KNCR11', 'KNHF11': 'KNHF11', 'KNRI11': 'KNRI11',
  'LVBI11': 'LVBI11',
  'MCCI11': 'MCCI11', 'MCRE11': 'MCRE11', 'FIL MAUA': 'MCRE11', 'FII MAUA': 'MCRE11',
  'MCHF11': 'MCHF11',
  'MXRF11': 'MXRF11',
  'RBRF11': 'RBRF11', 'RBVA11': 'RBVA11',
  'RECR11': 'RECR11', 'FII REC RECE': 'RECR11', 'RECT11': 'RECT11',
  'RBRP11': 'RBRP11',
  'SNCI11': 'SNCI11',
  'TGAR11': 'TGAR11', 'FII TG ATIVO': 'TGAR11',
  'URPR11': 'URPR11',
  'VISC11': 'VISC11', 'FII VINCI SC': 'VISC11', 'FII VINCI': 'VISC11',
  'VRTA11': 'VRTA11',
  'XPML11': 'XPML11', 'FII XP MALLS': 'XPML11',
  'XPLG11': 'XPLG11', 'XPPR11': 'XPPR11',
  // ── Ações ──
  'ABEV3': 'ABEV3', 'AMBEV': 'ABEV3',
  'AGRO3': 'AGRO3', 'BRASILAGRO': 'AGRO3',
  'ALOS3': 'ALOS3', 'ALPA4': 'ALPA4', 'ARZZ3': 'ARZZ3',
  'ASAI3': 'ASAI3', 'AZUL4': 'AZUL4',
  'B3SA3': 'B3SA3', 'B3': 'B3SA3',
  'BBAS3': 'BBAS3', 'BANCO DO BRASIL': 'BBAS3',
  'BBDC3': 'BBDC3', 'BBDC4': 'BBDC4', 'BRADESCO': 'BBDC4',
  'BBSE3': 'BBSE3', 'BEEF3': 'BEEF3', 'BIDI11': 'BIDI11',
  'BPAC11': 'BPAC11', 'BRFS3': 'BRFS3', 'BRKM5': 'BRKM5', 'BRSR6': 'BRSR6', 'BANRISUL': 'BRSR6',
  'BRML3': 'BRML3', 'CASH3': 'CASH3', 'MOTV3': 'MOTV3', 'CCR': 'MOTV3',
  'CEAB3': 'CEAB3', 'CIEL3': 'CIEL3', 'BHIA3': 'BHIA3', 'CASAS BAHIA': 'BHIA3',
  'CMIG3': 'CMIG3', 'CMIG4': 'CMIG4', 'CEMIG': 'CMIG4',
  'COGN3': 'COGN3', 'CPFE3': 'CPFE3', 'CPLE6': 'CPLE6',
  'CRFB3': 'CRFB3', 'CSAN3': 'CSAN3', 'CSNA3': 'CSNA3',
  'CVCB3': 'CVCB3', 'CYRE3': 'CYRE3', 'DXCO3': 'DXCO3',
  'ECOR3': 'ECOR3', 'EGIE3': 'EGIE3', 'ENGIE BRASIL': 'EGIE3',
  'ELET3': 'ELET3', 'ELET6': 'ELET6', 'ELETROBRAS': 'ELET3',
  'EMBR3': 'EMBR3', 'ENEV3': 'ENEV3', 'ENGI11': 'ENGI11', 'ENERGISA': 'ENGI11', 'BRAV3': 'BRAV3', 'BRAVA': 'BRAV3',
  'EQTL3': 'EQTL3', 'EZTC3': 'EZTC3', 'EZTEC': 'EZTC3',
  'FLRY3': 'FLRY3', 'GGBR4': 'GGBR4', 'GOAU4': 'GOAU4',
  'GOLL54': 'GOLL54', 'GOL': 'GOLL54', 'AZUL54': 'AZUL54', 'AZUL': 'AZUL54', 'HAPV3': 'HAPV3', 'HYPE3': 'HYPE3',
  'IGTI11': 'IGTI11', 'IRBR3': 'IRBR3',
  'ITSA3': 'ITSA3', 'ITSA4': 'ITSA4', 'ITAUSA': 'ITSA4',
  'ITUB3': 'ITUB3', 'ITUB4': 'ITUB4',
  'JBSS3': 'JBSS3', 'JBS': 'JBSS3', 'JHSF3': 'JHSF3',
  'KLBN3': 'KLBN3', 'KLBN4': 'KLBN4', 'KLBN11': 'KLBN11', 'KLABIN S/A': 'KLBN11', 'KLABIN': 'KLBN11',
  'LREN3': 'LREN3', 'LOJAS RENNER': 'LREN3',
  'LWSA3': 'LWSA3', 'MGLU3': 'MGLU3', 'MAGAZINE LUIZA': 'MGLU3',
  'MRFG3': 'MRFG3', 'MRVE3': 'MRVE3', 'MULT3': 'MULT3',
  'NTCO3': 'NTCO3', 'PCAR3': 'PCAR3',
  'PETR3': 'PETR3', 'PETR4': 'PETR4', 'PETROBRAS': 'PETR4',
  'PETZ3': 'PETZ3', 'PNVL3': 'PNVL3', 'DIMED': 'PNVL3',
  'PRIO3': 'PRIO3', 'QUAL3': 'QUAL3', 'RADL3': 'RADL3',
  'RAIL3': 'RAIL3', 'RAPT4': 'RAPT4', 'RDOR3': 'RDOR3',
  'RENT3': 'RENT3', 'LOCALIZA': 'RENT3',
  'RRRP3': 'RRRP3', 'SANB11': 'SANB11', 'SBFG3': 'SBFG3',
  'SBSP3': 'SBSP3', 'SIMH3': 'SIMH3', 'SIMPAR': 'SIMH3',
  'SLCE3': 'SLCE3', 'SMFT3': 'SMFT3', 'SMTO3': 'SMTO3',
  'STBP3': 'STBP3', 'SUZB3': 'SUZB3', 'SUZANO': 'SUZB3',
  'TAEE11': 'TAEE11', 'TAESA': 'TAEE11',
  'TIMS3': 'TIMS3', 'TOTS3': 'TOTS3', 'UGPA3': 'UGPA3',
  'USIM5': 'USIM5', 'VALE3': 'VALE3', 'VALE': 'VALE3',
  'VBBR3': 'VBBR3', 'VIVT3': 'VIVT3', 'VULC3': 'VULC3',
  'WEGE3': 'WEGE3', 'WEG': 'WEGE3', 'YDUQ3': 'YDUQ3',
};

function normalizeTickerName(name: string): string {
  const normalized = name.trim().toUpperCase();
  const withoutF = normalized.endsWith('F') ? normalized.slice(0, -1) : normalized;
  if (tickerMapping[normalized]) return tickerMapping[normalized];
  if (tickerMapping[withoutF]) return tickerMapping[withoutF];
  if (/^[A-Z]{4}\d{1,2}$/.test(withoutF)) return withoutF;
  return withoutF;
}

// Determina se é ativo brasileiro (precisa do sufixo .SA no Yahoo)
function isBrazilianTicker(ticker: string): boolean {
  // Tickers brasileiros: 4 letras + 1-2 dígitos
  return /^[A-Z]{4}\d{1,2}$/.test(ticker);
}

// Busca cotação atual via Yahoo Finance
async function fetchYahooQuote(ticker: string): Promise<{ price: number; change: number; changePercent: number; name?: string } | null> {
  try {
    const yahooTicker = isBrazilianTicker(ticker) ? `${ticker}.SA` : ticker;
    
    const response = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${yahooTicker}?interval=1d&range=1d`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      }
    );
    
    if (!response.ok) {
      console.log(`Yahoo Finance error for ${ticker}: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    
    if (data.chart?.result?.[0]?.meta) {
      const meta = data.chart.result[0].meta;
      const price = meta.regularMarketPrice;
      const previousClose = meta.previousClose || meta.chartPreviousClose;
      const change = price - previousClose;
      const changePercent = previousClose > 0 ? (change / previousClose) * 100 : 0;
      const name = meta.shortName || meta.longName || undefined;
      
      return { price, change, changePercent, name };
    }
    
    return null;
  } catch (error) {
    console.error(`Error fetching ${ticker} from Yahoo:`, error);
    return null;
  }
}

// Busca cotação HISTÓRICA via Yahoo Finance para uma data específica
async function fetchYahooHistoricalQuote(ticker: string, dateStr: string): Promise<{ price: number; change: number; changePercent: number } | null> {
  try {
    const yahooTicker = isBrazilianTicker(ticker) ? `${ticker}.SA` : ticker;
    
    // Parse the date and create period1/period2 (Unix timestamps)
    const targetDate = new Date(dateStr + 'T00:00:00Z');
    // Go 5 days before to ensure we get data (weekends/holidays)
    const startDate = new Date(targetDate);
    startDate.setDate(startDate.getDate() - 5);
    // Go 1 day after
    const endDate = new Date(targetDate);
    endDate.setDate(endDate.getDate() + 1);
    
    const period1 = Math.floor(startDate.getTime() / 1000);
    const period2 = Math.floor(endDate.getTime() / 1000);
    
    console.log(`Fetching historical for ${yahooTicker} date=${dateStr} period1=${period1} period2=${period2}`);
    
    const response = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${yahooTicker}?period1=${period1}&period2=${period2}&interval=1d`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      }
    );
    
    if (!response.ok) {
      console.log(`Yahoo Finance historical error for ${ticker}: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    
    if (data.chart?.result?.[0]) {
      const result = data.chart.result[0];
      const timestamps = result.timestamp || [];
      const closes = result.indicators?.quote?.[0]?.close || [];
      
      if (timestamps.length === 0 || closes.length === 0) {
        console.log(`No historical data for ${ticker} on ${dateStr}`);
        return null;
      }
      
      // Find the closest date to the target
      const targetTs = targetDate.getTime() / 1000;
      let bestIdx = 0;
      let bestDiff = Math.abs(timestamps[0] - targetTs);
      
      for (let i = 1; i < timestamps.length; i++) {
        const diff = Math.abs(timestamps[i] - targetTs);
        if (diff < bestDiff) {
          bestDiff = diff;
          bestIdx = i;
        }
      }
      
      const price = closes[bestIdx];
      if (price == null) {
        // Try the last non-null close
        for (let i = closes.length - 1; i >= 0; i--) {
          if (closes[i] != null) {
            return { price: closes[i], change: 0, changePercent: 0 };
          }
        }
        return null;
      }
      
      const prevClose = bestIdx > 0 && closes[bestIdx - 1] != null ? closes[bestIdx - 1] : price;
      const change = price - prevClose;
      const changePercent = prevClose > 0 ? (change / prevClose) * 100 : 0;
      
      console.log(`Historical price for ${ticker} on ${dateStr}: ${price}`);
      return { price, change, changePercent };
    }
    
    return null;
  } catch (error) {
    console.error(`Error fetching historical ${ticker}:`, error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { tickers, date } = body;

    if (!tickers || !Array.isArray(tickers) || tickers.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Tickers array is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Tickers recebidos:', tickers, 'Date:', date || 'hoje');

    const tickerMappings: Record<string, string> = {};
    const uniqueApiTickers: Set<string> = new Set();
    
    tickers.forEach((t: string) => {
      const normalized = normalizeTickerName(t);
      tickerMappings[t] = normalized;
      uniqueApiTickers.add(normalized);
    });

    console.log('Mapeamento de tickers:', tickerMappings);

    const apiTickers = [...uniqueApiTickers];
    
    // Use historical or current quote based on whether date is provided
    const quotePromises = date
      ? apiTickers.map(ticker => fetchYahooHistoricalQuote(ticker, date))
      : apiTickers.map(ticker => fetchYahooQuote(ticker));
    
    const quoteResults = await Promise.all(quotePromises);

    const apiResults: Record<string, { price: number; change: number; changePercent: number; name?: string }> = {};
    apiTickers.forEach((ticker, index) => {
      if (quoteResults[index]) {
        apiResults[ticker] = quoteResults[index]!;
      }
    });

    console.log('Resultados da API:', apiResults);

    const quotes: Record<string, { price: number; change: number; changePercent: number; name?: string }> = {};
    tickers.forEach((originalTicker: string) => {
      const apiTicker = tickerMappings[originalTicker];
      if (apiResults[apiTicker]) {
        quotes[originalTicker] = apiResults[apiTicker];
        quotes[originalTicker + 'F'] = apiResults[apiTicker];
      }
    });

    return new Response(
      JSON.stringify({ quotes }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error fetching quotes:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', quotes: {} }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
