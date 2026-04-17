import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { User, Lock, Save, Camera, Loader2, Eye, EyeOff, Gift, Menu } from "lucide-react";
import { usePlan } from "@/hooks/usePlan";
import PasswordRequirements, { isPasswordValid } from "@/components/PasswordRequirements";

const Configuracoes = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [promoCode, setPromoCode] = useState("");
  const [applyingPromo, setApplyingPromo] = useState(false);
  const { plan, loading: loadingPlan } = usePlan();

  const handleApplyPromo = async () => {
    if (promoCode.trim().toUpperCase() !== "DECLARECERTO") {
      toast({ title: "Código inválido", description: "O código promocional informado não é válido.", variant: "destructive" });
      return;
    }
    if (plan === "platinum") {
      toast({ title: "Você já possui o plano Platinum", description: "Seu plano já está ativo." });
      return;
    }
    setApplyingPromo(true);
    try {
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 3);

      const { error } = await supabase
        .from("user_subscriptions")
        .update({ plan: "platinum", status: "active", expires_at: expiresAt.toISOString() } as any)
        .eq("user_id", user!.id);

      if (error) throw error;

      toast({ title: "🎉 Código aplicado com sucesso!", description: "Você tem acesso Platinum por 3 meses." });
      setPromoCode("");
      // Reload to reflect new plan
      window.location.reload();
    } catch (error) {
      console.error("Erro ao aplicar código:", error);
      toast({ title: "Erro ao aplicar código", description: "Tente novamente mais tarde.", variant: "destructive" });
    } finally {
      setApplyingPromo(false);
    }
  };

  useEffect(() => {
    if (!loading && !user) {
      navigate("/");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error || !data) {
      // Profile doesn't exist — create one
      const { error: insertError } = await supabase
        .from("profiles")
        .insert({ id: user.id, nome: user.user_metadata?.nome || "", email: user.email || "" });
      if (!insertError) {
        setNome(user.user_metadata?.nome || "");
        setEmail(user.email || "");
      }
      return;
    }

    setNome(data.nome || "");
    setEmail(data.email || user.email || "");
    if (data.avatar_url) {
      let filePath = data.avatar_url;
      const marker = "/object/public/avatars/";
      const idx = filePath.indexOf(marker);
      if (idx !== -1) {
        filePath = filePath.substring(idx + marker.length).split("?")[0];
      }
      const { data: signedData } = await supabase.storage
        .from("avatars")
        .createSignedUrl(filePath, 3600);
      setAvatarUrl(signedData?.signedUrl || null);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "Arquivo inválido", description: "Selecione uma imagem (JPG, PNG, etc.)", variant: "destructive" });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "Arquivo muito grande", description: "A imagem deve ter no máximo 2MB.", variant: "destructive" });
      return;
    }

    setUploadingAvatar(true);
    try {
      const ext = file.name.split(".").pop();
      const filePath = `${user.id}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Save just the file path in the profile
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: filePath })
        .eq("id", user.id);

      if (updateError) throw updateError;

      // Get a signed URL for display
      const { data: signedData } = await supabase.storage
        .from("avatars")
        .createSignedUrl(filePath, 3600);

      setAvatarUrl(signedData?.signedUrl || null);
      toast({ title: "Foto atualizada", description: "Sua foto de perfil foi salva com sucesso." });
    } catch (err: any) {
      toast({ title: "Erro ao enviar foto", description: err.message, variant: "destructive" });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSavingProfile(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ nome })
        .eq("id", user.id);

      if (error) throw error;

      toast({ title: "Perfil atualizado", description: "Seus dados foram salvos com sucesso." });
    } catch (err: any) {
      toast({ title: "Erro ao salvar", description: err.message, variant: "destructive" });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword) {
      toast({ title: "Senha atual obrigatória", description: "Digite sua senha atual para confirmar a alteração.", variant: "destructive" });
      return;
    }
    if (!isPasswordValid(newPassword)) {
      toast({ title: "Senha fraca", description: "A nova senha não atende aos requisitos mínimos de segurança.", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Senhas não conferem", description: "A nova senha e a confirmação devem ser iguais.", variant: "destructive" });
      return;
    }

    setSavingPassword(true);
    try {
      // Verify current password by re-authenticating
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || "",
        password: currentPassword,
      });

      if (signInError) {
        toast({ title: "Senha atual incorreta", description: "A senha atual informada está incorreta.", variant: "destructive" });
        return;
      }

      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      toast({ title: "Senha alterada", description: "Sua senha foi atualizada com sucesso." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast({ title: "Erro ao alterar senha", description: err.message, variant: "destructive" });
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <main className="flex-1 p-4 md:p-8 overflow-auto">
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground md:hidden">
                <Menu className="w-5 h-5" />
              </SidebarTrigger>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-foreground">Configurações</h1>
                <p className="text-xs md:text-sm text-muted-foreground">Gerencie seus dados pessoais e senha</p>
              </div>
            </div>

            {/* Dados do Perfil */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  <CardTitle className="text-lg">Dados Pessoais</CardTitle>
                </div>
                <CardDescription>Visualize e edite suas informações</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Avatar Upload */}
                <div className="flex items-center gap-4">
                  <div className="relative group">
                    <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-border bg-muted flex items-center justify-center">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-8 h-8 text-muted-foreground" />
                      )}
                    </div>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingAvatar}
                      className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    >
                      {uploadingAvatar ? (
                        <Loader2 className="w-5 h-5 text-white animate-spin" />
                      ) : (
                        <Camera className="w-5 h-5 text-white" />
                      )}
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarUpload}
                    />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Foto de perfil</p>
                    <p className="text-xs text-muted-foreground">JPG ou PNG, máximo 2MB</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-1"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingAvatar}
                    >
                      {uploadingAvatar ? "Enviando..." : "Alterar foto"}
                    </Button>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="nome">Nome</Label>
                  <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Seu nome completo" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input id="email" value={email} disabled className="opacity-60" />
                  <p className="text-xs text-muted-foreground">O e-mail não pode ser alterado</p>
                </div>
                <Button onClick={handleSaveProfile} disabled={savingProfile} className="w-full sm:w-auto">
                  <Save className="w-4 h-4 mr-2" />
                  {savingProfile ? "Salvando..." : "Salvar Alterações"}
                </Button>
              </CardContent>
            </Card>

            <Separator />

            {/* Alterar Senha */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Lock className="w-5 h-5 text-primary" />
                  <CardTitle className="text-lg">Alterar Senha</CardTitle>
                </div>
                <CardDescription>Atualize sua senha de acesso</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Senha Atual</Label>
                  <div className="relative">
                    <Input id="currentPassword" type={showCurrentPassword ? "text" : "password"} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Digite sua senha atual" className="pr-10" />
                    <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                      {showCurrentPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nova Senha</Label>
                  <div className="relative">
                    <Input id="newPassword" type={showNewPassword ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Mínimo 8 caracteres" className="pr-10" />
                    <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                      {showNewPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                  </div>
                  <PasswordRequirements password={newPassword} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                  <div className="relative">
                    <Input id="confirmPassword" type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repita a nova senha" className="pr-10" />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                      {showConfirmPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <Button onClick={handleChangePassword} disabled={savingPassword || !currentPassword || !newPassword || !confirmPassword} className="w-full sm:w-auto">
                  <Lock className="w-4 h-4 mr-2" />
                  {savingPassword ? "Alterando..." : "Alterar Senha"}
                </Button>
              </CardContent>
            </Card>
            {/* Código Promocional */}
            <Card className="bg-card border-border/50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Gift className="w-5 h-5 text-primary" />
                  Código Promocional
                </CardTitle>
                <CardDescription>
                  {!loadingPlan && plan !== "basic"
                    ? `Seu plano atual: ${plan.charAt(0).toUpperCase() + plan.slice(1)}`
                    : "Insira um código para desbloquear recursos premium"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3">
                  <Input
                    placeholder="Digite o código promocional"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={handleApplyPromo} disabled={applyingPromo || !promoCode.trim()}>
                    {applyingPromo ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Gift className="w-4 h-4 mr-2" />}
                    Aplicar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Configuracoes;
