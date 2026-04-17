import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Users, UserPlus, Crown, Loader2, ShieldCheck, ClipboardList, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

const ADMIN_EMAIL = "josue.oliver@hotmail.com";

interface UserProfile {
  id: string;
  nome: string | null;
  email: string | null;
  cpf: string | null;
  created_at: string;
}

interface SignupAttempt {
  id: string;
  nome: string | null;
  email: string;
  status: string;
  error_message: string | null;
  created_at: string;
}

interface UserSubscription {
  user_id: string;
  plan: string;
  status: string;
  starts_at: string;
  expires_at: string | null;
}

const Admin = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([]);
  const [signupAttempts, setSignupAttempts] = useState<SignupAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && (!user || user.email !== ADMIN_EMAIL)) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user || user.email !== ADMIN_EMAIL) return;
    fetchData();
  }, [user]);

  const fetchData = async () => {
    const [profilesRes, subsRes, attemptsRes] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("user_subscriptions").select("*"),
      supabase.from("signup_attempts").select("*").order("created_at", { ascending: false }) as any,
    ]);

    if (profilesRes.data) setProfiles(profilesRes.data);
    if (subsRes.data) setSubscriptions(subsRes.data);
    if (attemptsRes.data) setSignupAttempts(attemptsRes.data);
    setLoading(false);
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    setDeletingUserId(userId);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-user`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ user_id: userId }),
        }
      );

      const result = await res.json();
      if (!res.ok) throw new Error(result.error);

      toast({ title: "Usuário excluído", description: `${userName} foi removido com sucesso.` });
      setProfiles((prev) => prev.filter((p) => p.id !== userId));
      setSubscriptions((prev) => prev.filter((s) => s.user_id !== userId));
    } catch (err: any) {
      toast({ title: "Erro ao excluir", description: err.message, variant: "destructive" });
    } finally {
      setDeletingUserId(null);
    }
  };

  const getSubscription = (userId: string) => {
    return subscriptions.find((s) => s.user_id === userId);
  };

  const getPlanBadge = (plan: string) => {
    const colors: Record<string, string> = {
      basic: "bg-muted text-muted-foreground",
      premium: "bg-primary/20 text-primary",
      platinum: "bg-accent/20 text-accent-foreground",
    };
    const labels: Record<string, string> = {
      basic: "Básico",
      premium: "Premium",
      platinum: "Platinum",
    };
    return <Badge className={colors[plan] || ""}>{labels[plan] || plan}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      active: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
      expired: "bg-yellow-100 text-yellow-800",
    };
    const labels: Record<string, string> = {
      active: "Ativo",
      cancelled: "Cancelado",
      expired: "Expirado",
    };
    return <Badge className={colors[status] || ""}>{labels[status] || status}</Badge>;
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || user.email !== ADMIN_EMAIL) return null;

  const totalUsers = profiles.length;
  const today = new Date().toISOString().split("T")[0];
  const newToday = profiles.filter((p) => p.created_at.startsWith(today)).length;
  const premiumUsers = subscriptions.filter((s) => s.plan !== "basic" && s.status === "active").length;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <main className="flex-1 overflow-auto">
          <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/50">
            <div className="flex items-center gap-4 px-4 md:px-6 py-3 md:py-4">
              <SidebarTrigger className="text-muted-foreground" />
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-primary" />
                <h1 className="text-xl md:text-2xl font-bold text-foreground">Painel Administrativo</h1>
              </div>
            </div>
          </header>

          <div className="p-4 md:p-6 space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card>
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="p-3 rounded-xl bg-primary/10">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total de Usuários</p>
                    <p className="text-2xl font-bold text-foreground">{totalUsers}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="p-3 rounded-xl bg-green-100">
                    <UserPlus className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Novos Hoje</p>
                    <p className="text-2xl font-bold text-foreground">{newToday}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="p-3 rounded-xl bg-accent/10">
                    <Crown className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Planos Pagos</p>
                    <p className="text-2xl font-bold text-foreground">{premiumUsers}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Users Table */}
            <Card>
              <CardHeader>
                <CardTitle>Usuários Cadastrados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>E-mail</TableHead>
                        <TableHead>Plano</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Cadastro</TableHead>
                        <TableHead>Expira em</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {profiles.map((profile) => {
                        const sub = getSubscription(profile.id);
                        const isAdmin = profile.email === ADMIN_EMAIL;
                        return (
                          <TableRow key={profile.id}>
                            <TableCell className="font-medium">{profile.nome || "—"}</TableCell>
                            <TableCell>{profile.email || "—"}</TableCell>
                            <TableCell>{sub ? getPlanBadge(sub.plan) : "—"}</TableCell>
                            <TableCell>{sub ? getStatusBadge(sub.status) : "—"}</TableCell>
                            <TableCell>
                              {format(new Date(profile.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                            </TableCell>
                            <TableCell>
                              {sub?.expires_at
                                ? format(new Date(sub.expires_at), "dd/MM/yyyy", { locale: ptBR })
                                : "—"}
                            </TableCell>
                            <TableCell className="text-right">
                              {!isAdmin && (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Excluir usuário</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Tem certeza que deseja excluir <strong>{profile.nome || profile.email}</strong>? Esta ação é irreversível e removerá todos os dados do usuário.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleDeleteUser(profile.id, profile.nome || profile.email || "")}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        disabled={deletingUserId === profile.id}
                                      >
                                        {deletingUserId === profile.id ? (
                                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                        ) : (
                                          <Trash2 className="w-4 h-4 mr-2" />
                                        )}
                                        Excluir
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Signup Attempts Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-primary" />
                  Tentativas de Cadastro
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>E-mail</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Erro</TableHead>
                        <TableHead>Data/Hora</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {signupAttempts.map((attempt) => (
                        <TableRow key={attempt.id}>
                          <TableCell className="font-medium">{attempt.nome || "—"}</TableCell>
                          <TableCell>{attempt.email}</TableCell>
                          <TableCell>
                            <Badge className={attempt.status === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                              {attempt.status === "success" ? "Sucesso" : "Falhou"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                            {attempt.error_message || "—"}
                          </TableCell>
                          <TableCell>
                            {format(new Date(attempt.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                          </TableCell>
                        </TableRow>
                      ))}
                      {signupAttempts.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                            Nenhuma tentativa registrada
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Admin;
