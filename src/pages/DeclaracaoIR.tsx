import { useEffect, useState, useMemo, useCallback } from "react";
import { usePlan } from "@/hooks/usePlan";
import { UpgradePrompt } from "@/components/UpgradePrompt";
import { useNavigate } from "react-router-dom";
import {
  Menu,
  Loader2,
  FileSpreadsheet,
  Building2,
  DollarSign,
  Landmark,
  Receipt,
  Download,
  AlertCircle,
} from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { isBrazilianTicker, getCurrency, formatCurrency } from "@/lib/currency";
import { gerarRelatorioPdf } from "@/lib/gerarRelatorioPdf";

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
  corretora: string;
}

interface Profile {
  nome: string | null;
  cpf: string | null;
}

interface BemDireito {
  grupo: string;
  codigo: string;
  localizacao: string;
  cnpj: string;
  discriminacao: string;
  situacaoAnoAnterior: number;
  situacaoAnoAtual: number;
  valorUsdAtual?: number;
  valorUsdAnterior?: number;
  ativo: string;
  quantidade: number;
  precoMedio: number;
  isFII: boolean;
  isInternacional: boolean;
  currency: "BRL" | "USD";
}

interface RendimentoIsento {
  tipo: string;
  ativo: string;
  valor: number;
  descricao: string;
}

interface DividendoNacional {
  ativo: string;
  valorTotal: number;
  valorEditado: number | null; // null = using auto value
  isFII: boolean;
}

const formatBRL = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const formatUSD = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);

// CNPJs das empresas/fundos brasileiros (fonte: B3/CVM)
const CNPJ_MAP: Record<string, string> = {
  // Ações
  "PETR3": "33.000.167/0001-01", "PETR4": "33.000.167/0001-01",
  "VALE3": "33.592.510/0001-54",
  "ITUB3": "60.872.504/0001-23", "ITUB4": "60.872.504/0001-23",
  "BBDC3": "60.746.948/0001-12", "BBDC4": "60.746.948/0001-12",
  "BBAS3": "00.000.000/0001-91",
  "ABEV3": "07.526.557/0001-00",
  "WEGE3": "84.429.695/0001-11",
  "ITSA3": "61.532.644/0001-15", "ITSA4": "61.532.644/0001-15",
  "B3SA3": "09.346.601/0001-25",
  "RENT3": "16.670.085/0001-55",
  "SUZB3": "16.404.287/0001-55",
  "GGBR4": "33.611.500/0001-19", "GGBR3": "33.611.500/0001-19",
  "GOAU4": "92.690.783/0001-09",
  "CSNA3": "33.042.730/0001-04",
  "LREN3": "92.754.738/0001-62",
  "HAPV3": "63.554.067/0001-98",
  "PRIO3": "10.887.931/0001-50",
  "RAIL3": "02.387.241/0001-60",
  "JBSS3": "02.916.265/0001-60",
  "BEEF3": "67.620.377/0001-14",
  "BRFS3": "01.838.723/0001-27",
  "EMBR3": "07.689.002/0001-89",
  "RDOR3": "06.047.087/0001-39",
  "VIVT3": "02.558.157/0001-62",
  "TIMS3": "02.421.421/0001-11",
  "EQTL3": "03.220.438/0001-73",
  "CMIG3": "17.155.730/0001-64", "CMIG4": "17.155.730/0001-64",
  "ELET3": "00.001.180/0001-26", "ELET6": "00.001.180/0001-26",
  "AXIA6": "00.001.180/0001-26",
  "CPLE6": "76.483.817/0001-20",
  "TAEE11": "07.859.971/0001-30",
  "ENGI11": "00.864.214/0001-06",
  "EGIE3": "02.474.103/0001-19",
  "CPFE3": "02.429.144/0001-93",
  "SBSP3": "43.776.517/0001-80",
  "MGLU3": "47.960.950/0001-21",
  "RADL3": "61.585.865/0001-51",
  "TOTS3": "53.113.791/0001-22",
  "FLRY3": "60.840.055/0001-31",
  "HYPE3": "02.932.074/0001-91",
  "BBSE3": "11.159.426/0001-09",
  "ENEV3": "04.423.567/0001-21",
  "CSAN3": "50.746.577/0001-15",
  "KLBN3": "89.637.490/0001-45", "KLBN4": "89.637.490/0001-45", "KLBN11": "89.637.490/0001-45",
  "USIM5": "60.894.730/0001-05",
  "BPAC11": "30.306.294/0001-45",
  "SANB11": "90.400.888/0001-42",
  "BRSR6": "92.702.067/0001-96",
  "UGPA3": "02.530.605/0001-04",
  "COGN3": "02.800.026/0001-40",
  "YDUQ3": "08.807.432/0001-10",
  "CYRE3": "73.178.600/0001-18",
  "MRVE3": "08.343.492/0001-20",
  "BHIA3": "33.041.260/0652-90",
  "LWSA3": "13.250.104/0001-90",
  "ASAI3": "47.427.653/0001-15",
  "CRFB3": "75.315.333/0001-09",
  "BRAV3": "12.091.809/0001-55",
  "MOTV3": "02.846.056/0001-97",
  "IRBR3": "33.376.989/0001-70",
  "SIMH3": "05.765.585/0001-53",
  "MULT3": "07.816.890/0001-53",
  "IGTI11": "51.218.147/0001-93",
  "SMTO3": "51.466.860/0001-56",
  "SLCE3": "89.096.457/0001-55",
  "EZTC3": "08.312.229/0001-73",
  "ALUP3": "08.364.948/0001-38", "ALUP11": "08.364.948/0001-38",
  "SAPR3": "76.484.013/0001-45", "SAPR4": "76.484.013/0001-45", "SAPR11": "76.484.013/0001-45",
  "TAEE3": "07.859.971/0001-30", "TAEE4": "07.859.971/0001-30",
  "VAMO3": "04.432.517/0001-05",
  "MRFG3": "03.853.896/0001-40",
  "PNVL3": "92.665.611/0001-77",
  "CMIN3": "08.902.291/0001-15",
  "ALOS3": "28.267.855/0001-82",
  "NTCO3": "71.673.990/0001-77",
  "ARZZ3": "16.590.234/0001-76",
  "SMFT3": "07.594.978/0001-78",
  "JHSF3": "08.294.224/0001-65",
  "DIRR3": "16.614.075/0001-00",
  "CURY3": "21.057.224/0001-42",
  "MOVI3": "21.314.559/0001-66",
  "ECOR3": "04.149.454/0001-80",
  "STBP3": "02.762.121/0001-04",
  "RAPT4": "89.086.144/0001-16",
  "INTB3": "16.564.541/0001-40",
  "POSI3": "81.243.735/0001-48",
  "NEOE3": "01.083.200/0001-18",
  "EVEN3": "43.470.988/0001-65",
  "GMAT3": "35.500.680/0001-03",
  "BRKM5": "42.150.391/0001-70",
  "ABCB4": "28.195.667/0001-06",
  "BPAN4": "59.285.411/0001-13",
  "CXSE3": "03.831.487/0001-67",
  "PSSA3": "02.149.205/0001-69",
  "ODPV3": "58.119.199/0001-51",
  "TEND3": "71.476.527/0001-35",
  "AGRO3": "07.628.528/0001-59",
  "RANI3": "92.791.243/0001-03",
  "WIZC3": "42.278.473/0001-47",
  "OIBR3": "76.535.764/0001-43",
  "CASH3": "14.110.585/0001-07",
  "AURE3": "42.527.195/0001-03",
  // FIIs
  "HGLG11": "11.728.688/0001-47",
  "KNRI11": "12.005.956/0001-65",
  "MXRF11": "97.521.225/0001-25",
  "XPLG11": "26.502.794/0001-85",
  "XPML11": "28.757.546/0001-00",
  "VISC11": "17.554.274/0001-25",
  "BTLG11": "08.924.783/0001-01",
  "CPTS11": "18.979.895/0001-13",
  "KNCR11": "16.706.958/0001-32",
  "RECR11": "35.942.168/0001-22",
  "HGRE11": "09.072.017/0001-29",
  "HGRU11": "29.641.226/0001-53",
  "IRDM11": "28.830.325/0001-10",
  "TGAR11": "26.614.291/0001-00",
  "MCCI11": "23.648.935/0001-84",
  "ALZR11": "28.737.771/0001-85",
  "LVBI11": "28.323.370/0001-89",
  "HSML11": "32.892.018/0001-31",
  "RBRF11": "29.467.977/0001-03",
  "VRTA11": "11.664.308/0001-97",
  "HFOF11": "18.307.582/0001-19",
  "SNCI11": "38.065.012/0001-77",
  "URPR11": "35.358.091/0001-07",
  "PVBI11": "35.652.102/0001-76",
  "GARE11": "37.295.919/0001-60",
  "PMLL11": "41.466.045/0001-88",
  "BCFF11": "11.026.627/0001-38",
  "RBRP11": "29.269.067/0001-00",
  "BRCO11": "20.748.515/0001-81",
  "MCRE11": "23.648.935/0001-84",
  "BOVA11": "10.406.511/0001-61",
  "IVVB11": "19.909.560/0001-91",
  "TRXF11": "28.548.288/0001-52",
  "TRXL11": "28.548.288/0001-52",
  "VINO11": "24.026.983/0001-35",
  "BTHF11": "45.188.176/0001-57",
  "CPTR11": "42.537.579/0001-76",
  "CRAA11": "48.903.610/0001-21",
  "MAXR11": "11.274.415/0001-70",
  "RCRB11": "03.683.056/0001-86",
  "RURA11": "42.479.593/0001-60",
  "KNIP11": "22.234.420/0001-85",
  "KNSC11": "35.864.448/0001-78",
  "RBRR11": "29.467.977/0001-03",
  "XPCI11": "28.516.325/0001-40",
  "VGIR11": "34.197.811/0001-46",
  "RZTR11": "36.501.137/0001-66",
  "RZAK11": "35.771.901/0001-60",
  "KFOF11": "28.075.003/0001-23",
  "MALL11": "17.365.105/0001-47",
  "HGBS11": "08.431.747/0001-06",
  "VILG11": "24.853.044/0001-06",
  "BTAL11": "32.134.015/0001-80",
};

// Nomes das empresas/fundos brasileiros
const NOME_EMPRESA_MAP: Record<string, string> = {
  "PETR3": "PETROLEO BRASILEIRO S.A. PETROBRAS", "PETR4": "PETROLEO BRASILEIRO S.A. PETROBRAS",
  "VALE3": "VALE S.A.",
  "ITUB3": "ITAU UNIBANCO HOLDING S.A.", "ITUB4": "ITAU UNIBANCO HOLDING S.A.",
  "BBDC3": "BCO BRADESCO S.A.", "BBDC4": "BCO BRADESCO S.A.",
  "BBAS3": "BCO BRASIL S.A.",
  "ABEV3": "AMBEV S.A.",
  "WEGE3": "WEG S.A.",
  "ITSA3": "ITAUSA S.A.", "ITSA4": "ITAUSA S.A.",
  "B3SA3": "B3 S.A. - BRASIL, BOLSA, BALCAO",
  "RENT3": "LOCALIZA RENT A CAR S.A.",
  "SUZB3": "SUZANO S.A.",
  "GGBR4": "GERDAU S.A.", "GGBR3": "GERDAU S.A.",
  "GOAU4": "METALURGICA GERDAU S.A.",
  "CSNA3": "CIA SIDERURGICA NACIONAL",
  "LREN3": "LOJAS RENNER S.A.",
  "HAPV3": "HAPVIDA PARTICIPACOES E INVEST S.A.",
  "PRIO3": "PRIO S.A.",
  "RAIL3": "RUMO S.A.",
  "JBSS3": "JBS S.A.",
  "BEEF3": "MINERVA S.A.",
  "BRFS3": "BRF S.A.",
  "EMBR3": "EMBRAER S.A.",
  "RDOR3": "REDE D'OR SAO LUIZ S.A.",
  "VIVT3": "TELEFONICA BRASIL S.A.",
  "TIMS3": "TIM S.A.",
  "EQTL3": "EQUATORIAL ENERGIA S.A.",
  "CMIG3": "CIA ENERGETICA DE MINAS GERAIS", "CMIG4": "CIA ENERGETICA DE MINAS GERAIS",
  "ELET3": "CENTRAIS ELET BRAS S.A. - ELETROBRAS", "ELET6": "CENTRAIS ELET BRAS S.A. - ELETROBRAS",
  "AXIA6": "CENTRAIS ELET BRAS S.A. - ELETROBRAS",
  "CPLE6": "CIA PARANAENSE DE ENERGIA - COPEL",
  "TAEE11": "TAESA - TRANSMISSORA ALIANCA DE ENERGIA ELETRICA S.A.",
  "ENGI11": "ENERGISA S.A.",
  "EGIE3": "ENGIE BRASIL ENERGIA S.A.",
  "CPFE3": "CPFL ENERGIA S.A.",
  "SBSP3": "CIA SANEAMENTO BASICO EST SAO PAULO",
  "MGLU3": "MAGAZINE LUIZA S.A.",
  "RADL3": "RAIA DROGASIL S.A.",
  "TOTS3": "TOTVS S.A.",
  "FLRY3": "FLEURY S.A.",
  "HYPE3": "HYPERA S.A.",
  "BBSE3": "BB SEGURIDADE PARTICIPACOES S.A.",
  "ENEV3": "ENEVA S.A.",
  "CSAN3": "COSAN S.A.",
  "KLBN3": "KLABIN S.A.", "KLBN4": "KLABIN S.A.", "KLBN11": "KLABIN S.A.",
  "USIM5": "USINAS SID DE MINAS GERAIS S.A.",
  "BPAC11": "BANCO BTG PACTUAL S.A.",
  "SANB11": "BANCO SANTANDER BRASIL S.A.",
  "BRSR6": "BANCO DO ESTADO DO RIO GRANDE DO SUL S.A.",
  "UGPA3": "ULTRAPAR PARTICIPACOES S.A.",
  "COGN3": "COGNA EDUCACAO S.A.",
  "YDUQ3": "YDUQS PARTICIPACOES S.A.",
  "CYRE3": "CYRELA BRAZIL REALTY S.A.",
  "MRVE3": "MRV ENGENHARIA E PARTICIPACOES S.A.",
  "BHIA3": "CASAS BAHIA S.A.",
  "LWSA3": "LOCAWEB SERVICOS DE INTERNET S.A.",
  "ASAI3": "SENDAS DISTRIBUIDORA S.A.",
  "CRFB3": "ATACADAO S.A.",
  "BRAV3": "BRAV ENERGIA S.A.",
  "MOTV3": "MOTIVA INFRAESTRUTURA DE MOBILIDADE S.A.",
  "IRBR3": "IRB BRASIL RESSEGUROS S.A.",
  "SIMH3": "SIMPAR S.A.",
  "MULT3": "MULTIPLAN EMPREENDIMENTOS IMOBILIARIOS S.A.",
  "IGTI11": "IGUATEMI S.A.",
  "SMTO3": "SAO MARTINHO S.A.",
  "SLCE3": "SLC AGRICOLA S.A.",
  "CMIN3": "CSN MINERACAO S.A.",
  // FIIs
  "HGLG11": "CSHG LOGISTICA FII", "KNRI11": "KINEA RENDA IMOBILIARIA FII",
  "MXRF11": "MAXI RENDA FII", "XPLG11": "XP LOG FII",
  "XPML11": "XP MALLS FII", "VISC11": "VINCI SHOPPING CENTERS FII",
  "BTLG11": "BTG PACTUAL LOGISTICA FII", "CPTS11": "CAPITANIA SECURITIES II FII",
  "KNCR11": "KINEA RENDIMENTOS IMOBILIARIOS FII", "RECR11": "REC RECEBIVEIS IMOBILIARIOS FII",
  "HGRE11": "CSHG REAL ESTATE FII", "HGRU11": "CSHG RENDA URBANA FII",
  "IRDM11": "IRIDIUM RECEBIVEIS IMOBILIARIOS FII", "TGAR11": "TG ATIVO REAL FII",
  "MCCI11": "MAUA CAPITAL RECEBIVEIS IMOBILIARIOS FII", "ALZR11": "ALIANZA TRUST RENDA IMOBILIARIA FII",
  "LVBI11": "VBI LOGISTICO FII", "HSML11": "HSI MALLS FII",
  "RBRF11": "RBR ALPHA FII", "VRTA11": "FATOR VERITA FII",
  "HFOF11": "HEDGE TOP FOFII 3 FII", "SNCI11": "SUNO RECEBIVEIS IMOBILIARIOS FII",
  "URPR11": "URCA PRIME RENDA FII", "PVBI11": "VBI PRIME PROPERTIES FII",
  "GARE11": "GUARDIAN LOGISTICA FII", "PMLL11": "PATRIA MALLS FII",
  "BCFF11": "BTG PACTUAL FUNDO DE FUNDOS FII", "RBRP11": "RBR PROPERTIES FII",
  "BRCO11": "BRESCO LOGISTICA FII", "MCRE11": "MAUA CAPITAL RECEBIVEIS IMOBILIARIOS FII",
  "BOVA11": "ISHARES IBOVESPA FII ETF", "IVVB11": "ISHARES S&P 500 FII ETF",
  // Adicionais do portfólio
  "EZTC3": "EZTEC EMPREENDIMENTOS E PARTICIPACOES S.A.",
  "ALUP3": "ALUPAR INVESTIMENTO S.A.", "ALUP11": "ALUPAR INVESTIMENTO S.A.",
  "SAPR3": "CIA DE SANEAMENTO DO PARANA - SANEPAR", "SAPR4": "CIA DE SANEAMENTO DO PARANA - SANEPAR", "SAPR11": "CIA DE SANEAMENTO DO PARANA - SANEPAR",
  "TAEE3": "TAESA - TRANSMISSORA ALIANCA DE ENERGIA ELETRICA S.A.", "TAEE4": "TAESA - TRANSMISSORA ALIANCA DE ENERGIA ELETRICA S.A.",
  "VAMO3": "VAMOS LOCACAO DE CAMINHOES MAQUINAS E EQUIPAMENTOS S.A.",
  "TRXF11": "TRX REAL ESTATE FII", "TRXL11": "TRX REAL ESTATE FII",
  "VINO11": "VINCI OFFICES FII",
  "BTHF11": "BTG PACTUAL REAL ESTATE HEDGE FUND FII",
  "CPTR11": "CAPITANIA AGRO STRATEGIES FIAGRO",
  "CRAA11": "SPARTA FIAGRO FDO INV NAS CAD PROD AGRO",
  "MAXR11": "FII MAX RETAIL",
  "RCRB11": "FDO INV IMOB RIO BRAVO RENDA CORPORATIVA",
  "RURA11": "ITAU ASSET RURAL FIAGRO IMOBILIARIO",
  "KNIP11": "KINEA INDICES DE PRECOS FII",
  "KNSC11": "KINEA SECURITIES FII",
  "RBRR11": "RBR RENDIMENTO HIGH GRADE FII",
  "XPCI11": "XP CREDITO IMOBILIARIO FII",
  "VGIR11": "VALORA RE III FII",
  "RZTR11": "RIZA TERRAX FII",
  "RZAK11": "RIZA AKIN FII",
  "KFOF11": "KINEA FUNDO DE FUNDOS FII",
  "MALL11": "MALLS BRASIL PLURAL FII",
  "HGBS11": "CSHG BRASIL SHOPPING FII",
  "VILG11": "VINCI LOGISTICA FII",
  "BTAL11": "BTG PACTUAL TERRAS AGRICOLAS FII",
};

// ETFs, REITs e Fundos internacionais conhecidos (Grupo 07, Cod 99 - Lei 14.754/2023)
// Ações individuais (stocks) ficam no Grupo 03, Cod 01
const INTERNATIONAL_ETF_SET = new Set([
  // ETFs mais comuns
  "SPY", "VOO", "VTI", "QQQ", "IVV", "SCHD", "VNQ", "VEA", "VWO", "IEMG",
  "EEM", "AGG", "BND", "TLT", "LQD", "HYG", "GLD", "SLV", "IAU", "DIA",
  "IWM", "MDY", "VIG", "VYM", "NOBL", "DGRO", "DVY", "SDY", "JEPI", "JEPQ",
  "XLF", "XLK", "XLE", "XLV", "XLI", "XLU", "XLP", "XLY", "XLC", "XLB",
  "ARKK", "ARKW", "ARKG", "ARKF", "ARKQ", "IBIT", "FBTC", "BITO",
  "EWZ", "EWJ", "EWG", "EWU", "EWA", "EWC", "EWY", "EWT", "EWH",
  "VT", "ACWI", "IXUS", "VXUS", "SPDW", "IEFA",
  "SCHX", "SCHB", "SCHA", "SCHG", "SCHV",
  "RSP", "QUAL", "MTUM", "USMV", "SPLV", "SIZE",
  "TQQQ", "SQQQ", "UPRO", "SPXU", "SOXL", "SOXS",
  // REITs
  "O", "VNQ", "SCHH", "IYR", "XLRE", "RWR", "USRT",
  "AMT", "PLD", "CCI", "EQIX", "SPG", "DLR", "PSA", "WELL",
  "AVB", "EQR", "ARE", "MAA", "UDR", "ESS", "CPT", "INVH",
  "STAG", "NNN", "WPC", "STOR", "ADC", "EPRT",
]);

const ptaxCache: Record<string, number> = {};

// Fetch PTAX (USD/BRL) from BCB for a specific date (tries backwards if not a business day)
const fetchPtaxForDate = async (date: Date): Promise<number | null> => {
  // Per IN RFB 1585/2015: PTAX de venda do dia útil anterior à data de liquidação
  // Settlement nos EUA = T+1 (desde mai/2024), logo PTAX = D+0 (dia da operação)
  // Tenta a data da operação; se não houver cotação (feriado/fds), busca dias anteriores
  for (let offset = 0; offset <= 5; offset++) {
    const d = new Date(date);
    d.setDate(d.getDate() - offset);
    const dateStr = `${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}-${d.getFullYear()}`;
    
    if (ptaxCache[dateStr] !== undefined) return ptaxCache[dateStr];
    
    try {
      const url = `https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoDolarDia(dataCotacao=@dataCotacao)?@dataCotacao='${dateStr}'&$top=1&$format=json`;
      const res = await fetch(url);
      if (!res.ok) continue;
      const data = await res.json();
      if (data.value && data.value.length > 0) {
        const rate = data.value[data.value.length - 1].cotacaoVenda;
        ptaxCache[dateStr] = rate;
        return rate;
      }
    } catch {
      continue;
    }
  }
  return null;
};

// Fetch PTAX for multiple dates in batch (deduplicates)
const fetchPtaxBatch = async (dates: Date[]): Promise<Record<string, number>> => {
  const uniqueDates = new Map<string, Date>();
  dates.forEach((d) => {
    const key = d.toISOString().split("T")[0];
    if (!uniqueDates.has(key)) uniqueDates.set(key, d);
  });

  const results: Record<string, number> = {};
  const promises = Array.from(uniqueDates.entries()).map(async ([key, date]) => {
    const rate = await fetchPtaxForDate(date);
    if (rate) results[key] = rate;
  });

  await Promise.all(promises);
  return results;
};

interface DividendoExterior {
  ativo: string;
  data: string;
  valorBrutoUsd: number;
  impostoRetidoUsd: number;
  valorLiquidoUsd: number;
  valorBrutoBrl: number;
  impostoRetidoBrl: number;
  ptax: number;
  quantidadeCotas: number;
}

const DeclaracaoIR = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { canGenerateIR, loading: loadingPlan } = usePlan();
  const [operacoes, setOperacoes] = useState<Operacao[]>([]);
  const [notas, setNotas] = useState<NotaCorretagem[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [anoCalendario, setAnoCalendario] = useState<string | null>(null);
  const [ptaxRates, setPtaxRates] = useState<Record<string, number>>({});
  const [loadingPtax, setLoadingPtax] = useState(false);
  const [dividendosExterior, setDividendosExterior] = useState<DividendoExterior[]>([]);
  const [loadingDividendos, setLoadingDividendos] = useState(false);
  const [dividendosNacionais, setDividendosNacionais] = useState<DividendoNacional[]>([]);
  const [loadingDividendosNacionais, setLoadingDividendosNacionais] = useState(false);
  const [editingDividendo, setEditingDividendo] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [addingDividendo, setAddingDividendo] = useState<"acao" | "fii" | null>(null);
  const [newDividendoAtivo, setNewDividendoAtivo] = useState("");
  const [newDividendoValor, setNewDividendoValor] = useState("");

  useEffect(() => {
    if (!loading && !user) navigate("/");
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      const [opsRes, notasRes, profileRes] = await Promise.all([
        supabase.from("operacoes").select("*, notas_corretagem(data_operacao, taxas)").eq("user_id", user!.id).order("created_at", { ascending: true }),
        supabase.from("notas_corretagem").select("id, data_operacao, corretora, taxas").eq("user_id", user!.id),
        supabase.from("profiles").select("nome, cpf").eq("id", user!.id).single(),
      ]);
      
      // Distribute fees proportionally into valor_total for buy operations
      const rawOps = opsRes.data || [];
      const comprasPorNota: Record<string, { total: number }> = {};
      rawOps.forEach((op: any) => {
        if (op.tipo === 'C' && op.nota_id) {
          if (!comprasPorNota[op.nota_id]) comprasPorNota[op.nota_id] = { total: 0 };
          comprasPorNota[op.nota_id].total += Number(op.valor_total);
        }
      });
      
      setOperacoes(
        rawOps.map((op: any) => {
          let taxaProporcional = 0;
          if (op.tipo === 'C' && op.nota_id && op.notas_corretagem?.taxas) {
            const info = comprasPorNota[op.nota_id];
            if (info && info.total > 0) {
              taxaProporcional = Number(op.notas_corretagem.taxas) * (Number(op.valor_total) / info.total);
            }
          }
          return {
            ...op,
            quantidade: Number(op.quantidade),
            preco_unitario: Number(op.preco_unitario),
            valor_total: Number(op.valor_total) + taxaProporcional,
          };
        })
      );
      setNotas(notasRes.data || []);
      if (profileRes.data) setProfile(profileRes.data);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoadingData(false);
    }
  };

  const notaDateMap = useMemo(() => {
    const map: Record<string, string> = {};
    notas.forEach((n) => {
      if (n.data_operacao) map[n.id] = n.data_operacao;
    });
    return map;
  }, [notas]);

  const notaCorretoraMap = useMemo(() => {
    const map: Record<string, string> = {};
    notas.forEach((n) => {
      map[n.id] = n.corretora;
    });
    return map;
  }, [notas]);

  // Filter operations by calendar year
  const operacoesAno = useMemo(() => {
    return operacoes.filter((op) => {
      const dataStr = op.nota_id ? notaDateMap[op.nota_id] : null;
      const date = dataStr ? new Date(dataStr + "T12:00:00") : new Date(op.created_at);
      return date.getFullYear().toString() === anoCalendario;
    });
  }, [operacoes, anoCalendario, notaDateMap]);

  // Helper: get operation date
  const getOpDate = (op: Operacao) => {
    const dataStr = op.nota_id ? notaDateMap[op.nota_id] : null;
    return dataStr ? new Date(dataStr + "T12:00:00") : new Date(op.created_at);
  };

  // Fetch PTAX rates for all international operation dates
  useEffect(() => {
    if (!anoCalendario || operacoes.length === 0) return;
    
    const intlOps = operacoes.filter((op) => !isBrazilianTicker(op.ativo));
    if (intlOps.length === 0) return;

    const dates = intlOps.map((op) => getOpDate(op));
    
    setLoadingPtax(true);
    fetchPtaxBatch(dates)
      .then((rates) => setPtaxRates((prev) => ({ ...prev, ...rates })))
      .finally(() => setLoadingPtax(false));
  }, [operacoes, anoCalendario, notaDateMap]);

  // Fetch dividends for international assets and calculate proportional amounts
  useEffect(() => {
    if (!anoCalendario || operacoes.length === 0) return;

    const intlTickers = [...new Set(operacoes.filter((op) => !isBrazilianTicker(op.ativo)).map((op) => op.ativo))];
    if (intlTickers.length === 0) {
      setDividendosExterior([]);
      return;
    }

    const ano = Number(anoCalendario);

    const fetchDividends = async () => {
      setLoadingDividendos(true);
      try {
        const allDividendos: DividendoExterior[] = [];

        for (const ticker of intlTickers) {
          try {
            const { data, error } = await supabase.functions.invoke('get-dividends', {
              body: { ticker }
            });
            if (error || !data?.dividends) continue;

            // Build position timeline for this ticker
            const tickerOps = operacoes
              .filter((op) => op.ativo === ticker)
              .map((op) => ({ ...op, date: getOpDate(op) }))
              .sort((a, b) => a.date.getTime() - b.date.getTime());

            // Filter dividends for the selected year
            const yearDividends = (data.dividends as { date: string; amount: number }[])
              .filter((d) => {
                const dYear = new Date(d.date + "T12:00:00").getFullYear();
                return dYear === ano;
              });

            for (const div of yearDividends) {
              const divDate = new Date(div.date + "T12:00:00");

              // Calculate shares held at dividend date
              let sharesHeld = 0;
              for (const op of tickerOps) {
                if (op.date > divDate) break;
                if (op.tipo === "C") sharesHeld += op.quantidade;
                else if (op.tipo === "V") sharesHeld -= op.quantidade;
              }

              if (sharesHeld <= 0) continue;

              // Yahoo Finance returns gross dividend amount per share
              // US withholds 30% at source (or 15% with W-8BEN treaty)
              const valorBrutoUsd = div.amount * sharesHeld;
              const taxaRetencaoEua = 0.30; // 30% default, 15% with W-8BEN
              const impostoRetidoUsd = valorBrutoUsd * taxaRetencaoEua;
              const valorLiquidoUsd = valorBrutoUsd - impostoRetidoUsd;

              // Get PTAX for dividend date
              const ptax = await fetchPtaxForDate(divDate);
              const ptaxRate = ptax || 1;
              const valorBrutoBrl = valorBrutoUsd * ptaxRate;
              const impostoRetidoBrl = impostoRetidoUsd * ptaxRate;

              allDividendos.push({
                ativo: ticker,
                data: div.date,
                valorBrutoUsd,
                impostoRetidoUsd,
                valorLiquidoUsd,
                valorBrutoBrl,
                impostoRetidoBrl,
                ptax: ptaxRate,
                quantidadeCotas: sharesHeld,
              });
            }
          } catch {
            continue;
          }
        }

        setDividendosExterior(allDividendos.sort((a, b) => a.data.localeCompare(b.data)));
      } finally {
        setLoadingDividendos(false);
      }
    };

    fetchDividends();
  }, [operacoes, anoCalendario, notaDateMap]);

  // Fetch dividends for national assets (ações BR + FIIs)
  useEffect(() => {
    if (!anoCalendario || operacoes.length === 0) return;

    const brTickers = [...new Set(operacoes.filter((op) => isBrazilianTicker(op.ativo)).map((op) => op.ativo))];
    if (brTickers.length === 0) {
      setDividendosNacionais([]);
      return;
    }

    const ano = Number(anoCalendario);

    const fetchNationalDividends = async () => {
      setLoadingDividendosNacionais(true);
      try {
        const results: DividendoNacional[] = [];

        for (const ticker of brTickers) {
          try {
            const { data, error } = await supabase.functions.invoke('get-dividends', {
              body: { ticker }
            });
            if (error || !data?.dividends) continue;

            // Build position timeline for this ticker
            const tickerOps = operacoes
              .filter((op) => op.ativo === ticker)
              .map((op) => ({ ...op, date: getOpDate(op) }))
              .sort((a, b) => a.date.getTime() - b.date.getTime());

            // Filter dividends for the selected year
            const yearDividends = (data.dividends as { date: string; amount: number }[])
              .filter((d) => {
                const dYear = new Date(d.date + "T12:00:00").getFullYear();
                return dYear === ano;
              });

            let totalDividendos = 0;

            for (const div of yearDividends) {
              const divDate = new Date(div.date + "T12:00:00");

              // Calculate shares held at dividend date
              let sharesHeld = 0;
              for (const op of tickerOps) {
                if (op.date > divDate) break;
                if (op.tipo === "C") sharesHeld += op.quantidade;
                else if (op.tipo === "V") sharesHeld -= op.quantidade;
              }

              if (sharesHeld <= 0) continue;
              totalDividendos += div.amount * sharesHeld;
            }

            if (totalDividendos > 0) {
              const isFII = /^\w{4}11$/.test(ticker);
              results.push({
                ativo: ticker,
                valorTotal: totalDividendos,
                valorEditado: null,
                isFII,
              });
            }
          } catch {
            continue;
          }
        }

        setDividendosNacionais(results.sort((a, b) => a.ativo.localeCompare(b.ativo)));
      } finally {
        setLoadingDividendosNacionais(false);
      }
    };

    fetchNationalDividends();
  }, [operacoes, anoCalendario, notaDateMap]);

  // Handlers for editing dividends
  const startEditDividendo = useCallback((ativo: string, currentValue: number) => {
    setEditingDividendo(ativo);
    setEditingValue(currentValue.toFixed(2).replace(".", ","));
  }, []);

  const saveEditDividendo = useCallback((ativo: string) => {
    const parsed = parseFloat(editingValue.replace(",", "."));
    if (!isNaN(parsed) && parsed >= 0) {
      setDividendosNacionais(prev => prev.map(d => 
        d.ativo === ativo ? { ...d, valorEditado: parsed } : d
      ));
    }
    setEditingDividendo(null);
    setEditingValue("");
  }, [editingValue]);

  const addManualDividendo = useCallback(() => {
    const ticker = newDividendoAtivo.trim().toUpperCase();
    const valor = parseFloat(newDividendoValor.replace(",", "."));
    if (!ticker || isNaN(valor) || valor <= 0) return;

    const isFII = addingDividendo === "fii";
    const existing = dividendosNacionais.find(d => d.ativo === ticker);
    if (existing) {
      setDividendosNacionais(prev => prev.map(d =>
        d.ativo === ticker ? { ...d, valorEditado: valor } : d
      ));
    } else {
      setDividendosNacionais(prev => [...prev, {
        ativo: ticker,
        valorTotal: 0,
        valorEditado: valor,
        isFII,
      }]);
    }
    setAddingDividendo(null);
    setNewDividendoAtivo("");
    setNewDividendoValor("");
  }, [addingDividendo, newDividendoAtivo, newDividendoValor, dividendosNacionais]);

  // Computed: dividendos de ações e FIIs
  const dividendosAcoes = useMemo(() => dividendosNacionais.filter(d => !d.isFII), [dividendosNacionais]);
  const dividendosFII = useMemo(() => dividendosNacionais.filter(d => d.isFII), [dividendosNacionais]);
  const totalDividendosAcoes = useMemo(() => dividendosAcoes.reduce((acc, d) => acc + (d.valorEditado ?? d.valorTotal), 0), [dividendosAcoes]);
  const totalDividendosFII = useMemo(() => dividendosFII.reduce((acc, d) => acc + (d.valorEditado ?? d.valorTotal), 0), [dividendosFII]);

  // Calculate accumulated positions up to a given year-end (31/12)
  // For international assets, converts each operation to BRL using PTAX of the operation date
  const calcularPosicoes = (ops: Operacao[], ateAno: number) => {
    const ativoMap: Record<string, { compras: number; custoTotalUsd: number; custoTotalBrl: number; vendas: number }> = {};
    ops.forEach((op) => {
      const date = getOpDate(op);
      if (date.getFullYear() > ateAno) return;
      if (!ativoMap[op.ativo]) ativoMap[op.ativo] = { compras: 0, custoTotalUsd: 0, custoTotalBrl: 0, vendas: 0 };
      
      const isIntl = !isBrazilianTicker(op.ativo);
      
      if (op.tipo === "C") {
        ativoMap[op.ativo].compras += op.quantidade;
        ativoMap[op.ativo].custoTotalUsd += op.valor_total;
        
        if (isIntl) {
          // Convert using PTAX of the operation date
          const dateKey = date.toISOString().split("T")[0];
          const ptax = ptaxRates[dateKey];
          ativoMap[op.ativo].custoTotalBrl += ptax ? op.valor_total * ptax : op.valor_total;
        } else {
          ativoMap[op.ativo].custoTotalBrl += op.valor_total;
        }
      } else if (op.tipo === "V") {
        ativoMap[op.ativo].vendas += op.quantidade;
      }
    });
    
    const result: Record<string, { quantidade: number; precoMedio: number; valorUsd: number; valorBrl: number }> = {};
    for (const [ativo, data] of Object.entries(ativoMap)) {
      const quantidade = data.compras - data.vendas;
      if (quantidade <= 0) continue;
      const proporcao = data.compras > 0 ? quantidade / data.compras : 0;
      const precoMedio = data.compras > 0 ? data.custoTotalUsd / data.compras : 0;
      result[ativo] = {
        quantidade,
        precoMedio,
        valorUsd: data.custoTotalUsd * proporcao,
        valorBrl: data.custoTotalBrl * proporcao,
      };
    }
    return result;
  };

  // Calculate positions (Bens e Direitos) - accumulated
  const bensEDireitos = useMemo(() => {
    if (!anoCalendario) return [];
    const ano = Number(anoCalendario);
    const posicoesAnoAtual = calcularPosicoes(operacoes, ano);
    const posicoesAnoAnterior = calcularPosicoes(operacoes, ano - 1);

    const allTickers = new Set([...Object.keys(posicoesAnoAtual), ...Object.keys(posicoesAnoAnterior)]);
    const result: BemDireito[] = [];

    for (const ativo of allTickers) {
      const posAtual = posicoesAnoAtual[ativo];
      const posAnterior = posicoesAnoAnterior[ativo];
      if (!posAtual && !posAnterior) continue;

      const quantidade = posAtual?.quantidade || 0;
      const precoMedio = posAtual?.precoMedio || posAnterior?.precoMedio || 0;
      
      const isFII = /^\w{4}11$/.test(ativo);
      const isInternacional = !isBrazilianTicker(ativo);
      const currency = getCurrency(ativo);

      // For international: situação uses BRL converted at each operation's PTAX
      const situacaoAnoAtual = isInternacional ? (posAtual?.valorBrl || 0) : (posAtual?.valorUsd || 0);
      const situacaoAnoAnterior = isInternacional ? (posAnterior?.valorBrl || 0) : (posAnterior?.valorUsd || 0);
      const valorUsdAtual = posAtual?.valorUsd || 0;
      const valorUsdAnterior = posAnterior?.valorUsd || 0;

      let grupo = "03";
      let codigo = "01";
      let localizacao = "105 - Brasil";

      if (isFII) { grupo = "07"; codigo = "03"; }
      if (isInternacional) {
        localizacao = "249 - Estados Unidos";
        // Stocks (ações individuais) = Grupo 03, Cod 01
        // ETFs, REITs, Fundos = Grupo 07, Cod 99 (Lei 14.754/2023)
        const isEtfOrFund = INTERNATIONAL_ETF_SET.has(ativo);
        if (isEtfOrFund) {
          grupo = "07";
          codigo = "99";
        } else {
          grupo = "03";
          codigo = "01";
        }
      }

      const cnpj = CNPJ_MAP[ativo] || "";
      const nomeEmpresa = NOME_EMPRESA_MAP[ativo] || ativo;

      // Find corretora for this asset (from its operations)
      let corretora = "";
      if (isInternacional) {
        const ativoOps = operacoes.filter(op => op.ativo === ativo && op.nota_id);
        if (ativoOps.length > 0) {
          corretora = notaCorretoraMap[ativoOps[0].nota_id!] || "";
        }
      }

      const quantidadeFormatada = isInternacional
        ? quantidade.toFixed(5).replace(".", ",")
        : String(Math.floor(quantidade));

      // For international assets: rendimentos na seção "Aplicação Financeira" conforme IRPF 2026
      // Apenas "Aplicação Financeira" - "Lucros e Dividendos" é somente para offshores/controladas
      let rendimentosTexto = "";
      if (isInternacional && dividendosExterior.length > 0) {
        const divsTicker = dividendosExterior.filter(d => d.ativo === ativo);
        if (divsTicker.length > 0) {
          const totalBrutoBrl = divsTicker.reduce((a, d) => a + d.valorBrutoBrl, 0);
          const totalImpostoBrl = divsTicker.reduce((a, d) => a + d.impostoRetidoBrl, 0);
          rendimentosTexto = `\nRendimentos de\nAplicacao Financeira => Lucro/Prejuizo: ${formatBRL(totalBrutoBrl)} / Imposto pago: ${formatBRL(totalImpostoBrl)}`;
        }
      }

      const isEtfOrFundIntl = isInternacional && INTERNATIONAL_ETF_SET.has(ativo);

      result.push({
        grupo,
        codigo,
        localizacao,
        cnpj,
        discriminacao: isInternacional
          ? isEtfOrFundIntl
            ? `${ativo} - ${quantidadeFormatada} Cotas do fundo ${nomeEmpresa} negociadas na Bolsa do pais Estados Unidos atraves do codigo: ${ativo}${corretora ? `, adquiridas pela corretora ${corretora}` : ""}. Valor de custo em dolar: ${formatUSD(valorUsdAtual)}.${rendimentosTexto}`
            : `${ativo} - ${quantidadeFormatada} Acoes da empresa ${nomeEmpresa} negociadas na Bolsa do pais Estados Unidos atraves do codigo: ${ativo}${corretora ? `, adquiridas pela corretora ${corretora}` : ""}. Valor de custo em dolar: ${formatUSD(valorUsdAtual)}.${rendimentosTexto}`
          : isFII
            ? `${ativo} - ${quantidadeFormatada} Cotas do fundo imobiliário ${nomeEmpresa}, codigo de negociacao na B3: ${ativo}. CNPJ: ${cnpj || "N/A"}. Custo medio unitario de ${formatBRL(precoMedio)}.`
            : `${ativo} - ${quantidadeFormatada} Acoes da empresa ${nomeEmpresa} (BRASIL), codigo de negociacao na B3: ${ativo}. CNPJ: ${cnpj || "N/A"}. Custo medio unitario de ${formatBRL(precoMedio)}.`,
        situacaoAnoAnterior,
        situacaoAnoAtual,
        valorUsdAtual: isInternacional ? valorUsdAtual : undefined,
        valorUsdAnterior: isInternacional ? valorUsdAnterior : undefined,
        ativo,
        quantidade,
        precoMedio,
        isFII,
        isInternacional,
        currency,
      });
    }

    return result.sort((a, b) => a.ativo.localeCompare(b.ativo));
  }, [operacoes, anoCalendario, notaDateMap, ptaxRates, dividendosExterior, notaCorretoraMap]);

  // Calculate monthly sales for exemption check and operations summary
  const operacoesMensais = useMemo(() => {
    const mesesMap: Record<string, { vendas: Operacao[]; compras: Operacao[] }> = {};

    operacoesAno.forEach((op) => {
      const dataStr = op.nota_id ? notaDateMap[op.nota_id] : null;
      const date = dataStr ? new Date(dataStr + "T12:00:00") : new Date(op.created_at);
      const mesAno = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      if (!mesesMap[mesAno]) mesesMap[mesAno] = { vendas: [], compras: [] };
      if (op.tipo === "V") mesesMap[mesAno].vendas.push(op);
      else mesesMap[mesAno].compras.push(op);
    });

    return mesesMap;
  }, [operacoesAno, notaDateMap]);

  // Vendas isentas (below 20k/month for BR stocks)
  const vendasIsentas = useMemo(() => {
    let total = 0;
    Object.values(operacoesMensais).forEach(({ vendas }) => {
      const vendasBR = vendas.filter((v) => isBrazilianTicker(v.ativo) && !/^\w{4}11$/.test(v.ativo));
      const totalMes = vendasBR.reduce((acc, v) => acc + v.valor_total, 0);
      if (totalMes <= 20000) {
        total += totalMes;
      }
    });
    return total;
  }, [operacoesMensais]);

  // Available years
  const anosDisponiveis = useMemo(() => {
    const anos = new Set<string>();
    operacoes.forEach((op) => {
      const dataStr = op.nota_id ? notaDateMap[op.nota_id] : null;
      const date = dataStr ? new Date(dataStr + "T12:00:00") : new Date(op.created_at);
      anos.add(date.getFullYear().toString());
    });
    if (anos.size === 0) anos.add("2024");
    return Array.from(anos).sort().reverse();
  }, [operacoes, notaDateMap]);

  // Totals
  const totalBens = bensEDireitos.reduce((acc, b) => acc + b.situacaoAnoAtual, 0);
  const totalBensAnterior = bensEDireitos.reduce((acc, b) => acc + b.situacaoAnoAnterior, 0);
  const totalOperacoesVenda = operacoesAno.filter((o) => o.tipo === "V").reduce((acc, o) => acc + o.valor_total, 0);
  const totalOperacoesCompra = operacoesAno.filter((o) => o.tipo === "C").reduce((acc, o) => acc + o.valor_total, 0);

  const formatMesLabel = (mesAno: string) => {
    const [year, month] = mesAno.split("-");
    const meses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    return `${meses[parseInt(month) - 1]}/${year}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  // Year selection screen
  if (!anoCalendario) {
    const currentYear = new Date().getFullYear();
    const yearsToShow = Array.from({ length: 6 }, (_, i) => (currentYear - 1 - i).toString());

    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <AppSidebar />
          <main className="flex-1 overflow-auto">
            <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/50">
              <div className="flex items-center gap-4 px-4 md:px-6 py-3 md:py-4">
                <SidebarTrigger className="text-muted-foreground hover:text-foreground">
                  <Menu className="w-5 h-5" />
                </SidebarTrigger>
                <div>
                  <h1 className="text-xl md:text-2xl font-bold text-foreground">Declaração de IR</h1>
                  <p className="text-xs md:text-sm text-muted-foreground">Relatório auxiliar para Declaração de IR</p>
                </div>
              </div>
            </header>

            <div className="flex-1 flex items-center justify-center p-4 md:p-6">
              <Card className="w-full max-w-lg border-border/50">
                <CardHeader className="text-center pb-2">
                  <div className="mx-auto p-4 rounded-2xl bg-primary/10 w-fit mb-4">
                    <FileSpreadsheet className="w-12 h-12 text-primary" />
                  </div>
                  <CardTitle className="text-2xl">Selecione o Ano Calendário</CardTitle>
                  <p className="text-sm text-muted-foreground mt-2">
                    Escolha o ano-base das operações. Exemplo: operações de 2025 serão declaradas no IRPF 2026.
                  </p>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {yearsToShow.map((ano) => (
                      <Button
                        key={ano}
                        variant="outline"
                        size="lg"
                        className="text-lg font-semibold h-20 hover:bg-primary/10 hover:border-primary hover:text-primary transition-all flex flex-col gap-0.5"
                        onClick={() => setAnoCalendario(ano)}
                      >
                        <span>{ano}</span>
                        <span className="text-xs font-normal text-muted-foreground">IRPF {Number(ano) + 1}</span>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

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
                  <h1 className="text-xl md:text-2xl font-bold text-foreground">Declaração de IR</h1>
                  <p className="text-xs md:text-sm text-muted-foreground">Relatório auxiliar para Declaração de IR</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" onClick={() => setAnoCalendario(null)}>
                  Trocar Ano
                </Button>
              </div>
            </div>
          </header>

          <div className="p-4 md:p-6 space-y-4 md:space-y-6">
            {loadingData || loadingPlan ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : !canGenerateIR ? (
              <UpgradePrompt feature="Relatórios para IR" minPlan="Platinum" />
            ) : (
              <>
                {/* Header Card - User Info */}
                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-primary/10">
                        <FileSpreadsheet className="w-8 h-8 text-primary" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-foreground">
                          Ano calendário: {anoCalendario} <span className="text-base font-normal text-muted-foreground">(IRPF {Number(anoCalendario) + 1})</span>
                        </h2>
                        <p className="text-lg text-foreground font-medium mt-1">
                          {profile?.nome || user.email}
                        </p>
                        {profile?.cpf && (
                          <p className="text-sm text-muted-foreground">CPF: {profile.cpf}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="bg-card border-border/50">
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Building2 className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Bens e Direitos</p>
                        <p className="font-semibold text-foreground">{bensEDireitos.length} ativos</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-card border-border/50">
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <DollarSign className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Total Patrimônio</p>
                        <p className="font-semibold text-foreground">{formatBRL(totalBens)}</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-card border-border/50">
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Receipt className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Vendas Isentas</p>
                        <p className="font-semibold text-foreground">{formatBRL(vendasIsentas)}</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-card border-border/50">
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Landmark className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Dividendos (Ações + FIIs)</p>
                        <p className="font-semibold text-foreground">{formatBRL(totalDividendosAcoes + totalDividendosFII)}</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {loadingPtax && (
                  <Card className="bg-muted/20 border-border/30">
                    <CardContent className="p-4 flex items-center gap-3 justify-center">
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      <span className="text-sm text-muted-foreground">Buscando cotação PTAX do Banco Central...</span>
                    </CardContent>
                  </Card>
                )}

                {loadingDividendos && (
                  <Card className="bg-muted/20 border-border/30">
                    <CardContent className="p-4 flex items-center gap-3 justify-center">
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      <span className="text-sm text-muted-foreground">Buscando dividendos...</span>
                    </CardContent>
                  </Card>
                )}

                {/* Download CTA */}
                <Card className="bg-card border-border/50">
                  <CardContent className="p-8 flex flex-col items-center text-center gap-4">
                    <div className="p-4 rounded-2xl bg-primary/10">
                      <Download className="w-10 h-10 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">Relatório pronto para download</h3>
                      <p className="text-sm text-muted-foreground mt-1 max-w-md">
                        O PDF contém todas as informações necessárias para preencher sua declaração: Bens e Direitos, Rendimentos Isentos, JCP, Operações e mais.
                      </p>
                    </div>
                    <Button
                      size="lg"
                      className="mt-2"
                      onClick={() => {
                        gerarRelatorioPdf({
                          anoCalendario: anoCalendario!,
                          nomeContribuinte: profile?.nome || user.email || "",
                          cpf: profile?.cpf || null,
                          bensEDireitos,
                          totalBens,
                          totalBensAnterior,
                          vendasIsentas,
                          operacoesMensais,
                          ptaxCount: Object.keys(ptaxRates).length,
                          dividendosAcoes: dividendosAcoes.map(d => ({ ativo: d.ativo, valor: d.valorEditado ?? d.valorTotal, cnpj: CNPJ_MAP[d.ativo] || "", nomeFonte: NOME_EMPRESA_MAP[d.ativo] || d.ativo })),
                          dividendosFII: dividendosFII.map(d => ({ ativo: d.ativo, valor: d.valorEditado ?? d.valorTotal, cnpj: CNPJ_MAP[d.ativo] || "", nomeFonte: NOME_EMPRESA_MAP[d.ativo] || d.ativo })),
                          totalDividendosAcoes,
                          totalDividendosFII,
                          dividendosExterior: dividendosExterior.map(d => ({
                            ativo: d.ativo,
                            data: d.data,
                            valorBrutoUsd: d.valorBrutoUsd,
                            impostoRetidoUsd: d.impostoRetidoUsd,
                            valorBrutoBrl: d.valorBrutoBrl,
                            impostoRetidoBrl: d.impostoRetidoBrl,
                            ptax: d.ptax,
                            quantidadeCotas: d.quantidadeCotas,
                          })),
                        });
                      }}
                      disabled={loadingData || loadingPtax || loadingDividendos || loadingDividendosNacionais}
                    >
                      <Download className="w-5 h-5 mr-2" />
                      Gerar Relatório em PDF
                    </Button>
                  </CardContent>
                </Card>

                {/* Info Alert */}
                <Card className="bg-accent/10 border-accent/30">
                  <CardContent className="p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-accent-foreground shrink-0 mt-0.5" />
                    <div className="text-sm text-foreground">
                      <p className="font-semibold mb-1">Importante</p>
                      <p className="text-muted-foreground">
                        Este relatório é auxiliar para preenchimento da declaração do IRPF. Confira os dados com os informes de rendimentos das corretoras. A responsabilidade pela declaração é do contribuinte.
                      </p>
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

export default DeclaracaoIR;
