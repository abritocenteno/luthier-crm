import { splitVat } from "./vat";

// ── Income-tax (inkomstenbelasting) constants ────────────────────────────────
//
// These drive the annual Jaaroverzicht for an eenmanszaak. The figures below
// change every year — ALWAYS confirm the rate for the filing year against the
// Belastingdienst before relying on the numbers.

// MKB-winstvrijstelling: a flat exemption of business profit for anyone who is
// an "ondernemer voor de inkomstenbelasting". Unlike the zelfstandigenaftrek it
// does NOT require the 1.225-hour urencriterium, so it always applies here.
//   2024: 13,31%  ·  2025: 12,70%  ·  2026: assumed 12,70% (confirm)
export const MKB_VRIJSTELLING_RATE: Record<number, number> = {
    2024: 0.1331,
    2025: 0.127,
    2026: 0.127,
};
export const DEFAULT_MKB_RATE = 0.127;

export function mkbRateForYear(year: number): number {
    return MKB_VRIJSTELLING_RATE[year] ?? DEFAULT_MKB_RATE;
}

// Indicative Box 1 marginal rates for the "set aside" estimate. A side business
// stacks on top of salary, so its profit is taxed at the marginal rate from the
// first euro. These are rounded band rates for a rough reserve — not exact.
export const MARGINAL_RATE_OPTIONS = [
    { rate: 0.37, label: "37% · basis" },
    { rate: 0.495, label: "49,5% · top" },
];

// ── Types ────────────────────────────────────────────────────────────────────

type JInvoice = { date: number; amount: number; taxRate?: number; status?: string };
type JOrder = {
    date: number;
    amount: number;
    taxRate?: number;
    status?: string;
    supplierVatReclaimable?: boolean;
};

export type JaaroverzichtInput = {
    invoices: JInvoice[];
    orders: JOrder[];
    year: number;
    defaultRate: number;
};

export type Jaaroverzicht = ReturnType<typeof computeJaaroverzicht>;

// ── Calculation ──────────────────────────────────────────────────────────────
//
// Factuurstelsel basis: revenue is every invoice ISSUED in the year, net of VAT.
// Deductible costs mirror the BTW panel — NL (reclaimable) purchases cost their
// NET (the VAT is reclaimed separately as voorbelasting); foreign purchases cost
// their GROSS (that VAT is never reclaimable, so it's a real business cost).
export function computeJaaroverzicht({ invoices, orders, year, defaultRate }: JaaroverzichtInput) {
    const inYear = (ts: number) => new Date(ts).getFullYear() === year;

    let revenueNet = 0;
    let invoiceCount = 0;
    let missingRate = 0;
    for (const inv of invoices) {
        if (!inYear(inv.date)) continue;
        const b = splitVat(inv.amount, inv.taxRate ?? 0);
        revenueNet += b.net;
        invoiceCount++;
        if (inv.taxRate == null) missingRate++;
    }

    let nlCostNet = 0;
    let foreignCostGross = 0;
    let nlCount = 0;
    let foreignCount = 0;
    for (const o of orders) {
        if (o.status === "cancelled") continue;
        if (!inYear(o.date)) continue;
        const b = splitVat(o.amount, o.taxRate ?? defaultRate);
        if (o.supplierVatReclaimable === false) {
            foreignCostGross += b.gross;
            foreignCount++;
        } else {
            nlCostNet += b.net;
            nlCount++;
        }
    }
    const deductibleCosts = nlCostNet + foreignCostGross;

    // Winst uit onderneming — the figure that feeds the IB return.
    const netProfit = revenueNet - deductibleCosts;

    // No urencriterium → no zelfstandigenaftrek/startersaftrek. MKB-vrijstelling
    // only, and only on a positive profit.
    const mkbRate = mkbRateForYear(year);
    const mkbVrijstelling = netProfit > 0 ? netProfit * mkbRate : 0;
    const belastbareWinst = netProfit - mkbVrijstelling;

    return {
        year,
        revenueNet,
        invoiceCount,
        missingRate,
        nlCostNet,
        nlCount,
        foreignCostGross,
        foreignCount,
        deductibleCosts,
        netProfit,
        mkbRate,
        mkbVrijstelling,
        belastbareWinst,
    };
}
