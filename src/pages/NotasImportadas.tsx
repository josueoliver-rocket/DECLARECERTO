import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  Menu,
  Loader2,
  Calendar,
  Trash2,
  Edit,
  TrendingUp,
  TrendingDown,
  Receipt,
  Eye,
  Search,
  Plus,
  ArrowUpDown,
  Filter,
  Download,
} from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const corretoras = [
  { id: "xp", name: "XP Investimentos", logo: "XP" },
  { id: "clear", name: "Clear Corretora", logo: "CL" },
  { id: "rico", name: "Rico Investimentos", logo: "RI" },
  { id: "nuinvest", name: "NuInvest", logo: "NU" },
  { id: "btg", name: "BTG Pactual", logo: "BTG" },
  { id: "inter", name: "Inter Invest", logo: "IN" },
  { id: "modal", name: "Modal Mais", logo: "MM" },
  { id: "genial", name: "Genial Investimentos", logo: "GE" },
  { id: "c6", name: "C6 Bank", logo: "C6" },
  { id: "avenue", name: "Avenue", logo: "AV" },
  { id: "itau", name: "Itaú Corretora", logo: "IT" },
  { id: "ion", name: "Íon (Itaú)", logo: "ÍO" },
  { id: "bradesco", name: "Bradesco Corretora", logo: "BR" },
  { id: "santander", name: "Santander Corretora", logo: "SA" },
  { id: "bb", name: "BB Investimentos", logo: "BB" },
  { id: "orama", name: "Órama", logo: "OR" },
  { id: "toro", name: "Toro Investimentos", logo: "TO" },
  { id: "warren", name: "Warren", logo: "WA" },
  { id: "easynvest", name: "Easynvest", logo: "EA" },
  { id: "mirae", name: "Mirae Asset", logo: "MI" },
  { id: "ativa", name: "Ativa Investimentos", logo: "AT" },
  { id: "guide", name: "Guide Investimentos", logo: "GU" },
  { id: "terra", name: "Terra Investimentos", logo: "TE" },
  { id: "agora", name: "Ágora Investimentos", logo: "AG" },
  { id: "necton", name: "Necton", logo: "NE" },
  { id: "outra", name: "Outra", logo: "??" },
];

interface NotaCorretagem {
  id: string;
  corretora: string;
  data_operacao: string | null;
  arquivo_nome: string | null;
  taxas: number | null;
  valor_total: number | null;
  valor_compras: number | null;
  valor_vendas: number | null;
  created_at: string;
}

interface Operacao {
  id: string;
  ativo: string;
  tipo: string;
  quantidade: number;
  preco_unitario: number;
  valor_total: number;
}

const formatCurrency = (value: number, currency: "BRL" | "USD" = "BRL") =>
  currency === "USD"
    ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value)
    : new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const isBrazilianTicker = (ticker: string): boolean => /^[A-Z]{4}\d{1,2}$/.test(ticker.toUpperCase().trim());

const NotasImportadas = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [notas, setNotas] = useState<NotaCorretagem[]>([]);
  const [operacoes, setOperacoes] = useState<Record<string, Operacao[]>>({});
  const [loadingNotas, setLoadingNotas] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [filterCorretora, setFilterCorretora] = useState("all");

  // Edit dialog
  const [editingNota, setEditingNota] = useState<NotaCorretagem | null>(null);
  const [editCorretora, setEditCorretora] = useState("");
  const [editDataOperacao, setEditDataOperacao] = useState("");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);

  // Delete confirmation dialog
  const [deleteNotaId, setDeleteNotaId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingNota, setDeletingNota] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate("/");
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) fetchNotas();
  }, [user]);

  const fetchNotas = async () => {
    try {
      const { data, error } = await supabase
        .from("notas_corretagem")
        .select("id, corretora, data_operacao, arquivo_nome, taxas, valor_total, valor_compras, valor_vendas, created_at")
        .order("data_operacao", { ascending: false, nullsFirst: false });

      if (error) throw error;
      setNotas(data || []);

      if (data && data.length > 0) {
        const { data: opsData } = await supabase
          .from("operacoes")
          .select("*")
          .in("nota_id", data.map((n) => n.id));

        if (opsData) {
          const grouped: Record<string, Operacao[]> = {};
          opsData.forEach((op) => {
            if (!op.nota_id) return;
            if (!grouped[op.nota_id]) grouped[op.nota_id] = [];
            grouped[op.nota_id].push({
              id: op.id,
              ativo: op.ativo,
              tipo: op.tipo,
              quantidade: op.quantidade,
              preco_unitario: Number(op.preco_unitario),
              valor_total: Number(op.valor_total),
            });
          });
          setOperacoes(grouped);
        }
      }
    } catch (error) {
      console.error("Erro ao carregar notas:", error);
    } finally {
      setLoadingNotas(false);
    }
  };

  const handleOpenDeleteDialog = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteNotaId(id);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteNotaId) return;
    setDeletingNota(true);
    try {
      // 1. Find which tickers are in this nota
      const { data: opsInNota } = await supabase
        .from("operacoes")
        .select("ativo")
        .eq("nota_id", deleteNotaId);
      
      const tickersInNota = [...new Set(opsInNota?.map(o => o.ativo) || [])];

      // 2. Check ticker_changes for any bonus tickers derived from these tickers
      if (tickersInNota.length > 0) {
        const { data: relatedChanges } = await supabase
          .from("ticker_changes")
          .select("bonus_ticker, old_ticker, new_ticker")
          .not("bonus_ticker", "is", null);

        if (relatedChanges) {
          const bonusTickersToDelete: string[] = [];
          for (const change of relatedChanges) {
            if (
              tickersInNota.includes(change.old_ticker) ||
              tickersInNota.includes(change.new_ticker)
            ) {
              if (change.bonus_ticker) bonusTickersToDelete.push(change.bonus_ticker);
            }
          }

          // 3. Delete bonus operations for this user
          if (bonusTickersToDelete.length > 0) {
            const { data: { user: currentUser } } = await supabase.auth.getUser();
            if (currentUser) {
              await supabase
                .from("operacoes")
                .delete()
                .eq("user_id", currentUser.id)
                .in("ativo", bonusTickersToDelete);
            }
          }
        }
      }

      // 4. Delete the nota (cascades to its operacoes via nota_id)
      const { error } = await supabase.from("notas_corretagem").delete().eq("id", deleteNotaId);
      if (error) throw error;
      setNotas((prev) => prev.filter((n) => n.id !== deleteNotaId));
      toast({ title: "Nota e bonificações relacionadas removidas" });
    } catch {
      toast({ title: "Erro ao remover", variant: "destructive" });
    } finally {
      setDeletingNota(false);
      setIsDeleteDialogOpen(false);
      setDeleteNotaId(null);
    }
  };

  const handleEditNota = (nota: NotaCorretagem) => {
    setEditingNota(nota);
    const c = corretoras.find((c) => c.name === nota.corretora);
    setEditCorretora(c?.id || "outra");
    setEditDataOperacao(nota.data_operacao || "");
    setIsEditDialogOpen(true);
  };

  const handleUpdateNota = async () => {
    if (!editingNota || !editCorretora) return;
    const corretora = corretoras.find((c) => c.id === editCorretora);
    setSavingEdit(true);
    try {
      const { error } = await supabase
        .from("notas_corretagem")
        .update({ corretora: corretora?.name || "", data_operacao: editDataOperacao || null })
        .eq("id", editingNota.id);
      if (error) throw error;
      setNotas((prev) =>
        prev.map((n) =>
          n.id === editingNota.id ? { ...n, corretora: corretora?.name || "", data_operacao: editDataOperacao || null } : n
        )
      );
      setIsEditDialogOpen(false);
      toast({ title: "Nota atualizada!" });
    } catch {
      toast({ title: "Erro ao atualizar", variant: "destructive" });
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDownloadNota = async (nota: NotaCorretagem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!nota.arquivo_nome || !user) {
      toast({ title: "Arquivo não disponível", description: "Esta nota não possui PDF associado.", variant: "destructive" });
      return;
    }
    try {
      const filePath = `${user.id}/${nota.arquivo_nome}`;
      const { data, error } = await supabase.storage.from("notas-pdf").download(filePath);
      if (error) throw error;
      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = nota.arquivo_nome;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      toast({ title: "Erro ao baixar", description: err.message, variant: "destructive" });
    }
  };

  const uniqueCorretoras = useMemo(() => [...new Set(notas.map((n) => n.corretora))], [notas]);

  const filteredNotas = useMemo(() => {
    let result = notas;

    if (filterCorretora !== "all") {
      result = result.filter((n) => n.corretora === filterCorretora);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter((n) => {
        const ops = operacoes[n.id] || [];
        const tickers = ops.map((o) => o.ativo.toLowerCase()).join(" ");
        return (
          n.corretora.toLowerCase().includes(term) ||
          tickers.includes(term) ||
          (n.data_operacao && new Date(n.data_operacao + "T12:00:00").toLocaleDateString("pt-BR").includes(term))
        );
      });
    }

    result = [...result].sort((a, b) => {
      const dateA = a.data_operacao || a.created_at;
      const dateB = b.data_operacao || b.created_at;
      return sortOrder === "desc" ? dateB.localeCompare(dateA) : dateA.localeCompare(dateB);
    });

    return result;
  }, [notas, filterCorretora, searchTerm, sortOrder, operacoes]);

  const totalNotas = notas.length;
  const totalCompras = notas.reduce((a, n) => a + (n.valor_compras || 0), 0);
  const totalVendas = notas.reduce((a, n) => a + (n.valor_vendas || 0), 0);
  const totalTaxas = notas.reduce((a, n) => a + (n.taxas || 0), 0);

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
          {/* Header */}
          <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/50">
            <div className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="text-muted-foreground hover:text-foreground">
                  <Menu className="w-5 h-5" />
                </SidebarTrigger>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Notas Importadas</h1>
                  <p className="text-sm text-muted-foreground">Histórico completo das suas notas de corretagem</p>
                </div>
              </div>
              <Button onClick={() => navigate("/notas-corretagem?tab=nota")} className="gap-2" size="sm">
                <Plus className="w-4 h-4" />
                Nova Nota
              </Button>
            </div>
          </header>

          <div className="p-6 space-y-6">
            {/* Stats Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-border/50 bg-card">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Notas</p>
                      <p className="text-2xl font-bold text-foreground">{totalNotas}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border/50 bg-card">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Compras</p>
                      <p className="text-lg font-bold text-foreground">{formatCurrency(totalCompras)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border/50 bg-card">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                      <TrendingDown className="w-5 h-5 text-destructive" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Vendas</p>
                      <p className="text-lg font-bold text-foreground">{formatCurrency(totalVendas)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border/50 bg-card">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                      <Receipt className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Taxas</p>
                      <p className="text-lg font-bold text-foreground">{formatCurrency(totalTaxas)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por corretora, ticker ou data..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-muted/50 border-border/50 h-10"
                />
              </div>
              <Select value={filterCorretora} onValueChange={setFilterCorretora}>
                <SelectTrigger className="w-[200px] bg-muted/50 border-border/50 h-10">
                  <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Corretora" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="all">Todas as corretoras</SelectItem>
                  {uniqueCorretoras.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 shrink-0"
                onClick={() => setSortOrder((o) => (o === "desc" ? "asc" : "desc"))}
                title={sortOrder === "desc" ? "Mais recentes primeiro" : "Mais antigas primeiro"}
              >
                <ArrowUpDown className="w-4 h-4" />
              </Button>
            </div>

            {/* Table */}
            <Card className="border-border/50 overflow-hidden">
              <CardContent className="p-0">
                {loadingNotas ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : filteredNotas.length === 0 ? (
                  <div className="text-center py-16 text-muted-foreground">
                    <FileText className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p className="text-lg font-medium">{searchTerm || filterCorretora !== "all" ? "Nenhuma nota encontrada" : "Nenhuma nota importada"}</p>
                    <p className="text-sm mt-1 mb-4">
                      {searchTerm || filterCorretora !== "all" ? "Tente ajustar os filtros" : "Importe seu primeiro PDF para começar"}
                    </p>
                    {!searchTerm && filterCorretora === "all" && (
                      <Button onClick={() => navigate("/notas-corretagem?tab=nota")} className="gap-2">
                        <Plus className="w-4 h-4" />
                        Importar Nota
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/30 hover:bg-muted/30">
                          <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Corretora</TableHead>
                          <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Data</TableHead>
                          <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Ativos</TableHead>
                          <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground text-right">Compras</TableHead>
                          <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground text-right">Vendas</TableHead>
                          <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground text-right">Taxas</TableHead>
                          <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground text-center">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredNotas.map((nota) => {
                          const ops = operacoes[nota.id] || [];
                          const tickers = [...new Set(ops.map((o) => o.ativo))];
                          const compras = ops.filter((o) => o.tipo === "C").reduce((a, o) => a + o.valor_total, 0);
                          const vendas = ops.filter((o) => o.tipo === "V").reduce((a, o) => a + o.valor_total, 0);
                          const notaCurr: "BRL" | "USD" = tickers.length > 0 && !isBrazilianTicker(tickers[0]) ? "USD" : "BRL";

                          return (
                            <TableRow
                              key={nota.id}
                              className="group cursor-pointer hover:bg-accent/30 transition-colors"
                              onClick={() => navigate(`/nota/${nota.id}`)}
                            >
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                                    {corretoras.find((c) => c.name === nota.corretora)?.logo || nota.corretora.substring(0, 2).toUpperCase()}
                                  </div>
                                  <span className="font-medium text-foreground text-sm">{nota.corretora}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                  <Calendar className="w-3.5 h-3.5" />
                                  {nota.data_operacao
                                    ? new Date(nota.data_operacao + "T12:00:00").toLocaleDateString("pt-BR")
                                    : "Sem data"}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-wrap gap-1">
                                  {tickers.slice(0, 4).map((t) => (
                                    <Badge key={t} variant="secondary" className="text-[10px] px-1.5 py-0 font-mono">
                                      {t}
                                    </Badge>
                                  ))}
                                  {tickers.length > 4 && (
                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                      +{tickers.length - 4}
                                    </Badge>
                                  )}
                                  {tickers.length === 0 && <span className="text-xs text-muted-foreground">—</span>}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                {compras > 0 ? (
                                  <span className="text-sm font-medium text-primary">{formatCurrency(compras, notaCurr)}</span>
                                ) : (
                                  <span className="text-sm text-muted-foreground">—</span>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                {vendas > 0 ? (
                                  <span className="text-sm font-medium text-destructive">{formatCurrency(vendas, notaCurr)}</span>
                                ) : (
                                  <span className="text-sm text-muted-foreground">—</span>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <span className="text-sm text-muted-foreground">
                                  {(nota.taxas || 0) > 0 ? formatCurrency(nota.taxas || 0, notaCurr) : "—"}
                                </span>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center justify-center gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-primary"
                                    onClick={(e) => { e.stopPropagation(); navigate(`/nota/${nota.id}`); }}
                                    title="Ver detalhes"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-primary"
                                    onClick={(e) => { e.stopPropagation(); handleEditNota(nota); }}
                                    title="Editar"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-primary"
                                    onClick={(e) => handleDownloadNota(nota, e)}
                                    title="Baixar PDF"
                                  >
                                    <Download className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                    onClick={(e) => handleOpenDeleteDialog(nota.id, e)}
                                    title="Excluir"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
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
          </div>
        </main>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Editar Nota</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-foreground text-sm">Corretora</Label>
              <Select value={editCorretora} onValueChange={setEditCorretora}>
                <SelectTrigger className="bg-muted/50 border-border/50">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border max-h-60">
                  {corretoras.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">{c.logo}</div>
                        <span>{c.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-foreground text-sm">Data do Pregão</Label>
              <Input type="date" value={editDataOperacao} onChange={(e) => setEditDataOperacao(e.target.value)} className="bg-muted/50 border-border/50" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleUpdateNota} disabled={savingEdit}>
              {savingEdit && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta nota? Esta ação não pode ser desfeita e todas as operações relacionadas serão removidas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingNota}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deletingNota}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletingNota && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarProvider>
  );
};

export default NotasImportadas;
