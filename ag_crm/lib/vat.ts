// ── VAT (BTW) + quarter helpers ─────────────────────────────────────────────
// All monetary amounts in this app are VAT-inclusive (the stored `amount` is the
// gross total). These helpers split a gross amount into net + VAT given a rate.

export const DEFAULT_VAT_RATE = 21;

export type VatBreakdown = { gross: number; net: number; vat: number; rate: number };

/** Split a VAT-inclusive (gross) amount into net + VAT for the given rate (%). */
export function splitVat(gross: number, rate: number): VatBreakdown {
    const r = rate > 0 ? rate : 0;
    const vat = r > 0 ? gross * (r / (100 + r)) : 0;
    return { gross, net: gross - vat, vat, rate: r };
}

// ── Quarters ────────────────────────────────────────────────────────────────

/** Inclusive-start / exclusive-end timestamps for quarter `q` (1–4) of `year`. */
export function quarterRange(year: number, q: number): { start: number; end: number } {
    const startMonth = (q - 1) * 3; // 0, 3, 6, 9
    const start = new Date(year, startMonth, 1, 0, 0, 0, 0).getTime();
    const end = new Date(year, startMonth + 3, 1, 0, 0, 0, 0).getTime();
    return { start, end };
}

/** The quarter (1–4) that a timestamp falls into. */
export function quarterOf(ts: number): number {
    return Math.floor(new Date(ts).getMonth() / 3) + 1;
}

export const QUARTER_LABELS: Record<number, string> = {
    1: "Q1 · Jan–Mar",
    2: "Q2 · Apr–Jun",
    3: "Q3 · Jul–Sep",
    4: "Q4 · Oct–Dec",
};

/** Returns the most recently completed quarter (the one you'd typically file for). */
export function currentFilingPeriod(now = new Date()): { year: number; quarter: number } {
    const q = Math.floor(now.getMonth() / 3) + 1; // current quarter
    if (q === 1) return { year: now.getFullYear() - 1, quarter: 4 };
    return { year: now.getFullYear(), quarter: q - 1 };
}
