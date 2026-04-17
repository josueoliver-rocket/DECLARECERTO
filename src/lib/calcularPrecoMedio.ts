/**
 * Calcula preço médio incluindo taxas proporcionais da nota de corretagem.
 * 
 * As taxas de cada nota (emolumentos, liquidação, etc.) são distribuídas
 * proporcionalmente entre as operações de COMPRA da mesma nota,
 * com base no valor_total de cada operação.
 */

export interface OperacaoComNota {
  ativo: string;
  tipo: string;
  quantidade: number;
  preco_unitario: number;
  valor_total: number;
  nota_id: string | null;
  created_at: string;
  notas_corretagem?: {
    data_operacao: string | null;
    taxas: number | null;
  } | null;
}

export interface AtivoAgrupado {
  compras: { quantidade: number; valorComTaxas: number }[];
  vendas: { quantidade: number; valor: number }[];
  allOps: { tipo: string; quantidade: number; valor_total: number; created_at: string }[];
}

/**
 * Agrupa operações por ativo, distribuindo taxas proporcionalmente nas compras.
 */
export function agruparOperacoesComTaxas(
  operacoes: OperacaoComNota[]
): Record<string, AtivoAgrupado> {
  // 1. Calcular o total de compras por nota_id para distribuição proporcional
  const comprasPorNota: Record<string, { total: number; ops: OperacaoComNota[] }> = {};
  
  operacoes.forEach(op => {
    if (op.tipo === 'C' && op.nota_id) {
      if (!comprasPorNota[op.nota_id]) {
        comprasPorNota[op.nota_id] = { total: 0, ops: [] };
      }
      comprasPorNota[op.nota_id].total += Number(op.valor_total);
      comprasPorNota[op.nota_id].ops.push(op);
    }
  });

  // 2. Agrupar por ativo
  const ativosMap: Record<string, AtivoAgrupado> = {};

  operacoes.forEach(op => {
    if (!ativosMap[op.ativo]) {
      ativosMap[op.ativo] = { compras: [], vendas: [], allOps: [] };
    }

    const opDate = op.notas_corretagem?.data_operacao
      ? op.notas_corretagem.data_operacao + 'T00:00:00+00:00'
      : op.created_at;

    if (op.tipo === 'C') {
      let taxaProporcional = 0;
      
      if (op.nota_id && op.notas_corretagem?.taxas) {
        const notaInfo = comprasPorNota[op.nota_id];
        if (notaInfo && notaInfo.total > 0) {
          // Distribui a taxa proporcionalmente pelo valor da compra
          const proporcao = Number(op.valor_total) / notaInfo.total;
          taxaProporcional = Number(op.notas_corretagem.taxas) * proporcao;
        }
      }

      ativosMap[op.ativo].compras.push({
        quantidade: op.quantidade,
        valorComTaxas: Number(op.valor_total) + taxaProporcional,
      });
    } else {
      ativosMap[op.ativo].vendas.push({
        quantidade: op.quantidade,
        valor: Number(op.valor_total),
      });
    }

    ativosMap[op.ativo].allOps.push({
      tipo: op.tipo,
      quantidade: op.quantidade,
      valor_total: Number(op.valor_total),
      created_at: opDate,
    });
  });

  return ativosMap;
}

/**
 * Calcula preço médio simples a partir de dados agrupados.
 */
export function calcularPrecoMedioSimples(data: AtivoAgrupado) {
  const qtdCompras = data.compras.reduce((acc, c) => acc + c.quantidade, 0);
  const valorCompras = data.compras.reduce((acc, c) => acc + c.valorComTaxas, 0);
  const qtdVendas = data.vendas.reduce((acc, v) => acc + v.quantidade, 0);

  const quantidade = qtdCompras - qtdVendas;
  const precoMedio = qtdCompras > 0 ? valorCompras / qtdCompras : 0;
  const valorInvestido = quantidade * precoMedio;

  return { quantidade, precoMedio, valorInvestido };
}
