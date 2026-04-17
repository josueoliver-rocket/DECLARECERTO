import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { TrendingUp, Menu, Loader2 } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { PieChart, Pie, Cell, ResponsiveContainer, Sector } from "recharts";
import { CorporateEvent, applyCorporateAdjustments } from "@/lib/corporateEvents";

interface AtivoCarteira {
  ativo: string;
  ticker: string;
  valorInvestido: number;
  percentual: number;
}

const COLORS = [
  "hsl(var(--primary))",
  "hsl(210, 70%, 50%)",
  "hsl(150, 60%, 45%)",
  "hsl(40, 80%, 55%)",
  "hsl(0, 65%, 55%)",
  "hsl(270, 55%, 55%)",
  "hsl(180, 50%, 45%)",
  "hsl(330, 60%, 50%)",
];

const TICKER_MAP: Record<string, string> = {
  "ITAUSA": "ITSA4",
  "CEMIG": "CMIG4",
  "FII GGRCOVEP": "GGRC11",
  "FII VINCI SC": "VISC11",
  "PETROBRAS": "PETR4",
  "VALE": "VALE3",
  "BANCO DO BRASIL": "BBAS3",
  "BRADESCO": "BBDC4",
  "AMBEV": "ABEV3",
  "MAGAZINE LUIZA": "MGLU3",
  "WEG": "WEGE3",
  "TAESA": "TAEE11",
  "KLABIN": "KLBN11",
  "SUZANO": "SUZB3",
  "ENGIE": "EGIE3",
};

const getTicker = (ativo: string): string => {
  return TICKER_MAP[ativo.toUpperCase()] || ativo;
};

const formatCurrency = (value: number, currency: "BRL" | "USD" = "BRL") =>
  currency === "USD"
    ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value)
    : new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const isBrazilianTicker = (ticker: string): boolean => /^[A-Z]{4}\d{1,2}$/.test(ticker.toUpperCase().trim());

const Investimentos = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [ativos, setAtivos] = useState<AtivoCarteira[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [clickedIndex, setClickedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchCarteira();
    }
  }, [user]);

  const fetchCorporateEventsForTickers = async (tickers: string[]): Promise<Record<string, CorporateEvent[]>> => {
    const results: Record<string, CorporateEvent[]> = {};
    const batchSize = 5;
    for (let i = 0; i < tickers.length; i += batchSize) {
      const batch = tickers.slice(i, i + batchSize);
      const promises = batch.map(async (ticker) => {
        try {
          const { data, error } = await supabase.functions.invoke('get-dividends', {
            body: { ticker }
          });
          if (!error && data?.corporateEvents) {
            results[ticker] = data.corporateEvents;
          } else {
            results[ticker] = [];
          }
        } catch {
          results[ticker] = [];
        }
      });
      await Promise.all(promises);
    }
    return results;
  };

  const fetchCarteira = async () => {
    try {
      const { data: operacoes, error } = await supabase
        .from('operacoes')
        .select('*, notas_corretagem(data_operacao, taxas)')
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (operacoes && operacoes.length > 0) {
        // Distribute fees proportionally into valor_total for buy operations
        const comprasPorNota: Record<string, { total: number }> = {};
        operacoes.forEach((op: any) => {
          if (op.tipo === 'C' && op.nota_id) {
            if (!comprasPorNota[op.nota_id]) comprasPorNota[op.nota_id] = { total: 0 };
            comprasPorNota[op.nota_id].total += Number(op.valor_total);
          }
        });

        const ativosMap: Record<string, {
          allOps: { tipo: string; quantidade: number; valor_total: number; created_at: string }[];
        }> = {};

        operacoes.forEach((op: any) => {
          if (!ativosMap[op.ativo]) {
            ativosMap[op.ativo] = { allOps: [] };
          }
          const opDate = op.notas_corretagem?.data_operacao
            ? op.notas_corretagem.data_operacao + 'T00:00:00+00:00'
            : op.created_at;
          
          let taxaProporcional = 0;
          if (op.tipo === 'C' && op.nota_id && op.notas_corretagem?.taxas) {
            const info = comprasPorNota[op.nota_id];
            if (info && info.total > 0) {
              taxaProporcional = Number(op.notas_corretagem.taxas) * (Number(op.valor_total) / info.total);
            }
          }
          
          ativosMap[op.ativo].allOps.push({
            tipo: op.tipo,
            quantidade: op.quantidade,
            valor_total: Number(op.valor_total) + taxaProporcional,
            created_at: opDate,
          });
        });

        // Fetch corporate events for all tickers
        const tickers = Object.keys(ativosMap);
        const allCorporateEvents = await fetchCorporateEventsForTickers(tickers);

        const ativosCalculados = Object.entries(ativosMap).map(([ativo, data]) => {
          const events = allCorporateEvents[ativo] || [];
          const { adjustedQuantity, adjustedPrecoMedio, adjustedValorInvestido } =
            applyCorporateAdjustments(data.allOps, events);

          return { ativo, ticker: getTicker(ativo), valorInvestido: adjustedValorInvestido, percentual: 0 };
        }).filter(a => a.valorInvestido > 0)
          .sort((a, b) => b.valorInvestido - a.valorInvestido);

        const total = ativosCalculados.reduce((acc, a) => acc + a.valorInvestido, 0);
        ativosCalculados.forEach(a => {
          a.percentual = total > 0 ? (a.valorInvestido / total) * 100 : 0;
        });

        setAtivos(ativosCalculados);
      } else {
        setAtivos([]);
      }
    } catch (error) {
      console.error('Erro ao carregar carteira:', error);
    } finally {
      setLoadingData(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;


  const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, midAngle } = props;
    const RADIAN = Math.PI / 180;
    const isClicked = clickedIndex !== null && clickedIndex === props.index;
    const offsetRadius = isClicked ? 12 : 0;
    const offsetX = offsetRadius * Math.cos(-midAngle * RADIAN);
    const offsetY = offsetRadius * Math.sin(-midAngle * RADIAN);

    return (
      <g>
        <text x={cx} y={cy - 12} textAnchor="middle" fill="hsl(var(--foreground))" className="text-sm font-bold">
          {payload.ticker}
        </text>
        <text x={cx} y={cy + 12} textAnchor="middle" fill="hsl(var(--muted-foreground))" className="text-xs">
          {(percent * 100).toFixed(1)}%
        </text>
        <Sector
          cx={cx + offsetX}
          cy={cy + offsetY}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 8}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
        <Sector
          cx={cx + offsetX}
          cy={cy + offsetY}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={outerRadius + 12}
          outerRadius={outerRadius + 16}
          fill={fill}
        />
      </g>
    );
  };

  const renderLabel = ({ cx, cy, midAngle, outerRadius, percent }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = outerRadius + 25;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    if (percent < 0.05) return null;
    return (
      <text x={x} y={y} fill="hsl(var(--foreground))" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className="text-xs font-medium">
        {(percent * 100).toFixed(1)}%
      </text>
    );
  };

  const onPieEnter = (_: any, index: number) => setActiveIndex(index);
  const onPieLeave = () => {
    if (clickedIndex !== null) {
      setActiveIndex(clickedIndex);
    } else {
      setActiveIndex(null);
    }
  };
  const onPieClick = (_: any, index: number) => {
    setClickedIndex(prev => prev === index ? null : index);
    setActiveIndex(index);
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />

        <main className="flex-1 overflow-auto">
          <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/50">
            <div className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="text-muted-foreground hover:text-foreground">
                  <Menu className="w-5 h-5" />
                </SidebarTrigger>
                <div>
                  <h1 className="text-xl md:text-2xl font-bold text-foreground">Investimentos</h1>
                  <p className="text-xs md:text-sm text-muted-foreground">Diversificação da sua carteira</p>
                </div>
              </div>
            </div>
          </header>

          <div className="p-4 md:p-6 space-y-4 md:space-y-6">
            {loadingData ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <Card className="bg-card border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Diversificação da Carteira
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {ativos.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>Nenhum ativo cadastrado</p>
                      <p className="text-sm">Adicione notas de corretagem para ver a diversificação</p>
                    </div>
                  ) : (
                    <div className="flex flex-col lg:flex-row items-center gap-8">
                      <div className="w-full lg:w-1/2 h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={ativos}
                              cx="50%"
                              cy="50%"
                              innerRadius={70}
                              outerRadius={130}
                              paddingAngle={3}
                              dataKey="valorInvestido"
                              nameKey="ativo"
                              activeIndex={activeIndex !== null ? activeIndex : undefined}
                              activeShape={renderActiveShape}
                              onMouseEnter={onPieEnter}
                              onMouseLeave={onPieLeave}
                              onClick={onPieClick}
                              label={activeIndex === null ? renderLabel : false}
                              labelLine={false}
                              style={{ cursor: 'pointer' }}
                            >
                              {ativos.map((_, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={COLORS[index % COLORS.length]}
                                  opacity={clickedIndex !== null && clickedIndex !== index ? 0.3 : 1}
                                  stroke={clickedIndex === index ? "hsl(var(--foreground))" : "none"}
                                  strokeWidth={clickedIndex === index ? 2 : 0}
                                />
                              ))}
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="w-full lg:w-1/2 space-y-3">
                        {ativos.map((ativo, index) => (
                          <div key={ativo.ativo} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                            <div className="flex items-center gap-3">
                              <div
                                className="w-4 h-4 rounded-full shrink-0"
                                style={{ backgroundColor: COLORS[index % COLORS.length] }}
                              />
                              <div>
                                <span className="font-semibold text-foreground">{ativo.ticker}</span>
                                <span className="text-xs text-muted-foreground ml-2">{ativo.ativo}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium text-foreground">{formatCurrency(ativo.valorInvestido, isBrazilianTicker(ativo.ativo) ? "BRL" : "USD")}</p>
                              <p className="text-xs text-muted-foreground">{ativo.percentual.toFixed(1)}%</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Investimentos;
