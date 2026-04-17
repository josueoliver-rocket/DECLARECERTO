import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const Termos = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/50">
        <div className="max-w-4xl mx-auto flex items-center gap-4 px-6 py-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold">Termos de Uso e Política de Privacidade</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-primary">1. Termos de Uso</h2>
          <p className="text-muted-foreground leading-relaxed">
            Ao utilizar a plataforma Declare Certo, você concorda com os termos e condições descritos abaixo. Leia atentamente antes de prosseguir.
          </p>

          <h3 className="text-lg font-medium">1.1 Aceitação dos Termos</h3>
          <p className="text-muted-foreground leading-relaxed">
            Ao criar uma conta e utilizar nossos serviços, você declara ter lido, compreendido e concordado com estes Termos de Uso em sua totalidade. Caso não concorde com qualquer disposição, não utilize a plataforma.
          </p>

          <h3 className="text-lg font-medium">1.2 Descrição do Serviço</h3>
          <p className="text-muted-foreground leading-relaxed">
            A plataforma oferece ferramentas para gestão de investimentos, incluindo importação de notas de corretagem, acompanhamento de carteira, cálculo de preço médio, monitoramento de eventos corporativos, proventos e cálculo de imposto de renda sobre investimentos.
          </p>

          <h3 className="text-lg font-medium">1.3 Responsabilidade do Usuário</h3>
          <p className="text-muted-foreground leading-relaxed">
            O usuário é responsável pela veracidade das informações inseridas na plataforma. As informações fornecidas pelo sistema são de caráter informativo e não constituem recomendação de investimento ou consultoria financeira, fiscal ou tributária.
          </p>

          <h3 className="text-lg font-medium">1.4 Limitação de Responsabilidade</h3>
          <p className="text-muted-foreground leading-relaxed">
            A plataforma não se responsabiliza por perdas financeiras decorrentes de decisões tomadas com base nas informações exibidas. Os cálculos de imposto de renda são estimativas e devem ser conferidos por um profissional contábil antes de qualquer declaração oficial.
          </p>

          <h3 className="text-lg font-medium">1.5 Disponibilidade do Serviço</h3>
          <p className="text-muted-foreground leading-relaxed">
            Nos reservamos o direito de modificar, suspender ou descontinuar o serviço a qualquer momento, com ou sem aviso prévio. Faremos esforços razoáveis para notificar os usuários sobre alterações significativas.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-primary">2. Política de Privacidade</h2>

          <h3 className="text-lg font-medium">2.1 Dados Coletados</h3>
          <p className="text-muted-foreground leading-relaxed">
            Coletamos os seguintes dados pessoais: nome, e-mail, CPF (opcional) e dados de investimentos inseridos pelo usuário (notas de corretagem, operações, ativos). Esses dados são necessários para o funcionamento adequado da plataforma.
          </p>

          <h3 className="text-lg font-medium">2.2 Uso dos Dados</h3>
          <p className="text-muted-foreground leading-relaxed">
            Seus dados são utilizados exclusivamente para fornecer os serviços da plataforma, incluindo cálculos de carteira, preço médio, dividendos e imposto de renda. Não compartilhamos, vendemos ou cedemos seus dados pessoais a terceiros.
          </p>

          <h3 className="text-lg font-medium">2.3 Armazenamento e Segurança</h3>
          <p className="text-muted-foreground leading-relaxed">
            Seus dados são armazenados de forma segura em servidores protegidos com criptografia. Utilizamos práticas de segurança como autenticação, controle de acesso por usuário (RLS) e conexões seguras (HTTPS) para proteger suas informações.
          </p>

          <h3 className="text-lg font-medium">2.4 Direitos do Usuário</h3>
          <p className="text-muted-foreground leading-relaxed">
            Você tem o direito de acessar, corrigir ou excluir seus dados pessoais a qualquer momento através da página de Configurações. Caso deseje a exclusão completa de sua conta e todos os dados associados, entre em contato conosco.
          </p>

          <h3 className="text-lg font-medium">2.5 Cookies e Sessão</h3>
          <p className="text-muted-foreground leading-relaxed">
            Utilizamos cookies e armazenamento local apenas para manter sua sessão ativa e preferências de interface. Não utilizamos cookies de rastreamento de terceiros.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-primary">3. Conformidade com a LGPD</h2>
          <p className="text-muted-foreground leading-relaxed">
            A DECLARE CERTO está em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 – LGPD). 
            Tratamos seus dados pessoais com base no consentimento e na necessidade para execução dos serviços contratados. 
            Você pode exercer seus direitos de titular de dados (acesso, correção, exclusão, portabilidade) a qualquer momento 
            entrando em contato conosco ou através das configurações da sua conta.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-primary">4. Disposições Gerais</h2>
          <p className="text-muted-foreground leading-relaxed">
            Estes termos podem ser atualizados periodicamente. Recomendamos que revise esta página regularmente. O uso continuado da plataforma após alterações constitui aceitação dos novos termos.
          </p>
          <p className="text-sm text-muted-foreground">
            Última atualização: Abril de 2026
          </p>
        </section>
      </main>
    </div>
  );
};

export default Termos;
