/**
 * Determines if a ticker is a Brazilian asset (B3).
 * Brazilian tickers typically follow the pattern: 4 letters + 1-2 digits (e.g., PETR4, VALE3, BOVA11)
 */
export const isBrazilianTicker = (ticker: string): boolean => {
  const t = ticker.toUpperCase().trim();
  return /^[A-Z]{4}\d{1,2}$/.test(t);
};

/**
 * Returns the currency for a given ticker.
 */
export const getCurrency = (ticker: string): "BRL" | "USD" =>
  isBrazilianTicker(ticker) ? "BRL" : "USD";

/**
 * Formats a number as currency (BRL or USD).
 */
export const formatCurrency = (value: number, currency: "BRL" | "USD" = "BRL") =>
  currency === "USD"
    ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value)
    : new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
