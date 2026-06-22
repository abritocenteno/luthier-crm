"use client";

import { forwardRef } from "react";
import { CheckCircle2, ExternalLink } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { sourceMeta } from "@/lib/sources";

const Card = ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={cn("bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden", className)}>
        {children}
    </div>
);

const Badge = ({ children, variant = "neutral" }: { children: React.ReactNode; variant?: "neutral" | "success" | "warning" | "error" }) => {
    const variants = {
        neutral: "bg-zinc-100 text-zinc-600",
        success: "bg-emerald-50 text-emerald-700 border border-emerald-100",
        warning: "bg-amber-50 text-amber-700 border border-amber-100",
        error: "bg-red-50 text-red-700 border border-red-100",
    };

    return (
        <span className={cn("px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider", variants[variant])}>
            {children}
        </span>
    );
};

export type InvoiceDocumentProps = {
    invoice: any;
    settings: any;
    invoiceSource: string;
    showSourceTag: boolean;
    /** Optional action node rendered in the Line Items header (e.g. the "Import time entries" button on the detail page). */
    headerAction?: React.ReactNode;
};

/**
 * The branded invoice document. Shared by the detail page and the quarterly Tax Pack
 * bundler so the PDFs we archive match exactly what clients receive. The capture id
 * (`invoice-capture`) and CSS Shield below keep html-to-image happy with Tailwind 4.
 */
const InvoiceDocument = forwardRef<HTMLDivElement, InvoiceDocumentProps>(function InvoiceDocument(
    { invoice, settings, invoiceSource, showSourceTag, headerAction },
    ref
) {
    return (
        <div
            ref={ref}
            id="invoice-capture"
            className="bg-white border border-zinc-200 rounded-2xl p-8 md:p-12 shadow-xl shadow-zinc-200/50 space-y-10"
            style={{
                color: '#18181b', // zinc-900
                backgroundColor: '#ffffff',
            }}
        >
            {/*
                CSS Shield for html2canvas compatibility with Tailwind 4.
                Tailwind 4 uses modern color functions (oklch, lab) that html2canvas 1.4.x cannot parse.
                This block forces standard hex values for all zinc variables used by the components.
            */}
            <style dangerouslySetInnerHTML={{
                __html: `
                #invoice-capture, #invoice-capture * {
                    --color-zinc-50: #fafafa !important;
                    --color-zinc-100: #f4f4f5 !important;
                    --color-zinc-200: #e4e4e7 !important;
                    --color-zinc-300: #d4d4d8 !important;
                    --color-zinc-400: #a1a1aa !important;
                    --color-zinc-500: #71717a !important;
                    --color-zinc-600: #52525b !important;
                    --color-zinc-700: #3f3f46 !important;
                    --color-zinc-800: #27272a !important;
                    --color-zinc-900: #18181b !important;

                    /* Fix for transparent/border colors that might use modern functions */
                    --tw-border-opacity: 1 !important;
                    --tw-bg-opacity: 1 !important;
                    --tw-text-opacity: 1 !important;

                    /* Disable modern features that often break canvas capture */
                    --tw-ring-color: transparent !important;
                    --tw-shadow: none !important;
                    --tw-shadow-colored: none !important;
                    box-shadow: none !important;
                }
            `}} />
            {/* Branding & Top Info */}
            <div className="flex flex-col md:flex-row justify-between gap-6">
                <div className="space-y-6 flex-1">
                    <div className="flex items-center gap-4">
                        {settings?.logoUrl ? (
                            <div className="h-16 flex items-center justify-center bg-white rounded-xl">
                                <img src={settings.logoUrl} alt="Company Logo" className="h-full object-contain max-w-[200px]" crossOrigin="anonymous" />
                            </div>
                        ) : (
                            <>
                                <div className="w-12 h-12 rounded-xl bg-black flex items-center justify-center text-white shrink-0">
                                    <span className="font-black text-xl italic">{settings?.companyName?.substring(0, 2).toUpperCase() || "AG"}</span>
                                </div>
                                <span className="font-black text-3xl tracking-tighter">{settings?.companyName || "AG CRM"}</span>
                            </>
                        )}
                    </div>
                    <div className="space-y-1.5 text-sm text-zinc-500 font-medium max-w-sm">
                        <p className="text-zinc-800 font-bold">{settings?.companyName || "Configure in Settings"}</p>
                        <p>{settings?.addressLine1 || "123 Workshop Blvd"}</p>
                        {settings?.addressLine2 && <p>{settings?.addressLine2}</p>}

                        <div className="pt-2 space-y-0.5 text-zinc-400">
                            <p>{settings?.contactEmail || "billing@agcrm.com"}</p>
                            {settings?.phone && <p>{settings?.phone}</p>}
                            {settings?.website && <p>{settings?.website.replace(/^https?:\/\//, '')}</p>}
                            {settings?.kvkNumber && <p>KvK: {settings?.kvkNumber}</p>}
                            {(settings as any)?.btwNumber && <p>BTW: {(settings as any).btwNumber}</p>}
                        </div>
                    </div>
                </div>
                <div className="text-right space-y-2">
                    <h2 className="text-3xl font-black tracking-tighter uppercase">Invoice</h2>
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-zinc-50 border border-zinc-100 rounded-full">
                        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none">Status</span>
                        <Badge variant={invoice.status === "paid" ? "success" : invoice.status === "pending" ? "warning" : "error"}>
                            {invoice.status}
                        </Badge>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Billed To */}
                <div className="space-y-4">
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Billed To</p>
                    <div className="space-y-1">
                        <h3 className="text-lg font-bold text-zinc-900">{invoice.clientName}</h3>
                        {(invoice as any).client?.street && (
                            <p className="text-sm text-zinc-500 font-medium">{(invoice as any).client.street}</p>
                        )}
                        {((invoice as any).client?.postcode || (invoice as any).client?.city) && (
                            <p className="text-sm text-zinc-500 font-medium">
                                {[(invoice as any).client?.postcode, (invoice as any).client?.city].filter(Boolean).join("  ")}
                            </p>
                        )}
                        {(invoice as any).client?.email && (
                            <p className="text-sm text-zinc-500 font-medium">{(invoice as any).client.email}</p>
                        )}
                        {(invoice as any).client?.phone && (
                            <p className="text-sm text-zinc-500 font-medium">{(invoice as any).client.phone}</p>
                        )}
                        {!(invoice as any).client?.street && !(invoice as any).client?.city && (
                            <p className="text-sm text-zinc-400 italic">No address on file.</p>
                        )}
                        {showSourceTag && (
                            <p className="text-xs font-bold text-orange-600 pt-2">
                                via {sourceMeta(invoiceSource).label}
                            </p>
                        )}
                    </div>
                </div>

                {/* Invoice Meta */}
                <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-2">
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Invoice Details</p>
                        <div className="space-y-2 text-sm font-bold">
                            <div>
                                <p className="text-zinc-400 font-medium text-[11px] mb-0.5">Number</p>
                                <p>{invoice.invoiceNumber}</p>
                            </div>
                            <div>
                                <p className="text-zinc-400 font-medium text-[11px] mb-0.5">Date Issued</p>
                                <p>{new Date(invoice.date).toLocaleDateString()}</p>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-2 relative">
                        {/* PAID stamp overlay */}
                        {invoice.status === "paid" && (
                            <div className="absolute -top-2 -right-2 rotate-[-12deg] pointer-events-none select-none">
                                <div className="px-3 py-1 border-2 border-emerald-400 rounded-lg">
                                    <span className="text-emerald-500 font-black text-xl tracking-[0.25em] uppercase opacity-70">Paid</span>
                                </div>
                            </div>
                        )}
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Payment</p>
                        <div className="space-y-2 text-sm font-bold">
                            {invoice.status !== "paid" && (
                                <div>
                                    <p className="text-zinc-400 font-medium text-[11px] mb-0.5">Due By</p>
                                    <p>{new Date(invoice.date + 14 * 24 * 60 * 60 * 1000).toLocaleDateString()}</p>
                                </div>
                            )}
                            {invoice.paymentMethod && (
                                <div>
                                    <p className="text-zinc-400 font-medium text-[11px] mb-0.5">Method</p>
                                    <p>{invoice.paymentMethod}</p>
                                </div>
                            )}
                            {(invoice as any).paidAt && (
                                <div>
                                    <p className="text-zinc-400 font-medium text-[11px] mb-0.5">Paid On</p>
                                    <p className="text-emerald-600">{new Date((invoice as any).paidAt).toLocaleDateString()}</p>
                                </div>
                            )}
                            <div>
                                <p className="text-zinc-400 font-medium text-[11px] mb-0.5">
                                    {invoice.status === "paid" ? "Amount Paid" : invoice.amount < 0 ? "Credit Due" : "Amount Due"}
                                </p>
                                <p className={cn(
                                    "text-lg font-black tracking-tight",
                                    invoice.status === "paid" ? "text-emerald-600" : invoice.amount < 0 ? "text-amber-600" : ""
                                )}>
                                    {formatCurrency(invoice.amount, settings?.currency)}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Items Table */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Line Items</p>
                    {headerAction}
                </div>
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b-2 border-zinc-100">
                            <th className="pb-3 text-sm font-black uppercase tracking-tight w-[45%]">Item & Description</th>
                            <th className="pb-3 text-sm font-black uppercase tracking-tight text-center w-[15%]">Qty</th>
                            <th className="pb-3 text-sm font-black uppercase tracking-tight text-right w-[20%]">Rate</th>
                            <th className="pb-3 text-sm font-black uppercase tracking-tight text-right w-[20%]">Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-50">
                        {invoice.items?.map((item: any, idx: number) => (
                            <tr key={idx} className="group">
                                <td className="py-3 pr-4">
                                    <div className="space-y-1">
                                        <p className="font-bold text-zinc-900">{item.name}</p>
                                        <p className="text-xs text-zinc-500 leading-relaxed max-w-sm">{item.description}</p>
                                        {item.remark && (
                                            <p className="text-[10px] text-zinc-400 italic mt-2 font-medium bg-zinc-50/50 inline-block px-2 py-0.5 rounded">
                                                Note: {item.remark}
                                            </p>
                                        )}
                                    </div>
                                </td>
                                <td className="py-3 text-center">
                                    <span className="text-sm font-bold text-zinc-700 bg-zinc-50 px-3 py-1 rounded-lg">{item.amount}</span>
                                </td>
                                <td className="py-3 text-right font-bold text-zinc-700">
                                    {formatCurrency(item.unitPrice, settings?.currency)}
                                </td>
                                <td className="py-3 text-right font-black text-zinc-900">
                                    {formatCurrency(item.amount * item.unitPrice, settings?.currency)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Summary Section */}
            {(() => {
                const credits = (invoice as any).credits as { description: string; amount: number }[] | undefined;
                const creditsTotal = credits?.reduce((a, c) => a + c.amount, 0) ?? 0;
                const taxRate: number = (invoice as any).taxRate ?? 0;
                // Compute subtotal directly from items for accuracy
                const itemsSubtotal = ((invoice.items ?? []) as any[]).reduce(
                    (acc, item) => acc + (item.amount * item.unitPrice), 0
                );
                // Prices are VAT-inclusive: extract the VAT contained in the total.
                const taxAmount = taxRate > 0 ? itemsSubtotal * (taxRate / (100 + taxRate)) : 0;

                return (
                    <div className="flex justify-end pt-6 border-t-2 border-zinc-100">
                        <div className="w-full md:w-72 space-y-3">

                            {/* Subtotal row */}
                            <div className="flex justify-between items-center">
                                <span className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">Subtotal</span>
                                <span className="text-sm font-bold text-zinc-900">{formatCurrency(itemsSubtotal, settings?.currency)}</span>
                            </div>

                            {/* VAT row */}
                            {taxRate > 0 && (
                                <div className="flex justify-between items-center">
                                    <span className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">
                                        Incl. VAT ({taxRate}%)
                                    </span>
                                    <span className="text-sm font-bold text-zinc-900">{formatCurrency(taxAmount, settings?.currency)}</span>
                                </div>
                            )}

                            {/* Credit deduction rows */}
                            {creditsTotal > 0 && credits?.map((credit, idx) => (
                                <div key={idx} className="flex justify-between items-center gap-4">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-amber-600 truncate">
                                        Credit — {credit.description}
                                    </span>
                                    <span className="text-sm font-bold text-amber-700 shrink-0">
                                        − {formatCurrency(credit.amount, settings?.currency)}
                                    </span>
                                </div>
                            ))}

                            {/* Total */}
                            <div className="pt-3 border-t border-zinc-100 flex justify-between items-end">
                                <div>
                                    <span className="text-zinc-400 font-bold uppercase tracking-widest text-[10px] block mb-1">
                                        {invoice.amount < 0 ? "Credit Due to Client" : "Total Amount"}
                                    </span>
                                    <span className={cn(
                                        "text-2xl font-black tracking-tighter",
                                        invoice.amount < 0 ? "text-amber-600" : "text-zinc-900"
                                    )}>
                                        {formatCurrency(invoice.amount, settings?.currency)}
                                    </span>
                                </div>
                                {invoice.amount < 0 ? (
                                    <div className="bg-amber-50 text-amber-700 border border-amber-100 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 mb-2">
                                        <span>Credit Balance</span>
                                    </div>
                                ) : invoice.status === "paid" && (
                                    <div className="bg-emerald-50 text-emerald-600 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 mb-2">
                                        <CheckCircle2 size={12} />
                                        Fully Paid
                                    </div>
                                )}
                            </div>

                        </div>
                    </div>
                );
            })()}

            {/* Attached Supplier Invoices */}
            {invoice.orders && invoice.orders.length > 0 && (
                <div className="pt-6 border-t border-zinc-100 no-print">
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-4 text-center">Attached Documents & Supplier Invoices</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {invoice.orders.map((order: any) => (
                            <Card key={order._id} className="p-6 bg-zinc-50/50 border-dashed hover:bg-zinc-50 transition-colors">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{order.supplierName}</p>
                                        <p className="text-sm font-bold text-zinc-900">{order.orderNumber}</p>
                                        <p className="text-[10px] text-zinc-500 font-medium">
                                            {formatCurrency(order.amount, settings?.currency)} • {new Date(order.date).toLocaleDateString()}
                                        </p>
                                    </div>
                                    {order.invoiceUrl && (
                                        <a
                                            href={order.invoiceUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-10 h-10 rounded-xl bg-white border border-zinc-200 flex items-center justify-center text-zinc-400 hover:text-black hover:border-black transition-all shadow-sm"
                                        >
                                            <ExternalLink size={18} />
                                        </a>
                                    )}
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {/* Footer Message */}
            <div className="pt-6 border-t border-zinc-100">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-zinc-500 text-[11px] font-medium leading-relaxed uppercase tracking-wider">
                    <div>
                        <p className="font-black text-zinc-900 mb-2">Payment Terms</p>
                        <p>Please pay within 14 days of receiving this invoice.</p>
                        {settings?.bankAccounts && (
                            <p className="mt-2 whitespace-pre-wrap">{settings.bankAccounts}</p>
                        )}
                    </div>
                    <div className="md:text-right self-end">
                        <p className="mb-1">Thank you for your business!</p>
                        <p className="font-black text-black">© {new Date().getFullYear()} {settings?.companyName || "Your Company"}</p>
                    </div>
                </div>
            </div>
        </div>
    );
});

export default InvoiceDocument;
