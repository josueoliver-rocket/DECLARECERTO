import { Link } from "react-router-dom";
import { ClipboardCheck, BarChart3, FileText, Shield, TrendingUp, ArrowRight, Star, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroBg from "@/assets/hero-bg.jpg";

const features = [
  {
    icon: FileText,
    title: "Importação Automática",
    description: "Importe suas notas de corretagem em PDF e deixe o sistema extrair todas as operações automaticamente.",
  },
  {
    icon: BarChart3,
    title: "Carteira em Tempo Real",
    description: "Acompanhe seus ativos, preço médio, rentabilidade e cotações atualizadas em um só lugar.",
  },
  {
    icon: Shield,
    title: "Declaração de IR Simplificada",
    description: "Gere relatórios prontos para a declaração do Imposto de Renda sem dor de cabeça.",
  },
  {
    icon: TrendingUp,
    title: "Análise de Rentabilidade",
    description: "Compare o desempenho da sua carteira com benchmarks como CDI, IBOV e dólar.",
  },
];

const testimonials = [
  {
    name: "Carlos M.",
    role: "Investidor desde 2020",
    text: "Antes eu gastava horas em planilhas para calcular meu preço médio. Com o Declare Certo, faço tudo em minutos!",
    rating: 5,
  },
  {
    name: "Ana Paula S.",
    role: "Day Trader",
    text: "A importação automática das notas de corretagem é incrível. Nunca mais errei na declaração do IR.",
    rating: 5,
  },
  {
    name: "Roberto L.",
    role: "Investidor de longo prazo",
    text: "Finalmente uma plataforma que simplifica de verdade. Recomendo para todos os investidores.",
    rating: 5,
  },
];

const steps = [
  { step: "01", title: "Crie sua conta", description: "Cadastre-se gratuitamente em menos de 1 minuto." },
  { step: "02", title: "Importe suas notas", description: "Envie os PDFs das notas de corretagem da sua corretora." },
  { step: "03", title: "Acompanhe tudo", description: "Veja sua carteira, rentabilidade e relatórios para o IR automaticamente." },
];

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
        <nav className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ClipboardCheck className="w-7 h-7 text-primary" />
            <span className="text-lg font-bold text-foreground">DECLARE CERTO</span>
          </div>
          <div className="hidden md:flex items-center gap-6">
            <a href="#funcionalidades" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Funcionalidades</a>
            <a href="#como-funciona" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Como Funciona</a>
            <a href="#depoimentos" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Depoimentos</a>
            <Link to="/planos" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Planos</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm">Entrar</Button>
            </Link>
            <Link to="/cadastro">
              <Button size="sm">Criar Conta</Button>
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${heroBg})` }}>
          <div className="absolute inset-0 bg-gradient-to-br from-[hsl(210,50%,8%)]/80 via-[hsl(160,40%,10%)]/60 to-[hsl(210,50%,8%)]/80" />
        </div>
        <div className="relative z-10 container mx-auto px-6 text-center max-w-4xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8">
            <span className="text-sm font-medium text-primary">✨ Plataforma inteligente para investidores</span>
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6">
            Esqueça as <span className="text-primary">planilhas.</span>
          </h1>
          <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto mb-10 leading-relaxed">
            Tenha o controle dos seus investimentos de forma simples, automática e sem complicação. 
            Importe notas, acompanhe sua carteira e declare seu IR com facilidade.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/cadastro">
              <Button size="lg" className="text-base px-8">
                Comece Grátis <ArrowRight className="w-5 h-5 ml-1" />
              </Button>
            </Link>
            <a href="#como-funciona">
              <Button variant="glass" size="lg" className="text-white border-white/20">
                Como Funciona
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="funcionalidades" className="py-20 md:py-28 bg-background">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Tudo que você precisa em um só lugar
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Ferramentas pensadas para simplificar a vida do investidor brasileiro.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group p-6 rounded-2xl border border-border bg-card hover:border-primary/30 hover:shadow-lg transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="como-funciona" className="py-20 md:py-28 bg-secondary/30">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Como funciona?
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Em 3 passos simples você tem tudo organizado.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {steps.map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center mx-auto mb-5">
                  <span className="text-xl font-bold text-primary">{item.step}</span>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="depoimentos" className="py-20 md:py-28 bg-background">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              O que nossos clientes dizem
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Milhares de investidores já simplificaram sua vida financeira.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {testimonials.map((t) => (
              <div
                key={t.name}
                className="p-6 rounded-2xl border border-border bg-card"
              >
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-5">"{t.text}"</p>
                <div>
                  <p className="text-sm font-semibold text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${heroBg})` }}>
          <div className="absolute inset-0 bg-gradient-to-br from-[hsl(210,50%,8%)]/90 via-[hsl(160,40%,10%)]/70 to-[hsl(210,50%,8%)]/90" />
        </div>
        <div className="relative z-10 container mx-auto px-6 text-center max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Pronto para simplificar seus investimentos?
          </h2>
          <p className="text-white/70 text-lg mb-8">
            Crie sua conta gratuita e comece a organizar sua carteira hoje mesmo.
          </p>
          <Link to="/cadastro">
            <Button size="lg" className="text-base px-10">
              Criar Conta Grátis <ArrowRight className="w-5 h-5 ml-1" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-8">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <ClipboardCheck className="w-5 h-5 text-primary" />
              <span className="text-sm font-bold text-foreground">DECLARE CERTO</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link to="/planos" className="hover:text-foreground transition-colors">Planos</Link>
              <Link to="/termos" className="hover:text-foreground transition-colors">Termos e Privacidade</Link>
            </div>
            <p className="text-xs text-muted-foreground">© 2026 Declare Certo — Todos os direitos reservados</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
