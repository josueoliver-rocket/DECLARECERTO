import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, UserPlus, Loader2, ClipboardCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import heroBg from "@/assets/hero-bg.jpg";
const Login = () => {
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const {
    signIn,
    user,
    loading: authLoading
  } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  useEffect(() => {
    if (user && !authLoading) {
      navigate("/dashboard");
    }
  }, [user, authLoading, navigate]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos",
        variant: "destructive"
      });
      return;
    }
    setIsLoading(true);

    // Check if account is locked
    const { data: lockData } = await supabase.rpc("check_login_locked", { p_email: email }) as { data: { locked: boolean; attempts: number } | null };
    if (lockData?.locked) {
      setIsLoading(false);
      toast({
        title: "Conta bloqueada",
        description: "Sua conta foi bloqueada após 3 tentativas incorretas. Use 'Esqueci minha senha' para desbloquear.",
        variant: "destructive"
      });
      return;
    }

    const { error } = await signIn(email, password);
    setIsLoading(false);

    if (error) {
      // Increment failed attempts
      const { data: attemptData } = await supabase.rpc("increment_login_attempts", { p_email: email }) as { data: { locked: boolean; attempts: number } | null };
      const remaining = 3 - (attemptData?.attempts || 0);

      if (attemptData?.locked) {
        toast({
          title: "Conta bloqueada",
          description: "Sua conta foi bloqueada após 3 tentativas incorretas. Use 'Esqueci minha senha' para desbloquear.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Erro ao entrar",
          description: `Email ou senha incorretos. ${remaining > 0 ? `Restam ${remaining} tentativa(s).` : ""}`,
          variant: "destructive"
        });
      }
      return;
    }

    // Reset attempts on successful login
    await supabase.rpc("reset_login_attempts", { p_email: email });

    toast({
      title: "Bem-vindo!",
      description: "Login realizado com sucesso"
    });
    navigate("/dashboard");
  };
  return <div className="min-h-screen relative overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{
      backgroundImage: `url(${heroBg})`
    }}>
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(210,50%,8%)]/60 via-[hsl(160,40%,10%)]/40 to-[hsl(210,50%,8%)]/60" />
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

            {/* Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <Link to="/" className="text-background/90 hover:text-background transition-colors">
                INÍCIO
              </Link>
              <Link to="/planos" className="text-background/90 hover:text-background transition-colors">
                PLANOS
              </Link>
            </div>

          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex items-center justify-center min-h-[calc(100vh-140px)] px-4">
        <div className="w-full max-w-md animate-fade-up">
          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Input */}
            <div className="relative">
              <Input type="text" placeholder="E-mail ou CPF" value={email} onChange={(e) => setEmail(e.target.value)} className="h-14 pl-4 pr-12 bg-white/10 backdrop-blur-md border-white/20 text-white placeholder:text-white/50 focus:border-primary" />
              <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
            </div>

            {/* Password Input */}
            <div className="relative">
              <Input type={showPassword ? "text" : "password"} placeholder="Senha" value={password} onChange={(e) => setPassword(e.target.value)} className="h-14 pl-4 pr-12 bg-white/10 backdrop-blur-md border-white/20 text-white placeholder:text-white/50 focus:border-primary" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors">
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {/* Remember Me */}
            <div className="flex items-center gap-3 animate-fade-up-delay">
              <Checkbox id="remember" checked={rememberMe} onCheckedChange={(checked) => setRememberMe(checked as boolean)} className="border-white/40 data-[state=checked]:bg-primary data-[state=checked]:border-primary" />
              <label htmlFor="remember" className="text-sm text-white/80 cursor-pointer select-none">
                Lembrar de mim?
              </label>
            </div>

            {/* Submit Button */}
            <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "ENTRAR"}
            </Button>
          </form>

          {/* Forgot Password */}
          <div className="mt-6 text-center animate-fade-up-delay">
            <Link to="/recuperar-senha" className="transition-colors text-sm font-medium text-white/70 hover:text-white">
              Esqueceu sua senha?
            </Link>
          </div>

          {/* Register CTA */}
          <div className="mt-8 text-center space-y-3 animate-fade-up-delay">
            <p className="text-white/60 text-center text-base font-bold">Não possui cadastro?</p>
            <Link to="/cadastro" className="inline-flex items-center gap-2 transition-colors font-medium text-primary hover:text-primary/80">
              <UserPlus className="w-5 h-5" />
              Cadastre agora e confira nossos serviços
            </Link>
          </div>
        </div>
      </main>

      {/* Footer - full width */}
      <footer className="relative z-10 w-full border-t border-white/10 bg-white/5 backdrop-blur-md px-6 py-3">
        <div className="container mx-auto flex items-center justify-between gap-6 text-xs">
          <p className="text-white/90 font-bold tracking-wide whitespace-nowrap">QUEM SOMOS</p>
          <span className="text-white/20">|</span>
          <p className="text-white/50 flex-1">
            Plataforma inteligente que simplifica a declaração de imposto de renda para investidores.
          </p>
          <span className="text-white/20">|</span>
          <Link to="/termos" className="text-white/50 hover:text-white transition-colors underline whitespace-nowrap">
            Termos e Privacidade
          </Link>
          <span className="text-white/20">|</span>
          <p className="text-white/30 whitespace-nowrap">© 2026 DECLARE CERTO — Todos os direitos reservados</p>
        </div>
      </footer>
    </div>;
};
export default Login;