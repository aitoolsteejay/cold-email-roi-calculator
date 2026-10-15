/** Display formatting only. Values arrive unrounded from lib/coldEmailRoi.ts. */
import { CURRENCIES, type Currency } from "@/data/coldEmailBenchmarks";

export function getCurrency(code: string): Currency {
  return CURRENCIES.find((c) => c.code === code) ?? CURRENCIES[0];
}

function finite(n: number | null | undefined): number {
  return typeof n === "number" && Number.isFinite(n) ? n : 0;
}

export function formatMoney(value: number | null | undefined, currency: Currency, opts: { compact?: boolean } = {}): string {
  const v = finite(value);
  if (opts.compact && Math.abs(v) >= 1000) {
    const s = new Intl.NumberFormat(currency.locale, { notation: "compact", maximumFractionDigits: 1 }).format(v);
    return `${v < 0 ? "-" : ""}${currency.symbol}${s.replace("-", "")}`;
  }
  const s = new Intl.NumberFormat(currency.locale, { maximumFractionDigits: 0 }).format(Math.abs(v));
  return `${v < 0 ? "-" : ""}${currency.symbol}${s}`;
}

/** Whole numbers at 100 and above, one decimal below that (28.9, 5, 0.4). */
export function formatCount(value: number | null | undefined, locale = "en-US"): string {
  const v = finite(value);
  const digits = Math.abs(v) >= 100 ? 0 : 1;
  return new Intl.NumberFormat(locale, { maximumFractionDigits: digits }).format(v);
}

export function formatInteger(value: number | null | undefined, locale = "en-US"): string {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(finite(value));
}

/** Percent with sensible precision: 1,057%, 3.4%, 0.05%. */
export function formatPercent(value: number | null | undefined, locale = "en-US"): string {
  const v = finite(value);
  const abs = Math.abs(v);
  const digits = abs >= 100 ? 0 : abs >= 1 ? 1 : abs >= 0.1 ? 2 : 3;
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: digits }).format(v)}%`;
}

/** Parse what a visitor typed. Accepts commas and spaces. Returns null for empty or invalid. */
export function parseNumberInput(text: string): number | null {
  const cleaned = text.replace(/[,\s]/g, "").replace(/[^\d.]/g, "");
  if (cleaned === "" || cleaned === ".") return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}
