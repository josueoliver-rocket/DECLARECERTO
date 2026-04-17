import { useState, useEffect, useRef, useMemo } from "react";
import { usePlan } from "@/hooks/usePlan";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  FileText,
  Plus,
  Menu,
  Loader2,
  Calendar,
  Trash2,
  TrendingUp,
  TrendingDown,
  Upload,
  Search,
  DollarSign,
  ChevronRight,
  Check,
  X,
  Send,
  Edit2,
  Receipt,
} from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const corretoras = [
  // Corretoras nacionais
  { id: "xp", name: "XP Investimentos", logo: "XP", mercados: ["brasil"] },
  { id: "clear", name: "Clear Corretora", logo: "CL", mercados: ["brasil"] },
  { id: "rico", name: "Rico Investimentos", logo: "RI", mercados: ["brasil"] },
  { id: "nuinvest", name: "NuInvest", logo: "NU", mercados: ["brasil"] },
  { id: "btg", name: "BTG Pactual", logo: "BTG", mercados: ["brasil", "internacional"] },
  { id: "inter", name: "Inter Invest", logo: "IN", mercados: ["brasil", "internacional"] },
  { id: "modal", name: "Modal Mais", logo: "MM", mercados: ["brasil"] },
  { id: "genial", name: "Genial Investimentos", logo: "GE", mercados: ["brasil"] },
  { id: "c6", name: "C6 Bank", logo: "C6", mercados: ["brasil", "internacional"] },
  { id: "itau", name: "Itaú Corretora", logo: "IT", mercados: ["brasil"] },
  { id: "ion", name: "Íon (Itaú)", logo: "ÍO", mercados: ["brasil"] },
  { id: "bradesco", name: "Bradesco Corretora", logo: "BR", mercados: ["brasil"] },
  { id: "santander", name: "Santander Corretora", logo: "SA", mercados: ["brasil"] },
  { id: "bb", name: "BB Investimentos", logo: "BB", mercados: ["brasil"] },
  { id: "orama", name: "Órama", logo: "OR", mercados: ["brasil"] },
  { id: "toro", name: "Toro Investimentos", logo: "TO", mercados: ["brasil"] },
  { id: "warren", name: "Warren", logo: "WA", mercados: ["brasil"] },
  { id: "easynvest", name: "Easynvest", logo: "EA", mercados: ["brasil"] },
  { id: "mirae", name: "Mirae Asset", logo: "MI", mercados: ["brasil"] },
  { id: "ativa", name: "Ativa Investimentos", logo: "AT", mercados: ["brasil"] },
  { id: "guide", name: "Guide Investimentos", logo: "GU", mercados: ["brasil"] },
  { id: "terra", name: "Terra Investimentos", logo: "TE", mercados: ["brasil"] },
  { id: "agora", name: "Ágora Investimentos", logo: "AG", mercados: ["brasil"] },
  { id: "necton", name: "Necton", logo: "NE", mercados: ["brasil"] },
  // Corretoras com foco em investimentos internacionais
  { id: "avenue", name: "Avenue", logo: "AV", mercados: ["internacional"] },
  { id: "nomad", name: "Nomad", logo: "NO", mercados: ["internacional"] },
  { id: "passfolio", name: "Passfolio", logo: "PF", mercados: ["internacional"] },
  { id: "stake", name: "Stake", logo: "SK", mercados: ["internacional"] },
  { id: "sproutfi", name: "Sproutfi", logo: "SF", mercados: ["internacional"] },
  { id: "charles_schwab", name: "Charles Schwab", logo: "CS", mercados: ["internacional"] },
  { id: "interactive_brokers", name: "Interactive Brokers", logo: "IB", mercados: ["internacional"] },
  { id: "td_ameritrade", name: "TD Ameritrade", logo: "TD", mercados: ["internacional"] },
  { id: "tastytrade", name: "Tastytrade", logo: "TT", mercados: ["internacional"] },
  { id: "outra", name: "Outra", logo: "??", mercados: ["brasil", "internacional"] },
];

const tiposAtivo = [
  { id: "acoes_br", label: "Ações Brasil", mercado: "brasil" },
  { id: "fiis", label: "FIIs", mercado: "brasil" },
  { id: "bdrs", label: "BDRs", mercado: "brasil" },
  { id: "etfs_br", label: "ETFs Brasil", mercado: "brasil" },
  { id: "acoes_us", label: "Ações EUA", mercado: "exterior" },
  { id: "etfs_us", label: "ETFs EUA", mercado: "exterior" },
  { id: "reits", label: "REITs", mercado: "exterior" },
  { id: "cripto", label: "Criptomoedas", mercado: "cripto" },
];

const tickerSuggestions: Record<string, string[]> = {
  acoes_br: ["PETR4","VALE3","ITUB4","BBDC4","BBAS3","WEGE3","ABEV3","RENT3","SUZB3","GGBR4","CSNA3","CMIN3","BPAC11","EQTL3","ELET3","RADL3","LREN3","HAPV3","PRIO3","RAIL3","JBSS3","BEEF3","BRFS3","CPLE6","CMIG4","TAEE11","VIVT3","TIMS3","TOTS3","SBSP3","UGPA3","EMBR3","GOAU4","USIM5","MRFG3","CSAN3","RAIZ4","KLBN11","FLRY3","HYPE3","RDOR3","ENEV3","ITSA4","B3SA3","SANB11","BBSE3","EGIE3","CPFE3","SIMH3","MGLU3","BHIA3","COGN3","CVCB3","IRBR3","LWSA3","PETZ3","YDUQ3","CRFB3","ALOS3","BRAV3","MOTV3"],
  fiis: ["HGLG11","KNRI11","MXRF11","XPLG11","XPML11","VISC11","HGBS11","BTLG11","VILG11","PVBI11","RBRP11","BCFF11","CPTS11","KNCR11","RECR11","HGRE11","JSRE11","IRDM11","VGIR11","TGAR11","GGRC11","FIIB11","RBRF11","HSML11","MALL11","TVRI11","VINO11","TRXF11","RBRR11","ALZR11","MCCI11","BRCO11","PMLL11","KNSC11","KNIP11","HFOF11","KFOF11","LVBI11","RZTR11","BTAL11","GARE11","HGRU11","XPCI11","RZAK11","HGCR11","VRTA11","NCHB11","PLCR11","RBRY11","MAUA11","SNCI11","URPR11","MCRE11"],
  bdrs: ["AAPL34","MSFT34","AMZO34","GOGL34","TSLA34","META34","NVDC34","NFLX34","DISB34","COCA34","JPMC34","BABA34","VISA34","MELI34","NIKE34"],
  etfs_br: ["BOVA11","IVVB11","SMAL11","HASH11","XFIX11","DIVO11","GOLD11","NASD11","SPXI11","BOVV11"],
  acoes_us: ["AAPL","MSFT","GOOGL","AMZN","TSLA","META","NVDA","NFLX","DIS","KO","JPM","V","MA","BABA","NKE","PFE","JNJ","UNH","HD","PG","AMD","INTC","PYPL","SQ","SHOP","UBER","ABNB","RIVN","PLTR","SOFI"],
  etfs_us: ["SPY","QQQ","IVV","IWM","VTI","VOO","VEA","VWO","GLD","SLV","TLT","ARKK","XLF","XLE","XLK","SCHD","DIA","EEM","EFA","AGG","BND","IEMG","IJR","IJH","VNQ","VTIP","VIG","VYM","VGT","XLV","XLI"],
  reits: ["O","AMT","PLD","CCI","EQIX","DLR","SPG","VICI","PSA","WELL"],
  cripto: ["BTC","ETH","BNB","SOL","ADA","XRP","DOT","AVAX","MATIC","LINK","UNI","AAVE","DOGE","SHIB","LTC"],
};

interface PreviewOperacao {
  ativo: string;
  tipo: string;
  quantidade: number;
  preco_unitario: number;
  valor_total: number;
}

interface PreviewData {
  data_operacao?: string;
  operacoes: PreviewOperacao[];
  taxas: number;
  taxas_detalhadas?: Record<string, number>;
  valor_total_compras?: number;
  valor_total_vendas?: number;
}

const isBrazilianTicker = (ticker: string): boolean => /^[A-Z]{4}\d{1,2}$/.test(ticker.toUpperCase().trim());
const getCurrencyForTicker = (ticker: string): "BRL" | "USD" => isBrazilianTicker(ticker) ? "BRL" : "USD";

interface NotaPreview {
  previewData: PreviewData;
  pdfBase64: string;
  fileName: string;
}

const formatCurrency = (value: number, currency: "BRL" | "USD" = "BRL") =>
  currency === "USD"
    ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value)
    : new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const NotasCorretagem = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const { maxNotasPerMonth, loading: loadingPlan } = usePlan();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "nota");

  // Import steps: 1=select broker, 2=upload, 3=preview
  const [importStep, setImportStep] = useState(1);
  const [selectedCorretora, setSelectedCorretora] = useState("");
  const [dataOperacao, setDataOperacao] = useState("");
  const [processingPdf, setProcessingPdf] = useState(false);
  const [processingCount, setProcessingCount] = useState({ current: 0, total: 0 });
  const [brokerSearch, setBrokerSearch] = useState("");

  // Preview state - now supports multiple notes
  const [notaPreviews, setNotaPreviews] = useState<NotaPreview[]>([]);
  const [savingNota, setSavingNota] = useState(false);
  const [expandedNota, setExpandedNota] = useState<number | null>(null);

  // Individual entry states
  const [indTipoAtivo, setIndTipoAtivo] = useState("");
  const [indTipoAtivoOpen, setIndTipoAtivoOpen] = useState(false);
  const [indTipoAtivoSearch, setIndTipoAtivoSearch] = useState("");
  const [indTicker, setIndTicker] = useState("");
  const [indTickerOpen, setIndTickerOpen] = useState(false);
  const [indTipoOp, setIndTipoOp] = useState("C");
  const [indData, setIndData] = useState("");
  const [indQuantidade, setIndQuantidade] = useState("");
  const [indPreco, setIndPreco] = useState("");
  const [indCusto, setIndCusto] = useState("");
  const [indLoadingPrice, setIndLoadingPrice] = useState(false);
  const [indSaving, setIndSaving] = useState(false);
  const [indCorretora, setIndCorretora] = useState("");

  const filteredTiposAtivo = useMemo(() => {
    if (!indTipoAtivoSearch) return tiposAtivo;
    return tiposAtivo.filter((t) => t.label.toLowerCase().includes(indTipoAtivoSearch.toLowerCase()));
  }, [indTipoAtivoSearch]);

  const mercadoAtual = useMemo(() => {
    const tipo = tiposAtivo.find((t) => t.id === indTipoAtivo);
    return tipo?.mercado || "brasil";
  }, [indTipoAtivo]);

  const moeda = mercadoAtual === "exterior" || mercadoAtual === "cripto" ? "US$" : "R$";

  const isImportInternacional = useMemo(() => {
    const broker = corretoras.find((c) => c.id === selectedCorretora);
    return broker?.mercados.includes("internacional") || false;
  }, [selectedCorretora]);

  // Editing state for preview operations
  const [editingOp, setEditingOp] = useState<{ notaIdx: number; opIdx: number } | null>(null);
  const [editOpValues, setEditOpValues] = useState({ ativo: "", quantidade: "", preco_unitario: "" });

  const startEditOp = (notaIdx: number, opIdx: number) => {
    const op = notaPreviews[notaIdx].previewData.operacoes[opIdx];
    setEditingOp({ notaIdx, opIdx });
    setEditOpValues({
      ativo: op.ativo,
      quantidade: String(op.quantidade),
      preco_unitario: String(op.preco_unitario),
    });
  };

  const saveEditOp = () => {
    if (!editingOp) return;
    const { notaIdx, opIdx } = editingOp;
    const qtd = parseFloat(editOpValues.quantidade.replace(",", ".")) || 0;
    const preco = parseFloat(editOpValues.preco_unitario.replace(",", ".")) || 0;
    if (qtd <= 0 || preco <= 0) {
      toast({ title: "Quantidade e preço devem ser maiores que zero", variant: "destructive" });
      return;
    }
    setNotaPreviews(prev => prev.map((nota, ni) => {
      if (ni !== notaIdx) return nota;
      const updatedOps = nota.previewData.operacoes.map((op, oi) => {
        if (oi !== opIdx) return op;
        return { ...op, ativo: editOpValues.ativo.toUpperCase().trim(), quantidade: qtd, preco_unitario: preco, valor_total: qtd * preco };
      });
      const compras = updatedOps.filter(o => o.tipo === "C").reduce((a, o) => a + o.valor_total, 0);
      const vendas = updatedOps.filter(o => o.tipo === "V").reduce((a, o) => a + o.valor_total, 0);
      return { ...nota, previewData: { ...nota.previewData, operacoes: updatedOps, valor_total_compras: compras, valor_total_vendas: vendas } };
    }));
    setEditingOp(null);
  };

  const cancelEditOp = () => setEditingOp(null);

  const filteredTickers = useMemo(() => {
    const suggestions = tickerSuggestions[indTipoAtivo] || [];
    if (!indTicker) return suggestions;
    const filtered = suggestions.filter((t) => t.toLowerCase().includes(indTicker.toLowerCase()));
    // Allow custom ticker entry: if user typed something not in suggestions, show it as option
    const upperTicker = indTicker.toUpperCase().trim();
    if (upperTicker.length >= 3 && !filtered.includes(upperTicker) && !suggestions.includes(upperTicker)) {
      filtered.unshift(upperTicker);
    }
    return filtered;
  }, [indTipoAtivo, indTicker]);

  const normalizeText = (text: string) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  
  const filteredCorretoras = useMemo(() => {
    if (!brokerSearch) return corretoras;
    const normalizedSearch = normalizeText(brokerSearch);
    return corretoras.filter((c) => normalizeText(c.name).includes(normalizedSearch));
  }, [brokerSearch]);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab && (tab === "nota" || tab === "individual")) setActiveTab(tab);
  }, [searchParams]);

  useEffect(() => {
    if (!loading && !user) navigate("/");
  }, [user, loading, navigate]);

  // Debounced fetch to avoid firing on intermediate date input values
  const fetchPriceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!indData || !indTicker || !indTipoAtivo) return;
    // Validate date is reasonable (year >= 1990)
    const year = parseInt(indData.split("-")[0], 10);
    if (isNaN(year) || year < 1990 || year > 2100) return;

    if (fetchPriceTimerRef.current) clearTimeout(fetchPriceTimerRef.current);
    fetchPriceTimerRef.current = setTimeout(() => {
      fetchPriceForDate();
    }, 800);

    return () => {
      if (fetchPriceTimerRef.current) clearTimeout(fetchPriceTimerRef.current);
    };
  }, [indData, indTicker, indTipoAtivo]);

  const fetchPriceForDate = async () => {
    if (!indTicker || !indData) return;
    // Cancel any previous in-flight request
    if (abortControllerRef.current) abortControllerRef.current.abort();
    
    setIndLoadingPrice(true);
    try {
      const ticker = indTicker.toUpperCase().trim();
      const { data: { session } } = await supabase.auth.getSession();
      
      const controller = new AbortController();
      abortControllerRef.current = controller;
      const timeoutId = setTimeout(() => controller.abort(), 12000);
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-stock-quotes`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ tickers: [ticker], date: indData }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      
      const result = await response.json();
      if (result?.quotes?.[ticker]?.price) {
        setIndPreco(result.quotes[ticker].price.toFixed(2).replace(".", ","));
        toast({ title: "💡 Cotação preenchida", description: `${ticker}: R$ ${result.quotes[ticker].price.toFixed(2)}` });
      } else {
        toast({ title: "Cotação não encontrada", description: `Não foi possível obter o preço de ${ticker} para esta data. Preencha manualmente.`, variant: "destructive" });
      }
    } catch (error: any) {
      if (error?.name === "AbortError") {
        // Only show timeout toast if it wasn't cancelled by a newer request
        if (!abortControllerRef.current || abortControllerRef.current.signal.aborted) return;
        toast({ title: "Tempo esgotado", description: "A busca de cotação demorou demais. Preencha o preço manualmente.", variant: "destructive" });
      } else {
        console.error("Erro ao buscar cotação:", error);
      }
    } finally {
      setIndLoadingPrice(false);
    }
  };

  // Step 2: Process multiple PDFs for PREVIEW
  const processFilesForPreview = async (files: File[]) => {
    if (!selectedCorretora) {
      toast({ title: "Selecione uma corretora", variant: "destructive" });
      return;
    }

    const validFiles = files.filter(f => f.type.includes("pdf") || f.type.startsWith("image/"));
    if (validFiles.length === 0) {
      toast({ title: "Arquivo inválido", description: "Envie apenas PDFs ou imagens", variant: "destructive" });
      return;
    }

    // Check monthly upload limit for Basic plan
    if (maxNotasPerMonth !== null && user) {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const { count } = await supabase
        .from("notas_corretagem")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("created_at", startOfMonth);
      if ((count ?? 0) + validFiles.length > (maxNotasPerMonth ?? 0)) {
        toast({
          title: "Limite de notas atingido",
          description: `Seu plano permite até ${maxNotasPerMonth} notas por mês. Você está tentando importar ${validFiles.length} nota(s).`,
          variant: "destructive",
        });
        return;
      }
    }

    setProcessingPdf(true);
    setProcessingCount({ current: 0, total: validFiles.length });
    const corretora = corretoras.find((c) => c.id === selectedCorretora);
    const newPreviews: NotaPreview[] = [];

    for (let i = 0; i < validFiles.length; i++) {
      setProcessingCount({ current: i + 1, total: validFiles.length });
      const file = validFiles[i];

      try {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const { data: { session } } = await supabase.auth.getSession();
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-nota-pdf`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token}` },
          body: JSON.stringify({ pdfBase64: base64, corretora: corretora?.name, previewOnly: true }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Erro ao processar PDF");

        if (result.data) {
          newPreviews.push({
            previewData: result.data,
            pdfBase64: base64,
            fileName: file.name,
          });
        }
      } catch (err) {
        console.error(`Erro ao processar ${file.name}:`, err);
        toast({ title: `Erro ao processar ${file.name}`, description: err instanceof Error ? err.message : "Tente novamente", variant: "destructive" });
      }
    }

    if (newPreviews.length > 0) {
      setNotaPreviews(prev => [...prev, ...newPreviews]);
      setExpandedNota(notaPreviews.length); // expand first new one
      setImportStep(3);
    }
    setProcessingPdf(false);
  };

  // Step 3: Confirm and save ALL notes
  const handleConfirmNotas = async () => {
    if (notaPreviews.length === 0) return;

    setSavingNota(true);
    const corretora = corretoras.find((c) => c.id === selectedCorretora);
    let savedCount = 0;

    try {
      for (const nota of notaPreviews) {
        const { previewData, pdfBase64, fileName } = nota;

        // Create nota
        const { data: notaData, error: notaError } = await supabase
          .from("notas_corretagem")
          .insert({
            user_id: user?.id,
            corretora: corretora?.name || "",
            data_operacao: previewData.data_operacao || dataOperacao || null,
            valor_total: 0,
            valor_compras: previewData.valor_total_compras || 0,
            valor_vendas: previewData.valor_total_vendas || 0,
            taxas: previewData.taxas || 0,
            taxas_detalhadas: previewData.taxas_detalhadas || null,
          })
          .select()
          .single();

        if (notaError) throw notaError;

        // Upload PDF to storage
        if (pdfBase64 && fileName) {
          const base64Content = pdfBase64.includes(',') ? pdfBase64.split(',')[1] : pdfBase64;
          const byteCharacters = atob(base64Content);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: 'application/pdf' });
          
          const filePath = `${user?.id}/${fileName}`;
          await supabase.storage.from('notas-pdf').upload(filePath, blob, { upsert: true });
          await supabase.from('notas_corretagem').update({ arquivo_nome: fileName }).eq('id', notaData.id);
        }

        // Call edge function to save operations
        const { data: { session } } = await supabase.auth.getSession();
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-nota-pdf`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token}` },
          body: JSON.stringify({ pdfBase64: pdfBase64, corretora: corretora?.name, notaId: notaData.id }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Erro ao salvar nota");

        savedCount++;
      }

      const totalOps = notaPreviews.reduce((acc, n) => acc + n.previewData.operacoes.length, 0);
      toast({ title: "✅ Notas importadas com sucesso!", description: `${savedCount} nota(s) com ${totalOps} operação(ões) registradas` });
      resetImport();
      navigate("/notas-importadas");
    } catch (error) {
      console.error("Erro ao salvar notas:", error);
      toast({ title: "Erro ao salvar notas", description: `${savedCount} salva(s). ${error instanceof Error ? error.message : "Tente novamente"}`, variant: "destructive" });
    } finally {
      setSavingNota(false);
    }
  };

  const resetImport = () => {
    setImportStep(1);
    setSelectedCorretora("");
    setDataOperacao("");
    setBrokerSearch("");
    setNotaPreviews([]);
    setExpandedNota(null);
  };

  const removeNotaPreview = (index: number) => {
    const updated = notaPreviews.filter((_, i) => i !== index);
    setNotaPreviews(updated);
    if (updated.length === 0) setImportStep(2);
  };

  const handlePdfUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    await processFilesForPreview(Array.from(files));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) await processFilesForPreview(files);
  };

  const handleIndividualSubmit = async () => {
    if (!indTipoAtivo) { toast({ title: "Selecione o tipo de ativo", variant: "destructive" }); return; }
    if (!indTicker.trim()) { toast({ title: "Informe o ticker", variant: "destructive" }); return; }
    if (!indData) { toast({ title: "Informe a data", variant: "destructive" }); return; }

    const qtd = parseFloat(indQuantidade.replace(",", ".")) || 0;
    const preco = parseFloat(indPreco.replace(",", ".")) || 0;
    const custo = parseFloat(indCusto.replace(",", ".")) || 0;
    const valorTotal = qtd * preco + custo;

    if (qtd <= 0 || preco <= 0) { toast({ title: "Quantidade e preço devem ser maiores que zero", variant: "destructive" }); return; }

    // Check monthly upload limit for Basic plan
    if (maxNotasPerMonth !== null && user) {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const { count } = await supabase
        .from("notas_corretagem")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("created_at", startOfMonth);
      if ((count ?? 0) >= maxNotasPerMonth) {
        toast({
          title: "Limite de notas atingido",
          description: `Seu plano permite até ${maxNotasPerMonth} notas por mês. Faça upgrade para enviar mais.`,
          variant: "destructive",
        });
        setIndSaving(false);
        return;
      }
    }

    setIndSaving(true);
    try {
      const corretoraName = indCorretora ? (corretoras.find((c) => c.id === indCorretora)?.name || "Outra") : "Lançamento Individual";
      const { data: notaData, error: notaError } = await supabase
        .from("notas_corretagem")
        .insert({ user_id: user?.id, corretora: corretoraName, data_operacao: indData, valor_total: valorTotal, valor_compras: indTipoOp === "C" ? valorTotal : 0, valor_vendas: indTipoOp === "V" ? valorTotal : 0, taxas: custo })
        .select().single();
      if (notaError) throw notaError;

      const { error: opError } = await supabase.from("operacoes").insert({ user_id: user?.id, nota_id: notaData.id, ativo: indTicker.toUpperCase().trim(), tipo: indTipoOp, quantidade: qtd, preco_unitario: preco, valor_total: qtd * preco });
      if (opError) throw opError;

      setIndTicker(""); setIndData(""); setIndQuantidade(""); setIndPreco(""); setIndCusto("");
      toast({ title: "✅ Lançamento registrado!", description: `${indTipoOp === "C" ? "Compra" : "Venda"} de ${indTicker.toUpperCase()}` });
    } catch (error) {
      console.error("Erro ao salvar:", error);
      toast({ title: "Erro ao salvar", variant: "destructive" });
    } finally {
      setIndSaving(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (!user) return null;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <main className="flex-1 overflow-auto">
          {/* Header */}
          <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/50">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 md:px-6 py-3 md:py-4">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="text-muted-foreground hover:text-foreground"><Menu className="w-5 h-5" /></SidebarTrigger>
                <div>
                  <h1 className="text-xl md:text-2xl font-bold text-foreground">Notas de Corretagem</h1>
                  <p className="text-xs md:text-sm text-muted-foreground">Importe PDFs ou lance operações</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate("/notas-importadas")} className="gap-2 w-full sm:w-auto">
                <FileText className="w-4 h-4" /> Ver Notas Importadas <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </header>

          <div className="p-4 md:p-6 space-y-4 md:space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="bg-muted/50 p-1 h-auto gap-1 w-full sm:w-auto">
                <TabsTrigger value="nota" className="flex items-center gap-2 px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg transition-all flex-1 sm:flex-none">
                  <Upload className="w-4 h-4" /> Importar PDF
                </TabsTrigger>
                <TabsTrigger value="individual" className="flex items-center gap-2 px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg transition-all flex-1 sm:flex-none">
                  <DollarSign className="w-4 h-4" /> Lançamento Individual
                </TabsTrigger>
              </TabsList>

              {/* ===== TAB: IMPORTAR PDF ===== */}
              <TabsContent value="nota" className="mt-6 space-y-6">
                {/* Steps indicator */}
                <div className="flex items-center gap-3 flex-wrap">
                  {[
                    { step: 1, label: "Selecionar Corretora" },
                    { step: 2, label: "Enviar Arquivo" },
                    { step: 3, label: "Revisar e Confirmar" },
                  ].map(({ step, label }, i) => (
                    <div key={step} className="flex items-center gap-3">
                      {i > 0 && <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                      <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        importStep > step ? "bg-primary/15 text-primary border border-primary/30" :
                        importStep === step ? "bg-primary/15 text-primary border border-primary/30" :
                        "bg-muted text-muted-foreground"
                      }`}>
                        {importStep > step ? <Check className="w-4 h-4" /> :
                          <span className={`w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold ${
                            importStep >= step ? "bg-primary text-primary-foreground" : "bg-muted-foreground/30 text-muted-foreground"
                          }`}>{step}</span>
                        }
                        {label}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Step 1: Select Broker */}
                {importStep === 1 && (
                  <Card className="border-border/50 overflow-hidden">
                    <CardContent className="p-6">
                      <div className="mb-5">
                        <h3 className="text-lg font-semibold text-foreground mb-1">Qual a sua corretora?</h3>
                        <p className="text-sm text-muted-foreground">Selecione a corretora da nota de corretagem</p>
                      </div>
                      <div className="relative mb-5">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input placeholder="Buscar corretora..." value={brokerSearch} onChange={(e) => setBrokerSearch(e.target.value)} className="pl-10 bg-muted/50 border-border/50 h-11" />
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-[400px] overflow-y-auto pr-1">
                        {filteredCorretoras.map((corretora) => (
                          <button
                            key={corretora.id}
                            onClick={() => { setSelectedCorretora(corretora.id); setImportStep(2); setBrokerSearch(""); }}
                            className={`group relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all hover:scale-[1.02] ${
                              selectedCorretora === corretora.id
                                ? "border-primary bg-primary/10 shadow-[0_0_20px_hsl(var(--primary)/0.15)]"
                                : "border-border/50 bg-card hover:border-primary/40 hover:bg-accent/30"
                            }`}
                          >
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold transition-all ${
                              selectedCorretora === corretora.id ? "bg-primary text-primary-foreground" : "bg-muted text-foreground group-hover:bg-primary/20 group-hover:text-primary"
                            }`}>{corretora.logo}</div>
                            <span className="text-xs font-medium text-foreground text-center leading-tight">{corretora.name}</span>
                            {corretora.mercados.length === 2 ? (
                              <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">🇧🇷 + 🇺🇸</span>
                            ) : corretora.mercados.includes("internacional") ? (
                              <span className="text-[10px] font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">🇺🇸 Internacional</span>
                            ) : null}
                            {selectedCorretora === corretora.id && <div className="absolute top-2 right-2"><Check className="w-4 h-4 text-primary" /></div>}
                          </button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Step 2: Upload File */}
                {importStep === 2 && (
                  <div className="space-y-4">
                    <Card className="border-primary/30 bg-primary/5">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                            {corretoras.find((c) => c.id === selectedCorretora)?.logo}
                          </div>
                          <div>
                            <p className="font-semibold text-foreground text-sm flex items-center gap-2">
                              {corretoras.find((c) => c.id === selectedCorretora)?.name}
                              {isImportInternacional && <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 text-primary border-primary/30">🇺🇸 USD</Badge>}
                            </p>
                            <p className="text-xs text-muted-foreground">{isImportInternacional ? "Corretora internacional • Valores em dólar" : "Corretora selecionada"}</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => { setImportStep(1); setSelectedCorretora(""); }} className="text-muted-foreground hover:text-foreground gap-1">
                          <X className="w-4 h-4" /> Trocar
                        </Button>
                      </CardContent>
                    </Card>

                    <Card className="border-border/50">
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          <Label className="text-foreground text-sm">Data do pregão (opcional)</Label>
                          <Input type="date" value={dataOperacao} onChange={(e) => setDataOperacao(e.target.value)} className="bg-muted/50 border-border/50 max-w-xs" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-border/50 overflow-hidden">
                      <CardContent className="p-0">
                        <div
                          onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
                          onClick={() => !processingPdf && fileInputRef.current?.click()}
                          className={`relative p-12 text-center cursor-pointer transition-all ${isDragging ? "bg-primary/10 border-2 border-dashed border-primary" : "hover:bg-accent/20"}`}
                        >
                          {processingPdf ? (
                            <div className="flex flex-col items-center gap-4">
                              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
                              <div>
                                <p className="text-lg font-semibold text-foreground">
                                  Analisando nota{processingCount.total > 1 ? `s (${processingCount.current}/${processingCount.total})` : ""}...
                                </p>
                                <p className="text-sm text-muted-foreground mt-1">Identificando ativos e operações com IA</p>
                              </div>
                              <div className="w-48 h-1.5 rounded-full bg-muted overflow-hidden"><div className="h-full bg-primary rounded-full transition-all" style={{ width: `${processingCount.total > 0 ? (processingCount.current / processingCount.total) * 100 : 60}%` }} /></div>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-4">
                              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-colors ${isDragging ? "bg-primary/20" : "bg-muted"}`}>
                                <Upload className={`w-8 h-8 ${isDragging ? "text-primary" : "text-muted-foreground"}`} />
                              </div>
                              <div>
                                <p className="text-lg font-semibold text-foreground">{isDragging ? "Solte os arquivos aqui" : "Arraste e solte seus PDFs aqui"}</p>
                                <p className="text-sm text-muted-foreground mt-1">ou clique para selecionar • Múltiplos arquivos aceitos</p>
                              </div>
                              <Badge variant="outline" className="text-xs text-muted-foreground">Selecione vários PDFs de uma vez</Badge>
                            </div>
                          )}
                          <input ref={fileInputRef} type="file" accept=".pdf,image/*" multiple onChange={handlePdfUpload} className="hidden" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Step 3: Preview & Confirm */}
                {importStep === 3 && notaPreviews.length > 0 && (
                  <div className="space-y-4">
                    {/* Summary header */}
                    <Card className="border-primary/30 bg-primary/5">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                              {corretoras.find((c) => c.id === selectedCorretora)?.logo}
                            </div>
                            <div>
                              <p className="font-semibold text-foreground text-sm">{corretoras.find((c) => c.id === selectedCorretora)?.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {notaPreviews.length} nota{notaPreviews.length !== 1 ? "s" : ""} • {notaPreviews.reduce((acc, n) => acc + n.previewData.operacoes.length, 0)} operação(ões)
                              </p>
                            </div>
                          </div>
                          <Button variant="outline" size="sm" onClick={() => { setImportStep(2); }} className="gap-1 text-xs">
                            <Plus className="w-3 h-3" /> Adicionar mais
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Each note preview */}
                    {notaPreviews.map((nota, notaIdx) => {
                      const pd = nota.previewData;
                      const isExpanded = expandedNota === notaIdx;
                      return (
                        <Card key={notaIdx} className="border-border/50 overflow-hidden">
                          <CardContent className="p-0">
                            {/* Nota header - clickable to expand */}
                            <button
                              onClick={() => setExpandedNota(isExpanded ? null : notaIdx)}
                              className="w-full px-4 py-3 flex items-center justify-between bg-muted/20 hover:bg-muted/30 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <FileText className="w-4 h-4 text-primary" />
                                <div className="text-left">
                                  <p className="text-sm font-semibold text-foreground">{nota.fileName}</p>
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Calendar className="w-3 h-3" />
                                    {pd.data_operacao
                                      ? new Date(pd.data_operacao + "T12:00:00").toLocaleDateString("pt-BR")
                                      : "Sem data"}
                                    <span>•</span>
                                    <span>{pd.operacoes.length} op.</span>
                                    <span>•</span>
                                    <span className="text-primary font-medium">
                                      {formatCurrency(pd.valor_total_compras || pd.operacoes.filter(o => o.tipo === "C").reduce((a, o) => a + o.valor_total, 0))}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost" size="sm"
                                  onClick={(e) => { e.stopPropagation(); removeNotaPreview(notaIdx); }}
                                  className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                                <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                              </div>
                            </button>

                            {/* Expanded content */}
                            {isExpanded && (
                              <div className="border-t border-border/50">
                                {/* Summary cards */}
                                <div className="grid grid-cols-3 gap-3 p-4">
                                  <div className="text-center">
                                    <p className="text-xs text-muted-foreground mb-0.5">Compras</p>
                                    <p className="text-sm font-bold text-primary">
                                      {formatCurrency(pd.valor_total_compras || pd.operacoes.filter(o => o.tipo === "C").reduce((a, o) => a + o.valor_total, 0))}
                                    </p>
                                  </div>
                                  <div className="text-center">
                                    <p className="text-xs text-muted-foreground mb-0.5">Vendas</p>
                                    <p className="text-sm font-bold text-destructive">
                                      {formatCurrency(pd.valor_total_vendas || pd.operacoes.filter(o => o.tipo === "V").reduce((a, o) => a + o.valor_total, 0))}
                                    </p>
                                  </div>
                                  <div className="text-center">
                                    <p className="text-xs text-muted-foreground mb-0.5">Taxas</p>
                                    <p className="text-sm font-bold text-foreground">{formatCurrency(pd.taxas || 0)}</p>
                                  </div>
                                </div>

                                {/* Operations table */}
                                <Table>
                                  <TableHeader>
                                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                                      <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Tipo</TableHead>
                                      <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Ativo</TableHead>
                                      <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground text-right">Qtd</TableHead>
                                      <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground text-right">Preço Unit.</TableHead>
                                      <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground text-right">Total</TableHead>
                                      <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground w-10"></TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {pd.operacoes.map((op, idx) => {
                                      const isEditing = editingOp?.notaIdx === notaIdx && editingOp?.opIdx === idx;
                                      const opCurrency = getCurrencyForTicker(isEditing ? editOpValues.ativo : op.ativo);
                                      if (isEditing) {
                                        return (
                                          <TableRow key={idx} className="bg-primary/5">
                                            <TableCell>
                                              <Badge variant={op.tipo === "C" ? "default" : "destructive"} className={op.tipo === "C" ? "bg-primary/20 text-primary hover:bg-primary/30" : ""}>
                                                {op.tipo === "C" ? "C" : "V"}
                                              </Badge>
                                            </TableCell>
                                            <TableCell>
                                              <Input value={editOpValues.ativo} onChange={e => setEditOpValues(v => ({ ...v, ativo: e.target.value.toUpperCase() }))} className="h-8 w-24 font-mono text-xs bg-background" />
                                            </TableCell>
                                            <TableCell className="text-right">
                                              <Input value={editOpValues.quantidade} onChange={e => setEditOpValues(v => ({ ...v, quantidade: e.target.value }))} className="h-8 w-20 text-xs text-right bg-background" />
                                            </TableCell>
                                            <TableCell className="text-right">
                                              <Input value={editOpValues.preco_unitario} onChange={e => setEditOpValues(v => ({ ...v, preco_unitario: e.target.value }))} className="h-8 w-24 text-xs text-right bg-background" />
                                            </TableCell>
                                            <TableCell className="text-right text-xs text-muted-foreground">
                                              {formatCurrency((parseFloat(editOpValues.quantidade.replace(",",".")) || 0) * (parseFloat(editOpValues.preco_unitario.replace(",",".")) || 0), opCurrency)}
                                            </TableCell>
                                            <TableCell>
                                              <div className="flex gap-1">
                                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-primary" onClick={saveEditOp}><Check className="w-3 h-3" /></Button>
                                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground" onClick={cancelEditOp}><X className="w-3 h-3" /></Button>
                                              </div>
                                            </TableCell>
                                          </TableRow>
                                        );
                                      }
                                      return (
                                        <TableRow key={idx} className="group">
                                          <TableCell>
                                            <Badge variant={op.tipo === "C" ? "default" : "destructive"} className={op.tipo === "C" ? "bg-primary/20 text-primary hover:bg-primary/30" : ""}>
                                              {op.tipo === "C" ? <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" /> C</span> : <span className="flex items-center gap-1"><TrendingDown className="w-3 h-3" /> V</span>}
                                            </Badge>
                                          </TableCell>
                                          <TableCell className="font-mono font-semibold text-foreground">{op.ativo}</TableCell>
                                          <TableCell className="text-right font-medium text-foreground">{op.quantidade}</TableCell>
                                          <TableCell className="text-right font-medium text-muted-foreground">{formatCurrency(op.preco_unitario, opCurrency)}</TableCell>
                                          <TableCell className="text-right font-semibold text-foreground">{formatCurrency(op.valor_total, opCurrency)}</TableCell>
                                          <TableCell>
                                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-primary transition-opacity" onClick={() => startEditOp(notaIdx, idx)}>
                                              <Edit2 className="w-3 h-3" />
                                            </Button>
                                          </TableCell>
                                        </TableRow>
                                      );
                                    })}
                                  </TableBody>
                                </Table>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}

                    {/* Action buttons */}
                    <div className="flex gap-3">
                      <Button variant="outline" onClick={resetImport} className="gap-2 flex-1" disabled={savingNota}>
                        <X className="w-4 h-4" /> Cancelar
                      </Button>
                      <Button onClick={handleConfirmNotas} disabled={savingNota || notaPreviews.length === 0} className="gap-2 flex-[2]">
                        {savingNota ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        Enviar {notaPreviews.length} Nota{notaPreviews.length !== 1 ? "s" : ""}
                      </Button>
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* ===== TAB: LANÇAMENTO INDIVIDUAL ===== */}
              <TabsContent value="individual" className="mt-6">
                <Card className="border-border/50">
                  <CardContent className="p-6">
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-foreground mb-1">Lançamento Individual</h3>
                      <p className="text-sm text-muted-foreground">Registre compras e vendas de ativos manualmente</p>
                    </div>
                    <div className="space-y-5">
                      {/* Tipo de Ativo */}
                      <div className="space-y-2">
                        <Label className="text-foreground text-sm font-medium">Tipo de Ativo</Label>
                        <Popover open={indTipoAtivoOpen} onOpenChange={setIndTipoAtivoOpen}>
                          <PopoverTrigger asChild>
                            <Button variant="outline" role="combobox" className="w-full justify-between bg-muted/50 border-border/50 h-11 text-left font-normal">
                              {indTipoAtivo ? (
                                <span className="flex items-center gap-2">
                                  {tiposAtivo.find((t) => t.id === indTipoAtivo)?.label}
                                  <Badge variant="outline" className="text-[10px] px-1 py-0">
                                    {tiposAtivo.find((t) => t.id === indTipoAtivo)?.mercado === "brasil" ? "🇧🇷" : tiposAtivo.find((t) => t.id === indTipoAtivo)?.mercado === "exterior" ? "🇺🇸" : "₿"}
                                  </Badge>
                                </span>
                              ) : "Selecione o tipo de ativo..."}
                              <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-full p-0" align="start">
                            <Command>
                              <CommandInput placeholder="Pesquisar..." value={indTipoAtivoSearch} onValueChange={setIndTipoAtivoSearch} />
                              <CommandList>
                                <CommandEmpty>Nenhum tipo encontrado</CommandEmpty>
                                <CommandGroup>
                                  {filteredTiposAtivo.map((tipo) => (
                                    <CommandItem key={tipo.id} value={tipo.label} onSelect={() => { setIndTipoAtivo(tipo.id); setIndTicker(""); setIndPreco(""); setIndTipoAtivoOpen(false); setIndTipoAtivoSearch(""); }}>
                                      <span className="flex items-center gap-2">{tipo.label} <Badge variant="outline" className="text-[10px] px-1 py-0">{tipo.mercado === "brasil" ? "🇧🇷" : tipo.mercado === "exterior" ? "🇺🇸" : "₿"}</Badge></span>
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-foreground text-sm font-medium">Ativo / Ticker</Label>
                          <Popover open={indTickerOpen} onOpenChange={setIndTickerOpen}>
                            <PopoverTrigger asChild>
                              <Button variant="outline" role="combobox" className="w-full justify-between bg-muted/50 border-border/50 h-11 text-left font-normal">
                                {indTicker ? indTicker.toUpperCase() : "Buscar ticker..."} <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-full p-0" align="start">
                              <Command>
                                <CommandInput placeholder="Digite o ticker..." value={indTicker} onValueChange={setIndTicker} />
                                <CommandList>
                                  <CommandEmpty>{indTicker ? <button className="w-full p-2 text-sm text-primary hover:bg-accent" onClick={() => setIndTickerOpen(false)}>Usar "{indTicker.toUpperCase()}"</button> : "Digite um ticker"}</CommandEmpty>
                                  <CommandGroup heading={indTipoAtivo ? tiposAtivo.find((t) => t.id === indTipoAtivo)?.label : "Selecione um tipo"}>
                                    {filteredTickers.slice(0, 20).map((ticker) => (
                                      <CommandItem key={ticker} value={ticker} onSelect={(val) => { setIndTicker(val.toUpperCase()); setIndTickerOpen(false); }}>
                                        <span className="font-mono font-medium">{ticker}</span>
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-foreground text-sm font-medium">Operação</Label>
                          <div className="grid grid-cols-2 gap-2">
                            <button onClick={() => setIndTipoOp("C")} className={`p-3 rounded-xl border-2 text-sm font-medium transition-all flex items-center justify-center gap-2 ${indTipoOp === "C" ? "border-primary bg-primary/10 text-primary" : "border-border/50 bg-muted/30 text-muted-foreground hover:border-primary/40"}`}>
                              <TrendingUp className="w-4 h-4" /> Compra
                            </button>
                            <button onClick={() => setIndTipoOp("V")} className={`p-3 rounded-xl border-2 text-sm font-medium transition-all flex items-center justify-center gap-2 ${indTipoOp === "V" ? "border-destructive bg-destructive/10 text-destructive" : "border-border/50 bg-muted/30 text-muted-foreground hover:border-destructive/40"}`}>
                              <TrendingDown className="w-4 h-4" /> Venda
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label className="text-foreground text-sm font-medium">Data da {indTipoOp === "C" ? "Compra" : "Venda"}</Label>
                          <Input type="date" value={indData} onChange={(e) => setIndData(e.target.value)} className="bg-muted/50 border-border/50 h-11" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-foreground text-sm font-medium">Quantidade</Label>
                          <Input type="number" step="any" placeholder="Ex: 100 ou 0,02696" value={indQuantidade} onChange={(e) => setIndQuantidade(e.target.value)} className="bg-muted/50 border-border/50 h-11" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-foreground text-sm font-medium flex items-center gap-2">Preço ({moeda}) {indLoadingPrice && <Loader2 className="w-3 h-3 animate-spin text-primary" />}</Label>
                          <div className="relative">
                            <Input placeholder={mercadoAtual === "exterior" ? "150.00" : "35,50"} value={indPreco} onChange={(e) => setIndPreco(e.target.value)} className="bg-muted/50 border-border/50 h-11 pr-12" />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">{moeda}</span>
                          </div>
                          {indData && indTicker && <p className="text-xs text-muted-foreground">💡 Cotação preenchida automaticamente</p>}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-foreground text-sm font-medium">Corretora (opcional)</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" role="combobox" className="w-full justify-between bg-muted/50 border-border/50 h-11 text-left font-normal">
                                {indCorretora ? (
                                  <span className="flex items-center gap-2">
                                    <span className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                                      {corretoras.find((c) => c.id === indCorretora)?.logo || "??"}
                                    </span>
                                    {corretoras.find((c) => c.id === indCorretora)?.name || indCorretora}
                                  </span>
                                ) : "Digite ou selecione..."}
                                <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-full p-0" align="start">
                              <Command>
                                <CommandInput placeholder="Buscar corretora..." />
                                <CommandList>
                                  <CommandEmpty>Nenhuma corretora encontrada</CommandEmpty>
                                  <CommandGroup>
                                    {corretoras.map((c) => (
                                      <CommandItem key={c.id} value={c.name} onSelect={() => setIndCorretora(c.id)}>
                                        <div className="flex items-center gap-2">
                                          <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">{c.logo}</div>
                                          <span>{c.name}</span>
                                          {c.mercados.includes("internacional") && <Badge variant="outline" className="text-[10px] px-1 py-0 text-primary border-primary/30">🇺🇸</Badge>}
                                          {c.mercados.includes("brasil") && <Badge variant="outline" className="text-[10px] px-1 py-0 text-muted-foreground border-border">🇧🇷</Badge>}
                                        </div>
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-foreground text-sm font-medium">Outros Custos ({moeda})</Label>
                          <Input placeholder="0,00" value={indCusto} onChange={(e) => setIndCusto(e.target.value)} className="bg-muted/50 border-border/50 h-11" />
                        </div>
                      </div>

                      {indQuantidade && indPreco && (
                        <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Valor Total</span>
                            <span className="text-xl font-bold text-foreground">
                              {moeda} {((parseFloat(indQuantidade.replace(",", ".")) || 0) * (parseFloat(indPreco.replace(",", ".")) || 0)).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                          {indCusto && parseFloat(indCusto.replace(",", ".")) > 0 && (
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-xs text-muted-foreground">+ Custos</span>
                              <span className="text-sm text-muted-foreground">{moeda} {parseFloat(indCusto.replace(",", ".")).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                            </div>
                          )}
                        </div>
                      )}

                      <Button onClick={handleIndividualSubmit} disabled={indSaving} className="w-full h-12 text-sm font-semibold" size="lg">
                        {indSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                        Registrar {indTipoOp === "C" ? "Compra" : "Venda"}
                      </Button>
                    </div>
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

export default NotasCorretagem;
