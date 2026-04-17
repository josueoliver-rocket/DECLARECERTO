import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Wallet, Menu, Loader2 } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { agruparOperacoesComTaxas, calcularPrecoMedioSimples } from "@/lib/calcularPrecoMedio";

interface AtivoCarteira {
  ativo: string;
  nomeEmpresa: string;
  quantidade: number;
  precoMedio: number;
  valorInvestido: number;
}

// Mapeamento legado - todos os tickers já devem estar corretos no banco
// Este mapa serve apenas como fallback para dados antigos
const TICKER_MAP: Record<string, string> = {
  "BBSEGURIDADE": "BBSE3", "BB SEGURIDADE": "BBSE3",
  "BRESCO": "BRCO11", "FII BRESCO": "BRCO11",
  "FII HGLG PAX": "HGLG11", "CSHG LOGISTICA": "HGLG11",
  "KNEA11": "KNRI11", "FII KINEA UN": "KNRI11", "FII KINEA": "KNRI11",
  "FII MAUA": "MCCI11", "MAUA CAPITAL": "MCCI11", "MAUA11": "MCCI11",
  "FII XP MALLS": "XPML11", "XP MALLS": "XPML11",
  "GUARD11": "GARE11", "GUARDIAN": "GARE11",
  "PETRORIO": "PRIO3", "PETRORECSA": "PRIO3",
  "UNIPAR": "UNIP6", "UNIPAR PNB": "UNIP6",
  "VAMOS": "VAMO3", "VAMOS ON": "VAMO3",
  "WIZ CO": "WIZC3", "WIZ SOLUCOES": "WIZC3",
  "ELETROBRAS": "AXIA6", "ELETROBRAS PNB": "AXIA6", "ELET6": "AXIA6",
  "MALL11": "PMLL11",
  "ITAUSA": "ITSA4", "CEMIG": "CMIG4",
  "PETROBRAS": "PETR4", "VALE": "VALE3",
  "BANCO DO BRASIL": "BBAS3", "BRADESCO": "BBDC4",
  "WEG": "WEGE3", "TAESA": "TAEE11",
  "KLABIN": "KLBN11", "SUZANO": "SUZB3", "ENGIE": "EGIE3",
};

const ASSET_NAME_MAP: Record<string, string> = {
  "PETR4": "Petrobras", "VALE3": "Vale", "BBAS3": "Banco do Brasil",
  "BBDC4": "Bradesco", "ITSA4": "Itaúsa", "ITUB4": "Itaú Unibanco",
  "WEGE3": "WEG", "CMIG4": "Cemig", "TAEE11": "Taesa",
  "KLBN11": "Klabin", "SUZB3": "Suzano", "EGIE3": "Engie Brasil",
  "BBSE3": "BB Seguridade", "PRIO3": "PRIO", "UNIP6": "Unipar",
  "VAMO3": "Vamos", "WIZC3": "Wiz Co", "AXIA6": "Eletrobras",
  "BRCO11": "FII Bresco", "HGLG11": "FII CSHG Logística",
  "KNRI11": "FII Kinea Renda", "MCCI11": "FII Mauá Capital",
  "XPML11": "FII XP Malls", "GARE11": "FII Guardian",
  "PMLL11": "FII Pátria Malls",
  "ABEV3": "Ambev", "MGLU3": "Magazine Luiza", "RENT3": "Localiza",
  "LREN3": "Lojas Renner", "RADL3": "Raia Drogasil", "VIVT3": "Telefônica Vivo",
  "HAPV3": "Hapvida", "RDOR3": "Rede D'Or", "RAIL3": "Rumo",
  "EMBR3": "Embraer", "JBSS3": "JBS", "BEEF3": "Minerva Foods",
  "BRFS3": "BRF", "CSAN3": "Cosan", "TOTS3": "TOTVS",
  "B3SA3": "B3", "SBSP3": "Sabesp", "EQTL3": "Equatorial",
  "FLRY3": "Fleury", "CPLE6": "Copel", "ENEV3": "Eneva",
  "ENGI11": "Energisa", "BRSR6": "Banrisul",
  "CPFE3": "CPFL Energia", "TIMS3": "TIM", "SANB11": "Santander Brasil",
  "MULT3": "Multiplan", "IGTI11": "Iguatemi", "ALSO3": "Allos",
  "CMIN3": "CSN Mineração", "CSNA3": "CSN", "GOAU4": "Metalúrgica Gerdau",
  "GGBR4": "Gerdau", "USIM5": "Usiminas", "BPAC11": "BTG Pactual",
  "HYPE3": "Hypera", "NTCO3": "Natura", "AZUL54": "Azul",
  "COGN3": "Cogna", "YDUQ3": "Yduqs", "CYRE3": "Cyrela",
  "MRVE3": "MRV", "EVEN3": "Even", "DIRR3": "Direcional",
  "BHIA3": "Casas Bahia", "AMER3": "Americanas", "LWSA3": "Locaweb",
  "CASH3": "Méliuz", "PETZ3": "Petz", "ASAI3": "Assaí",
  "CRFB3": "Carrefour Brasil", "SMTO3": "São Martinho",
  "RECV3": "PetroRecôncavo", "RRRP3": "3R Petroleum",
  "AURE3": "Auren Energia", "ELET3": "Eletrobras ON",
  "TRPL4": "ISA CTEEP", "BRAP4": "Bradespar", "MOTV3": "Motiva",
  "GOLL54": "GOL", "BRAV3": "Brava Energia",
  // ETFs internacionais
  "TFLO": "iShares Treasury Floating Rate Bond ETF",
  "VOO": "Vanguard S&P 500 ETF", "QQQ": "Invesco QQQ Trust",
  "VTI": "Vanguard Total Stock Market ETF", "SCHD": "Schwab US Dividend Equity ETF",
  "IVV": "iShares Core S&P 500 ETF", "SPY": "SPDR S&P 500 ETF Trust",
  "AAPL": "Apple", "MSFT": "Microsoft", "GOOGL": "Alphabet",
  "AMZN": "Amazon", "NVDA": "NVIDIA", "META": "Meta Platforms",
  "TSLA": "Tesla", "JPM": "JPMorgan Chase", "V": "Visa",
  "MA": "Mastercard", "DIS": "Walt Disney", "KO": "Coca-Cola",
  "PEP": "PepsiCo", "NFLX": "Netflix", "AMD": "AMD",
  "VNQ": "Vanguard Real Estate ETF", "BNDX": "Vanguard Total International Bond ETF",
  "VEA": "Vanguard FTSE Developed Markets ETF", "VWO": "Vanguard FTSE Emerging Markets ETF",
  "BND": "Vanguard Total Bond Market ETF", "AGG": "iShares Core US Aggregate Bond ETF",
  "EEM": "iShares MSCI Emerging Markets ETF", "GLD": "SPDR Gold Shares",
  "SLV": "iShares Silver Trust", "XLF": "Financial Select Sector SPDR",
  "XLE": "Energy Select Sector SPDR", "ARKK": "ARK Innovation ETF",
  "EQIX": "Equinix", "RACE": "Ferrari", "TLT": "iShares 20+ Year Treasury Bond ETF",
};

const getAssetName = (ticker: string): string => {
  const t = ticker.toUpperCase().trim();
  return ASSET_NAME_MAP[t] || t;
};

const getTicker = (ativo: string): string => {
  return TICKER_MAP[ativo.toUpperCase()] || ativo;
};

const formatCurrency = (value: number, currency: "BRL" | "USD" = "BRL") =>
  currency === "USD"
    ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value)
    : new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const isBrazilianTicker = (ticker: string): boolean => /^[A-Z]{4}\d{1,2}$/.test(ticker.toUpperCase().trim());
const getCurrency = (ticker: string): "BRL" | "USD" => isBrazilianTicker(ticker) ? "BRL" : "USD";

const Carteira = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [ativos, setAtivos] = useState<AtivoCarteira[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      processBonusAndFetch();
    }
  }, [user]);

  const processBonusAndFetch = async () => {
    try {
      // Sync ticker changes first (e.g., ELET6 -> AXIA6, MAUA11 -> MCCI11)
      const { data: syncResult } = await supabase.functions.invoke('sync-ticker-changes', {
        body: { user_id: user?.id },
      });
      // Sync result handled silently

      // Then process bonus shares
      await supabase.functions.invoke('process-bonus-shares', {
        body: { user_id: user?.id },
      });
    } catch (e) {
      console.error('Erro ao processar sincronização:', e);
    }
    fetchCarteira();
  };

  const fetchCarteira = async () => {
    try {
      const { data: operacoes, error } = await supabase
        .from('operacoes')
        .select('*, notas_corretagem(data_operacao, taxas)')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (operacoes && operacoes.length > 0) {
        const agrupados = agruparOperacoesComTaxas(operacoes as any);

        const ativosCalculados = Object.entries(agrupados).map(([ativo, data]) => {
          const { quantidade, precoMedio, valorInvestido } = calcularPrecoMedioSimples(data);

          return {
            ativo,
            nomeEmpresa: getAssetName(ativo),
            quantidade,
            precoMedio,
            valorInvestido,
          };
        }).filter(a => a.quantidade > 0)
          .sort((a, b) => b.valorInvestido - a.valorInvestido);

        // Fetch company names dynamically from Yahoo Finance for tickers not in static map
        const tickersToLookup = ativosCalculados
          .filter(a => a.nomeEmpresa === a.ativo.toUpperCase().trim())
          .map(a => a.ativo);

        if (tickersToLookup.length > 0) {
          try {
            const { data: quoteData } = await supabase.functions.invoke('get-stock-quotes', {
              body: { tickers: tickersToLookup }
            });
            if (quoteData?.quotes) {
              ativosCalculados.forEach(a => {
                const q = quoteData.quotes[a.ativo];
                if (q?.name && a.nomeEmpresa === a.ativo.toUpperCase().trim()) {
                  a.nomeEmpresa = q.name;
                }
              });
            }
          } catch (e) {
            console.error('Erro ao buscar nomes:', e);
          }
        }

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

  if (!user) {
    return null;
  }

  const totalInvestido = ativos.reduce((acc, a) => acc + a.valorInvestido, 0);

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
                  <h1 className="text-xl md:text-2xl font-bold text-foreground">Carteira</h1>
                  <p className="text-xs md:text-sm text-muted-foreground">Seus ativos em carteira</p>
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
              <>
                <Card className="bg-card border-border/50">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
                      <Wallet className="w-5 h-5 text-primary" />
                      Ativos em Carteira
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {ativos.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Wallet className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>Nenhum ativo cadastrado</p>
                        <p className="text-sm">Adicione notas de corretagem para ver seus ativos aqui</p>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                             <TableHead>Ativo</TableHead>
                             <TableHead>Ticker</TableHead>
                             <TableHead className="text-right">Quantidade</TableHead>
                             <TableHead className="text-right">Preço Médio</TableHead>
                             <TableHead className="text-right">Valor Investido</TableHead>
                           </TableRow>
                        </TableHeader>
                        <TableBody>
                          {ativos.map((ativo) => (
                            <TableRow key={ativo.ativo}>
                              <TableCell className="font-semibold text-foreground">
                                 <div className="flex flex-col">
                                   <span>{ativo.nomeEmpresa}</span>
                                   <span className="text-xs font-normal text-muted-foreground">{ativo.ativo}</span>
                                 </div>
                               </TableCell>
                              <TableCell className="font-medium text-muted-foreground">
                                 {getTicker(ativo.ativo)}
                              </TableCell>
                               <TableCell className="text-right font-medium">
                                 {isBrazilianTicker(ativo.ativo) ? ativo.quantidade : ativo.quantidade.toFixed(5)}
                                </TableCell>
                               <TableCell className="text-right font-medium">
                                 {formatCurrency(ativo.precoMedio, getCurrency(ativo.ativo))}
                               </TableCell>
                               <TableCell className="text-right font-medium text-primary">
                                 {formatCurrency(ativo.valorInvestido, getCurrency(ativo.ativo))}
                               </TableCell>
                            </TableRow>
                          ))}
                           <TableRow className="bg-muted/30 font-bold">
                              <TableCell>Total</TableCell>
                              <TableCell>-</TableCell>
                              <TableCell className="text-right">-</TableCell>
                              <TableCell className="text-right">-</TableCell>
                              <TableCell className="text-right text-primary">
                               {formatCurrency(totalInvestido)}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
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

export default Carteira;
