import { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Loader2,
  DollarSign,
  Calendar,
  FileText,
  AlertTriangle,
  ArrowUpDown,
} from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  CorporateEvent,
  applyCorporateAdjustments,
  hasCorporateEvents,
} from "@/lib/corporateEvents";
import { Separator } from "@/components/ui/separator";

interface TickerChange {
  old_ticker: string;
  new_ticker: string;
  change_date: string;
  reason: string;
  bonus_ticker: string | null;
  bonus_ratio: number | null;
  description: string | null;
}

const formatCurrency = (value: number, currency: "BRL" | "USD" = "BRL") =>
  currency === "USD"
    ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value)
    : new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const isBrazilianTicker = (ticker: string): boolean => /^[A-Z]{4}\d{1,2}$/.test(ticker.toUpperCase().trim());
const getCurrency = (ticker: string): "BRL" | "USD" => isBrazilianTicker(ticker) ? "BRL" : "USD";

interface Operacao {
  id: string;
  ativo: string;
  tipo: string;
  quantidade: number;
  preco_unitario: number;
  valor_total: number;
  created_at: string;
  data_operacao?: string;
}

interface DividendEvent {
  date: string;
  amount: number;
}

interface DividendWithPosition {
  date: string;
  amountPerShare: number;
  sharesHeld: number;
  totalReceived: number;
}

const AtivoDetalhes = () => {
  const navigate = useNavigate();
  const { ativoName } = useParams<{ ativoName: string }>();
  const { user, loading } = useAuth();
  const [operacoes, setOperacoes] = useState<Operacao[]>([]);
  const [dividends, setDividends] = useState<DividendEvent[]>([]);
  const [corporateEvents, setCorporateEvents] = useState<CorporateEvent[]>([]);
  const [tickerChanges, setTickerChanges] = useState<TickerChange[]>([]);
  const [loadingOps, setLoadingOps] = useState(true);
  const [loadingDivs, setLoadingDivs] = useState(true);
  const moeda = getCurrency(ativoName || "");

  useEffect(() => {
    if (!loading && !user) {
      navigate("/");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user && ativoName) {
      fetchOperacoes();
      fetchDividends();
    }
  }, [user, ativoName]);

  const fetchOperacoes = async () => {
    try {
      const decoded = decodeURIComponent(ativoName!);
      const { data, error } = await supabase
        .from("operacoes")
        .select("*, notas_corretagem(data_operacao)")
        .eq("ativo", decoded)
        .order("created_at", { ascending: true });

      if (error) throw error;
      // Map data_operacao from nota into each operation
      const ops = (data || []).map((op: any) => ({
        ...op,
        data_operacao: op.notas_corretagem?.data_operacao || null,
      }));
      setOperacoes(ops);
    } catch (error) {
      console.error("Erro ao buscar operações:", error);
      toast.error("Erro ao buscar histórico");
    } finally {
      setLoadingOps(false);
    }
  };

  const fetchDividends = async () => {
    try {
      const decoded = decodeURIComponent(ativoName!);
      const { data, error } = await supabase.functions.invoke("get-dividends", {
        body: { ticker: decoded },
      });

      if (error) throw error;
      setDividends(data?.dividends || []);
      setCorporateEvents(data?.corporateEvents || []);
      setTickerChanges(data?.tickerChanges || []);
    } catch (error) {
      console.error("Erro ao buscar dividendos:", error);
      toast.error("Erro ao buscar dividendos");
    } finally {
      setLoadingDivs(false);
    }
  };

  // Adjusted summary using corporate events
  const summary = useMemo(() => {
    const ops = operacoes.map((op) => ({
      tipo: op.tipo,
      quantidade: op.quantidade,
      valor_total: op.valor_total,
      created_at: op.data_operacao ? op.data_operacao + 'T00:00:00+00:00' : op.created_at,
    }));

    const { adjustedQuantity, adjustedPrecoMedio, adjustedValorInvestido } =
      applyCorporateAdjustments(ops, corporateEvents);

    let valorCompras = 0;
    let valorVendas = 0;
    operacoes.forEach((op) => {
      if (op.tipo === "C") {
        valorCompras += Number(op.valor_total);
      } else {
        valorVendas += Number(op.valor_total);
      }
    });

    return {
      posicaoAtual: adjustedQuantity,
      precoMedio: adjustedPrecoMedio,
      valorCompras,
      valorVendas,
      valorInvestido: adjustedValorInvestido,
    };
  }, [operacoes, corporateEvents]);

  const ticker = ativoName ? decodeURIComponent(ativoName).toUpperCase() : "";

  const hasCorpEvents = useMemo(() => hasCorporateEvents(corporateEvents), [corporateEvents]);

  // Position timeline considering corporate events
  const positionTimeline = useMemo(() => {
    const timeline: { date: string; shares: number }[] = [];
    let shares = 0;

    const splitEvents = corporateEvents.filter(
      (e) =>
        e.adjustmentFactor &&
        e.adjustmentFactor !== 1 &&
        (e.type === "Desdobramento" || e.type === "Bonificação" || e.type === "Grupamento")
    );

    // Merge operations and split events chronologically
    type TimelineEntry =
      | { kind: "op"; date: string; tipo: string; quantidade: number }
      | { kind: "split"; date: string; factor: number };

    const entries: TimelineEntry[] = [
      ...operacoes.map((op) => ({
        kind: "op" as const,
        date: op.data_operacao || op.created_at.split("T")[0],
        tipo: op.tipo,
        quantidade: op.quantidade,
      })),
      ...splitEvents.map((e) => ({
        kind: "split" as const,
        date: e.date,
        factor: e.adjustmentFactor!,
      })),
    ].sort((a, b) => a.date.localeCompare(b.date));

    entries.forEach((entry) => {
      if (entry.kind === "op") {
        if (entry.tipo === "C") {
          shares += entry.quantidade;
        } else {
          shares -= entry.quantidade;
        }
      } else {
        const isBR = /^[A-Z]{4}\d{1,2}$/.test(ticker?.toUpperCase?.() || "");
        shares = isBR ? Math.round(shares * entry.factor) : shares * entry.factor;
      }
      timeline.push({ date: entry.date, shares });
    });

    return timeline;
  }, [operacoes, corporateEvents]);

  const getSharesAtDate = (date: string): number => {
    let shares = 0;
    for (const entry of positionTimeline) {
      if (entry.date <= date) {
        shares = entry.shares;
      } else {
        break;
      }
    }
    return Math.max(shares, 0);
  };

  const proportionalDividends: DividendWithPosition[] = useMemo(() => {
    if (positionTimeline.length === 0 || dividends.length === 0) return [];

    const firstOpDate = positionTimeline[0]?.date;
    if (!firstOpDate) return [];

    return dividends
      .filter((d) => d.date >= firstOpDate)
      .map((d) => {
        const sharesHeld = getSharesAtDate(d.date);
        return {
          date: d.date,
          amountPerShare: d.amount,
          sharesHeld,
          totalReceived: sharesHeld * d.amount,
        };
      })
      .filter((d) => d.sharesHeld > 0);
  }, [dividends, positionTimeline]);

  const totalDividends = useMemo(
    () => proportionalDividends.reduce((acc, d) => acc + d.totalReceived, 0),
    [proportionalDividends]
  );

  // Build event impact descriptions for ALL corporate events
  const eventImpactDetails = useMemo(() => {
    return corporateEvents.map((evt) => {
      const dateStr = new Date(evt.date + "T00:00:00").toLocaleDateString("pt-BR");
      const isSplitType = evt.type === "Desdobramento" || evt.type === "Bonificação" || evt.type === "Grupamento";

      const sharesBefore = (() => {
        let shares = 0;
        for (const entry of positionTimeline) {
          if (entry.date < evt.date) {
            shares = entry.shares;
          } else {
            break;
          }
        }
        return Math.max(shares, 0);
      })();

      const isBR = /^[A-Z]{4}\d{1,2}$/.test(ticker?.toUpperCase?.() || "");
      const sharesAfter = isSplitType && evt.adjustmentFactor
        ? (isBR ? Math.round(sharesBefore * evt.adjustmentFactor) : sharesBefore * evt.adjustmentFactor)
        : sharesBefore;

      // Calculate price impact
      const precoMedioBefore = sharesBefore > 0 && summary.valorCompras > 0
        ? summary.valorCompras / (isSplitType && evt.adjustmentFactor ? sharesAfter : sharesBefore)
        : 0;
      const precoMedioAfter = isSplitType && evt.adjustmentFactor && sharesBefore > 0
        ? summary.valorCompras / sharesAfter
        : precoMedioBefore;

      return {
        ...evt,
        dateFormatted: dateStr,
        sharesBefore,
        sharesAfter,
        difference: sharesAfter - sharesBefore,
        precoMedioBefore,
        precoMedioAfter,
        isSplitType,
        executed: sharesBefore > 0,
      };
    });
  }, [corporateEvents, positionTimeline, summary]);


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <main className="flex-1 overflow-auto">
          <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/50">
            <div className="flex items-center gap-4 px-6 py-4">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/dashboard")}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
              <div className="flex items-center gap-3">
                <div>
                  <h1 className="text-2xl font-bold text-foreground">{ticker}</h1>
                  <p className="text-sm text-muted-foreground">
                    {decodeURIComponent(ativoName || "")}
                  </p>
                </div>
                {hasCorpEvents && (
                  <Badge variant="outline" className="border-yellow-500/50 text-yellow-500 gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Eventos Corporativos
                  </Badge>
                )}
              </div>
            </div>
          </header>

          <div className="p-6 space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-card border-border/50">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Posição Atual {hasCorpEvents && "(ajustada)"}
                  </CardTitle>
                  <div className="p-2 rounded-lg bg-primary/10">
                    <TrendingUp className="w-4 h-4 text-primary" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">
                    {isBrazilianTicker(ticker) ? Math.round(summary.posicaoAtual) : summary.posicaoAtual}
                  </div>
                  <p className="text-sm text-muted-foreground">ações</p>
                </CardContent>
              </Card>

              <Card className="bg-card border-border/50">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Preço Médio {hasCorpEvents && "(ajustado)"}
                  </CardTitle>
                  <div className="p-2 rounded-lg bg-primary/10">
                    <DollarSign className="w-4 h-4 text-primary" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">
                    {formatCurrency(summary.precoMedio, moeda)}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border/50">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Investido
                  </CardTitle>
                  <div className="p-2 rounded-lg bg-primary/10">
                    <TrendingDown className="w-4 h-4 text-primary" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">
                    {formatCurrency(summary.valorCompras, moeda)}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border/50">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Dividendos Recebidos
                  </CardTitle>
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Calendar className="w-4 h-4 text-primary" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-500">
                    {loadingDivs ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      formatCurrency(totalDividends, moeda)
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="historico" className="w-full">
              <TabsList>
                <TabsTrigger value="historico">Histórico de Negociações</TabsTrigger>
                <TabsTrigger value="dividendos">Dividendos</TabsTrigger>
                <TabsTrigger value="eventos" className="relative">
                  Eventos Corporativos
                  {(hasCorpEvents || tickerChanges.length > 0) && (
                    <span className="ml-1.5 inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold rounded-full bg-yellow-500/20 text-yellow-500">
                      {eventImpactDetails.length + tickerChanges.filter(tc => tc.old_ticker !== tc.new_ticker).length}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="historico">
                <Card className="bg-card border-border/50">
                  <CardContent className="pt-6">
                    {loadingOps ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                      </div>
                    ) : operacoes.length === 0 ? (
                      <p className="text-center py-8 text-muted-foreground">
                        Nenhuma operação encontrada.
                      </p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Data</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead className="text-right">Qtd</TableHead>
                            <TableHead className="text-right">Preço Unit.</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {[...operacoes].reverse().map((op) => (
                            <TableRow key={op.id}>
                              <TableCell>
                                {op.data_operacao
                                  ? new Date(op.data_operacao + "T00:00:00").toLocaleDateString("pt-BR")
                                  : new Date(op.created_at).toLocaleDateString("pt-BR")}
                              </TableCell>
                              <TableCell>
                                <span
                                  className={`font-semibold ${
                                    op.tipo === "C"
                                      ? "text-green-500"
                                      : "text-red-500"
                                  }`}
                                >
                                  {op.tipo === "C" ? "Compra" : "Venda"}
                                </span>
                              </TableCell>
                              <TableCell className="text-right">
                                {isBrazilianTicker(ticker) ? Math.round(op.quantidade) : op.quantidade}
                              </TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(op.preco_unitario, moeda)}
                              </TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(op.valor_total, moeda)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="dividendos">
                <Card className="bg-card border-border/50">
                  <CardContent className="pt-6">
                    {loadingDivs ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                      </div>
                    ) : proportionalDividends.length === 0 ? (
                      <p className="text-center py-8 text-muted-foreground">
                        Nenhum dividendo encontrado para o período em que você deteve este ativo.
                      </p>
                    ) : (
                      <>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Data</TableHead>
                              <TableHead className="text-right">Por Ação</TableHead>
                              <TableHead className="text-right">Ações Detidas</TableHead>
                              <TableHead className="text-right">Total Recebido</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {proportionalDividends.map((d, i) => (
                              <TableRow key={i}>
                                <TableCell>
                                  {new Date(d.date + "T00:00:00").toLocaleDateString("pt-BR")}
                                </TableCell>
                                <TableCell className="text-right">
                                  {formatCurrency(d.amountPerShare, moeda)}
                                </TableCell>
                                <TableCell className="text-right">
                                  {d.sharesHeld}
                                </TableCell>
                                <TableCell className="text-right font-semibold text-green-500">
                                  {formatCurrency(d.totalReceived, moeda)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                        <div className="mt-4 p-4 rounded-lg bg-muted/50 flex justify-between items-center">
                          <span className="font-medium text-muted-foreground">
                            Total de Dividendos
                          </span>
                          <span className="text-lg font-bold text-green-500">
                            {formatCurrency(totalDividends, moeda)}
                          </span>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="eventos">
                <Card className="bg-card border-border/50">
                  <CardContent className="pt-6">
                    {loadingDivs ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                      </div>
                    ) : eventImpactDetails.length === 0 && tickerChanges.filter(tc => tc.old_ticker !== tc.new_ticker).length === 0 ? (
                      <div className="text-center py-8">
                        <FileText className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
                        <p className="text-muted-foreground">
                          Nenhum evento corporativo encontrado para este ativo.
                        </p>
                        <p className="text-sm text-muted-foreground/70 mt-1">
                          Bonificações, desdobramentos, grupamentos, mudanças de ticker e rendimentos aparecerão aqui quando disponíveis.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* Summary banner */}
                        <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                          <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className="w-4 h-4 text-yellow-500" />
                            <span className="font-semibold text-yellow-500">
                              {eventImpactDetails.length + tickerChanges.filter(tc => tc.old_ticker !== tc.new_ticker).length} evento(s) corporativo(s) detectado(s)
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Sua posição e preço médio foram ajustados automaticamente considerando os eventos abaixo.
                          </p>
                        </div>

                        {/* Ticker Change Cards */}
                        {tickerChanges.filter(tc => tc.old_ticker !== tc.new_ticker).length > 0 && (
                          <div className="space-y-3">
                            <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                              <ArrowUpDown className="w-4 h-4" />
                              Mudanças de Ticker
                            </h3>
                            {tickerChanges
                              .filter(tc => tc.old_ticker !== tc.new_ticker)
                              .map((tc, i) => (
                                <div key={`tc-${i}`} className="p-4 rounded-lg border border-purple-500/30 bg-purple-500/5 space-y-3">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <Badge variant="outline" className="text-xs border-purple-500/50 text-purple-500 bg-purple-500/10">
                                        Mudança de Ticker
                                      </Badge>
                                      <span className="text-sm font-medium text-foreground">
                                        {new Date(tc.change_date + 'T00:00:00').toLocaleDateString('pt-BR')}
                                      </span>
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center gap-4">
                                    <div className="px-3 py-2 rounded bg-muted text-center">
                                      <p className="text-xs text-muted-foreground">Antes</p>
                                      <p className="text-lg font-bold text-foreground">{tc.old_ticker}</p>
                                    </div>
                                    <div className="text-muted-foreground">→</div>
                                    <div className="px-3 py-2 rounded bg-primary/10 text-center">
                                      <p className="text-xs text-muted-foreground">Depois</p>
                                      <p className="text-lg font-bold text-primary">{tc.new_ticker}</p>
                                    </div>
                                  </div>

                                  <p className="text-sm text-muted-foreground">{tc.description || tc.reason}</p>

                                  {tc.bonus_ticker && (
                                    <div className="p-3 rounded bg-green-500/10 border border-green-500/20 text-sm">
                                      <span className="font-medium text-green-500">Bonificação:</span>{' '}
                                      <span className="text-foreground">
                                        Recebimento de {tc.bonus_ticker}
                                        {tc.bonus_ratio ? ` (${tc.bonus_ratio} por ação)` : ''}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              ))}
                            
                            {eventImpactDetails.length > 0 && (
                              <Separator className="my-4" />
                            )}
                          </div>
                        )}

                        {/* Event cards */}
                        <div className="space-y-3">
                          {eventImpactDetails.map((evt, i) => {
                            const badgeColor = evt.type === "Bonificação" || evt.type === "Desdobramento"
                              ? "border-green-500/50 text-green-500 bg-green-500/10"
                              : evt.type === "Grupamento"
                                ? "border-red-500/50 text-red-500 bg-red-500/10"
                                : "border-blue-500/50 text-blue-500 bg-blue-500/10";

                            return (
                              <div key={i} className="p-4 rounded-lg border border-border/50 bg-muted/20 space-y-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <Badge variant="outline" className={`text-xs ${badgeColor}`}>
                                      {evt.type}
                                    </Badge>
                                    <span className="text-sm font-medium text-foreground">{evt.dateFormatted}</span>
                                  </div>
                                  {evt.executed ? (
                                    <Badge className="bg-green-500/20 text-green-500 border-green-500/30 text-[10px]">
                                      ✓ Executado
                                    </Badge>
                                  ) : (
                                    <Badge className="bg-muted text-muted-foreground text-[10px]">
                                      Sem posição na data
                                    </Badge>
                                  )}
                                </div>

                                <p className="text-sm text-muted-foreground">{evt.description}</p>

                                {evt.isSplitType && evt.executed && (
                                  <div className="grid grid-cols-3 gap-3 pt-2 border-t border-border/30">
                                    <div className="text-center">
                                      <p className="text-xs text-muted-foreground mb-1">Ações Antes</p>
                                      <p className="text-lg font-bold text-foreground">{evt.sharesBefore}</p>
                                    </div>
                                    <div className="text-center flex flex-col items-center justify-center">
                                      <ArrowUpDown className="w-4 h-4 text-muted-foreground mb-1" />
                                      <span className={`text-sm font-bold ${evt.difference >= 0 ? "text-green-500" : "text-red-500"}`}>
                                        {evt.difference >= 0 ? "+" : ""}{evt.difference}
                                      </span>
                                    </div>
                                    <div className="text-center">
                                      <p className="text-xs text-muted-foreground mb-1">Ações Depois</p>
                                      <p className="text-lg font-bold text-foreground">{evt.sharesAfter}</p>
                                    </div>
                                  </div>
                                )}

                                {evt.isSplitType && evt.executed && evt.ratio && (
                                  <div className="p-3 rounded bg-muted/40 text-xs text-muted-foreground">
                                    <span className="font-medium text-foreground">Fator de ajuste:</span>{" "}
                                    {evt.ratio} (×{evt.adjustmentFactor?.toFixed(2)})
                                    {" · "}
                                    <span className="font-medium text-foreground">Preço médio ajustado:</span>{" "}
                                    {formatCurrency(evt.precoMedioAfter, moeda)}
                                  </div>
                                )}

                                {evt.type === "Rendimento" && evt.executed && (
                                  <div className="p-3 rounded bg-blue-500/10 text-xs">
                                    <span className="font-medium text-foreground">Posição na data:</span>{" "}
                                    <span className="text-blue-500 font-bold">{evt.sharesBefore} ações</span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default AtivoDetalhes;
