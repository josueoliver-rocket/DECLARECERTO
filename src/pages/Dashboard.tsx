import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  RefreshCw,
  Menu,
  Loader2,
  FileText,
  BarChart3,
  AlertTriangle,
  DollarSign,
} from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CorporateEvent, applyCorporateAdjustments, hasCorporateEvents } from "@/lib/corporateEvents";

interface DashboardStats {
  valorInvestido: number;
  valorMercado: number;
  rentabilidade: number;
  rentabilidadePercent: number;
  totalCompras: number;
  totalVendas: number;
}

interface AtivoConsolidado {
  ativo: string;
  quantidade: number;
  precoMedio: number;
  valorInvestido: number;
  cotacaoAtual: number | null;
  valorMercado: number | null;
  rentabilidade: number | null;
  rentabilidadePercent: number | null;
  totalCompras: number;
  totalVendas: number;
  corporateEvents: CorporateEvent[];
  hasEvents: boolean;
}

interface StockQuotes {
  [ticker: string]: { price: number; change: number; changePercent: number };
}

const QUOTES_CACHE_KEY = "dashboard_quotes_cache";
const QUOTES_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCachedQuotes(): { quotes: StockQuotes; timestamp: number } | null {
  try {
    const raw = sessionStorage.getItem(QUOTES_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.timestamp < QUOTES_CACHE_TTL) return parsed;
    sessionStorage.removeItem(QUOTES_CACHE_KEY);
  } catch {}
  return null;
}

function setCachedQuotes(quotes: StockQuotes) {
  try {
    sessionStorage.setItem(QUOTES_CACHE_KEY, JSON.stringify({ quotes, timestamp: Date.now() }));
  } catch {}
}

const getTicker = (ativo: string): string => ativo.toUpperCase();

const isBrazilianTicker = (ticker: string): boolean => {
  const t = ticker.toUpperCase();
  // Brazilian tickers typically end with a digit (PETR4, VALE3, ITUB4, BOVA11, etc.)
  return /\d+$/.test(t) && /^[A-Z]{4}\d{1,2}$/.test(t);
};

const formatCurrency = (value: number, currency: "BRL" | "USD" = "BRL") =>
  currency === "USD"
    ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value)
    : new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const getCurrency = (ticker: string): "BRL" | "USD" => isBrazilianTicker(ticker) ? "BRL" : "USD";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    valorInvestido: 0, valorMercado: 0, rentabilidade: 0, rentabilidadePercent: 0, totalCompras: 0, totalVendas: 0,
  });
  const [ativos, setAtivos] = useState<AtivoConsolidado[]>([]);
  const [dolarQuote, setDolarQuote] = useState<{ price: number; change: number; changePercent: number } | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [loadingQuotes, setLoadingQuotes] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const ativosRef = useRef<AtivoConsolidado[]>([]);

  useEffect(() => {
    if (!loading && !user) navigate("/");
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) loadDashboard();
  }, [user]);

  // Step 1: Load operations from DB (fast) → show table immediately
  const loadDashboard = useCallback(async () => {
    try {
      const { data: operacoes, error } = await supabase
        .from("operacoes")
        .select("*, notas_corretagem(data_operacao)")
        .order("created_at", { ascending: true });

      if (error) throw error;
      if (!operacoes || operacoes.length === 0) {
        setStats({ valorInvestido: 0, valorMercado: 0, rentabilidade: 0, rentabilidadePercent: 0, totalCompras: 0, totalVendas: 0 });
        setAtivos([]);
        setLoadingData(false);
        // Still fetch dollar quote even with no operations
        fetchDolarQuote();
        return;
      }

      let totalCompras = 0;
      let totalVendas = 0;
      const ativosMap: Record<string, {
        compras: { quantidade: number; valor: number; created_at: string }[];
        vendas: { quantidade: number; valor: number; created_at: string }[];
        allOps: { tipo: string; quantidade: number; valor_total: number; created_at: string }[];
      }> = {};

      operacoes.forEach((op: any) => {
        if (!ativosMap[op.ativo]) ativosMap[op.ativo] = { compras: [], vendas: [], allOps: [] };
        const opDate = op.notas_corretagem?.data_operacao
          ? op.notas_corretagem.data_operacao + "T00:00:00+00:00"
          : op.created_at;

        ativosMap[op.ativo].allOps.push({ tipo: op.tipo, quantidade: op.quantidade, valor_total: Number(op.valor_total), created_at: opDate });

        if (op.tipo === "C") {
          totalCompras += Number(op.valor_total);
          ativosMap[op.ativo].compras.push({ quantidade: op.quantidade, valor: Number(op.valor_total), created_at: opDate });
        } else {
          totalVendas += Number(op.valor_total);
          ativosMap[op.ativo].vendas.push({ quantidade: op.quantidade, valor: Number(op.valor_total), created_at: opDate });
        }
      });

      // Build base positions WITHOUT corporate events (instant)
      const ativosBase: AtivoConsolidado[] = Object.entries(ativosMap)
        .map(([ativo, data]) => {
          // Simple PM calculation without corporate events
          const totalQtyCompra = data.compras.reduce((a, c) => a + c.quantidade, 0);
          const totalValCompra = data.compras.reduce((a, c) => a + c.valor, 0);
          const totalQtyVenda = data.vendas.reduce((a, v) => a + v.quantidade, 0);
          const quantidade = totalQtyCompra - totalQtyVenda;
          const precoMedio = totalQtyCompra > 0 ? totalValCompra / totalQtyCompra : 0;
          const valorInvestido = quantidade * precoMedio;

          return {
            ativo, quantidade, precoMedio, valorInvestido,
            cotacaoAtual: null, valorMercado: null, rentabilidade: null, rentabilidadePercent: null,
            totalCompras: data.compras.reduce((a, c) => a + c.valor, 0),
            totalVendas: data.vendas.reduce((a, v) => a + v.valor, 0),
            corporateEvents: [] as CorporateEvent[], hasEvents: false,
          };
        })
        .filter((a) => a.quantidade > 0)
        .sort((a, b) => b.valorInvestido - a.valorInvestido);

      // Show table immediately with invested values
      setAtivos(ativosBase);
      ativosRef.current = ativosBase;
      setStats({
        valorInvestido: ativosBase.reduce((a, x) => a + x.valorInvestido, 0),
        valorMercado: ativosBase.reduce((a, x) => a + x.valorInvestido, 0),
        rentabilidade: 0, rentabilidadePercent: 0, totalCompras, totalVendas,
      });
      setLoadingData(false);

      // Step 2: Fetch quotes (use cache if available)
      const tickers = ativosBase.map((a) => a.ativo);
      const cached = getCachedQuotes();
      const cachedTickersMatch = cached && tickers.every((t) => t in cached.quotes);

      if (cachedTickersMatch) {
        applyQuotes(ativosBase, cached!.quotes, totalCompras, totalVendas);
        setLastUpdate(new Date(cached!.timestamp));
      }

      // Always fetch fresh quotes (even if cached, to update)
      fetchQuotesFresh(tickers, ativosBase, totalCompras, totalVendas);

      // Step 3: Fetch corporate events lazily in background
      fetchCorporateEventsLazy(tickers, ativosMap);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      setLoadingData(false);
    }
  }, []);

  const applyQuotes = (base: AtivoConsolidado[], quotes: StockQuotes, totalCompras: number, totalVendas: number) => {
    const updated = base.map((a) => {
      const q = quotes[a.ativo];
      if (q) {
        const valorMercado = a.quantidade * q.price;
        const rentabilidade = valorMercado - a.valorInvestido;
        const rentabilidadePercent = a.valorInvestido > 0 ? (rentabilidade / a.valorInvestido) * 100 : 0;
        return { ...a, cotacaoAtual: q.price, valorMercado, rentabilidade, rentabilidadePercent };
      }
      return a;
    });
    setAtivos(updated);
    ativosRef.current = updated;

    const valorInvestido = updated.reduce((a, x) => a + x.valorInvestido, 0);
    const valorMercado = updated.reduce((a, x) => a + (x.valorMercado ?? x.valorInvestido), 0);
    const rentabilidade = valorMercado - valorInvestido;
    const rentabilidadePercent = valorInvestido > 0 ? (rentabilidade / valorInvestido) * 100 : 0;
    setStats({ valorInvestido, valorMercado, rentabilidade, rentabilidadePercent, totalCompras, totalVendas });
  };

  const fetchDolarQuote = async () => {
    try {
      const dolarRes = await supabase.functions.invoke("get-stock-quotes", { body: { tickers: ["BRL=X"] } });
      if (!dolarRes.error && dolarRes.data?.quotes?.["BRL=X"]) {
        setDolarQuote(dolarRes.data.quotes["BRL=X"]);
      }
    } catch (error) {
      console.error("Erro ao buscar cotação do dólar:", error);
    }
  };

  const fetchQuotesFresh = async (tickers: string[], base: AtivoConsolidado[], totalCompras: number, totalVendas: number) => {
    setLoadingQuotes(true);
    try {
      const promises: Promise<any>[] = [fetchDolarQuote()];
      if (tickers.length > 0) {
        promises.push(
          supabase.functions.invoke("get-stock-quotes", { body: { tickers } }).then((stockRes) => {
            if (!stockRes.error && stockRes.data?.quotes) {
              setCachedQuotes(stockRes.data.quotes);
              setLastUpdate(new Date());
              applyQuotes(ativosRef.current.length > 0 ? ativosRef.current : base, stockRes.data.quotes, totalCompras, totalVendas);
            }
          })
        );
      }
      await Promise.all(promises);
    } catch (error) {
      console.error("Erro ao buscar cotações:", error);
    } finally {
      setLoadingQuotes(false);
    }
  };

  const fetchCorporateEventsLazy = async (
    tickers: string[],
    ativosMap: Record<string, { allOps: { tipo: string; quantidade: number; valor_total: number; created_at: string }[] }>
  ) => {
    // Fetch ALL corporate events in parallel (all at once, not batched sequentially)
    const results: Record<string, CorporateEvent[]> = {};
    const promises = tickers.map(async (ticker) => {
      try {
        const { data, error } = await supabase.functions.invoke("get-dividends", { body: { ticker } });
        results[ticker] = !error && data?.corporateEvents ? data.corporateEvents : [];
      } catch {
        results[ticker] = [];
      }
    });
    await Promise.all(promises);

    // Check if any ticker actually has events
    const anyEvents = Object.values(results).some((evts) => hasCorporateEvents(evts));
    if (!anyEvents) return;

    // Re-calculate positions with corporate adjustments
    setAtivos((prev) =>
      prev.map((a) => {
        const events = results[a.ativo] || [];
        const hasEvts = hasCorporateEvents(events);
        if (!hasEvts) return a;

        const ops = ativosMap[a.ativo]?.allOps || [];
        const { adjustedQuantity, adjustedPrecoMedio, adjustedValorInvestido } = applyCorporateAdjustments(ops, events);

        const valorMercado = a.cotacaoAtual ? adjustedQuantity * a.cotacaoAtual : null;
        const rentabilidade = valorMercado !== null ? valorMercado - adjustedValorInvestido : null;
        const rentabilidadePercent = rentabilidade !== null && adjustedValorInvestido > 0
          ? (rentabilidade / adjustedValorInvestido) * 100 : null;

        return {
          ...a,
          quantidade: adjustedQuantity,
          precoMedio: adjustedPrecoMedio,
          valorInvestido: adjustedValorInvestido,
          valorMercado, rentabilidade, rentabilidadePercent,
          corporateEvents: events, hasEvents: hasEvts,
        };
      })
    );
  };

  const handleRefreshQuotes = async () => {
    const tickers = ativos.map((a) => a.ativo);
    setLoadingQuotes(true);
    try {
      const promises: Promise<any>[] = [fetchDolarQuote()];
      if (tickers.length > 0) {
        promises.push(
          supabase.functions.invoke("get-stock-quotes", { body: { tickers } }).then((stockRes) => {
            if (!stockRes.error && stockRes.data?.quotes) {
              setCachedQuotes(stockRes.data.quotes);
              setLastUpdate(new Date());
              applyQuotes(ativos, stockRes.data.quotes, stats.totalCompras, stats.totalVendas);
              toast.success("Cotações atualizadas!");
            }
          })
        );
      }
      await Promise.all(promises);
    } catch (error) {
      console.error("Erro ao buscar cotações:", error);
      toast.error("Não foi possível buscar cotações");
    } finally {
      setLoadingQuotes(false);
    }
  };

  const handleAtivoClick = (ativo: string) => navigate(`/ativo/${encodeURIComponent(ativo)}`);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  const statsCards = [
    { title: "Valor Investido", value: formatCurrency(stats.valorInvestido), icon: Wallet, color: "text-primary" },
    { title: "Valor de Mercado", value: formatCurrency(stats.valorMercado), icon: BarChart3, color: "text-blue-500" },
    {
      title: "Lucro / Prejuízo",
      value: `${stats.rentabilidade >= 0 ? "+" : ""}${formatCurrency(stats.rentabilidade)}`,
      subtitle: `${stats.rentabilidadePercent >= 0 ? "+" : ""}${stats.rentabilidadePercent.toFixed(2)}%`,
      icon: stats.rentabilidade >= 0 ? TrendingUp : TrendingDown,
      color: stats.rentabilidade >= 0 ? "text-green-500" : "text-red-500",
    },
    { title: "Total em Compras", value: formatCurrency(stats.totalCompras), icon: TrendingDown, color: "text-red-500" },
  ];

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <main className="flex-1 overflow-auto">
          <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/50">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 md:px-6 py-3 md:py-4">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="text-muted-foreground hover:text-foreground">
                  <Menu className="w-5 h-5" />
                </SidebarTrigger>
                <div>
                  <h1 className="text-xl md:text-2xl font-bold text-foreground">Dashboard</h1>
                  <p className="text-xs md:text-sm text-muted-foreground">Bem-vindo de volta!</p>
                </div>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Última atualização</p>
                  <p className="text-xs md:text-sm font-medium text-foreground">
                    {lastUpdate ? lastUpdate.toLocaleString("pt-BR") : new Date().toLocaleString("pt-BR")}
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={handleRefreshQuotes} disabled={loadingQuotes || ativos.length === 0}>
                  <RefreshCw className={`w-4 h-4 mr-2 ${loadingQuotes ? "animate-spin" : ""}`} />
                  <span className="hidden sm:inline">Atualizar</span>
                  <span className="sm:hidden">↻</span>
                </Button>
              </div>
            </div>
          </header>

          <div className="p-4 md:p-6 space-y-4 md:space-y-6">
            {loadingData ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                {/* Cotação do Dólar */}
                <Card className="bg-card border-border/50 hover:shadow-lg transition-shadow">
                  <CardContent className="flex items-center justify-between py-3 px-5">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <DollarSign className="w-5 h-5 text-primary" />
                      </div>
                      <span className="text-sm font-medium text-muted-foreground">Dólar (USD/BRL)</span>
                    </div>
                    {dolarQuote ? (
                      <div className="flex items-center gap-3">
                        <span className="text-xl font-bold text-foreground">
                          {formatCurrency(dolarQuote.price)}
                        </span>
                        <span className={`text-sm font-medium ${dolarQuote.changePercent >= 0 ? "text-green-500" : "text-red-500"}`}>
                          {dolarQuote.changePercent >= 0 ? "+" : ""}{dolarQuote.changePercent.toFixed(2)}%
                        </span>
                      </div>
                    ) : (
                      <span className="text-xl font-bold text-muted-foreground">—</span>
                    )}
                  </CardContent>
                </Card>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {statsCards.map((card, index) => (
                    <Card key={index} className="bg-card border-border/50 hover:shadow-lg transition-shadow">
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
                        <div className="p-2 rounded-lg bg-primary/10">
                          <card.icon className="w-4 h-4 text-primary" />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className={`text-xl font-bold truncate ${card.color}`}>{card.value}</div>
                        {"subtitle" in card && card.subtitle && (
                          <p className={`text-sm font-medium mt-1 ${card.color}`}>{card.subtitle}</p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Carteira de Ativos */}
                <Card className="bg-card border-border/50">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-primary" />
                      Carteira de Ativos
                      {loadingQuotes && (
                        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground ml-2" />
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {ativos.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>Nenhum ativo cadastrado</p>
                        <p className="text-sm">Adicione notas de corretagem para ver seus ativos aqui</p>
                      </div>
                    ) : (
                      <TooltipProvider>
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b border-border">
                                <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Ativo</th>
                                <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">Qtd</th>
                                <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">Cotação</th>
                                <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">Investido</th>
                                <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">Mercado</th>
                                <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">Rent.</th>
                              </tr>
                            </thead>
                            <tbody>
                              {ativos.map((ativo) => (
                                <tr key={ativo.ativo} className="border-b border-border/50 hover:bg-accent/30">
                                  <td className="py-3 px-2">
                                    <div className="flex items-center gap-2">
                                      <div className="p-1.5 rounded bg-primary/10">
                                        <TrendingUp className="w-4 h-4 text-primary" />
                                      </div>
                                      <button
                                        className="font-semibold text-primary underline hover:text-primary/80 cursor-pointer bg-transparent border-none p-0"
                                        onClick={() => handleAtivoClick(ativo.ativo)}
                                      >
                                        {getTicker(ativo.ativo)}
                                      </button>
                                      {!isBrazilianTicker(ativo.ativo) && (
                                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-primary/30 text-primary">🇺🇸 USD</Badge>
                                      )}
                                      {ativo.hasEvents && (
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <button onClick={() => handleAtivoClick(ativo.ativo)} className="bg-transparent border-none p-0 cursor-pointer">
                                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-yellow-500/50 text-yellow-500 gap-1">
                                                <AlertTriangle className="w-3 h-3" />
                                                Evento
                                              </Badge>
                                            </button>
                                          </TooltipTrigger>
                                          <TooltipContent side="right" className="max-w-xs">
                                            <p className="font-semibold mb-1">Eventos Corporativos:</p>
                                            {ativo.corporateEvents
                                              .filter((e) => e.type === "Desdobramento" || e.type === "Bonificação" || e.type === "Grupamento")
                                              .slice(0, 3)
                                              .map((e, i) => (
                                                <p key={i} className="text-xs">
                                                  {new Date(e.date + "T00:00:00").toLocaleDateString("pt-BR")} — {e.type} {e.ratio}
                                                </p>
                                              ))}
                                            <p className="text-xs text-muted-foreground mt-1">Clique para ver detalhes</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      )}
                                    </div>
                                  </td>
                                  <td className="text-right py-3 px-2 font-medium text-foreground">{isBrazilianTicker(ativo.ativo) ? Math.round(ativo.quantidade) : ativo.quantidade}</td>
                                  <td className="text-right py-3 px-2 text-foreground">
                                    {ativo.cotacaoAtual ? formatCurrency(ativo.cotacaoAtual, getCurrency(ativo.ativo)) : (
                                      <span className="text-muted-foreground">—</span>
                                    )}
                                  </td>
                                  <td className="text-right py-3 px-2 text-foreground">{formatCurrency(ativo.valorInvestido, getCurrency(ativo.ativo))}</td>
                                  <td className="text-right py-3 px-2 text-blue-500 font-medium">
                                    {ativo.valorMercado ? formatCurrency(ativo.valorMercado, getCurrency(ativo.ativo)) : (
                                      <span className="text-muted-foreground">—</span>
                                    )}
                                  </td>
                                  <td className={`text-right py-3 px-2 font-semibold ${
                                    ativo.rentabilidade !== null
                                      ? ativo.rentabilidade >= 0 ? "text-green-500" : "text-red-500"
                                      : "text-muted-foreground"
                                  }`}>
                                    {ativo.rentabilidadePercent !== null
                                      ? `${ativo.rentabilidadePercent >= 0 ? "+" : ""}${ativo.rentabilidadePercent.toFixed(2)}%`
                                      : "—"}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </TooltipProvider>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
