import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowLeft, Loader2, CheckCircle, ClipboardCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import heroBg from "@/assets/hero-bg.jpg";

const RecuperarSenha = () => {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast({
        title: "Erro",
        description: "Informe seu e-mail",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/redefinir-senha`
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

    setEmailSent(true);
    toast({
      title: "E-mail enviado!",
      description: "Verifique sua caixa de entrada"
    });
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroBg})` }}>

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
              <Link
                to="/"
                className="text-background/90 hover:text-background transition-colors">

                INÍCIO
              </Link>
              <Link
                to="/planos"
                className="text-background/90 hover:text-background transition-colors">

                PLANOS
              </Link>
              <Link
                to="/duvidas"
                className="text-background/90 hover:text-background transition-colors">

                DÚVIDAS
              </Link>
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
          {!emailSent ?
          <>
              {/* Title */}
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-background mb-2">
                  Recuperar Senha
                </h1>
                <p className="text-background/70 text-sm">
                  Informe seu e-mail para receber as instruções de recuperação
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email Input */}
                <div className="relative">
                  <Input
                  type="email"
                  placeholder="Seu e-mail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-14 pl-4 pr-12 bg-background/95 backdrop-blur-sm border-transparent focus:border-primary" />

                  <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                </div>

                {/* Submit Button */}
                <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={isLoading}>

                  {isLoading ?
                <Loader2 className="w-5 h-5 animate-spin" /> :

                "ENVIAR INSTRUÇÕES"
                }
                </Button>
              </form>
            </> : (

          /* Success State */
          <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-xl font-bold text-background">
                E-mail enviado!
              </h2>
              <p className="text-background/70 text-sm">
                Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.
              </p>
            </div>)
          }

          {/* Back to Login */}
          <div className="mt-8 text-center">
            <Link
              to="/"
              className="inline-flex items-center gap-2 transition-colors text-secondary font-bold">

              <ArrowLeft className="w-4 h-4" />
              Voltar para o login
            </Link>
          </div>
        </div>
      </main>
    </div>);

};

export default RecuperarSenha;