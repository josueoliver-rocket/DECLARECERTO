import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  HelpCircle,
  Menu,
  Loader2,
  FileText,
  TrendingUp,
  BarChart3,
  AlertTriangle,
  Upload,
  DollarSign,
  Settings,
  ChevronRight,
} from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useAuth } from "@/hooks/useAuth";

const faqSections = [
  {
    title: "Notas de Corretagem",
    icon: Upload,
    items: [
      {
        question: "Como importar minhas notas de corretagem?",
        answer:
          "Acesse o menu 'Notas de Corretagem' e clique em 'Enviar Nota'. Selecione o arquivo PDF da sua nota de corretagem. O sistema irá extrair automaticamente todas as operações (compras e vendas) contidas no documento usando inteligência artificial.",
      },
      {
        question: "Quais corretoras são suportadas?",
        answer:
          "O sistema suporta notas de corretagem das principais corretoras do Brasil, incluindo Clear, XP, Rico, Inter, BTG Pactual, Genial, entre outras. O processamento é feito por IA, que se adapta a diferentes formatos de nota.",
      },
      {
        question: "Posso enviar várias notas de uma vez?",
        answer:
          "Sim! Você pode enviar múltiplas notas sequencialmente. Cada nota será processada individualmente e as operações serão adicionadas à sua carteira automaticamente.",
      },
    ],
  },
  {
    title: "Dashboard e Carteira",
    icon: BarChart3,
    items: [
      {
        question: "Como são calculadas as cotações em tempo real?",
        answer:
          "As cotações são obtidas automaticamente do mercado. Você pode atualizar manualmente clicando no botão 'Atualizar' no Dashboard. As cotações refletem o último preço de negociação disponível.",
      },
      {
        question: "O que significa 'Preço Médio'?",
        answer:
          "O preço médio é calculado dividindo o valor total investido em compras pela quantidade total de ações compradas. Quando há eventos corporativos (desdobramentos ou grupamentos), o preço médio é ajustado automaticamente.",
      },
      {
        question: "Como é calculada a rentabilidade?",
        answer:
          "A rentabilidade é a diferença entre o valor de mercado atual (quantidade × cotação atual) e o valor investido (quantidade × preço médio). O percentual indica o ganho ou perda em relação ao investimento original.",
      },
    ],
  },
  {
    title: "Eventos Corporativos",
    icon: AlertTriangle,
    items: [
      {
        question: "O que são eventos corporativos?",
        answer:
          "Eventos corporativos são ações tomadas pela empresa que afetam suas ações. Os principais tipos são: Desdobramento (split) — multiplica a quantidade de ações; Grupamento — reduz a quantidade agrupando ações; Bonificação — distribui ações adicionais proporcionalmente.",
      },
      {
        question: "Como o sistema trata desdobramentos e grupamentos?",
        answer:
          "O sistema detecta automaticamente eventos corporativos e ajusta sua posição. Por exemplo, se você tinha 100 ações e houve um grupamento 1:2, o sistema ajusta para 50 ações e recalcula o preço médio proporcionalmente. Esses ajustes são exibidos na aba 'Eventos Corporativos' ao clicar no ativo.",
      },
      {
        question: "Onde vejo os eventos corporativos de um ativo?",
        answer:
          "Clique no ticker do ativo no Dashboard para abrir a página de detalhes. Na aba 'Eventos Corporativos', você verá todos os eventos detectados com o impacto na sua posição: ações antes, diferença e ações depois do evento.",
      },
    ],
  },
  {
    title: "Dividendos e Proventos",
    icon: DollarSign,
    items: [
      {
        question: "Como são calculados os dividendos?",
        answer:
          "Os dividendos são calculados proporcionalmente à sua posição na data de cada pagamento. O sistema cruza o histórico de proventos do ativo com a quantidade de ações que você detinha em cada data, mostrando exatamente quanto você teria recebido.",
      },
      {
        question: "Os dividendos incluem JCP e rendimentos de FIIs?",
        answer:
          "Sim! O sistema busca todos os tipos de proventos disponíveis no mercado, incluindo dividendos, juros sobre capital próprio (JCP) e rendimentos de fundos imobiliários (FIIs).",
      },
    ],
  },
  {
    title: "Investimentos e Diversificação",
    icon: TrendingUp,
    items: [
      {
        question: "O que mostra a página de Investimentos?",
        answer:
          "A página de Investimentos exibe um gráfico de pizza com a distribuição percentual da sua carteira por ativo, mostrando quanto cada ativo representa do total investido. Isso ajuda a visualizar a diversificação dos seus investimentos.",
      },
      {
        question: "Os percentuais consideram eventos corporativos?",
        answer:
          "Sim! Os valores investidos e percentuais são calculados após aplicar todos os ajustes de eventos corporativos (desdobramentos, grupamentos e bonificações), garantindo que a distribuição reflita a realidade atual.",
      },
    ],
  },
  {
    title: "Configurações e Conta",
    icon: Settings,
    items: [
      {
        question: "Como altero meus dados pessoais?",
        answer:
          "Acesse o menu 'Configurações' para atualizar seu nome, e-mail e CPF. As alterações são salvas automaticamente no seu perfil.",
      },
      {
        question: "Como recupero minha senha?",
        answer:
          "Na tela de login, clique em 'Esqueci minha senha'. Digite seu e-mail cadastrado e você receberá um link para criar uma nova senha.",
      },
    ],
  },
];

const Ajuda = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/");
    }
  }, [user, loading, navigate]);

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
          <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/50">
            <div className="flex items-center gap-4 px-4 md:px-6 py-3 md:py-4">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground">
                <Menu className="w-5 h-5" />
              </SidebarTrigger>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-foreground">Central de Ajuda</h1>
                <p className="text-xs md:text-sm text-muted-foreground">
                  Tire suas dúvidas sobre o Declare Certo
                </p>
              </div>
            </div>
          </header>

          <div className="p-4 md:p-6 space-y-4 md:space-y-6 max-w-4xl mx-auto">
            {/* Welcome Card */}
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-primary/10">
                    <HelpCircle className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground mb-1">
                      Como podemos ajudar?
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Encontre respostas para as perguntas mais frequentes sobre o funcionamento
                      do sistema. Navegue pelas categorias abaixo para encontrar o que precisa.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Links */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                { label: "Enviar Nota", icon: FileText, href: "/notas-corretagem" },
                { label: "Ver Dashboard", icon: BarChart3, href: "/dashboard" },
                { label: "Investimentos", icon: TrendingUp, href: "/investimentos" },
              ].map((link) => (
                <button
                  key={link.label}
                  onClick={() => navigate(link.href)}
                  className="flex items-center gap-3 p-4 rounded-lg border border-border/50 bg-card hover:bg-accent/30 transition-colors text-left"
                >
                  <link.icon className="w-5 h-5 text-primary shrink-0" />
                  <span className="text-sm font-medium text-foreground">{link.label}</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
                </button>
              ))}
            </div>

            {/* FAQ Sections */}
            {faqSections.map((section) => (
              <Card key={section.title} className="bg-card border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <section.icon className="w-5 h-5 text-primary" />
                    {section.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    {section.items.map((item, idx) => (
                      <AccordionItem key={idx} value={`${section.title}-${idx}`}>
                        <AccordionTrigger className="text-sm font-medium text-foreground hover:text-primary">
                          {item.question}
                        </AccordionTrigger>
                        <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                          {item.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            ))}

            {/* Contact */}
            <Card className="bg-card border-border/50">
              <CardContent className="pt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Não encontrou o que procurava? Entre em contato pelo e-mail{" "}
                  <span className="text-primary font-medium">josue.declarecerto@outlook.com</span>
                </p>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Ajuda;
