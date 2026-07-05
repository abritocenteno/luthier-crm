import { splitVat, DEFAULT_VAT_RATE } from "./vat";

// ── Generic CSV helper ─────────────────────────────────────────────────────

function escapeCsvCell(value: unknown): string {
    if (value == null) return "";
    const str = String(value);
    // Wrap in quotes if it contains a comma, quote, or newline
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
}

function toCSV(rows: Record<string, unknown>[]): string {
    if (rows.length === 0) return "";
    const headers = Object.keys(rows[0]);
    const lines = [
        headers.join(","),
        ...rows.map((row) => headers.map((h) => escapeCsvCell(row[h])).join(",")),
    ];
    return lines.join("\n");
}

/** Build a CSV string from rows (without triggering a download) — handy for bundling into a ZIP. */
export function toCSVString(rows: Record<string, unknown>[]): string {
    return toCSV(rows);
}

export function downloadCSV(rows: Record<string, unknown>[], filename: string) {
    const csv = toCSV(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// ── Type-specific exporters ────────────────────────────────────────────────

type Job = {
    _id: string;
    title: string;
    status: string;
    instrumentType: string;
    instrumentBrand?: string;
    instrumentModel?: string;
    instrumentSerial?: string;
    instrumentColor?: string;
    intakeDate: number;
    estimatedCompletionDate?: number;
    completionDate?: number;
    internalNotes?: string;
    source?: string; // 'direct' | 'gitaarafstellen' — acquisition channel
    workItems?: Array<{ name: string; type: string; unitPrice: number; hours?: number }>;
    client?: { name?: string; email?: string };
};

type Invoice = {
    _id: string;
    invoiceNumber: string;
    date: number;
    amount: number;
    status: string;
    paymentMethod?: string;
    paidAt?: number;
    clientName?: string;
    taxRate?: number;
};

type Order = {
    _id: string;
    orderNumber: string;
    date: number;
    amount: number;
    status: string;
    taxRate?: number;
    supplierName?: string;
    supplierVatReclaimable?: boolean;
};

type Client = {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    type: string;
    city?: string;
    street?: string;
    postcode?: string;
    website?: string;
};

const fmt = (ts?: number) =>
    ts ? new Date(ts).toLocaleDateString("en-GB") : "";

export function exportJobs(jobs: Job[]) {
    const rows = jobs.map((j) => {
        const workTotal = (j.workItems ?? []).reduce(
            (sum, wi) => sum + (wi.type === "hourly" ? wi.unitPrice * (wi.hours ?? 1) : wi.unitPrice),
            0
        );
        return {
            "Job Title": j.title,
            "Client": (j as any).client?.name ?? "",
            "Channel": j.source === "gitaarafstellen" ? "Gitaarafstellen" : "Direct",
            "Status": j.status,
            "Instrument Type": j.instrumentType,
            "Brand": j.instrumentBrand ?? "",
            "Model": j.instrumentModel ?? "",
            "Serial": j.instrumentSerial ?? "",
            "Color": j.instrumentColor ?? "",
            "Intake Date": fmt(j.intakeDate),
            "Est. Completion": fmt(j.estimatedCompletionDate),
            "Completion Date": fmt(j.completionDate),
            "Work Items": (j.workItems ?? []).map((wi) => wi.name).join("; "),
            "Estimated Total (€)": workTotal.toFixed(2),
            "Internal Notes": j.internalNotes ?? "",
        };
    });
    downloadCSV(rows as Record<string, unknown>[], "jobs_export");
}

export function invoiceRows(invoices: Invoice[]): Record<string, unknown>[] {
    return invoices.map((i) => {
        const rate = i.taxRate ?? 0;
        const { net, vat } = splitVat(i.amount, rate);
        return {
            "Invoice #": i.invoiceNumber,
            "Client": i.clientName ?? "",
            "Date": fmt(i.date),
            "VAT Rate (%)": rate,
            "Net (€)": net.toFixed(2),
            "VAT (€)": vat.toFixed(2),
            "Gross (€)": i.amount.toFixed(2),
            "Status": i.status,
            "Payment Method": i.paymentMethod ?? "",
            "Paid On": fmt(i.paidAt),
        };
    });
}

export function orderRows(orders: Order[], defaultRate = DEFAULT_VAT_RATE): Record<string, unknown>[] {
    return orders.map((o) => {
        const rate = o.taxRate ?? defaultRate;
        const { net, vat } = splitVat(o.amount, rate);
        return {
            "Order #": o.orderNumber,
            "Supplier": o.supplierName ?? "",
            "Date": fmt(o.date),
            "VAT Rate (%)": rate,
            "Net (€)": net.toFixed(2),
            "VAT (€)": vat.toFixed(2),
            "Gross (€)": o.amount.toFixed(2),
            "NL VAT Reclaimable": o.supplierVatReclaimable === false ? "No" : "Yes",
            "Status": o.status,
        };
    });
}

export function exportInvoices(invoices: Invoice[], filename = "invoices_export") {
    downloadCSV(invoiceRows(invoices), filename);
}

export function exportOrders(orders: Order[], defaultRate = DEFAULT_VAT_RATE, filename = "orders_export") {
    downloadCSV(orderRows(orders, defaultRate), filename);
}

export function exportClients(clients: Client[]) {
    const rows = clients.map((c) => ({
        "Name": c.name,
        "Email": c.email,
        "Phone": c.phone ?? "",
        "Type": c.type,
        "City": c.city ?? "",
        "Street": c.street ?? "",
        "Postcode": c.postcode ?? "",
        "Website": c.website ?? "",
    }));
    downloadCSV(rows as Record<string, unknown>[], "clients_export");
}
