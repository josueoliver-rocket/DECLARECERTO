import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FileText, Menu, Loader2, ArrowLeft, Calendar, Receipt, TrendingUp, TrendingDown, Hash, Edit, Trash2, Save, X } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface TaxasDetalhadas {
  taxa_liquidacao?: number;
  emolumentos?: number;
  corretagem?: number;
  iss?: number;
  irrf?: number;
  taxa_registro?: number;
  taxa_ana?: number;
  taxa_custodia?: number;
  outras?: number;
}

interface NotaInfo {
  id: string;
  corretora: string;
  data_operacao: string | null;
  arquivo_nome: string | null;
  taxas: number | null;
  taxas_detalhadas: TaxasDetalhadas | null;
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
  created_at: string;
}

const formatCurrency = (value: number, currency: "BRL" | "USD" = "BRL") =>
  currency === "USD"
    ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value)
    : new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const isBrazilianTicker = (ticker: string): boolean => /^[A-Z]{4}\d{1,2}$/.test(ticker.toUpperCase().trim());

const NotaDetalhes = () => {
  const navigate = useNavigate();
  const { notaId } = useParams<{ notaId: string }>();
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [nota, setNota] = useState<NotaInfo | null>(null);
  const [operacoes, setOperacoes] = useState<Operacao[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Edit operation state
  const [editingOp, setEditingOp] = useState<Operacao | null>(null);
  const [editTipo, setEditTipo] = useState("C");
  const [editAtivo, setEditAtivo] = useState("");
  const [editQuantidade, setEditQuantidade] = useState("");
  const [editPreco, setEditPreco] = useState("");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingOp, setDeletingOp] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate("/");
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user && notaId) fetchNota();
  }, [user, notaId]);

  const fetchNota = async () => {
    try {
      const [notaRes, opsRes] = await Promise.all([
        supabase.from("notas_corretagem").select("*").eq("id", notaId!).single(),
        supabase.from("operacoes").select("*").eq("nota_id", notaId!).order("created_at", { ascending: true }),
      ]);

      if (notaRes.error) throw notaRes.error;
      const notaData = notaRes.data;
      setNota({
        ...notaData,
        taxas_detalhadas: notaData.taxas_detalhadas as TaxasDetalhadas | null,
      });
      setOperacoes(
        (opsRes.data || []).map((op) => ({
          id: op.id,
          ativo: op.ativo,
          tipo: op.tipo,
          quantidade: op.quantidade,
          preco_unitario: Number(op.preco_unitario),
          valor_total: Number(op.valor_total),
          created_at: op.created_at,
        }))
      );
    } catch (error) {
      console.error("Erro ao carregar nota:", error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleEditOp = (op: Operacao) => {
    setEditingOp(op);
    setEditTipo(op.tipo);
    setEditAtivo(op.ativo);
    setEditQuantidade(String(op.quantidade));
    setEditPreco(String(op.preco_unitario));
    setIsEditDialogOpen(true);
  };

  const handleUpdateOp = async () => {
    if (!editingOp || !editAtivo || !editQuantidade || !editPreco) return;
    setSavingEdit(true);
    const quantidade = parseFloat(editQuantidade);
    const preco_unitario = parseFloat(editPreco);
    const valor_total = quantidade * preco_unitario;

    try {
      const { error } = await supabase
        .from("operacoes")
        .update({
          tipo: editTipo,
          ativo: editAtivo.toUpperCase(),
          quantidade,
          preco_unitario,
          valor_total,
        })
        .eq("id", editingOp.id);
      if (error) throw error;

      setOperacoes((prev) =>
        prev.map((o) =>
          o.id === editingOp.id
            ? { ...o, tipo: editTipo, ativo: editAtivo.toUpperCase(), quantidade, preco_unitario, valor_total }
            : o
        )
      );
      setIsEditDialogOpen(false);
      toast({ title: "Operação atualizada!" });
    } catch {
      toast({ title: "Erro ao atualizar operação", variant: "destructive" });
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteOp = async (opId: string) => {
    setDeletingOp(opId);
    try {
      // Check if this operation's ticker has bonus shares
      const opToDelete = operacoes.find(o => o.id === opId);
      if (opToDelete) {
        const { data: relatedChanges } = await supabase
          .from("ticker_changes")
          .select("bonus_ticker, old_ticker, new_ticker")
          .not("bonus_ticker", "is", null);

        if (relatedChanges) {
          const bonusTickersToDelete: string[] = [];
          for (const change of relatedChanges) {
            if (opToDelete.ativo === change.old_ticker || opToDelete.ativo === change.new_ticker) {
              if (change.bonus_ticker) bonusTickersToDelete.push(change.bonus_ticker);
            }
          }

          if (bonusTickersToDelete.length > 0 && user) {
            // Check if after deleting this op, user still holds the source ticker
            const remainingOps = operacoes.filter(o => o.id !== opId && o.ativo === opToDelete.ativo);
            const remainingQty = remainingOps.reduce((acc, o) => acc + (o.tipo === 'C' ? o.quantidade : -o.quantidade), 0);
            
            if (remainingQty <= 0) {
              await supabase
                .from("operacoes")
                .delete()
                .eq("user_id", user.id)
                .in("ativo", bonusTickersToDelete);
            }
          }
        }
      }

      const { error } = await supabase.from("operacoes").delete().eq("id", opId);
      if (error) throw error;
      setOperacoes((prev) => prev.filter((o) => o.id !== opId));
      toast({ title: "Operação removida" });
    } catch {
      toast({ title: "Erro ao remover operação", variant: "destructive" });
    } finally {
      setDeletingOp(null);
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

  const totalCompras = operacoes.filter((o) => o.tipo === "C").reduce((a, o) => a + o.valor_total, 0);
  const totalVendas = operacoes.filter((o) => o.tipo === "V").reduce((a, o) => a + o.valor_total, 0);
  const totalNegociado = totalCompras + totalVendas;
  // Detect currency from first operation's ticker
  const notaCurrency: "BRL" | "USD" = operacoes.length > 0 && !isBrazilianTicker(operacoes[0].ativo) ? "USD" : "BRL";

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <main className="flex-1 overflow-auto">
          <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/50">
            <div className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="text-muted-foreground hover:text-foreground">
                  <Menu className="w-5 h-5" />
                </SidebarTrigger>
                <Button variant="ghost" size="icon" onClick={() => navigate("/notas-corretagem")}>
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Detalhes da Nota</h1>
                  <p className="text-sm text-muted-foreground">Operações extraídas da nota de corretagem</p>
                </div>
              </div>
            </div>
          </header>

          <div className="p-6 space-y-6">
            {loadingData ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : !nota ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Nota não encontrada</p>
              </div>
            ) : (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="bg-card border-border/50">
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Corretora</p>
                        <p className="font-semibold text-foreground">{nota.corretora}</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-card border-border/50">
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Calendar className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Data do Pregão</p>
                        <p className="font-semibold text-foreground">
                          {nota.data_operacao
                            ? new Date(nota.data_operacao + "T12:00:00").toLocaleDateString("pt-BR")
                            : "Sem data"}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-card border-border/50">
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Receipt className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Taxas Totais</p>
                        <p className="font-semibold text-foreground">
                          {formatCurrency(nota.taxas || 0, notaCurrency)}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-card border-border/50">
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Hash className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Nº da Nota</p>
                        <p className="font-semibold text-foreground text-xs">
                          {nota.id.split("-")[0].toUpperCase()}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Totals */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Card className="bg-card border-border/50">
                    <CardContent className="p-4 text-center">
                      <p className="text-xs text-muted-foreground mb-1">Total Compras</p>
                      <p className="text-lg font-bold text-primary">{formatCurrency(totalCompras, notaCurrency)}</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-card border-border/50">
                    <CardContent className="p-4 text-center">
                      <p className="text-xs text-muted-foreground mb-1">Total Vendas</p>
                      <p className="text-lg font-bold text-destructive">{formatCurrency(totalVendas, notaCurrency)}</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-card border-border/50">
                    <CardContent className="p-4 text-center">
                      <p className="text-xs text-muted-foreground mb-1">Total Negociado</p>
                      <p className="text-lg font-bold text-primary">{formatCurrency(totalNegociado, notaCurrency)}</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Itemized Fees */}
                {nota.taxas_detalhadas && Object.values(nota.taxas_detalhadas).some((v) => v && v > 0) && (
                  <Card className="bg-card border-border/50">
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
                        <Receipt className="w-5 h-5 text-primary" />
                        Taxas Discriminadas
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                        {[
                          { key: "taxa_liquidacao", label: "Taxa de Liquidação" },
                          { key: "emolumentos", label: "Emolumentos B3" },
                          { key: "corretagem", label: "Taxa de Corretagem" },
                          { key: "iss", label: "ISS (Imposto sobre Serviço)" },
                          { key: "irrf", label: "IRRF (Imposto de Renda)" },
                          { key: "taxa_registro", label: "Taxa de Registro BM&F" },
                          { key: "taxa_ana", label: "Taxa ANA (Aviso de Negociação)" },
                          { key: "taxa_custodia", label: "Taxa de Custódia" },
                          { key: "outras", label: "Outras Taxas" },
                        ]
                          .filter(({ key }) => {
                            const val = nota.taxas_detalhadas?.[key as keyof TaxasDetalhadas];
                            return val !== undefined && val !== null && val > 0;
                          })
                          .map(({ key, label }) => (
                            <div key={key} className="bg-muted/30 rounded-lg p-3">
                              <p className="text-xs text-muted-foreground">{label}</p>
                              <p className="font-semibold text-foreground">
                                {formatCurrency(nota.taxas_detalhadas![key as keyof TaxasDetalhadas] || 0, notaCurrency)}
                              </p>
                            </div>
                          ))}
                      </div>
                      <div className="mt-3 pt-3 border-t border-border/50 flex justify-between items-center">
                        <span className="text-sm font-medium text-muted-foreground">Total de Taxas</span>
                        <span className="text-lg font-bold text-primary">{formatCurrency(nota.taxas || 0, notaCurrency)}</span>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Operations Table */}
                <Card className="bg-card border-border/50">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-primary" />
                      Ativos Negociados
                      <Badge variant="secondary" className="ml-2">{operacoes.length} operações</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {operacoes.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>Nenhuma operação nesta nota</p>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Ativo</TableHead>
                            <TableHead className="text-right">Quantidade</TableHead>
                            <TableHead className="text-right">Preço Unit.</TableHead>
                            <TableHead className="text-right">Valor Total</TableHead>
                            <TableHead className="text-center">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {operacoes.map((op) => (
                            <TableRow key={op.id}>
                              <TableCell>
                                <Badge
                                  variant={op.tipo === "C" ? "default" : "destructive"}
                                  className={op.tipo === "C" ? "bg-green-500/20 text-green-600 hover:bg-green-500/30" : ""}
                                >
                                  {op.tipo === "C" ? (
                                    <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Compra</span>
                                  ) : (
                                    <span className="flex items-center gap-1"><TrendingDown className="w-3 h-3" /> Venda</span>
                                  )}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <button
                                  onClick={() => navigate(`/ativo/${op.ativo}`)}
                                  className="font-semibold text-primary underline underline-offset-2 hover:text-primary/80 transition-colors"
                                >
                                  {op.ativo}
                                </button>
                              </TableCell>
                              <TableCell className="text-right font-medium">{op.quantidade}</TableCell>
                              <TableCell className="text-right font-medium">{formatCurrency(op.preco_unitario, isBrazilianTicker(op.ativo) ? "BRL" : "USD")}</TableCell>
                              <TableCell className="text-right font-medium text-primary">{formatCurrency(op.valor_total, isBrazilianTicker(op.ativo) ? "BRL" : "USD")}</TableCell>
                              <TableCell className="text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-primary"
                                    onClick={() => handleEditOp(op)}
                                    title="Editar operação"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                    onClick={() => handleDeleteOp(op.id)}
                                    disabled={deletingOp === op.id}
                                    title="Remover operação"
                                  >
                                    {deletingOp === op.id ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <Trash2 className="w-4 h-4" />
                                    )}
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                          <TableRow className="bg-muted/30 font-bold">
                            <TableCell colSpan={4}>Total</TableCell>
                            <TableCell className="text-right text-primary">{formatCurrency(totalNegociado, notaCurrency)}</TableCell>
                            <TableCell />
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

      {/* Edit Operation Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Editar Operação</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-muted-foreground">Tipo</Label>
              <Select value={editTipo} onValueChange={setEditTipo}>
                <SelectTrigger className="bg-muted/50 border-border/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="C">Compra</SelectItem>
                  <SelectItem value="V">Venda</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">Ativo</Label>
              <Input
                value={editAtivo}
                onChange={(e) => setEditAtivo(e.target.value.toUpperCase())}
                className="bg-muted/50 border-border/50"
                placeholder="Ex: PETR4"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-muted-foreground">Quantidade</Label>
                <Input
                  type="number"
                  value={editQuantidade}
                  onChange={(e) => setEditQuantidade(e.target.value)}
                  className="bg-muted/50 border-border/50"
                  min="0"
                  step="any"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Preço Unitário (R$)</Label>
                <Input
                  type="number"
                  value={editPreco}
                  onChange={(e) => setEditPreco(e.target.value)}
                  className="bg-muted/50 border-border/50"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
            {editQuantidade && editPreco && (
              <div className="bg-muted/30 rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground">Valor Total</p>
                <p className="text-lg font-bold text-primary">
                  {formatCurrency(parseFloat(editQuantidade || "0") * parseFloat(editPreco || "0"), notaCurrency)}
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateOp} disabled={savingEdit || !editAtivo || !editQuantidade || !editPreco}>
              {savingEdit ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
};

export default NotaDetalhes;
