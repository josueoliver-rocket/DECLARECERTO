import { useEffect, useState, useMemo, useCallback } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, Calendar, ArrowUpRight, ArrowDownRight, Percent, Loader2 } from "lucide-react";

const FALLBACK_MONTHLY: Record<string, number> = {
  CDI: 0.0087,
  IFIX: 0.0075,
  IPCA: 0.0038,
};

type PeriodKey = "3m" | "6m" | "1y" | "2y" | "all";
const PERIOD_OPTIONS: { value: PeriodKey; label: string }[] = [
  { value: "3m", label: "3 meses" },
  { value: "6m", label: "6 meses" },
  { value: "1y", label: "1 ano" },
  { value: "2y", label: "2 anos" },
  { value: "all", label: "Desde o início" },
];

function subtractPeriod(date: Date, period: PeriodKey): Date {
  const d = new Date(date);
  switch (period) {
    case "3m": d.setMonth(d.getMonth() - 3); break;
    case "6m": d.setMonth(d.getMonth() - 6); break;
    case "1y": d.setFullYear(d.getFullYear() - 1); break;
    case "2y": d.setFullYear(d.getFullYear() - 2); break;
    case "all": return new Date(2000, 0, 1);
  }
  return d;
}

function isBrazilianTicker(ticker: string): boolean {
  return /^[A-Z]{4}\d{1,2}$/.test(ticker);
}

interface Operacao {
  ativo: string;
  tipo: string;
  quantidade: number;
  preco_unitario: number;
  valor_total: number;
  created_at: string;
}

interface BenchmarkData {
  cdi: Record<string, number>;
  ipca: Record<string, number>;
  ifix: Record<string, number>;
}

const chartConfig = {
  carteira: { label: "Sua Carteira", color: "hsl(var(--primary))" },
  cdi: { label: "CDI", color: "hsl(142, 76%, 36%)" },
  ifix: { label: "IFIX", color: "hsl(280, 65%, 60%)" },
  ipca: { label: "IPCA", color: "hsl(25, 95%, 53%)" },
};

const formatBRL = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function Rentabilidade() {
  const { user } = useAuth();
  const [operacoes, setOperacoes] = useState<Operacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<PeriodKey>("1y");
  const [benchmarkData, setBenchmarkData] = useState<BenchmarkData | null>(null);
  const [benchmarkLoading, setBenchmarkLoading] = useState(false);
  const [quotes, setQuotes] = useState<Record<string, number>>({});
  const [quotesLoading, setQuotesLoading] = useState(false);
  const [usdBrl, setUsdBrl] = useState<number>(5.0);

  // Fetch operations
  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("operacoes")
        .select("ativo, tipo, quantidade, preco_unitario, valor_total, created_at, nota_id, notas_corretagem(data_operacao, taxas)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });
      
      // Distribute fees proportionally into valor_total for buy operations
      if (data && data.length > 0) {
        const comprasPorNota: Record<string, { total: number; indices: number[] }> = {};
        data.forEach((op: any, idx: number) => {
          if (op.tipo === 'C' && op.nota_id) {
            if (!comprasPorNota[op.nota_id]) comprasPorNota[op.nota_id] = { total: 0, indices: [] };
            comprasPorNota[op.nota_id].total += Number(op.valor_total);
            comprasPorNota[op.nota_id].indices.push(idx);
          }
        });
        const adjusted = data.map((op: any, idx: number) => {
          let taxaProporcional = 0;
          if (op.tipo === 'C' && op.nota_id && op.notas_corretagem?.taxas) {
            const info = comprasPorNota[op.nota_id];
            if (info && info.total > 0) {
              taxaProporcional = Number(op.notas_corretagem.taxas) * (Number(op.valor_total) / info.total);
            }
          }
          return {
            ativo: op.ativo,
            tipo: op.tipo,
            quantidade: op.quantidade,
            preco_unitario: op.preco_unitario,
            valor_total: Number(op.valor_total) + taxaProporcional,
            created_at: op.created_at,
          };
        });
        setOperacoes(adjusted);
      } else {
        setOperacoes([]);
      }
      setLoading(false);
      setLoading(false);
    })();
  }, [user]);

  // Fetch current quotes for all assets
  useEffect(() => {
    if (!operacoes.length) return;
    const uniqueTickers = [...new Set(operacoes.map(o => o.ativo))];
    if (uniqueTickers.length === 0) return;

    (async () => {
      setQuotesLoading(true);
      try {
        // Separate BR and international tickers
        const brTickers = uniqueTickers.filter(isBrazilianTicker);
        const intTickers = uniqueTickers.filter(t => !isBrazilianTicker(t));

        const promises: Promise<void>[] = [];
        const newQuotes: Record<string, number> = {};

        if (brTickers.length > 0) {
          promises.push(
            supabase.functions.invoke("get-stock-quotes", { body: { tickers: brTickers } })
              .then(({ data }) => {
                if (data?.quotes) {
                  for (const [k, v] of Object.entries(data.quotes)) {
                    newQuotes[k] = (v as { price: number }).price;
                  }
                }
              })
          );
        }

        if (intTickers.length > 0) {
          promises.push(
            supabase.functions.invoke("get-stock-quotes", { body: { tickers: intTickers } })
              .then(({ data }) => {
                if (data?.quotes) {
                  for (const [k, v] of Object.entries(data.quotes)) {
                    newQuotes[k] = (v as { price: number }).price;
                  }
                }
              })
          );
          // Fetch USD/BRL
          promises.push(
            supabase.functions.invoke("get-stock-quotes", { body: { tickers: ["BRL=X"] } })
              .then(({ data }) => {
                if (data?.quotes?.["BRL=X"]) {
                  setUsdBrl(data.quotes["BRL=X"].price);
                }
              })
          );
        }

        await Promise.all(promises);
        setQuotes(newQuotes);
      } catch (err) {
        console.error("Error fetching quotes:", err);
      }
      setQuotesLoading(false);
    })();
  }, [operacoes]);

  // Fetch real benchmark data from BCB
  const fetchBenchmarks = useCallback(async (startDate: Date) => {
    setBenchmarkLoading(true);
    try {
      const cacheKey = `benchmarks_${startDate.toISOString().slice(0, 7)}`;
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        setBenchmarkData(JSON.parse(cached));
        setBenchmarkLoading(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke("get-benchmark-data", {
        body: { startDate: startDate.toISOString(), endDate: new Date().toISOString() },
      });

      if (!error && data?.cdi) {
        setBenchmarkData(data);
        try { sessionStorage.setItem(cacheKey, JSON.stringify(data)); } catch {}
      }
    } catch {
      // Will use fallback rates
    }
    setBenchmarkLoading(false);
  }, []);

  useEffect(() => {
    fetchBenchmarks(subtractPeriod(new Date(), period));
  }, [period, fetchBenchmarks]);

  // Per-asset summary with current value
  const assetSummaries = useMemo(() => {
    const map = new Map<string, { qty: number; totalCost: number }>();

    for (const op of operacoes) {
      if (!map.has(op.ativo)) map.set(op.ativo, { qty: 0, totalCost: 0 });
      const a = map.get(op.ativo)!;
      if (op.tipo === "C") {
        a.totalCost += op.valor_total;
        a.qty += op.quantidade;
      } else if (op.tipo === "V") {
        if (a.qty > 0) {
          const avgCost = a.totalCost / a.qty;
          a.totalCost -= avgCost * op.quantidade;
          a.qty -= op.quantidade;
        }
      }
    }

    return Array.from(map.entries())
      .filter(([, v]) => v.qty > 0.001)
      .map(([ativo, v]) => {
        const precoMedio = v.qty > 0 ? v.totalCost / v.qty : 0;
        const currentPrice = quotes[ativo] || 0;
        const isInt = !isBrazilianTicker(ativo);
        const valorAtual = v.qty * currentPrice * (isInt ? usdBrl : 1);
        const investido = v.totalCost;
        const rentPct = investido > 0 ? ((valorAtual / investido) - 1) * 100 : 0;

        return {
          ativo,
          investido,
          precoMedio,
          quantidade: v.qty,
          currentPrice,
          valorAtual,
          rentPct,
          isInternational: isInt,
        };
      })
      .sort((a, b) => b.investido - a.investido);
  }, [operacoes, quotes, usdBrl]);

  // Total portfolio return
  const totalInvestido = useMemo(() => assetSummaries.reduce((a, s) => a + s.investido, 0), [assetSummaries]);
  const totalAtual = useMemo(() => assetSummaries.reduce((a, s) => a + s.valorAtual, 0), [assetSummaries]);
  const totalReturnPct = totalInvestido > 0 ? ((totalAtual / totalInvestido) - 1) * 100 : 0;

  // Chart data: distribute portfolio return proportionally across months, compare with benchmarks
  const chartData = useMemo(() => {
    if (!operacoes.length) return [];

    const now = new Date();
    const startDate = subtractPeriod(now, period);

    // Generate month keys
    const months: string[] = [];
    const cursor = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    while (cursor <= now) {
      months.push(`${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`);
      cursor.setMonth(cursor.getMonth() + 1);
    }
    if (months.length === 0) return [];

    // Calculate invested value per month
    const monthlyInvested = new Map<string, number>();
    let cumInvested = 0;
    
    // Pre-period cumulative
    for (const op of operacoes) {
      const d = new Date(op.created_at);
      if (d >= startDate) break;
      if (op.tipo === "C") cumInvested += op.valor_total;
      else cumInvested -= op.valor_total;
    }

    let running = cumInvested;
    for (const op of operacoes) {
      const d = new Date(op.created_at);
      if (d < startDate) continue;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (op.tipo === "C") running += op.valor_total;
      else running -= op.valor_total;
      monthlyInvested.set(key, running);
    }

    // Build invested series
    const investedSeries: number[] = [];
    let lastInvested = cumInvested;
    for (const m of months) {
      if (monthlyInvested.has(m)) lastInvested = monthlyInvested.get(m)!;
      investedSeries.push(lastInvested);
    }

    const baseInvested = investedSeries[0] || 1;

    // Approximate portfolio monthly return: we know the total return
    // Distribute it using a simple linear interpolation from 0% to totalReturnPct
    // This is an approximation since we don't have monthly historical quotes
    const totalMonths = months.length - 1;

    let cdiAcc = 1, ipcaAcc = 1, ifixAcc = 1;

    return months.map((m, i) => {
      // Portfolio: linear interpolation of total return + adjust for cash flow changes
      const investedPct = baseInvested > 0 ? ((investedSeries[i] / baseInvested) - 1) * 100 : 0;
      const returnContribution = totalMonths > 0 ? (totalReturnPct * i) / totalMonths : 0;
      const portfolioPct = investedPct + returnContribution;

      // Benchmarks
      if (i > 0) {
        const cdiRate = benchmarkData?.cdi?.[m] ?? FALLBACK_MONTHLY.CDI;
        const ipcaRate = benchmarkData?.ipca?.[m] ?? FALLBACK_MONTHLY.IPCA;
        const ifixRate = benchmarkData?.ifix?.[m] ?? FALLBACK_MONTHLY.IFIX;
        cdiAcc *= (1 + cdiRate);
        ipcaAcc *= (1 + ipcaRate);
        ifixAcc *= (1 + ifixRate);
      }

      const [y, mo] = m.split("-");
      return {
        month: `${mo}/${y.slice(2)}`,
        carteira: +portfolioPct.toFixed(2),
        cdi: +((cdiAcc - 1) * 100).toFixed(2),
        ifix: +((ifixAcc - 1) * 100).toFixed(2),
        ipca: +((ipcaAcc - 1) * 100).toFixed(2),
      };
    });
  }, [operacoes, period, benchmarkData, totalReturnPct]);

  const summary = useMemo(() => {
    if (!chartData.length) return null;
    const last = chartData[chartData.length - 1];
    const pctCdi = last.cdi > 0 ? ((last.carteira / last.cdi) * 100) : 0;
    return { ...last, pctCdi: +pctCdi.toFixed(1) };
  }, [chartData]);

  const isRealData = !!benchmarkData && Object.keys(benchmarkData.cdi).length > 0;
  const isLoading = loading || quotesLoading;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center border-b border-border/50 px-4 gap-4">
            <SidebarTrigger />
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h1 className="text-base md:text-lg font-semibold text-foreground">Rentabilidade</h1>
            </div>
          </header>

          <main className="flex-1 p-3 md:p-6 space-y-4 md:space-y-6 overflow-auto">
            {/* Period selector */}
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  Compare a rentabilidade da sua carteira com os principais índices do mercado.
                </p>
                {isRealData && (
                  <Badge variant="outline" className="text-xs gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    Dados reais do Banco Central
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <Select value={period} onValueChange={(v) => setPeriod(v as PeriodKey)}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PERIOD_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Summary cards */}
            {isLoading || benchmarkLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-24 rounded-lg" />)}
              </div>
            ) : summary ? (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {([
                  { key: "carteira" as const, label: "Sua Carteira" },
                  { key: "cdi" as const, label: "CDI" },
                  { key: "ifix" as const, label: "IFIX" },
                  { key: "ipca" as const, label: "IPCA" },
                ]).map(({ key, label }) => (
                  <Card key={key}>
                    <CardContent className="p-4">
                      <p className="text-xs text-muted-foreground mb-1">{label}</p>
                      <div className="flex items-center gap-1">
                        {summary[key] >= 0 ? (
                          <ArrowUpRight className="w-4 h-4 text-primary" />
                        ) : (
                          <ArrowDownRight className="w-4 h-4 text-destructive" />
                        )}
                        <p className={`text-2xl font-bold ${
                          summary[key] >= 0 ? "text-primary" : "text-destructive"
                        }`}>
                          {summary[key] >= 0 ? "+" : ""}{summary[key].toFixed(2)}%
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                <Card className="border-primary/20 bg-primary/5">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-1 mb-1">
                      <Percent className="w-3.5 h-3.5 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">% do CDI</p>
                    </div>
                    <p className={`text-2xl font-bold ${summary.pctCdi >= 100 ? "text-primary" : "text-muted-foreground"}`}>
                      {summary.pctCdi.toFixed(1)}%
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {summary.pctCdi >= 100 ? "Acima do CDI 🎉" : "Abaixo do CDI"}
                    </p>
                  </CardContent>
                </Card>
              </div>
            ) : null}

            {/* Portfolio value summary */}
            {!isLoading && assetSummaries.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground mb-1">Total Investido</p>
                    <p className="text-xl font-bold text-foreground">{formatBRL(totalInvestido)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground mb-1">Valor Atual</p>
                    <p className="text-xl font-bold text-foreground">{formatBRL(totalAtual)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground mb-1">Resultado</p>
                    <p className={`text-xl font-bold ${totalAtual - totalInvestido >= 0 ? "text-primary" : "text-destructive"}`}>
                      {totalAtual - totalInvestido >= 0 ? "+" : ""}{formatBRL(totalAtual - totalInvestido)}
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Comparativo de Rentabilidade</CardTitle>
                <CardDescription>Evolução percentual acumulada no período</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-[350px] w-full rounded-lg" />
                ) : chartData.length === 0 ? (
                  <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                    Nenhuma operação encontrada no período selecionado.
                  </div>
                ) : (
                  <ChartContainer config={chartConfig} className="h-[350px] w-full">
                    <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                      <ChartTooltip
                        content={<ChartTooltipContent
                          formatter={(value) => `${Number(value).toFixed(2)}%`}
                        />}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="carteira" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={false} name="Sua Carteira" />
                      <Line type="monotone" dataKey="cdi" stroke="hsl(142, 76%, 36%)" strokeWidth={1.5} dot={false} strokeDasharray="5 5" name="CDI" />
                      <Line type="monotone" dataKey="ifix" stroke="hsl(280, 65%, 60%)" strokeWidth={1.5} dot={false} strokeDasharray="5 5" name="IFIX" />
                      <Line type="monotone" dataKey="ipca" stroke="hsl(25, 95%, 53%)" strokeWidth={1.5} dot={false} strokeDasharray="5 5" name="IPCA" />
                    </LineChart>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>

            {/* Per-asset table */}
            {!isLoading && assetSummaries.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Posição por Ativo</CardTitle>
                  <CardDescription>Resumo de cada ativo com cotação atual e rentabilidade</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Ativo</TableHead>
                          <TableHead className="text-right">Qtd</TableHead>
                          <TableHead className="text-right">Preço Médio</TableHead>
                          <TableHead className="text-right">Cotação Atual</TableHead>
                          <TableHead className="text-right">Investido</TableHead>
                          <TableHead className="text-right">Valor Atual</TableHead>
                          <TableHead className="text-right">Rent. %</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {assetSummaries.map((a) => (
                          <TableRow key={a.ativo}>
                            <TableCell className="font-medium font-mono">{a.ativo}</TableCell>
                            <TableCell className="text-right">
                              {isBrazilianTicker(a.ativo)
                                ? a.quantidade.toLocaleString("pt-BR", { maximumFractionDigits: 0 })
                                : a.quantidade.toLocaleString("pt-BR", { maximumFractionDigits: 5 })}
                            </TableCell>
                            <TableCell className="text-right">
                              {a.isInternational
                                ? `US$ ${a.precoMedio.toFixed(2)}`
                                : formatBRL(a.precoMedio)}
                            </TableCell>
                            <TableCell className="text-right">
                              {a.currentPrice > 0
                                ? a.isInternational
                                  ? `US$ ${a.currentPrice.toFixed(2)}`
                                  : formatBRL(a.currentPrice)
                                : <span className="text-muted-foreground">—</span>}
                            </TableCell>
                            <TableCell className="text-right">{formatBRL(a.investido)}</TableCell>
                            <TableCell className="text-right font-medium">
                              {a.valorAtual > 0 ? formatBRL(a.valorAtual) : "—"}
                            </TableCell>
                            <TableCell className={`text-right font-bold ${a.rentPct >= 0 ? "text-primary" : "text-destructive"}`}>
                              {a.currentPrice > 0
                                ? `${a.rentPct >= 0 ? "+" : ""}${a.rentPct.toFixed(2)}%`
                                : "—"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
