import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, X, ArrowLeft, Crown, Star, Zap, HelpCircle, ClipboardCheck } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import heroBg from "@/assets/hero-bg.jpg";

const plans = [
  {
    name: "Basic",
    price: "R$ 0,00",
    period: "Grátis para sempre",
    icon: Zap,
    highlight: false,
    paymentUrl: "",
    features: [
      { text: "Upload de até 5 notas de corretagem/mês", included: true },
      { text: "Visualização básica da carteira", included: true },
      { text: "Histórico de operações limitado", included: true },
      { text: "Suporte por e-mail", included: true },
      { text: "Dividendos proporcionais", included: false },
      { text: "Relatórios para IR", included: false },
      { text: "Exportação de dados", included: false },
      { text: "Suporte prioritário", included: false },
    ],
  },
  {
    name: "Premium",
    price: "R$ 17,28",
    period: "12x de R$ 17,28 ou R$ 170,00 à vista",
    icon: Star,
    paymentUrl: "https://pay.hub.la/ruDJTl1zaEXU0iKKZ1fE",
    features: [
      { text: "Upload ilimitado de notas de corretagem", included: true },
      { text: "Visualização completa da carteira", included: true },
      { text: "Histórico de operações completo", included: true },
      { text: "Suporte por e-mail", included: true },
      { text: "Dividendos proporcionais", included: true },
      { text: "Relatórios para IR", included: false },
      { text: "Exportação de dados", included: false },
      { text: "Suporte prioritário", included: false },
    ],
  },
  {
    name: "Platinum",
    price: "R$ 22,36",
    period: "12x de R$ 22,36 ou R$ 220,00 à vista",
    icon: Crown,
    paymentUrl: "https://pay.hub.la/YrMylbPBjQJyd18KPR04",
    highlight: false,
    features: [
      { text: "Upload ilimitado de notas de corretagem", included: true },
      { text: "Visualização completa da carteira", included: true },
      { text: "Histórico de operações completo", included: true },
      { text: "Suporte por e-mail", included: true },
      { text: "Dividendos proporcionais", included: true },
      { text: "Relatórios para IR", included: true },
      { text: "Exportação de dados", included: true },
      
      { text: "Suporte prioritário 24/7", included: true },
    ],
  },
];

const Planos = () => {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroBg})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-foreground/80 via-foreground/60 to-foreground/80" />
      </div>

      {/* Header */}
      <header className="relative z-10">
        <nav className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ClipboardCheck className="w-8 h-8 text-primary" />
              <span className="text-xl font-bold text-background">DECLARE CERTO</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <Link to="/" className="text-background/90 hover:text-background transition-colors">
                INÍCIO
              </Link>
              <Link to="/planos" className="text-primary font-medium border-b-2 border-primary pb-1">
                PLANOS
              </Link>
            </div>
            <Link to="/">
              <Button variant="ghost" size="sm" className="text-background/90 hover:text-background">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
            </Link>
          </div>
        </nav>
      </header>

      {/* Content */}
      <main className="relative z-10 container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-background mb-4">
            Escolha seu Plano
          </h1>
          <p className="text-background/70 text-lg max-w-2xl mx-auto">
            Encontre o plano ideal para gerenciar seus investimentos e declarar seu IR com facilidade.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`relative flex flex-col bg-background/10 backdrop-blur-md border transition-all duration-300 hover:-translate-y-1 ${
                plan.highlight
                  ? "border-primary shadow-xl shadow-primary/20 scale-[1.03]"
                  : "border-border/20 hover:border-primary/50"
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider">
                  Mais Popular
                </div>
              )}
              <CardHeader className="text-center pb-2">
                <div className={`w-14 h-14 rounded-full mx-auto mb-3 flex items-center justify-center ${
                  plan.highlight ? "bg-primary/20" : "bg-background/10"
                }`}>
                  <plan.icon className={`w-7 h-7 ${plan.highlight ? "text-primary" : "text-background/80"}`} />
                </div>
                <CardTitle className="text-2xl font-bold text-background">{plan.name}</CardTitle>
                <div className="mt-3">
                  <span className="text-3xl font-extrabold text-background">{plan.price}</span>
                  <span className="text-background/60 text-sm block mt-1">{plan.period}</span>
                </div>
              </CardHeader>
              <CardContent className="flex-1 pt-4">
                <ul className="space-y-3">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      {feature.included ? (
                        <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      ) : (
                        <X className="w-5 h-5 text-background/30 shrink-0 mt-0.5" />
                      )}
                      <span className={`text-sm ${feature.included ? "text-background/90" : "text-background/40 line-through"}`}>
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="pt-4">
                {plan.price === "R$ 0,00" ? (
                  <Link to="/cadastro" className="w-full">
                    <Button variant="glass" size="lg" className="w-full">
                      Começar Grátis
                    </Button>
                  </Link>
                ) : (
                  <a href={plan.paymentUrl} target="_blank" rel="noopener noreferrer" className="w-full">
                    <Button
                      variant={plan.highlight ? "default" : "glass"}
                      size="lg"
                      className="w-full"
                    >
                      Assinar Agora
                    </Button>
                  </a>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto mt-20">
          <div className="text-center mb-8">
            <HelpCircle className="w-10 h-10 text-primary mx-auto mb-3" />
            <h2 className="text-3xl font-bold text-background mb-2">Principais Dúvidas</h2>
            <p className="text-background/60">Respostas para as perguntas mais frequentes</p>
          </div>
          <Accordion type="single" collapsible className="space-y-3">
            {[
              {
                q: "Como funciona o período de teste?",
                a: "O plano Basic é gratuito para sempre. Você pode usar as funcionalidades básicas sem nenhum custo e fazer upgrade quando quiser.",
              },
              {
                q: "Posso trocar de plano a qualquer momento?",
                a: "Sim! Você pode fazer upgrade ou downgrade do seu plano a qualquer momento. A cobrança será ajustada proporcionalmente.",
              },
              {
                q: "Quais formas de pagamento são aceitas?",
                a: "Aceitamos cartão de crédito e PIX. Os pagamentos são processados de forma segura.",
              },
              {
                q: "O que acontece se eu cancelar minha assinatura?",
                a: "Ao cancelar, você mantém acesso até o fim do período pago. Após isso, sua conta volta para o plano Basic com as funcionalidades gratuitas.",
              },
              {
                q: "Meus dados ficam seguros?",
                a: "Sim! Utilizamos criptografia de ponta a ponta e servidores seguros para proteger todas as suas informações financeiras.",
              },
              {
                q: "Como importar minhas notas de corretagem?",
                a: "Acesse o menu 'Notas de Corretagem' e envie o PDF da sua nota. O sistema extrai automaticamente todas as operações usando inteligência artificial.",
              },
              {
                q: "Vai me ajudar no Imposto de Renda?",
                a: "Sim! O sistema gera relatórios completos para facilitar sua declaração de IR. Com os planos Premium e Platinum, você tem acesso a relatórios detalhados de operações, lucros, prejuízos e dividendos, tudo organizado para preencher sua declaração sem complicação.",
              },
            ].map((faq, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
                className="bg-background/10 backdrop-blur-md border border-white/10 rounded-lg px-5"
              >
                <AccordionTrigger className="text-background/90 hover:text-background text-left text-sm font-medium">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-background/60 text-sm">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        {/* Contact */}
        <div className="text-center mt-12">
          <p className="text-background/60 text-sm">
            Dúvidas? Entre em contato:{" "}
            <a href="mailto:josue.declarecerto@outlook.com" className="text-primary font-medium hover:underline">
              josue.declarecerto@outlook.com
            </a>
          </p>
        </div>
      </main>
    </div>
  );
};

export default Planos;
