import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, User, ArrowLeft, Loader2, ClipboardCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import PasswordRequirements, { isPasswordValid } from "@/components/PasswordRequirements";
import heroBg from "@/assets/hero-bg.jpg";
const Cadastro = () => {
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const {
    signUp,
    user,
    loading: authLoading
  } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  useEffect(() => {
    if (user && !authLoading) {
      navigate("/dashboard");
    }
  }, [user, authLoading, navigate]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome || !email || !password || !confirmPassword) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }
    if (password !== confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem",
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
    if (!acceptTerms) {
      toast({
        title: "Erro",
        description: "Você precisa aceitar os termos de uso",
        variant: "destructive"
      });
      return;
    }
    setIsLoading(true);


    const {
      error
    } = await signUp(email, password, {
      nome
    });
    setIsLoading(false);

    // Log signup attempt
    supabase.from("signup_attempts").insert({
      nome,
      email,
      status: error ? "failed" : "success",
      error_message: error?.message || null,
    } as any);

    if (error) {
      let description = error.message;
      if (error.message === "User already registered") {
        description = "Este e-mail já está cadastrado";
      } else if (error.message.includes("Password is known to be weak and easy to guess")) {
        description = "Essa senha foi identificada como fraca, comum ou já exposta em vazamentos. Escolha uma senha mais forte e menos previsível.";
      }
      toast({
        title: "Erro ao cadastrar",
        description,
        variant: "destructive"
      });
      return;
    }
    // Notify admin about new signup
    supabase.functions.invoke("notify-new-signup", {
      body: { nome, email },
    }).catch(console.error);

    toast({
      title: "Cadastro realizado!",
      description: "Bem-vindo ao DECLARE CERTO"
    });
    navigate("/dashboard");
  };
  return <div className="min-h-screen relative overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{
      backgroundImage: `url(${heroBg})`
    }}>
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

            {/* Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <Link to="/" className="text-background/90 hover:text-background transition-colors">
                INÍCIO
              </Link>
              <Link to="/planos" className="text-background/90 hover:text-background transition-colors">
                PLANOS
              </Link>
            </div>

            {/* CTA Button */}
            <Button variant="default" size="default" className="hidden md:flex">
              MINHA CONTA
            </Button>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex items-center justify-center min-h-[calc(100vh-100px)] px-4 py-8">
        <div className="w-full max-w-md animate-fade-up">
          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-background mb-2">Criar Conta</h1>
            <p className="text-background/70 text-sm">Preencha seus dados para começar</p>
          </div>

          {/* Register Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nome Input */}
            <div className="relative">
              <Input type="text" placeholder="Nome completo" value={nome} onChange={(e) => setNome(e.target.value)} className="h-14 pl-4 pr-12 bg-background/95 backdrop-blur-sm border-transparent focus:border-primary" />
              <User className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            </div>

            {/* Email Input */}
            <div className="relative">
              <Input type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} className="h-14 pl-4 pr-12 bg-background/95 backdrop-blur-sm border-transparent focus:border-primary" />
              <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            </div>


            {/* Password Input */}
            <div>
              <div className="relative">
                <Input type={showPassword ? "text" : "password"} placeholder="Senha" value={password} onChange={(e) => setPassword(e.target.value)} className="h-14 pl-4 pr-12 bg-background/95 backdrop-blur-sm border-transparent focus:border-primary" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <PasswordRequirements password={password} variant="light" />
            </div>

            {/* Confirm Password Input */}
            <div className="relative">
              <Input type={showConfirmPassword ? "text" : "password"} placeholder="Confirmar senha" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="h-14 pl-4 pr-12 bg-background/95 backdrop-blur-sm border-transparent focus:border-primary" />
              <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {/* Terms */}
            <div className="flex items-start gap-3 animate-fade-up-delay">
              <Checkbox id="terms" checked={acceptTerms} onCheckedChange={(checked) => setAcceptTerms(checked as boolean)} className="border-background/60 data-[state=checked]:bg-primary data-[state=checked]:border-primary mt-0.5" />
              <label htmlFor="terms" className="text-sm text-background/90 cursor-pointer select-none leading-relaxed">
                Concordo com os{" "}
                <span className="underline cursor-pointer hover:opacity-80" onClick={(e) => { e.preventDefault(); navigate("/termos"); }}>
                  Termos de Uso e Política de Privacidade
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <Button type="submit" size="lg" className="w-full animate-pulse-glow" disabled={isLoading}>
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "CADASTRAR"}
            </Button>
          </form>

          {/* Back to Login */}
          <div className="mt-8 text-center animate-fade-up-delay">
            <Link to="/" className="inline-flex items-center gap-2 transition-colors font-medium text-secondary">
              <ArrowLeft className="w-5 h-5" />
              Já possui conta? Faça login
            </Link>
          </div>
        </div>
      </main>
    </div>;
};
export default Cadastro;