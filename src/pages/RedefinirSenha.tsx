import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, Loader2, CheckCircle, ClipboardCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import PasswordRequirements, { isPasswordValid } from "@/components/PasswordRequirements";
import heroBg from "@/assets/hero-bg.jpg";

const RedefinirSenha = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    // Check if user came from password reset email
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        setIsValidSession(true);
      } else {
        toast({
          title: "Link inválido",
          description: "O link de redefinição expirou ou é inválido. Solicite um novo.",
          variant: "destructive"
        });
      }
      setCheckingSession(false);
    };

    checkSession();
  }, [toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password || !confirmPassword) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos",
        variant: "destructive"
      });
      return;
    }

    if (!isPasswordValid(password)) {
      toast({
        title: "Erro",
        description: "A senha não atende aos requisitos mínimos de segurança",
        variant: "destructive"
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não conferem",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    const { error } = await supabase.auth.updateUser({
      password: password
    });

    setIsLoading(false);

    if (error) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
      return;
    }

    // Reset login attempts to unlock the account
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.email) {
      await supabase.rpc("reset_login_attempts", { p_email: session.user.email });
    }

    // Sign out after password change
    await supabase.auth.signOut();

    setIsSuccess(true);
    toast({
      title: "Senha alterada!",
      description: "Sua senha foi redefinida com sucesso"
    });
  };

  const handleGoToLogin = () => {
    navigate("/");
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroBg})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-foreground/70 via-foreground/50 to-foreground/70" />
      </div>

      {/* Header */}
      <header className="relative z-10">
        <nav className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <ClipboardCheck className="w-8 h-8 text-primary" />
              <span className="text-xl font-bold text-background">DECLARE CERTO</span>
            </div>

            {/* CTA Button */}
            <Button variant="default" size="default" className="hidden md:flex" asChild>
              <Link to="/">ENTRAR</Link>
            </Button>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex items-center justify-center min-h-[calc(100vh-100px)] px-4">
        <div className="w-full max-w-md animate-fade-up">
          {!isValidSession ? (
            /* Invalid Session */
            <div className="text-center space-y-4">
              <h2 className="text-xl font-bold text-background">
                Link Inválido
              </h2>
              <p className="text-background/70 text-sm">
                O link de redefinição expirou ou é inválido.
              </p>
              <Button onClick={() => navigate("/recuperar-senha")} className="mt-4">
                Solicitar novo link
              </Button>
            </div>
          ) : !isSuccess ? (
            <>
              {/* Title */}
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-background mb-2">
                  Redefinir Senha
                </h1>
                <p className="text-background/70 text-sm">
                  Digite sua nova senha
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* New Password */}
                <div>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Nova senha"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-14 pl-4 pr-12 bg-background/95 backdrop-blur-sm border-transparent focus:border-primary"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <PasswordRequirements password={password} variant="light" />
                </div>

                {/* Confirm Password */}
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirmar nova senha"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-14 pl-4 pr-12 bg-background/95 backdrop-blur-sm border-transparent focus:border-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    "REDEFINIR SENHA"
                  )}
                </Button>
              </form>
            </>
          ) : (
            /* Success State */
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-xl font-bold text-background">
                Senha Redefinida!
              </h2>
              <p className="text-background/70 text-sm">
                Sua senha foi alterada com sucesso. Faça login com sua nova senha.
              </p>
              <Button onClick={handleGoToLogin} className="mt-4">
                IR PARA O LOGIN
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default RedefinirSenha;
