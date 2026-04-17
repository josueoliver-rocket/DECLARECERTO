export interface CorporateEvent {
  date: string;
  type: string;
  description: string;
  ratio?: string;
  numerator?: number;
  denominator?: number;
  adjustmentFactor?: number;
}

/**
 * Given a list of corporate events (splits/groupings) in chronological order,
 * and a list of operations with dates, calculate the adjusted quantity and average price
 * considering all splits/groupings that happened AFTER each purchase.
 */
export function applyCorporateAdjustments(
  operations: { tipo: string; quantidade: number; valor_total: number; created_at: string }[],
  corporateEvents: CorporateEvent[]
): { adjustedQuantity: number; adjustedPrecoMedio: number; adjustedValorInvestido: number } {
  // Filter only split/grouping events with adjustment factors
  const splitEvents = corporateEvents.filter(
    (e) => e.adjustmentFactor && e.adjustmentFactor !== 1 && (e.type === 'Desdobramento' || e.type === 'Bonificação' || e.type === 'Grupamento')
  );

  if (splitEvents.length === 0) {
    // No adjustments needed, calculate normally
    let qtdCompras = 0;
    let valorCompras = 0;
    let qtdVendas = 0;

    operations.forEach((op) => {
      if (op.tipo === 'C') {
        qtdCompras += op.quantidade;
        valorCompras += Number(op.valor_total);
      } else {
        qtdVendas += op.quantidade;
      }
    });

    const qty = qtdCompras - qtdVendas;
    const pm = qtdCompras > 0 ? valorCompras / qtdCompras : 0;
    return { adjustedQuantity: qty, adjustedPrecoMedio: pm, adjustedValorInvestido: qty * pm };
  }

  // Sort operations by date ascending
  const sortedOps = [...operations].sort(
    (a, b) => a.created_at.localeCompare(b.created_at)
  );

  // For each operation, calculate the cumulative adjustment factor
  // that applies from the operation date to today
  let totalShares = 0;
  let totalCost = 0;

  sortedOps.forEach((op) => {
    const opDate = op.created_at.split('T')[0];

    // Find all split events that happened after this operation
    const applicableEvents = splitEvents.filter((e) => e.date > opDate);
    const cumulativeFactor = applicableEvents.reduce(
      (acc, e) => acc * (e.adjustmentFactor || 1),
      1
    );

    if (op.tipo === 'C') {
      // Adjust quantity: multiply by cumulative factor
      const adjustedQty = op.quantidade * cumulativeFactor;
      totalShares += adjustedQty;
      totalCost += Number(op.valor_total);
    } else {
      // For sells, also adjust quantity
      const adjustedQty = op.quantidade * cumulativeFactor;
      totalShares -= adjustedQty;
    }
  });

  // Only round for Brazilian tickers (international assets can have fractional shares)
  // We don't have ticker info here, so skip rounding — callers handle display
  const adjustedPrecoMedio = totalShares > 0 ? totalCost / totalShares : 0;

  return {
    adjustedQuantity: totalShares,
    adjustedPrecoMedio,
    adjustedValorInvestido: totalShares * adjustedPrecoMedio,
  };
}

/**
 * Check if asset has any split/grouping events
 */
export function hasCorporateEvents(events: CorporateEvent[]): boolean {
  return events.some(
    (e) => e.type === 'Desdobramento' || e.type === 'Bonificação' || e.type === 'Grupamento'
  );
}
