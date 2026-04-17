import { useEffect, useState, useMemo } from "react";
import { usePlan } from "@/hooks/usePlan";
import { UpgradePrompt } from "@/components/UpgradePrompt";
import { useNavigate } from "react-router-dom";
import {
  Menu,
  Loader2,
  Calculator,
  FileText,
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertTriangle,
  Percent,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Globe,
} from "lucide-react";
import { isBrazilianTicker, getCurrency, formatCurrency as formatCurrencyLib } from "@/lib/currency";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface Operacao {
  id: string;
  ativo: string;
  tipo: string;
  quantidade: number;
  preco_unitario: number;
  valor_total: number;
  created_at: string;
  nota_id: string | null;
}

interface NotaCorretagem {
  id: string;
  data_operacao: string | null;
}

interface AtivoIR {
  ativo: string;
  quantidadeComprada: number;
  custoTotal: number;
  precoMedio: number;
  quantidadeVendida: number;
  receitaVenda: number;
  precoMedioVenda: number;
  lucroOuPrejuizo: number;
  aliquota: number;
  impostoDevido: number;
  isFII: boolean;
  isInternacional: boolean;
  currency: "BRL" | "USD";
}

const formatBRL = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const formatPercent = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "percent", minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(value / 100);

// Lei 14.754/2023 (vigente desde 2024): alíquota única de 15% para investimentos no exterior
const ALIQUOTA_EXTERIOR = 15;

const IRInvestimentos = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { canGenerateIR, loading: loadingPlan } = usePlan();
  const [operacoes, setOperacoes] = useState<Operacao[]>([]);
  const [notas, setNotas] = useState<NotaCorretagem[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [mesSelecionado, setMesSelecionado] = useState<string>("todos");

  useEffect(() => {
    if (!loading && !user) navigate("/");
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      const [opsRes, notasRes] = await Promise.all([
        supabase.from("operacoes").select("*").eq("user_id", user!.id).order("created_at", { ascending: true }),
        supabase.from("notas_corretagem").select("id, data_operacao").eq("user_id", user!.id),
      ]);
      setOperacoes(
        (opsRes.data || []).map((op) => ({
          ...op,
          quantidade: Number(op.quantidade),
          preco_unitario: Number(op.preco_unitario),
          valor_total: Number(op.valor_total),
        }))
      );
      setNotas(notasRes.data || []);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoadingData(false);
    }
  };

  // Build a map from nota_id -> data_operacao
  const notaDateMap = useMemo(() => {
    const map: Record<string, string> = {};
    notas.forEach((n) => {
      if (n.data_operacao) map[n.id] = n.data_operacao;
    });
    return map;
  }, [notas]);

  // Get available months from operations
  const mesesDisponiveis = useMemo(() => {
    const meses = new Set<string>();
    operacoes.forEach((op) => {
      const dataStr = op.nota_id ? notaDateMap[op.nota_id] : null;
      const date = dataStr ? new Date(dataStr + "T12:00:00") : new Date(op.created_at);
      const mesAno = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      meses.add(mesAno);
    });
    return Array.from(meses).sort().reverse();
  }, [operacoes, notaDateMap]);

  // Filter operations by month
  const operacoesFiltradas = useMemo(() => {
    if (mesSelecionado === "todos") return operacoes;
    return operacoes.filter((op) => {
      const dataStr = op.nota_id ? notaDateMap[op.nota_id] : null;
      const date = dataStr ? new Date(dataStr + "T12:00:00") : new Date(op.created_at);
      const mesAno = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      return mesAno === mesSelecionado;
    });
  }, [operacoes, mesSelecionado, notaDateMap]);

  // Calculate IR per asset
  const ativosIR = useMemo(() => {
    const ativoMap: Record<string, { compras: Operacao[]; vendas: Operacao[] }> = {};

    operacoesFiltradas.forEach((op) => {
      if (!ativoMap[op.ativo]) ativoMap[op.ativo] = { compras: [], vendas: [] };
      if (op.tipo === "C") ativoMap[op.ativo].compras.push(op);
      else if (op.tipo === "V") ativoMap[op.ativo].vendas.push(op);
    });

    const result: AtivoIR[] = [];

    for (const [ativo, { compras, vendas }] of Object.entries(ativoMap)) {
      const quantidadeComprada = compras.reduce((acc, op) => acc + op.quantidade, 0);
      const custoTotal = compras.reduce((acc, op) => acc + op.valor_total, 0);
      const precoMedio = quantidadeComprada > 0 ? custoTotal / quantidadeComprada : 0;

      const quantidadeVendida = vendas.reduce((acc, op) => acc + op.quantidade, 0);
      const receitaVenda = vendas.reduce((acc, op) => acc + op.valor_total, 0);
      const precoMedioVenda = quantidadeVendida > 0 ? receitaVenda / quantidadeVendida : 0;

      const lucroOuPrejuizo = quantidadeVendida > 0 ? receitaVenda - precoMedio * quantidadeVendida : 0;

      const isFII = /^\w{4}11$/.test(ativo);
      const isInternacional = !isBrazilianTicker(ativo);
      const currency = getCurrency(ativo);

      // Alíquota: FII 20%, Internacional 15% fixo (Lei 14.754/2023), Ações BR 15%
      const aliquota = isInternacional ? ALIQUOTA_EXTERIOR : isFII ? 20 : 15;

      const impostoDevido = lucroOuPrejuizo > 0 ? lucroOuPrejuizo * (aliquota / 100) : 0;

      result.push({
        ativo,
        quantidadeComprada,
        custoTotal,
        precoMedio,
        quantidadeVendida,
        receitaVenda,
        precoMedioVenda,
        lucroOuPrejuizo,
        aliquota,
        impostoDevido,
        isFII,
        isInternacional,
        currency,
      });
    }

    return result.sort((a, b) => {
      // Show assets with sales first
      if (a.quantidadeVendida > 0 && b.quantidadeVendida === 0) return -1;
      if (a.quantidadeVendida === 0 && b.quantidadeVendida > 0) return 1;
      return a.ativo.localeCompare(b.ativo);
    });
  }, [operacoesFiltradas]);

  // Summary
  const ativosComVenda = ativosIR.filter((a) => a.quantidadeVendida > 0);
  const lucroTotal = ativosComVenda.reduce((acc, a) => acc + (a.lucroOuPrejuizo > 0 ? a.lucroOuPrejuizo : 0), 0);
  const prejuizoTotal = ativosComVenda.reduce((acc, a) => acc + (a.lucroOuPrejuizo < 0 ? a.lucroOuPrejuizo : 0), 0);
  const impostoTotal = ativosComVenda.reduce((acc, a) => acc + a.impostoDevido, 0);
  const totalVendas = ativosComVenda.reduce((acc, a) => acc + a.receitaVenda, 0);

  // Check swing trade exemption (R$20k/month for non-FII, non-international)
  const vendasAcoesNoMes = ativosComVenda.filter((a) => !a.isFII && !a.isInternacional).reduce((acc, a) => acc + a.receitaVenda, 0);
  const isento = vendasAcoesNoMes <= 20000 && mesSelecionado !== "todos";

  const formatMesLabel = (mesAno: string) => {
    const [year, month] = mesAno.split("-");
    const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    return `${meses[parseInt(month) - 1]} ${year}`;
  };

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
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 md:px-6 py-3 md:py-4">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="text-muted-foreground hover:text-foreground">
                  <Menu className="w-5 h-5" />
                </SidebarTrigger>
                <div>
                  <h1 className="text-xl md:text-2xl font-bold text-foreground">IR de Investimentos</h1>
                  <p className="text-xs md:text-sm text-muted-foreground">Apuração de imposto sobre vendas</p>
                </div>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <Select value={mesSelecionado} onValueChange={setMesSelecionado}>
                  <SelectTrigger className="w-full sm:w-[160px]">
                    <SelectValue placeholder="Período" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os meses</SelectItem>
                    {mesesDisponiveis.map((m) => (
                      <SelectItem key={m} value={m}>{formatMesLabel(m)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </header>

          <div className="p-4 md:p-6 space-y-4 md:space-y-6">
            {loadingData || loadingPlan ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : !canGenerateIR ? (
              <UpgradePrompt feature="IR de Investimentos" minPlan="Platinum" />
            ) : (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="bg-card border-border/50">
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <DollarSign className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Total Vendas</p>
                        <p className="font-semibold text-foreground">{formatBRL(totalVendas)}</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-card border-border/50">
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${lucroTotal > 0 ? "bg-primary/10" : "bg-muted/30"}`}>
                        <ArrowUpRight className={`w-5 h-5 ${lucroTotal > 0 ? "text-primary" : "text-muted-foreground"}`} />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Lucro Tributável</p>
                        <p className="font-semibold text-foreground">{formatBRL(lucroTotal)}</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-card border-border/50">
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${prejuizoTotal < 0 ? "bg-destructive/10" : "bg-muted/30"}`}>
                        <ArrowDownRight className={`w-5 h-5 ${prejuizoTotal < 0 ? "text-destructive" : "text-muted-foreground"}`} />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Prejuízo Acumulado</p>
                        <p className="font-semibold text-foreground">{formatBRL(prejuizoTotal)}</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-card border-border/50">
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${impostoTotal > 0 ? "bg-destructive/10" : "bg-primary/10"}`}>
                        <Calculator className={`w-5 h-5 ${impostoTotal > 0 ? "text-destructive" : "text-primary"}`} />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">DARF a Pagar</p>
                        <p className={`font-semibold ${impostoTotal > 0 && !isento ? (impostoTotal < 10 ? "text-muted-foreground" : "text-destructive") : "text-foreground"}`}>
                          {isento ? "Isento" : impostoTotal < 10 && impostoTotal > 0 ? `${formatBRL(impostoTotal)} *` : formatBRL(impostoTotal)}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Exemption notice */}
                {isento && vendasAcoesNoMes > 0 && (
                  <Card className="bg-primary/5 border-primary/20">
                    <CardContent className="p-4 flex items-center gap-3">
                      <FileText className="w-5 h-5 text-primary shrink-0" />
                      <p className="text-sm text-foreground">
                        <span className="font-semibold">Isenção aplicada:</span> Vendas de ações nacionais no mês totalizaram{" "}
                        {formatBRL(vendasAcoesNoMes)}, abaixo do limite de R$ 20.000,00 para swing trade. A isenção não se aplica a FIIs nem a ativos internacionais.
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* DARF minimum notice */}
                {!isento && impostoTotal > 0 && impostoTotal < 10 && (
                  <Card className="bg-accent/50 border-accent">
                    <CardContent className="p-4 flex items-center gap-3">
                      <AlertTriangle className="w-5 h-5 text-accent-foreground shrink-0" />
                      <p className="text-sm text-foreground">
                        <span className="font-semibold">DARF abaixo do mínimo:</span> O imposto apurado de{" "}
                        {formatBRL(impostoTotal)} é inferior a R$ 10,00. DARFs com valor menor que R$ 10,00 não podem ser emitidas.
                        O valor será acumulado para o próximo mês em que o total ultrapassar R$ 10,00.
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Detail Table */}
                <Card className="bg-card border-border/50">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-primary" />
                      Apuração por Ativo
                      <Badge variant="secondary" className="ml-2">
                        {ativosComVenda.length} ativo{ativosComVenda.length !== 1 ? "s" : ""} com venda
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {ativosIR.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <Calculator className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p className="text-lg font-medium">Nenhuma operação encontrada</p>
                        <p className="text-sm mt-1">Importe notas de corretagem para calcular o IR automaticamente.</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Ativo</TableHead>
                              <TableHead>Tipo</TableHead>
                              <TableHead className="text-right">Qtd Comprada</TableHead>
                              <TableHead className="text-right">Preço Médio</TableHead>
                              <TableHead className="text-right">Qtd Vendida</TableHead>
                              <TableHead className="text-right">Preço Médio Venda</TableHead>
                              <TableHead className="text-right">Resultado</TableHead>
                              <TableHead className="text-center">Alíquota</TableHead>
                              <TableHead className="text-right">IR Devido</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {ativosIR.map((a) => {
                              const temVenda = a.quantidadeVendida > 0;
                              const lucro = a.lucroOuPrejuizo > 0;
                              const fmtVal = (v: number) => formatCurrencyLib(v, a.currency);
                              return (
                                <TableRow key={a.ativo} className={!temVenda ? "opacity-50" : ""}>
                                  <TableCell className="font-semibold text-foreground flex items-center gap-2">
                                    {a.ativo}
                                    {a.isInternacional && <Globe className="w-3.5 h-3.5 text-muted-foreground" />}
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="outline" className={
                                      a.isInternacional
                                        ? "border-accent text-accent-foreground"
                                        : a.isFII
                                          ? "border-primary/30 text-primary"
                                          : "border-muted-foreground/30 text-muted-foreground"
                                    }>
                                      {a.isInternacional ? "Exterior" : a.isFII ? "FII" : "Ação"}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-right">{a.quantidadeComprada}</TableCell>
                                  <TableCell className="text-right">{fmtVal(a.precoMedio)}</TableCell>
                                  <TableCell className="text-right">
                                    {temVenda ? a.quantidadeVendida : "—"}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    {temVenda ? fmtVal(a.precoMedioVenda) : "—"}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    {temVenda ? (
                                      <span className={`flex items-center justify-end gap-1 font-semibold ${lucro ? "text-primary" : "text-destructive"}`}>
                                        {lucro ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                        {fmtVal(a.lucroOuPrejuizo)}
                                      </span>
                                    ) : "—"}
                                  </TableCell>
                                  <TableCell className="text-center">
                                    {temVenda ? (
                                      <Badge variant="secondary" className="gap-1">
                                        <Percent className="w-3 h-3" />
                                        {a.aliquota}%
                                      </Badge>
                                    ) : "—"}
                                  </TableCell>
                                  <TableCell className="text-right font-semibold">
                                    {temVenda ? (
                                      a.impostoDevido > 0 ? (
                                        <span className="text-destructive">{formatBRL(a.impostoDevido)}</span>
                                      ) : (
                                        <span className="text-muted-foreground">R$ 0,00</span>
                                      )
                                    ) : "—"}
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                            {/* Totals row */}
                            {ativosComVenda.length > 0 && (
                              <TableRow className="bg-muted/30 font-bold border-t-2 border-border">
                                <TableCell colSpan={6} className="text-foreground">Total</TableCell>
                                <TableCell className="text-right">
                                  <span className={`font-bold ${lucroTotal + prejuizoTotal > 0 ? "text-primary" : "text-destructive"}`}>
                                    {formatBRL(lucroTotal + prejuizoTotal)}
                                  </span>
                                </TableCell>
                                <TableCell />
                                <TableCell className="text-right">
                                  <span className="font-bold text-destructive">
                                    {isento ? "Isento" : formatBRL(impostoTotal)}
                                  </span>
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Tax rules info */}
                <Card className="bg-card border-border/50">
                  <CardHeader>
                    <CardTitle className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Regras de Tributação Aplicadas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Nacional */}
                      <div>
                        <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                          🇧🇷 Ativos Nacionais (B3)
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                          <div className="p-3 rounded-lg bg-muted/30">
                            <p className="font-semibold text-foreground mb-1">Ações (Swing Trade)</p>
                            <p className="text-muted-foreground">Alíquota de <span className="text-primary font-semibold">15%</span> sobre o lucro líquido. Isenção para vendas até R$ 20.000/mês.</p>
                          </div>
                          <div className="p-3 rounded-lg bg-muted/30">
                            <p className="font-semibold text-foreground mb-1">FIIs</p>
                            <p className="text-muted-foreground">Alíquota de <span className="text-primary font-semibold">20%</span> sobre o lucro. Sem isenção de R$ 20.000.</p>
                          </div>
                          <div className="p-3 rounded-lg bg-muted/30">
                            <p className="font-semibold text-foreground mb-1">Prejuízo</p>
                            <p className="text-muted-foreground">Prejuízos podem ser compensados com lucros futuros do mesmo tipo de ativo.</p>
                          </div>
                          <div className="p-3 rounded-lg bg-muted/30">
                            <p className="font-semibold text-foreground mb-1">DARF Mínimo</p>
                            <p className="text-muted-foreground">DARFs com valor inferior a <span className="text-primary font-semibold">R$ 10,00</span> não podem ser emitidas. O valor acumula para o mês seguinte.</p>
                          </div>
                        </div>
                      </div>

                      {/* Internacional - Lei 14.754/2023 */}
                      <div>
                        <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                          🌎 Ativos no Exterior (Lei 14.754/2023)
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                          <div className="p-3 rounded-lg bg-muted/30">
                            <p className="font-semibold text-foreground mb-1">Alíquota Única de 15%</p>
                            <p className="text-muted-foreground">Alíquota fixa de <span className="text-primary font-semibold">15%</span> sobre o ganho de capital.</p>
                          </div>
                          <div className="p-3 rounded-lg bg-muted/30">
                            <p className="font-semibold text-foreground mb-1">Sem Isenções</p>
                            <p className="text-muted-foreground">A isenção de R$ 35 mil/mês <span className="text-destructive font-semibold">foi extinta</span>. Qualquer ganho, independente do valor, é tributado.</p>
                          </div>
                          <div className="p-3 rounded-lg bg-muted/30">
                            <p className="font-semibold text-foreground mb-1">Apuração Anual</p>
                            <p className="text-muted-foreground">A tributação é <span className="text-primary font-semibold">anual</span>, na declaração do IR. Não é mais necessário recolher mensalmente via GCAP/Carnê-Leão.</p>
                          </div>
                          <div className="p-3 rounded-lg bg-muted/30">
                            <p className="font-semibold text-foreground mb-1">Variação Cambial</p>
                            <p className="text-muted-foreground">O ganho cambial entre a compra e venda do ativo é tributado. Prejuízos podem ser <span className="text-primary font-semibold">compensados</span> com lucros futuros.</p>
                          </div>
                        </div>
                      </div>
                    </div>
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

export default IRInvestimentos;
