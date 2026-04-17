const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// BCB SGS series codes
const SERIES: Record<string, number> = {
  CDI: 4391,   // CDI daily rate
  IPCA: 433,   // IPCA monthly
  IFIX: 12017, // IFIX daily (may not be available, fallback)
};

function formatDate(d: Date): string {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

interface BcbDataPoint {
  data: string; // dd/MM/yyyy
  valor: string;
}

async function fetchSeries(code: number, startDate: Date, endDate: Date): Promise<BcbDataPoint[]> {
  const url = `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${code}/dados?formato=json&dataInicial=${formatDate(startDate)}&dataFinal=${formatDate(endDate)}`;
  try {
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

// Aggregate daily CDI rates into monthly cumulative returns
function aggregateMonthly(data: BcbDataPoint[], isDailyRate: boolean): Record<string, number> {
  const monthly: Record<string, number> = {};

  if (isDailyRate) {
    // CDI: compound daily rates per month
    const monthAccum: Record<string, number> = {};
    for (const pt of data) {
      const [dd, mm, yyyy] = pt.data.split("/");
      const key = `${yyyy}-${mm}`;
      const rate = parseFloat(pt.valor) / 100;
      if (!monthAccum[key]) monthAccum[key] = 1;
      monthAccum[key] *= (1 + rate);
    }
    for (const [k, v] of Object.entries(monthAccum)) {
      monthly[k] = (v - 1); // monthly return as decimal
    }
  } else {
    // IPCA: already monthly
    for (const pt of data) {
      const [, mm, yyyy] = pt.data.split("/");
      const key = `${yyyy}-${mm}`;
      monthly[key] = parseFloat(pt.valor) / 100;
    }
  }

  return monthly;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { startDate, endDate } = await req.json();
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Fetch CDI and IPCA in parallel
    const [cdiData, ipcaData] = await Promise.all([
      fetchSeries(SERIES.CDI, start, end),
      fetchSeries(SERIES.IPCA, start, end),
    ]);

    const cdiMonthly = aggregateMonthly(cdiData, true);
    const ipcaMonthly = aggregateMonthly(ipcaData, false);

    // For IFIX, try fetching. If unavailable, use a reasonable estimate
    let ifixMonthly: Record<string, number> = {};
    try {
      const ifixData = await fetchSeries(SERIES.IFIX, start, end);
      if (ifixData.length > 0) {
        // IFIX is an index value, compute monthly returns
        const monthVals: Record<string, { first: number; last: number }> = {};
        for (const pt of ifixData) {
          const [, mm, yyyy] = pt.data.split("/");
          const key = `${yyyy}-${mm}`;
          const val = parseFloat(pt.valor);
          if (!monthVals[key]) monthVals[key] = { first: val, last: val };
          monthVals[key].last = val;
        }
        for (const [k, v] of Object.entries(monthVals)) {
          ifixMonthly[k] = (v.last / v.first) - 1;
        }
      }
    } catch {
      // IFIX unavailable, will use fallback on client
    }

    return new Response(
      JSON.stringify({ cdi: cdiMonthly, ipca: ipcaMonthly, ifix: ifixMonthly }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
