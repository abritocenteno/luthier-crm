import { splitVat, DEFAULT_VAT_RATE, type SupplierVatTreatment } from "./vat";

// ── BTW aangifte rubrieken ──────────────────────────────────────────────────
// Maps a quarter's sales invoices and purchase orders onto the boxes of the
// Dutch VAT return, so the figures can be copied straight into Mijn Belastingdienst.
//
//   1a  sales at 21%              1b  sales at 9%
//   1c  sales at other rates      1e  sales at 0% / not taxed here
//   4b  purchases from EU suppliers under reverse charge (self-assessed 21%)
//   5b  voorbelasting: NL input VAT + the 4b VAT reclaimed again
//   5g  total to pay (positive) or reclaim (negative)

type AInvoice = { amount: number; taxRate?: number };
type AOrder = { amount: number; taxRate?: number; supplierVatTreatment?: SupplierVatTreatment };

export type Rubriek = { code: string; label: string; omzet?: number; btw?: number };

/** Net cost + reclaimable input VAT of one purchase order, per its supplier's treatment. */
export function orderVat(o: AOrder, defaultRate: number) {
    const treatment = o.supplierVatTreatment ?? "nl";
    if (treatment === "eu_reverse") {
        // Invoiced at 0%: what was paid is the net amount. Dutch BTW is self-assessed on it.
        return { treatment, net: o.amount, inputVat: 0, reverseVat: o.amount * (DEFAULT_VAT_RATE / 100) };
    }
    const b = splitVat(o.amount, o.taxRate ?? defaultRate);
    if (treatment === "foreign") return { treatment, net: b.gross, inputVat: 0, reverseVat: 0 };
    return { treatment, net: b.net, inputVat: b.vat, reverseVat: 0 };
}

export function computeAangifte(invoices: AInvoice[], orders: AOrder[], defaultRate: number) {
    const sales = { r1a: { omzet: 0, btw: 0 }, r1b: { omzet: 0, btw: 0 }, r1c: { omzet: 0, btw: 0 }, r1e: { omzet: 0 } };
    for (const inv of invoices) {
        const rate = inv.taxRate ?? 0;
        const b = splitVat(inv.amount, rate);
        if (rate === 21) { sales.r1a.omzet += b.net; sales.r1a.btw += b.vat; }
        else if (rate === 9) { sales.r1b.omzet += b.net; sales.r1b.btw += b.vat; }
        else if (rate > 0) { sales.r1c.omzet += b.net; sales.r1c.btw += b.vat; }
        else sales.r1e.omzet += b.net;
    }

    let r4bOmzet = 0, r4bBtw = 0, nlInputVat = 0, reverseCount = 0;
    for (const o of orders) {
        const v = orderVat(o, defaultRate);
        if (v.treatment === "eu_reverse") { r4bOmzet += v.net; r4bBtw += v.reverseVat; reverseCount++; }
        nlInputVat += v.inputVat;
    }

    // The Belastingdienst takes whole euros and lets you round in your favour:
    // turnover and VAT owed down, voorbelasting up.
    const down = (n: number) => Math.floor(n + 1e-9);
    const up = (n: number) => Math.ceil(n - 1e-9);

    const rubrieken: Rubriek[] = [
        { code: "1a", label: "Leveringen/diensten belast met hoog tarief (21%)", omzet: down(sales.r1a.omzet), btw: down(sales.r1a.btw) },
        { code: "1b", label: "Leveringen/diensten belast met laag tarief (9%)", omzet: down(sales.r1b.omzet), btw: down(sales.r1b.btw) },
        ...(sales.r1c.omzet > 0 ? [{ code: "1c", label: "Leveringen/diensten belast met overige tarieven", omzet: down(sales.r1c.omzet), btw: down(sales.r1c.btw) }] : []),
        { code: "1e", label: "Leveringen/diensten belast met 0% of niet bij u belast", omzet: down(sales.r1e.omzet) },
        { code: "4b", label: "Leveringen/diensten uit landen binnen de EU", omzet: down(r4bOmzet), btw: down(r4bBtw) },
    ];
    const r5a = rubrieken.reduce((s, r) => s + (r.btw ?? 0), 0);
    const r5b = up(nlInputVat + r4bBtw);
    rubrieken.push(
        { code: "5a", label: "Verschuldigde omzetbelasting (subtotaal)", btw: r5a },
        { code: "5b", label: "Voorbelasting", btw: r5b },
        { code: "5g", label: r5a - r5b >= 0 ? "Totaal te betalen" : "Totaal terug te vragen", btw: Math.abs(r5a - r5b) },
    );

    return { rubrieken, total: r5a - r5b, reverseCount, r4bOmzet, r4bBtw };
}
