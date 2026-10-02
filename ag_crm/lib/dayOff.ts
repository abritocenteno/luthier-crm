import { splitVat, type SupplierVatTreatment } from "./vat";
import { orderVat } from "./btwAangifte";

// ── "One day less" tracker ──────────────────────────────────────────────────
//
// Compares what the shop earns per week with what dropping one day of the
// salaried job would cost. The shop's profit stacks on top of the salary, so it
// is taxed at the marginal Box 1 rate (~37,5%), lowered by the MKB-winstvrijstelling
// (12,7%) and raised again by the Zvw-bijdrage (~5%) — about 37% all-in.
// Indicative only, like the Jaaroverzicht panel.
export const DAY_OFF_TAX_RESERVE = 0.37;

// A rolling quarter: long enough to smooth out bursts of material purchases.
export const ROLLING_WEEKS = 13;
export const CHART_WEEKS = 26;

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

type DInvoice = { date: number; amount: number; taxRate?: number; status?: string };
type DOrder = {
    date: number;
    amount: number;
    taxRate?: number;
    status?: string;
    supplierVatTreatment?: SupplierVatTreatment;
};

export type DayOffInput = {
    invoices: DInvoice[];
    orders: DOrder[];
    defaultRate: number;
    salaryPer4Weeks: number;
    workDaysPerWeek: number;
    now: number;
};

export type DayOffWeek = { end: number; profit: number; rollingAfterTax: number };

const afterTax = (profit: number) => (profit > 0 ? profit * (1 - DAY_OFF_TAX_RESERVE) : profit);

// Same basis as the Jaaroverzicht: invoices net of BTW on their invoice date,
// minus purchase costs (NL at net, foreign at gross, EU reverse-charge as paid).
export function computeDayOff({ invoices, orders, defaultRate, salaryPer4Weeks, workDaysPerWeek, now }: DayOffInput) {
    const dayValue = salaryPer4Weeks / 4 / workDaysPerWeek;
    const profitNeeded = dayValue / (1 - DAY_OFF_TAX_RESERVE);

    // Week i covers (now - (i+1) weeks, now - i weeks]; index 0 is the latest week.
    const totalWeeks = CHART_WEEKS + ROLLING_WEEKS - 1;
    const revenue = new Array<number>(totalWeeks).fill(0);
    const costs = new Array<number>(totalWeeks).fill(0);
    const invoiceCounts = new Array<number>(totalWeeks).fill(0);
    const weekIndex = (ts: number) => Math.floor((now - ts) / WEEK_MS);

    let firstActivity = Infinity;
    for (const inv of invoices) {
        if (inv.status === "cancelled" || inv.status === "draft") continue;
        firstActivity = Math.min(firstActivity, inv.date);
        const i = weekIndex(inv.date);
        if (i < 0 || i >= totalWeeks) continue;
        revenue[i] += splitVat(inv.amount, inv.taxRate ?? 0).net;
        invoiceCounts[i]++;
    }
    for (const o of orders) {
        if (o.status === "cancelled") continue;
        firstActivity = Math.min(firstActivity, o.date);
        const i = weekIndex(o.date);
        if (i < 0 || i >= totalWeeks) continue;
        costs[i] += orderVat(o, defaultRate).net;
    }

    // Weeks before the shop's first invoice or order don't count towards an average.
    const activeWeeks = Number.isFinite(firstActivity) ? weekIndex(firstActivity) + 1 : 0;
    const rollingProfit = (from: number) => {
        const span = Math.min(ROLLING_WEEKS, activeWeeks - from);
        if (span <= 0) return null;
        let rev = 0, cost = 0, count = 0;
        for (let i = from; i < from + span; i++) { rev += revenue[i]; cost += costs[i]; count += invoiceCounts[i]; }
        return { rev, cost, count, span };
    };

    const weeks: DayOffWeek[] = [];
    for (let i = CHART_WEEKS - 1; i >= 0; i--) {
        const r = rollingProfit(i);
        weeks.push({
            end: now - i * WEEK_MS,
            profit: revenue[i] - costs[i],
            rollingAfterTax: r ? afterTax((r.rev - r.cost) / r.span) : 0,
        });
    }

    const current = rollingProfit(0);
    const span = current?.span ?? 0;
    const revenuePerWeek = current ? current.rev / span : 0;
    const costsPerWeek = current ? current.cost / span : 0;
    const profitPerWeek = revenuePerWeek - costsPerWeek;
    const afterTaxPerWeek = afterTax(profitPerWeek);
    const avgInvoiceNet = current && current.count > 0 ? current.rev / current.count : 0;
    const profitGap = Math.max(0, profitNeeded - profitPerWeek);

    return {
        dayValue,
        profitNeeded,
        span,
        invoicesPerWeek: current ? current.count / span : 0,
        revenuePerWeek,
        costsPerWeek,
        profitPerWeek,
        afterTaxPerWeek,
        coverage: dayValue > 0 ? Math.max(0, afterTaxPerWeek) / dayValue : 0,
        profitGap,
        avgInvoiceNet,
        extraJobsPerWeek: avgInvoiceNet > 0 ? profitGap / avgInvoiceNet : 0,
        weeks,
    };
}
