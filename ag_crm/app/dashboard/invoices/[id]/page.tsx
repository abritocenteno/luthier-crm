"use client";

import { useState, useRef, use, Suspense, useCallback } from "react";
import { useQuery, useAction, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    ArrowLeft,
    Download,
    Mail,
    FileText,
    Calendar,
    User,
    CheckCircle2,
    AlertCircle,
    Loader2,
    Printer,
    Edit2,
    Banknote,
    ChevronDown,
    RotateCcw,
    Timer,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DEFAULT_SOURCE } from "@/lib/sources";
import { Id } from "../../../../convex/_generated/dataModel";
import InvoiceDocument from "@/components/InvoiceDocument";
import { splitIntoPages, captureInvoicePng } from "@/lib/invoicePdf";

function InvoiceDetail({ id }: { id: Id<"invoices"> }) {
    const router = useRouter();
    const invoice = useQuery(api.invoices.get, { id });
    const settings = useQuery(api.settings.get);
    const invoiceRef = useRef<HTMLDivElement>(null);

    const markAsPaid = useMutation(api.invoices.markAsPaid);
    const markAsUnpaid = useMutation(api.invoices.markAsUnpaid);
    const sendReminderAction = useAction(api.resend.sendOverdueReminderEmail);
    const importTimeEntries = useMutation(api.timeEntries.importToInvoice);

    const linkedJob = useQuery(api.jobs.getByInvoiceId, invoice ? { invoiceId: invoice._id } : "skip");
    const unbilledEntries = useQuery(
        api.timeEntries.listUnbilledByJob,
        linkedJob ? { jobId: linkedJob._id } : "skip"
    );

    const [isDownloading, setIsDownloading] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [sendSuccess, setSendSuccess] = useState(false);
    const [showPayModal, setShowPayModal] = useState(false);
    const [selectedPayMethod, setSelectedPayMethod] = useState("Cash");
    const [isMarkingPaid, setIsMarkingPaid] = useState(false);
    const [isSendingReminder, setIsSendingReminder] = useState(false);
    const [reminderSent, setReminderSent] = useState(false);

    const [isImportingTime, setIsImportingTime] = useState(false);
    const [errorDetails, setErrorDetails] = useState<string | null>(null);

    const PAYMENT_METHODS = ["Cash", "iDeal / Wero", "Bank Transfer", "Card", "Other"];

    const handleMarkAsPaid = async () => {
        if (!invoice) return;
        setIsMarkingPaid(true);
        try {
            await markAsPaid({ id: invoice._id, paymentMethod: selectedPayMethod });
            setShowPayModal(false);
        } catch (err: any) {
            alert(`Failed to mark as paid: ${err.message}`);
        } finally {
            setIsMarkingPaid(false);
        }
    };

    const handleSendReminder = async () => {
        if (!invoice) return;
        setIsSendingReminder(true);
        try {
            await sendReminderAction({ invoiceId: invoice._id });
            setReminderSent(true);
            setTimeout(() => setReminderSent(false), 4000);
        } catch (err: any) {
            alert(`Failed to send reminder: ${err.message}`);
        } finally {
            setIsSendingReminder(false);
        }
    };

    const handleImportTimeEntries = async () => {
        if (!invoice || !unbilledEntries?.length) return;
        const totalMins = unbilledEntries.reduce((sum: number, e: any) => sum + e.durationMinutes, 0);
        const h = Math.floor(totalMins / 60), m = totalMins % 60;
        if (!confirm(`Import ${unbilledEntries.length} billable time entr${unbilledEntries.length === 1 ? "y" : "ies"} (${h}h ${m}m) as line items on this invoice?`)) return;
        setIsImportingTime(true);
        try {
            await importTimeEntries({ invoiceId: invoice._id, entryIds: unbilledEntries.map((e: any) => e._id) });
        } catch (err: any) {
            alert(`Failed to import time entries: ${err.message}`);
        } finally {
            setIsImportingTime(false);
        }
    };

    const handleMarkAsUnpaid = async () => {
        if (!invoice) return;
        if (!confirm("Revert this invoice back to unpaid?")) return;
        try {
            await markAsUnpaid({ id: invoice._id });
        } catch (err: any) {
            alert(`Failed to revert: ${err.message}`);
        }
    };

    const handleDownloadPDF = async () => {
        if (!invoiceRef.current || !invoice) return;

        setIsDownloading(true);
        setErrorDetails(null);
        try {
            // High resolution for a crisp PDF.
            const dataUrl = await captureInvoicePng(invoiceRef.current, { quality: 1.0, pixelRatio: 2 });

            const pdf = await splitIntoPages(dataUrl);
            pdf.save(`${invoice?.invoiceNumber || "invoice"}.pdf`);
            
            // Download attachments
            if (invoice.orders && invoice.orders.length > 0) {
                invoice.orders.forEach((order: any) => {
                    if (order.invoiceUrl) {
                        fetch(order.invoiceUrl)
                            .then(res => res.blob())
                            .then(blob => {
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement("a");
                                a.href = url;
                                const mimeToExt: Record<string, string> = {
                                    'application/pdf': '.pdf',
                                    'image/jpeg': '.jpg',
                                    'image/png': '.png',
                                    'image/webp': '.webp'
                                };
                                const ext = mimeToExt[blob.type] || '';
                                const safeSupplier = (order.supplierName || "Unknown").replace(/[^a-z0-9]/gi, '_');
                                const safeOrder = (order.orderNumber || "Unknown").replace(/[^a-z0-9]/gi, '_');
                                a.download = `Attachment_${safeSupplier}_${safeOrder}${ext}`;
                                document.body.appendChild(a);
                                a.click();
                                a.remove();
                                URL.revokeObjectURL(url);
                            })
                            .catch(err => console.error("Failed to download attachment:", err));
                    }
                });
            }

            setIsDownloading(false);
        } catch (error: any) {
            console.error("PDF generation failed:", error);
            setErrorDetails(error.message || String(error));
            alert(`Failed to generate PDF: ${error.message || "Unknown error"}`);
            setIsDownloading(false);
        }
    };

    const sendEmailAction = useAction(api.resend.sendInvoiceEmail);

    const handleSendEmail = async () => {
        if (!invoiceRef.current || !invoice || !invoice.client) return;

        setIsSending(true);
        setErrorDetails(null);

        try {
            // 1. Generate the PDF as an image data URL (silently, in background)
            // We MUST reduce quality here because Convex has a 16MB argument limit for Actions.
            // A pixelRatio of 2 creates a ~20MB string.
            // A pixelRatio of 1.5 with quality 0.8 keeps it crisp but drastically reduces file size.
            const dataUrl = await captureInvoicePng(invoiceRef.current, { quality: 0.8, pixelRatio: 1.5 });

            // 2. Split into pages with smart whitespace detection
            const pdf = await splitIntoPages(dataUrl, true);

            // 3. Extract the clean Base64 string for the email attachment
            const pdfDataUri = pdf.output('datauristring');
            const base64Data = pdfDataUri.split(',')[1];

            // Safety check for Convex 16MB limit
            const approxSizeMiB = (base64Data.length * 3 / 4) / (1024 * 1024);
            console.log(`Generated PDF approximate size: ${approxSizeMiB.toFixed(2)} MiB`);

            if (approxSizeMiB > 15) {
                throw new Error("Generated PDF is still too large for emailing. Please try with fewer items.");
            }

            const extraAttachments = [];
            if (invoice.orders && invoice.orders.length > 0) {
                for (const order of invoice.orders) {
                    if (order.invoiceUrl) {
                        try {
                            const res = await fetch(order.invoiceUrl);
                            const blob = await res.blob();
                            const buffer = await blob.arrayBuffer();
                            const bytes = new Uint8Array(buffer);
                            let binary = '';
                            const len = bytes.byteLength;
                            for (let i = 0; i < len; i++) {
                                binary += String.fromCharCode(bytes[i]);
                            }
                            const base64 = window.btoa(binary);
                            
                            const mimeToExt: Record<string, string> = {
                                'application/pdf': '.pdf',
                                'image/jpeg': '.jpg',
                                'image/png': '.png',
                                'image/webp': '.webp'
                            };
                            const ext = mimeToExt[blob.type] || '';
                            const safeSupplier = (order.supplierName || "Unknown").replace(/[^a-z0-9]/gi, '_');
                            const safeOrder = (order.orderNumber || "Unknown").replace(/[^a-z0-9]/gi, '_');
                            
                            extraAttachments.push({
                                filename: `Attachment_${safeSupplier}_${safeOrder}${ext}`,
                                content: base64,
                            });
                        } catch (err) {
                            console.error("Failed to process attachment:", err);
                        }
                    }
                }
            }

            // 4. Send the payload to our Convex Action
            await sendEmailAction({
                invoiceNumber: invoice.invoiceNumber,
                clientName: invoice.client.name,
                clientEmail: invoice.client.email || "",
                replyToEmail: settings?.contactEmail || "billing@thedotguitars.com",
                companyName: settings?.companyName,
                amount: invoice.amount,
                pdfBase64: base64Data,
                extraAttachments: extraAttachments,
            });

            setSendSuccess(true);
            setTimeout(() => setSendSuccess(false), 3000);
        } catch (error: any) {
            console.error("Email sending failed:", error);
            setErrorDetails(error.message || String(error));
            alert(`Failed to send email: ${error.message || "Unknown error"}`);
        } finally {
            setIsSending(false);
        }
    };

    if (invoice === undefined) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="animate-spin text-zinc-300" size={32} />
            </div>
        );
    }

    if (invoice === null) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <AlertCircle className="text-red-500" size={48} />
                <h2 className="text-xl font-bold">Invoice Not Found</h2>
                <button onClick={() => router.back()} className="text-sm font-bold text-black underline">Go Back</button>
            </div>
        );
    }

    // Job is the financial source of truth; fall back to the client's source.
    const invoiceSource = (linkedJob?.source) ?? (invoice as any).client?.source ?? DEFAULT_SOURCE;
    const showSourceTag = invoiceSource !== DEFAULT_SOURCE;

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
            {/* Header / Actions */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 no-print">
                <div className="space-y-4">
                    <button
                        onClick={() => router.push("/dashboard/invoices")}
                        className="flex items-center gap-2 text-sm font-bold text-zinc-400 hover:text-black transition-colors group"
                    >
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                        Back to Invoices
                    </button>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-black flex items-center justify-center text-white shadow-lg">
                            <FileText size={24} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">{invoice.invoiceNumber}</h1>
                            <p className="text-zinc-500 font-medium">View and manage this invoice record.</p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {invoice.status !== 'paid' && (
                        <Link
                            href={`/dashboard/invoices/${invoice._id}/edit`}
                            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm font-bold hover:bg-zinc-50 transition-all active:scale-95 shadow-sm"
                        >
                            <Edit2 size={18} />
                            Edit
                        </Link>
                    )}
                    <button
                        onClick={handleDownloadPDF}
                        disabled={isDownloading}
                        className="flex items-center gap-2 px-5 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm font-bold hover:bg-zinc-50 transition-all active:scale-95 disabled:opacity-50"
                    >
                        {isDownloading ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                        PDF
                    </button>
                    <button
                        onClick={handleSendEmail}
                        disabled={isSending || sendSuccess}
                        className={cn(
                            "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 shadow-lg disabled:opacity-50",
                            sendSuccess
                                ? "bg-emerald-500 text-white shadow-emerald-500/20"
                                : "bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50 shadow-none"
                        )}
                    >
                        {isSending ? <Loader2 size={18} className="animate-spin" /> : sendSuccess ? <CheckCircle2 size={18} /> : <Mail size={18} />}
                        {sendSuccess ? "Sent!" : "Email"}
                    </button>

                    {/* Overdue reminder */}
                    {invoice.status === "overdue" && (
                        <button
                            onClick={handleSendReminder}
                            disabled={isSendingReminder || reminderSent}
                            className={cn(
                                "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 shadow-lg disabled:opacity-60",
                                reminderSent
                                    ? "bg-emerald-500 text-white shadow-emerald-500/20"
                                    : "bg-red-500 text-white hover:bg-red-600 shadow-red-500/20"
                            )}
                        >
                            {isSendingReminder ? <Loader2 size={18} className="animate-spin" /> : reminderSent ? <CheckCircle2 size={18} /> : <Mail size={18} />}
                            {reminderSent ? "Reminder Sent" : "Send Reminder"}
                        </button>
                    )}

                    {/* Mark as Paid / Paid indicator */}
                    {invoice.status === "paid" ? (
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-2 px-5 py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-sm font-bold text-emerald-700">
                                <CheckCircle2 size={18} />
                                Paid{(invoice as any).paidAt ? ` · ${new Date((invoice as any).paidAt).toLocaleDateString()}` : ""}
                            </div>
                            <button
                                onClick={handleMarkAsUnpaid}
                                title="Revert to unpaid"
                                className="p-2.5 bg-white border border-zinc-200 rounded-xl text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50 transition-all active:scale-95"
                            >
                                <RotateCcw size={16} />
                            </button>
                        </div>
                    ) : (
                        <div className="relative">
                            <button
                                onClick={() => setShowPayModal((v) => !v)}
                                className="flex items-center gap-2 px-5 py-2.5 bg-black text-white rounded-xl text-sm font-bold hover:bg-zinc-800 transition-all active:scale-95 shadow-lg shadow-black/10"
                            >
                                <Banknote size={18} />
                                Mark as Paid
                                <ChevronDown size={14} className={cn("transition-transform", showPayModal && "rotate-180")} />
                            </button>

                            {showPayModal && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setShowPayModal(false)} />
                                    <div className="absolute right-0 top-full mt-2 z-20 w-72 bg-white border border-zinc-200 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                                        <div className="px-5 pt-5 pb-3">
                                            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.15em] mb-3">Payment Method</p>
                                            <div className="flex flex-wrap gap-2">
                                                {PAYMENT_METHODS.map((m) => (
                                                    <button
                                                        key={m}
                                                        type="button"
                                                        onClick={() => setSelectedPayMethod(m)}
                                                        className={cn(
                                                            "px-3 py-1.5 rounded-lg text-xs font-bold border transition-all",
                                                            selectedPayMethod === m
                                                                ? "bg-black text-white border-black"
                                                                : "bg-white text-zinc-500 border-zinc-200 hover:border-zinc-400"
                                                        )}
                                                    >
                                                        {m}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="px-5 pb-5 pt-3 border-t border-zinc-100">
                                            <button
                                                onClick={handleMarkAsPaid}
                                                disabled={isMarkingPaid}
                                                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-bold transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                                            >
                                                {isMarkingPaid ? <Loader2 size={16} className="animate-spin shrink-0" /> : <CheckCircle2 size={16} className="shrink-0" />}
                                                <span className="truncate">Confirm Payment — {selectedPayMethod}</span>
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </header>

            {errorDetails && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs no-print animate-in fade-in duration-300">
                    <p className="font-black uppercase tracking-widest text-[10px] mb-2 flex items-center gap-2">
                        <AlertCircle size={14} />
                        Debug Information
                    </p>
                    <pre className="whitespace-pre-wrap font-mono">{errorDetails}</pre>
                    <p className="mt-2 text-[10px] opacity-70">This information helps us identify why the PDF is failing to generate in your browser.</p>
                </div>
            )}

            {/* Invoice Canvas — shared with the quarterly Tax Pack bundler */}
            <InvoiceDocument
                ref={invoiceRef}
                invoice={invoice}
                settings={settings}
                invoiceSource={invoiceSource}
                showSourceTag={showSourceTag}
                headerAction={
                    invoice.status !== "paid" && unbilledEntries && unbilledEntries.length > 0 ? (
                        <button
                            onClick={handleImportTimeEntries}
                            disabled={isImportingTime}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-xl text-xs font-bold hover:bg-blue-100 transition-all active:scale-95 disabled:opacity-50"
                        >
                            {isImportingTime ? <Loader2 size={12} className="animate-spin" /> : <Timer size={12} />}
                            Import {unbilledEntries.length} time entr{unbilledEntries.length === 1 ? "y" : "ies"}
                        </button>
                    ) : null
                }
            />
        </div>
    );
}

export default function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen text-zinc-400"><Loader2 className="animate-spin" /></div>}>
            <InvoiceDetail id={id as Id<"invoices">} />
        </Suspense>
    );
}
