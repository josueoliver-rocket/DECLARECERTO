import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface BemDireito {
  grupo: string;
  codigo: string;
  localizacao: string;
  cnpj: string;
  discriminacao: string;
  situacaoAnoAnterior: number;
  situacaoAnoAtual: number;
  ativo: string;
  isFII: boolean;
  isInternacional: boolean;
}

interface OperacaoMensal {
  ativo: string;
  tipo: string;
  quantidade: number;
  preco_unitario: number;
  valor_total: number;
  isFII?: boolean;
  isInternacional?: boolean;
}

interface DividendoAtivo {
  ativo: string;
  valor: number;
  cnpj?: string;
  nomeFonte?: string;
}

interface DividendoExteriorPdf {
  ativo: string;
  data: string;
  valorBrutoUsd: number;
  impostoRetidoUsd: number;
  valorBrutoBrl: number;
  impostoRetidoBrl: number;
  ptax: number;
  quantidadeCotas: number;
}

interface DadosRelatorio {
  anoCalendario: string;
  nomeContribuinte: string;
  cpf: string | null;
  bensEDireitos: BemDireito[];
  totalBens: number;
  totalBensAnterior: number;
  vendasIsentas: number;
  operacoesMensais: Record<string, { vendas: OperacaoMensal[]; compras: OperacaoMensal[] }>;
  ptaxCount: number;
  dividendosAcoes?: DividendoAtivo[];
  dividendosFII?: DividendoAtivo[];
  totalDividendosAcoes?: number;
  totalDividendosFII?: number;
  dividendosExterior?: DividendoExteriorPdf[];
  dividendosMensaisAcoes?: Record<string, DividendoAtivo[]>;
  dividendosMensaisFII?: Record<string, DividendoAtivo[]>;
}

const formatBRL = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const formatUSD = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);

const MESES = [
  "Janeiro", "Fevereiro", "Marco", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

// Color palette
const COLORS = {
  primary: [34, 60, 80] as [number, number, number],
  primaryLight: [44, 82, 110] as [number, number, number],
  dark: [30, 30, 30] as [number, number, number],
  medium: [80, 80, 80] as [number, number, number],
  muted: [120, 120, 120] as [number, number, number],
  light: [240, 240, 240] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  warningBg: [255, 250, 230] as [number, number, number],
  warningBorder: [200, 170, 50] as [number, number, number],
  instructionBg: [240, 246, 250] as [number, number, number],
  instructionBorder: [180, 200, 220] as [number, number, number],
  accentGreen: [39, 174, 96] as [number, number, number],
};

// Font sizes
const FONT = {
  coverTitle: 18,
  title: 14,
  subtitle: 11,
  sectionTitle: 10,
  body: 8.5,
  small: 7.5,
  tiny: 7,
};

// Line height multiplier
const LINE_H = 1.5;

export function gerarRelatorioPdf(dados: DadosRelatorio) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 16;
  const contentW = pageW - margin * 2;
  let y = 20;
  let pageNum = 1;
  const anoExercicio = Number(dados.anoCalendario) + 1;

  // --- Helpers ---
  const lineHeight = (fontSize: number) => fontSize * LINE_H * 0.352778;

  const checkPage = (needed: number) => {
    if (y + needed > pageH - 15) {
      doc.addPage();
      y = 18;
      pageNum++;
    }
  };

  const writeText = (text: string, fontSize: number, fontStyle: "normal" | "bold" | "italic" = "normal", color: [number, number, number] = COLORS.dark) => {
    doc.setFontSize(fontSize);
    doc.setFont("helvetica", fontStyle);
    doc.setTextColor(...color);
    const lh = lineHeight(fontSize);
    const lines = doc.splitTextToSize(text, contentW);
    checkPage(lines.length * lh + 2);
    doc.text(lines, margin, y);
    y += lines.length * lh;
  };

  const writeTextIndented = (text: string, fontSize: number, fontStyle: "normal" | "bold" | "italic" = "normal", indent = 4) => {
    doc.setFontSize(fontSize);
    doc.setFont("helvetica", fontStyle);
    doc.setTextColor(...COLORS.dark);
    const lh = lineHeight(fontSize);
    const lines = doc.splitTextToSize(text, contentW - indent);
    checkPage(lines.length * lh + 2);
    doc.text(lines, margin + indent, y);
    y += lines.length * lh;
  };

  const sectionTitle = (text: string) => {
    checkPage(16);
    y += 4;
    doc.setFillColor(...COLORS.primary);
    doc.roundedRect(margin, y, contentW, 9, 1, 1, "F");
    doc.setTextColor(...COLORS.white);
    doc.setFontSize(FONT.sectionTitle);
    doc.setFont("helvetica", "bold");
    doc.text(text, margin + 4, y + 6.2);
    doc.setTextColor(...COLORS.dark);
    y += 14;
  };

  const subSectionTitle = (text: string) => {
    checkPage(12);
    y += 2;
    doc.setFillColor(...COLORS.light);
    doc.roundedRect(margin, y, contentW, 7, 1, 1, "F");
    doc.setFontSize(FONT.body);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLORS.primary);
    doc.text(text, margin + 3, y + 5);
    doc.setTextColor(...COLORS.dark);
    y += 10;
  };

  const instructionBox = (title: string, text: string) => {
    doc.setFontSize(FONT.body);
    const lh = lineHeight(FONT.body);
    const lines = doc.splitTextToSize(text, contentW - 10);
    const boxH = 6 + lines.length * lh + 4;
    checkPage(boxH + 4);

    doc.setFillColor(...COLORS.instructionBg);
    doc.setDrawColor(...COLORS.instructionBorder);
    doc.roundedRect(margin, y, contentW, boxH, 1.5, 1.5, "FD");

    doc.setFillColor(...COLORS.primaryLight);
    doc.rect(margin, y, 2.5, boxH, "F");

    doc.setFontSize(FONT.body);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLORS.primary);
    doc.text(title, margin + 6, y + 5);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLORS.dark);
    doc.text(lines, margin + 6, y + 5 + lh + 1);

    y += boxH + 4;
  };

  const labelValue = (label: string, value: string, labelW = 32) => {
    doc.setFontSize(FONT.body);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLORS.medium);
    doc.text(label, margin, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLORS.dark);
    doc.text(value, margin + labelW, y);
    y += lineHeight(FONT.body) + 1;
  };

  const bulletPoint = (text: string, fontSize = FONT.body) => {
    doc.setFontSize(fontSize);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLORS.dark);
    const lh = lineHeight(fontSize);
    const lines = doc.splitTextToSize(text, contentW - 10);
    checkPage(lines.length * lh + 1);
    doc.text("-", margin + 4, y);
    doc.text(lines, margin + 8, y);
    y += lines.length * lh + 0.5;
  };

  // =======================================
  // ===== PAGE 1: COVER PAGE =====
  // =======================================
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, pageW, pageH, "F");

  // Center content vertically
  const coverY = pageH / 2 - 30;

  doc.setTextColor(...COLORS.white);
  doc.setFontSize(FONT.coverTitle);
  doc.setFont("helvetica", "bold");
  doc.text("Relatorio auxiliar para", pageW / 2, coverY, { align: "center" });
  doc.text("Declaracao de Imposto de Renda", pageW / 2, coverY + 10, { align: "center" });

  y = coverY + 28;
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.5);
  doc.line(pageW / 2 - 40, y, pageW / 2 + 40, y);

  y += 12;
  doc.setFontSize(FONT.title);
  doc.setFont("helvetica", "normal");
  doc.text(`Ano calendario: ${dados.anoCalendario}`, pageW / 2, y, { align: "center" });

  y += 8;
  doc.setFontSize(FONT.subtitle);
  doc.text(`Exercicio: IRPF ${anoExercicio}`, pageW / 2, y, { align: "center" });

  // Contributor info on cover
  y += 20;
  doc.setFontSize(FONT.body);
  if (dados.nomeContribuinte) {
    doc.text(`Contribuinte: ${dados.nomeContribuinte}`, pageW / 2, y, { align: "center" });
    y += 5;
  }
  if (dados.cpf) {
    doc.text(`CPF: ${dados.cpf}`, pageW / 2, y, { align: "center" });
  }

  // Footer on cover
  doc.setFontSize(FONT.tiny);
  doc.setTextColor(200, 200, 200);
  doc.text("Gerado por DECLARE CERTO", pageW / 2, pageH - 15, { align: "center" });
  doc.text(new Date().toLocaleDateString("pt-BR"), pageW / 2, pageH - 10, { align: "center" });

  // =======================================
  // ===== PAGE 2: OBRIGATORIEDADE + ESCOPO =====
  // =======================================
  doc.addPage();
  pageNum++;
  y = 18;

  // Top accent bar
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, pageW, 3, "F");

  sectionTitle("OBRIGATORIEDADE DA DECLARACAO");

  writeText(
    `Conforme Instrucao Normativa RFB n. 2312/${anoExercicio}, no que se refere a investimentos em bolsa de valores, sao obrigados a entregar a Declaracao de Ajuste Anual do Imposto de Renda Pessoa Fisica, o investidor que: obteve, em qualquer mes, ganho de capital na alienacao de bens ou ativos, sujeito a incidencia do imposto (vendas com geracao de DARF), ou realizou operacoes em bolsas de valores, de mercadorias, de futuros e assemelhadas, cuja soma das vendas anuais foi superior a R$ 40.000,00.`,
    FONT.body,
  );
  y += 3;

  writeText(
    `Portanto, a declaracao somente sera opcional, se nao atender nenhum dos criterios da Receita (renda tributada anual acima de 35.584,00, posse de patrimonio acima de 800.000,00, entre outros criterios). Porem, recomendamos que quem investiu na bolsa de valores, mesmo tendo declaracao opcional, opte por declarar, dessa forma podera utilizar tambem prejuizos acumulados para compensacao futura de impostos.`,
    FONT.body,
  );
  y += 5;

  sectionTitle("ESCOPO DO RELATORIO");

  writeText(
    `O relatorio auxiliar para Declaracao de Imposto de Renda gerado tem por objetivo facilitar o preenchimento da declaracao anual que todo investidor deve entregar para a Receita Federal do Brasil. O escopo que e atendido por esse relatorio ira lhe auxiliar a preencher os seguintes dados em sua declaracao:`,
    FONT.body,
  );
  y += 2;

  bulletPoint(`Bens e direitos (Posicao acionaria em 31/12/${dados.anoCalendario}), rendimentos/perdas no exterior e imposto pago no exterior`);
  bulletPoint("Rendimentos isentos e nao tributaveis (Vendas abaixo de 20mil, ativos isentos e dividendos)");
  bulletPoint("Rendimentos sujeitos a tributacao exclusiva (Proventos tributados como JCP)");
  bulletPoint("Renda variavel (Operacoes comuns / Day-Trade / Fundos Imobiliarios)");
  y += 5;

  sectionTitle("DISCLAIMER");

  const disclaimerText =
    `Toda a informacao contida no relatorio foi gerada com base nos dados informados pelo cliente, ficando sob responsabilidade do investidor a conferencia dos dados cadastrados e o preenchimento da declaracao de imposto de renda. A plataforma Declare Certo tem como responsabilidade realizar os devidos calculos com base nos dados cadastrados, e tambem descrever corretamente neste relatorio todas instrucoes para o preenchimento do IRPF ${anoExercicio}.`;

  doc.setFontSize(FONT.small);
  const disclaimerLines = doc.splitTextToSize(disclaimerText, contentW - 10);
  const disclaimerH = 7 + disclaimerLines.length * lineHeight(FONT.small) + 4;
  checkPage(disclaimerH + 4);

  doc.setFillColor(...COLORS.warningBg);
  doc.setDrawColor(...COLORS.warningBorder);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, y, contentW, disclaimerH, 2, 2, "FD");
  doc.setFillColor(...COLORS.warningBorder);
  doc.rect(margin, y, 2.5, disclaimerH, "F");

  doc.setFontSize(FONT.body);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(150, 120, 0);
  doc.text("AVISO IMPORTANTE", margin + 6, y + 5.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(FONT.small);
  doc.setTextColor(...COLORS.dark);
  doc.text(disclaimerLines, margin + 6, y + 5.5 + lineHeight(FONT.body) + 1);
  y += disclaimerH + 5;

  writeText(
    `Este relatorio nao sera sua unica fonte de consulta para preencher sua declaracao, procure tambem os informes fornecidos por outras instituicoes que geraram renda ou rendimentos durante o ano de ${dados.anoCalendario}. Exemplo de outras informacoes que devera procurar para sua declaracao:`,
    FONT.body,
  );
  y += 2;

  bulletPoint("Informe do banco onde possui conta corrente/poupanca para informacao de saldos e rendimentos");
  bulletPoint("Informe de seu empregador para declaracao de remuneracao anual e impostos retidos");
  bulletPoint("Rendimentos provenientes de alugueis, permutas etc.");
  y += 5;

  // =======================================
  // ===== PAGE 3: INSTALAÇÃO DO PROGRAMA =====
  // =======================================
  checkPage(60);
  sectionTitle("INSTALACAO DO PROGRAMA DA RECEITA FEDERAL");

  writeText(
    `O primeiro passo para a declaracao do IRPF ${anoExercicio} e realizar o download do programa disponibilizado atraves do site da Receita Federal do Brasil.`,
    FONT.body,
  );
  y += 2;

  writeText(
    `Repare que o IRPF de ${anoExercicio} e referente ao fechamento de ${dados.anoCalendario} e a Receita costuma disponibilizar o aplicativo para download proximo do final de fevereiro.`,
    FONT.body,
  );
  y += 2;

  writeText(
    `Pode encontrar o link de instalacao no site da Receita Federal: https://www.gov.br/receitafederal`,
    FONT.body,
    "normal",
    COLORS.primaryLight,
  );
  y += 3;

  writeText(
    `Instalacao do programa e rapida e, ao abrir o instalador, serao dados todos os passos para que o programa seja instalado adequadamente na sua maquina. Apos abrir o programa, o investidor devera:`,
    FONT.body,
  );
  y += 2;

  writeText(`1- Importar a declaracao realizada no ano de ${dados.anoCalendario} (competencia ${Number(dados.anoCalendario) - 1}), caso tenha declarado no ano anterior;`, FONT.body);
  y += 1;
  writeText(`2- Criar uma nova Declaracao, caso seja a primeira vez declarando o imposto de renda.`, FONT.body);
  y += 5;

  // =======================================
  // ===== SEÇÃO: BENS E DIREITOS =====
  // =======================================
  sectionTitle("1. BENS E DIREITOS (Ativos sob sua custodia)");

  writeText(
    `A obrigatoriedade das Acoes em Bens e Direitos existe caso tenha terminado o ano de ${dados.anoCalendario} com algum ativo em sua custodia. Na declaracao e necessario informar todas as posicoes em acoes, opcoes, FII e ETF referentes ao dia 31/12/${dados.anoCalendario} na opcao "Bens e Direitos".`,
    FONT.body,
  );
  y += 3;

  instructionBox(
    "Como preencher no programa da Receita Federal:",
    `Acesse: Fichas da Declaracao > Bens e Direitos > Novo. ` +
    `Para cada ativo, informe Grupo, Codigo, Localizacao e copie a Discriminacao. ` +
    `Nos campos 'Situacao em 31/12' informe os valores das colunas correspondentes. ` +
    `Acoes (Grupo 03, Cod. 01): quantidade e custo medio de aquisicao. ` +
    `FIIs (Grupo 07, Cod. 03): quantidade de cotas e valor total de aquisicao. ` +
    `Ativos internacionais: discriminacao em dolar, mas campos 'Situacao' em REAIS.`
  );

  // Separate national and international assets
  const bensNacionais = dados.bensEDireitos.filter(b => !b.isInternacional);
  const bensInternacionais = dados.bensEDireitos.filter(b => b.isInternacional);

  if (bensNacionais.length > 0) {
    subSectionTitle("Ativos Nacionais (B3)");

    writeText(
      `Para cada linha da tabela abaixo efetue um lancamento atraves do botao 'Novo', preencha os dados da tabela e confirme em 'OK'.`,
      FONT.small,
    );
    y += 2;

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      styles: {
        fontSize: FONT.tiny,
        cellPadding: 2,
        lineColor: [200, 200, 200],
        lineWidth: 0.2,
      },
      headStyles: {
        fillColor: COLORS.primary,
        textColor: COLORS.white,
        fontSize: FONT.tiny,
        fontStyle: "bold",
        halign: "center",
        cellPadding: 2.5,
      },
      bodyStyles: { textColor: COLORS.dark },
      alternateRowStyles: { fillColor: [248, 248, 248] },
      footStyles: {
        fillColor: [225, 230, 235],
        textColor: COLORS.dark,
        fontSize: FONT.tiny,
        fontStyle: "bold",
      },
      columnStyles: {
        0: { cellWidth: 13, halign: "center" },
        1: { cellWidth: 12, halign: "center" },
        2: { cellWidth: 24 },
        3: { cellWidth: 30 },
        4: { cellWidth: "auto" },
        5: { cellWidth: 24, halign: "right" },
        6: { cellWidth: 24, halign: "right" },
      },
      head: [[
        "Grupo",
        "Cod.",
        "Localizacao",
        "CNPJ",
        "Discriminacao",
        `Sit. 31/12/${Number(dados.anoCalendario) - 1}`,
        `Sit. 31/12/${dados.anoCalendario}`,
      ]],
      body: bensNacionais.map((b) => [
        b.grupo,
        b.codigo,
        b.localizacao,
        b.cnpj || "-",
        b.discriminacao,
        formatBRL(b.situacaoAnoAnterior),
        formatBRL(b.situacaoAnoAtual),
      ]),
      foot: [[
        "", "", "", "", "TOTAL",
        formatBRL(bensNacionais.reduce((a, b) => a + b.situacaoAnoAnterior, 0)),
        formatBRL(bensNacionais.reduce((a, b) => a + b.situacaoAnoAtual, 0)),
      ]],
    });
    y = (doc as any).lastAutoTable.finalY + 6;
  }

  // International assets with inline rendimentos
  if (bensInternacionais.length > 0) {
    subSectionTitle("Ativos no Exterior com Rendimentos");

    writeText(
      `A partir de 2024, sera necessario informar os ganhos recebidos no exterior (vendas, dividendos, cupons) diretamente na declaracao, na ficha de bens e direitos, somente nos campos da secao APLICACAO FINANCEIRA.`,
      FONT.body,
      "bold",
    );
    y += 2;

    instructionBox(
      "ATENCAO:",
      "A secao LUCROS E DIVIDENDOS nao precisa ser preenchida, pois se refere a rendimentos de empresas offshore somente, mantenha zerada. O documento ira mostrar na tabela quais dados devera preencher nos campos de Aplicacao Financeira."
    );

    // Build table rows with rendimentos inline
    const intlBody: any[][] = [];
    bensInternacionais.forEach((b) => {
      // Main row
      intlBody.push([
        b.grupo,
        b.codigo,
        b.localizacao,
        b.discriminacao.split("\n")[0], // Only main discriminação without rendimentos
        formatBRL(b.situacaoAnoAnterior),
        formatBRL(b.situacaoAnoAtual),
      ]);

      // Rendimentos row (inline below the asset)
      if (dados.dividendosExterior && dados.dividendosExterior.length > 0) {
        const divsTicker = dados.dividendosExterior.filter(d => d.ativo === b.ativo);
        const totalBrutoBrl = divsTicker.reduce((a, d) => a + d.valorBrutoBrl, 0);
        const totalImpostoBrl = divsTicker.reduce((a, d) => a + d.impostoRetidoBrl, 0);

        intlBody.push([{
          content: `Rendimentos de\nAplicacao Financeira => Lucro/Prejuizo: ${formatBRL(totalBrutoBrl)} / Imposto pago: ${formatBRL(totalImpostoBrl)}\nLucros e Dividendos => Valor Recebido: R$ 0,00 / Imposto pago: R$ 0,00`,
          colSpan: 6,
          styles: {
            fontStyle: "italic" as const,
            fontSize: 6.5,
            textColor: COLORS.primary,
            fillColor: [245, 248, 252],
            cellPadding: { top: 1.5, bottom: 1.5, left: 4, right: 2 },
          },
        }]);
      }
    });

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      styles: {
        fontSize: FONT.tiny,
        cellPadding: 2,
        lineColor: [200, 200, 200],
        lineWidth: 0.2,
      },
      headStyles: {
        fillColor: COLORS.primary,
        textColor: COLORS.white,
        fontSize: FONT.tiny,
        fontStyle: "bold",
        halign: "center",
        cellPadding: 2.5,
      },
      bodyStyles: { textColor: COLORS.dark },
      alternateRowStyles: { fillColor: [248, 248, 248] },
      columnStyles: {
        0: { cellWidth: 13, halign: "center" },
        1: { cellWidth: 12, halign: "center" },
        2: { cellWidth: 28 },
        3: { cellWidth: "auto" },
        4: { cellWidth: 24, halign: "right" },
        5: { cellWidth: 24, halign: "right" },
      },
      head: [[
        "Grupo",
        "Cod.",
        "Localizacao",
        "Discriminacao",
        `Sit. 31/12/${Number(dados.anoCalendario) - 1}`,
        `Sit. 31/12/${dados.anoCalendario}`,
      ]],
      body: intlBody,
    });
    y = (doc as any).lastAutoTable.finalY + 6;
  }

  if (dados.bensEDireitos.length === 0) {
    writeTextIndented("Nenhum ativo em custodia no periodo.", FONT.body, "italic");
    y += 4;
  }

  // =======================================
  // ===== SEÇÃO 2: RENDIMENTOS ISENTOS =====
  // =======================================
  sectionTitle("2. RENDIMENTOS ISENTOS E NAO TRIBUTAVEIS");

  writeText(
    `Esta secao ira lhe demonstrar quais rendimentos teve durante o ano e foram isentos de imposto de renda, seja por beneficio fiscal ou limite de isencao.`,
    FONT.body,
  );
  y += 2;

  writeText("Itens contemplados no informe:", FONT.body, "bold");
  y += 1;
  bulletPoint("Vendas mensais de acoes abaixo de 20 mil reais (Brasil)");
  bulletPoint("Dividendos de acoes");
  bulletPoint("Rendimentos de FII");
  bulletPoint("Vendas de ativos com beneficio fiscal");
  y += 3;

  instructionBox(
    "Como preencher no programa da Receita Federal:",
    `Acesse: Fichas da Declaracao > Rendimentos Isentos e Nao Tributaveis > Novo. ` +
    `Selecione o tipo de rendimento (Tipo 09, 20 ou 99) e informe o valor total recebido no ano, ` +
    `junto com o CNPJ da fonte pagadora (corretora ou administradora do fundo).`
  );

  // Vendas isentas
  subSectionTitle("Tipo 20 - Ganhos liquidos em operacoes no mercado a vista (vendas <= R$ 20.000/mes)");
  writeTextIndented(`Total de vendas isentas no ano: ${formatBRL(dados.vendasIsentas)}`, FONT.body, "bold");
  y += 1;
  writeTextIndented(
    "Informe este valor quando o total de vendas de acoes no mes foi inferior a R$ 20.000,00. " +
    "FIIs, ETFs e BDRs NAO se enquadram nesta isencao.",
    FONT.small,
  );
  y += 4;

  // Dividendos de Ações - with CNPJ and Nome da Fonte Pagadora
  subSectionTitle("Tipo 09 - Lucros e dividendos recebidos");

  writeText(
    `Para cada linha da tabela abaixo efetue um lancamento atraves do botao 'Novo', preencha os dados da tabela e confirme em 'OK'.`,
    FONT.small,
  );
  y += 2;

  if (dados.dividendosAcoes && dados.dividendosAcoes.length > 0) {
    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      styles: { fontSize: FONT.tiny, cellPadding: 1.8, lineColor: [210, 210, 210], lineWidth: 0.15 },
      headStyles: { fillColor: COLORS.primary, textColor: COLORS.white, fontSize: FONT.tiny, fontStyle: "bold" },
      bodyStyles: { textColor: COLORS.dark },
      alternateRowStyles: { fillColor: [250, 250, 250] },
      footStyles: { fillColor: [225, 230, 235], textColor: COLORS.dark, fontSize: FONT.tiny, fontStyle: "bold" },
      columnStyles: { 0: { cellWidth: 12, halign: "center" }, 3: { halign: "right" } },
      head: [["Tipo", "CNPJ da Fonte Pagadora", "Nome da Fonte Pagadora", "Valor"]],
      body: dados.dividendosAcoes.map((d) => [
        "09",
        d.cnpj || "-",
        d.nomeFonte || d.ativo,
        formatBRL(d.valor),
      ]),
      foot: [["", "", "TOTAL", formatBRL(dados.totalDividendosAcoes || 0)]],
    });
    y = (doc as any).lastAutoTable.finalY + 3;
  } else {
    writeTextIndented("Nenhum dividendo de acoes identificado no periodo.", FONT.small, "italic");
  }
  y += 1;
  writeTextIndented(
    "Valores calculados proporcionalmente a posicao na data ex-dividendo. " +
    "Confira com o Informe de Rendimentos da corretora e ajuste se necessario.",
    FONT.small,
  );
  y += 4;

  // Rendimentos de FII - with CNPJ and Nome da Fonte Pagadora
  subSectionTitle("Tipo 99 - Outros rendimentos isentos (Rendimentos de FII)");

  if (dados.dividendosFII && dados.dividendosFII.length > 0) {
    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      styles: { fontSize: FONT.tiny, cellPadding: 1.8, lineColor: [210, 210, 210], lineWidth: 0.15 },
      headStyles: { fillColor: COLORS.primary, textColor: COLORS.white, fontSize: FONT.tiny, fontStyle: "bold" },
      bodyStyles: { textColor: COLORS.dark },
      alternateRowStyles: { fillColor: [250, 250, 250] },
      footStyles: { fillColor: [225, 230, 235], textColor: COLORS.dark, fontSize: FONT.tiny, fontStyle: "bold" },
      columnStyles: { 0: { cellWidth: 12, halign: "center" }, 4: { halign: "right" } },
      head: [["Tipo", "CNPJ da Fonte Pagadora", "Nome da Fonte Pagadora", "Descricao", "Valor"]],
      body: dados.dividendosFII.map((d) => [
        "99",
        d.cnpj || "-",
        d.nomeFonte || d.ativo,
        `Rendimentos FII ${d.ativo}`,
        formatBRL(d.valor),
      ]),
      foot: [["", "", "", "TOTAL", formatBRL(dados.totalDividendosFII || 0)]],
    });
    y = (doc as any).lastAutoTable.finalY + 3;
  } else {
    writeTextIndented("Nenhum rendimento de FII identificado no periodo.", FONT.small, "italic");
  }
  y += 1;
  writeTextIndented(
    "Rendimentos de FII sao isentos para pessoa fisica (desde que o fundo tenha mais de 50 cotistas " +
    "e o investidor detenha menos de 10% das cotas). Confira com o informe da administradora.",
    FONT.small,
  );
  y += 4;

  // =======================================
  // ===== SEÇÃO 3: RENDIMENTOS SUJEITOS A TRIBUTAÇÃO EXCLUSIVA (JCP) =====
  // =======================================
  sectionTitle("3. RENDIMENTOS SUJEITOS A TRIBUTACAO EXCLUSIVA");

  writeText(
    `Esta secao ira lhe demonstrar quais rendimentos tiveram tributacao retida na fonte durante o ano, nao sera necessario pagar imposto adicional sobre eles, mas precisara declara-los na secao de mesmo nome.`,
    FONT.body,
  );
  y += 2;

  writeText("Itens contemplados no informe:", FONT.body, "bold");
  y += 1;
  bulletPoint("Juros sobre capital proprio (JCP)");
  bulletPoint("Amortizacoes");
  bulletPoint("Outros proventos tributados");
  y += 2;

  writeText("Itens nao contemplados no relatorio, para estes itens procure o informe oficial de seu banco/corretora:", FONT.body, "italic");
  y += 1;
  bulletPoint("Rendimentos de contas remuneradas");
  y += 3;

  instructionBox(
    "Como preencher no programa da Receita Federal:",
    `Acesse: Fichas da Declaracao > Rendimentos Sujeitos a Tributacao Exclusiva/Definitiva > Novo. ` +
    `Selecione Tipo 10 - Juros sobre capital proprio. Informe o CNPJ e nome da fonte pagadora e o valor liquido recebido.`
  );

  writeTextIndented(
    "Nota: O calculo de JCP requer dados dos informes de rendimentos da corretora. " +
    "Os valores exatos devem ser conferidos com o informe oficial fornecido pela corretora/empresa.",
    FONT.small,
    "italic",
  );
  y += 5;

  // =======================================
  // ===== SEÇÃO 4: RENDA VARIÁVEL =====
  // =======================================
  sectionTitle("4. RENDA VARIAVEL (Operacoes Comuns / Day-Trade / Fundos Imobiliarios)");

  instructionBox(
    "Como preencher no programa da Receita Federal:",
    "Acesse: Fichas da Declaracao > Renda Variavel > Operacoes Comuns / Day-Trade. " +
    "Preencha mes a mes os resultados nos campos correspondentes. " +
    "Prejuizos compensam lucros futuros do mesmo tipo. " +
    "Aliquota: 15% operacoes comuns (acoes), 20% day-trade e FIIs/FIAgro. " +
    "DARF ate o ultimo dia util do mes seguinte (codigo 6015 para acoes, 6800 para FIIs)."
  );

  // Build all 12 months
  const ano = dados.anoCalendario;
  let prejuizoAcumuladoComum = 0;
  let prejuizoAcumuladoDT = 0;
  let irFonteDTAnterior = 0;
  let irFonte11033Anterior = 0;

  const renderMonthlyMarketTable = (label: string, rows: [string, string, string][]) => {
    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      styles: { fontSize: 6.5, cellPadding: 1.5, lineColor: [200, 200, 200], lineWidth: 0.15 },
      headStyles: { fillColor: COLORS.primary, textColor: COLORS.white, fontSize: 6.5, fontStyle: "bold" },
      bodyStyles: { textColor: COLORS.dark },
      alternateRowStyles: { fillColor: [250, 250, 250] },
      columnStyles: { 0: { cellWidth: 70 }, 1: { cellWidth: 40, halign: "right" }, 2: { cellWidth: 40, halign: "right" } },
      head: [[label, "Operacoes Comuns", "Day-Trade"]],
      body: rows,
    });
    y = (doc as any).lastAutoTable.finalY + 2;
  };

  for (let m = 1; m <= 12; m++) {
    const mesKey = `${ano}-${String(m).padStart(2, "0")}`;
    const mesLabel = MESES[m - 1];
    const opsData = dados.operacoesMensais[mesKey] || { vendas: [], compras: [] };

    // Calculate results for this month
    // Separate FII and stock operations
    const vendasAcoes = opsData.vendas.filter(v => !v.isFII && !v.isInternacional);
    const vendasFII = opsData.vendas.filter(v => v.isFII);

    // Calculate profit/loss for stocks (ações) - simplified: vendas - custo médio
    let resultadoAcoes = 0;
    vendasAcoes.forEach(v => {
      // Find corresponding purchase cost
      const comprasAtivo = opsData.compras.filter(c => c.ativo === v.ativo);
      const custoMedio = comprasAtivo.length > 0
        ? comprasAtivo.reduce((a, c) => a + c.valor_total, 0) / comprasAtivo.reduce((a, c) => a + c.quantidade, 0)
        : v.preco_unitario;
      resultadoAcoes += v.valor_total - (custoMedio * v.quantidade);
    });

    // Calculate profit/loss for FIIs
    let resultadoFII = 0;
    vendasFII.forEach(v => {
      const comprasAtivo = opsData.compras.filter(c => c.ativo === v.ativo);
      const custoMedio = comprasAtivo.length > 0
        ? comprasAtivo.reduce((a, c) => a + c.valor_total, 0) / comprasAtivo.reduce((a, c) => a + c.quantidade, 0)
        : v.preco_unitario;
      resultadoFII += v.valor_total - (custoMedio * v.quantidade);
    });

    const resultadoLiquidoComum = resultadoAcoes + resultadoFII;
    const resultadoLiquidoDT = 0; // Day-trade not yet tracked separately

    // Check if month has any activity (operations or dividends)
    const divAcoesMes = dados.dividendosMensaisAcoes?.[mesKey] || [];
    const divFIIMes = dados.dividendosMensaisFII?.[mesKey] || [];
    const hasActivity = opsData.vendas.length > 0 || opsData.compras.length > 0 || divAcoesMes.length > 0 || divFIIMes.length > 0;

    // Always show all 12 months (as per RF format)
    checkPage(120);

    // Month header
    doc.setFillColor(...COLORS.primary);
    doc.roundedRect(margin, y, contentW, 8, 1, 1, "F");
    doc.setTextColor(...COLORS.white);
    doc.setFontSize(FONT.body);
    doc.setFont("helvetica", "bold");
    doc.text(`Mes: ${mesLabel}`, margin + 4, y + 5.5);
    doc.setTextColor(...COLORS.dark);
    y += 12;

    // Mercado à Vista
    renderMonthlyMarketTable("Mercado a Vista", [
      ["Mercado a Vista - acoes", formatBRL(resultadoAcoes), "R$ 0,00"],
      ["Mercado a Vista - ouro", "R$ 0,00", "R$ 0,00"],
      ["Mercado a Vista - ouro at. fin. fora bolsa", "R$ 0,00", "R$ 0,00"],
    ]);

    // Dividends inline (Tipo 09 - Ações)
    if (divAcoesMes.length > 0) {
      autoTable(doc, {
        startY: y,
        margin: { left: margin, right: margin },
        styles: { fontSize: 6.5, cellPadding: 1.5, lineColor: [200, 200, 200], lineWidth: 0.15 },
        headStyles: { fillColor: [39, 174, 96], textColor: COLORS.white, fontSize: 6.5, fontStyle: "bold" },
        bodyStyles: { textColor: COLORS.dark },
        alternateRowStyles: { fillColor: [245, 252, 245] },
        columnStyles: { 0: { cellWidth: 12, halign: "center" }, 3: { halign: "right" } },
        head: [["Tipo", "CNPJ da Fonte Pagadora", "Nome da Fonte Pagadora", "Valor"]],
        body: divAcoesMes.map(d => ["09", d.cnpj || "-", d.nomeFonte || d.ativo, formatBRL(d.valor)]),
      });
      y = (doc as any).lastAutoTable.finalY + 2;
    }

    // Mercado Opções
    renderMonthlyMarketTable("Mercado Opcoes", [
      ["Mercado opcoes - acoes", "R$ 0,00", "R$ 0,00"],
      ["Mercado opcoes - ouro", "R$ 0,00", "R$ 0,00"],
      ["Mercado opcoes - fora de bolsa", "R$ 0,00", "R$ 0,00"],
      ["Mercado opcoes - outros", "R$ 0,00", "R$ 0,00"],
    ]);

    // Mercado Futuro
    renderMonthlyMarketTable("Mercado Futuro", [
      ["Mercado futuro - dolar dos EUA", "R$ 0,00", "R$ 0,00"],
      ["Mercado futuro - indices", "R$ 0,00", "R$ 0,00"],
      ["Mercado futuro - juros", "R$ 0,00", "R$ 0,00"],
      ["Mercado futuro - outros", "R$ 0,00", "R$ 0,00"],
    ]);

    // Mercado a Termo
    renderMonthlyMarketTable("Mercado a Termo", [
      ["Mercado termo - acoes/ouro", "R$ 0,00", "R$ 0,00"],
      ["Mercado termo - outros", "R$ 0,00", "R$ 0,00"],
    ]);

    // Resultados
    const baseCalcComum = Math.max(0, resultadoLiquidoComum - prejuizoAcumuladoComum);
    const baseCalcDT = Math.max(0, resultadoLiquidoDT - prejuizoAcumuladoDT);
    const impostoDevidoComum = baseCalcComum > 0 ? baseCalcComum * 0.15 : 0;
    const impostoDevidoDT = baseCalcDT > 0 ? baseCalcDT * 0.20 : 0;

    if (resultadoLiquidoComum < 0) {
      prejuizoAcumuladoComum += Math.abs(resultadoLiquidoComum);
    } else {
      prejuizoAcumuladoComum = Math.max(0, prejuizoAcumuladoComum - resultadoLiquidoComum);
    }

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      styles: { fontSize: 6.5, cellPadding: 1.5, lineColor: [200, 200, 200], lineWidth: 0.15 },
      headStyles: { fillColor: COLORS.primaryLight, textColor: COLORS.white, fontSize: 6.5, fontStyle: "bold" },
      bodyStyles: { textColor: COLORS.dark, fontStyle: "bold" },
      columnStyles: { 0: { cellWidth: 70 }, 1: { cellWidth: 40, halign: "right" }, 2: { cellWidth: 40, halign: "right" } },
      head: [["Resultados", "Operacoes Comuns", "Day-Trade"]],
      body: [
        ["RESULTADO LIQUIDO DO MES", formatBRL(resultadoLiquidoComum), formatBRL(resultadoLiquidoDT)],
        ["Resultado negativo ate o mes anterior", formatBRL(prejuizoAcumuladoComum > 0 && resultadoLiquidoComum >= 0 ? prejuizoAcumuladoComum + resultadoLiquidoComum : prejuizoAcumuladoComum), formatBRL(prejuizoAcumuladoDT)],
        ["BASE DE CALCULO DO IMPOSTO", formatBRL(baseCalcComum), formatBRL(baseCalcDT)],
        ["Prejuizo a compensar", formatBRL(prejuizoAcumuladoComum), formatBRL(prejuizoAcumuladoDT)],
        ["Aliquota do imposto", "15%", "20%"],
        ["IMPOSTO DEVIDO", formatBRL(impostoDevidoComum), formatBRL(impostoDevidoDT)],
      ],
    });
    y = (doc as any).lastAutoTable.finalY + 2;

    // Consolidação do mês
    const totalImpostoDevido = impostoDevidoComum + impostoDevidoDT;

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      styles: { fontSize: 6.5, cellPadding: 1.5, lineColor: [200, 200, 200], lineWidth: 0.15 },
      headStyles: { fillColor: [80, 80, 80], textColor: COLORS.white, fontSize: 6.5, fontStyle: "bold" },
      bodyStyles: { textColor: COLORS.dark },
      columnStyles: { 0: { cellWidth: 110 }, 1: { cellWidth: 40, halign: "right" } },
      head: [["Consolidacao do mes", ""]],
      body: [
        ["Total do imposto devido", formatBRL(totalImpostoDevido)],
        ["IR fonte de Day-Trade nos meses anteriores", formatBRL(irFonteDTAnterior)],
        ["IR fonte de Day-Trade a compensar", "R$ 0,00"],
        ["IR fonte (Lei n. 11.033/2004) no mes", "R$ 0,00"],
        ["IR fonte (Lei n. 11.033/2004) nos meses anteriores", formatBRL(irFonte11033Anterior)],
        ["IR fonte (Lei n. 11.033/2004) meses a compensar", "R$ 0,00"],
        ["Imposto a pagar", formatBRL(Math.max(0, totalImpostoDevido))],
        ["Imposto pago", "R$ 0,00"],
      ],
    });
    y = (doc as any).lastAutoTable.finalY + 2;

    // Dividends inline (Tipo 99 - FIIs)
    if (divFIIMes.length > 0) {
      autoTable(doc, {
        startY: y,
        margin: { left: margin, right: margin },
        styles: { fontSize: 6.5, cellPadding: 1.5, lineColor: [200, 200, 200], lineWidth: 0.15 },
        headStyles: { fillColor: [39, 174, 96], textColor: COLORS.white, fontSize: 6.5, fontStyle: "bold" },
        bodyStyles: { textColor: COLORS.dark },
        alternateRowStyles: { fillColor: [245, 252, 245] },
        columnStyles: { 0: { cellWidth: 12, halign: "center" }, 4: { halign: "right" } },
        head: [["Tipo", "CNPJ da Fonte Pagadora", "Nome da Fonte Pagadora", "Descricao", "Valor"]],
        body: divFIIMes.map(d => ["99", d.cnpj || "-", d.nomeFonte || d.ativo, `Rendimentos FII ${d.ativo}`, formatBRL(d.valor)]),
      });
      y = (doc as any).lastAutoTable.finalY + 2;
    }

    y += 4;
  }

  // ===== PTAX INFO =====
  if (dados.ptaxCount > 0) {
    const secNum = 5;
    sectionTitle(`${secNum}. INFORMACOES SOBRE CONVERSAO CAMBIAL (PTAX)`);

    writeText(
      `Os valores de ativos internacionais foram convertidos de USD para BRL utilizando a PTAX de venda ` +
      `do Banco Central do Brasil, referente ao dia util anterior a data de liquidacao de cada operacao ` +
      `(liquidacao T+1 nos EUA desde mai/2024, portanto PTAX do dia da operacao), conforme ` +
      `IN RFB 1585/2015. Foram utilizadas ${dados.ptaxCount} taxa(s) PTAX distintas. ` +
      `Na discriminacao, o custo e informado em dolar (USD); nos campos "Situacao em 31/12" ` +
      `os valores ja estao convertidos para reais (BRL).`,
      FONT.body,
    );
    y += 4;
  }

  // ===== FOOTER DISCLAIMER =====
  checkPage(28);
  y += 4;
  doc.setDrawColor(...COLORS.muted);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageW - margin, y);
  y += 5;

  writeText(
    "DISCLAIMER: Este documento foi gerado automaticamente pela plataforma Declare Certo e possui carater " +
    "exclusivamente informativo e auxiliar. Nao constitui assessoria fiscal, contabil ou juridica. O contribuinte " +
    "e o unico responsavel pela veracidade das informacoes prestadas a Receita Federal do Brasil. Recomenda-se " +
    "a consulta a um profissional contabil habilitado para validacao dos dados antes do envio da declaracao. " +
    "A plataforma Declare Certo nao se responsabiliza por eventuais erros, omissoes ou divergencias.",
    FONT.tiny,
    "italic",
    COLORS.muted,
  );

  // Add footer to all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    if (i === 1) continue; // Skip cover page

    const footerY = pageH - 8;
    doc.setFontSize(6.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLORS.muted);
    doc.text("Declare Certo - Relatorio Auxiliar IRPF", margin, footerY);
    doc.text(`Pagina ${i - 1} de ${totalPages - 1}`, pageW - margin, footerY, { align: "right" });

    // Top accent bar on every page (except cover)
    doc.setFillColor(...COLORS.primary);
    doc.rect(0, 0, pageW, 2.5, "F");
  }

  // Save
  doc.save(`Declaracao_IR_${dados.anoCalendario}_IRPF${anoExercicio}.pdf`);
}
