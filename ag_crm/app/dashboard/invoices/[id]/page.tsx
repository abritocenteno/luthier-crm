"use client";

import { useState, useRef, use, Suspense } from "react";
import { useQuery, useAction } from "convex/react";
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
    ExternalLink,
    Edit2,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { Id } from "../../../../convex/_generated/dataModel";
import jsPDF from "jspdf";
import { toPng } from "html-to-image";

const Card = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <div className={cn("bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden", className)}>
        {children}
    </div>
);

const Badge = ({ children, variant = "neutral" }: { children: React.ReactNode, variant?: "neutral" | "success" | "warning" | "error" }) => {
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

function InvoiceDetail({ id }: { id: Id<"invoices"> }) {
    const router = useRouter();
    const invoice = useQuery(api.invoices.get, { id });
    const settings = useQuery(api.settings.get);
    const invoiceRef = useRef<HTMLDivElement>(null);

    const [isDownloading, setIsDownloading] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [sendSuccess, setSendSuccess] = useState(false);

    const [errorDetails, setErrorDetails] = useState<string | null>(null);

    const handleDownloadPDF = async () => {
        if (!invoiceRef.current || !invoice) return;

        setIsDownloading(true);
        setErrorDetails(null);
        try {
            // Using html-to-image to bypass manual CSS parsing limitations.
            // This relies on the browser's native SVG foreignObject support,
            // which fully understands oklch, lab, color-mix, and Tailwind 4.
            const dataUrl = await toPng(invoiceRef.current, {
                quality: 1.0,
                pixelRatio: 2, // High resolution for crisp PDF
                backgroundColor: '#ffffff',
                style: {
                    transform: 'scale(1)',
                    transformOrigin: 'top left',
                    width: '1100px', // Ensure capture stays at desktop width
                    margin: '0'
                }
            });

            const pdf = new jsPDF({
                orientation: "p",
                unit: "mm",
                format: "a4",
            });

            const imgWidth = 210; // A4 width in mm
            const pageHeight = 297; // A4 height in mm

            // Calculate height to maintain aspect ratio
            const imgProps = pdf.getImageProperties(dataUrl);
            const imgHeight = (imgProps.height * imgWidth) / imgProps.width;

            let heightLeft = imgHeight;
            let position = 0;

            pdf.addImage(dataUrl, "PNG", 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            while (heightLeft > 0) {
                position = position - pageHeight;
                pdf.addPage();
                pdf.addImage(dataUrl, "PNG", 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }

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
            const dataUrl = await toPng(invoiceRef.current, {
                quality: 0.8,
                pixelRatio: 1.5,
                backgroundColor: '#ffffff',
                style: {
                    transform: 'scale(1)',
                    transformOrigin: 'top left',
                    width: '1100px',
                    margin: '0'
                }
            });

            // 2. Put it into jsPDF to format as A4
            const pdf = new jsPDF({
                orientation: "p",
                unit: "mm",
                format: "a4",
                compress: true, // Enable jsPDF compression
            });

            const imgWidth = 210;
            const pageHeight = 297;
            const imgProps = pdf.getImageProperties(dataUrl);
            const imgHeight = (imgProps.height * imgWidth) / imgProps.width;

            let heightLeft = imgHeight;
            let position = 0;

            // Use 'FAST' compression in jsPDF to further reduce the final output size
            pdf.addImage(dataUrl, "PNG", 0, position, imgWidth, imgHeight, undefined, 'FAST');
            heightLeft -= pageHeight;

            while (heightLeft > 0) {
                position = position - pageHeight;
                pdf.addPage();
                pdf.addImage(dataUrl, "PNG", 0, position, imgWidth, imgHeight, undefined, 'FAST');
                heightLeft -= pageHeight;
            }

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
                clientEmail: invoice.client.email || "", // Fallback if no email is set
                replyToEmail: "billing@thedotguitars.com", // Validated domain sender
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
                            Edit Invoice
                        </Link>
                    )}
                    <button
                        onClick={handleDownloadPDF}
                        disabled={isDownloading}
                        className="flex items-center gap-2 px-5 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm font-bold hover:bg-zinc-50 transition-all active:scale-95 disabled:opacity-50"
                    >
                        {isDownloading ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                        Download PDF
                    </button>
                    <button
                        onClick={handleSendEmail}
                        disabled={isSending || sendSuccess}
                        className={cn(
                            "flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 shadow-lg disabled:opacity-50",
                            sendSuccess
                                ? "bg-emerald-500 text-white shadow-emerald-500/20"
                                : "bg-black text-white hover:bg-zinc-800 shadow-black/10"
                        )}
                    >
                        {isSending ? (
                            <Loader2 size={18} className="animate-spin" />
                        ) : sendSuccess ? (
                            <CheckCircle2 size={18} />
                        ) : (
                            <Mail size={18} />
                        )}
                        {sendSuccess ? "Sent Successfully" : "Send to Client"}
                    </button>
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

            {/* Invoice Canvas */}
            <div
                ref={invoiceRef}
                id="invoice-capture"
                className="bg-white border border-zinc-200 rounded-[2.5rem] p-12 md:p-20 shadow-xl shadow-zinc-200/50 space-y-16"
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
                <div className="flex flex-col md:flex-row justify-between gap-10">
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
                            </div>
                        </div>
                    </div>
                    <div className="text-right space-y-2">
                        <h2 className="text-5xl font-black tracking-tighter uppercase">Invoice</h2>
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-zinc-50 border border-zinc-100 rounded-full">
                            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none">Status</span>
                            <Badge variant={invoice.status === "paid" ? "success" : invoice.status === "pending" ? "warning" : "error"}>
                                {invoice.status}
                            </Badge>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    {/* Billed To */}
                    <div className="space-y-4">
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Billed To</p>
                        <div className="flex items-start gap-4">
                            <div className="space-y-1">
                                <h3 className="text-lg font-bold text-zinc-900">{invoice.clientName}</h3>
                                <p className="text-sm text-zinc-500 font-medium">Contact Client Detail for address.</p>
                            </div>
                        </div>
                    </div>

                    {/* Invoice Meta */}
                    <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Invoice Details</p>
                            <div className="space-y-4 text-sm font-bold">
                                <div>
                                    <p className="text-zinc-400 font-medium text-[11px] mb-1">Number</p>
                                    <p>{invoice.invoiceNumber}</p>
                                </div>
                                <div>
                                    <p className="text-zinc-400 font-medium text-[11px] mb-1">Date Issued</p>
                                    <p>{new Date(invoice.date).toLocaleDateString()}</p>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Payment Due</p>
                            <div className="space-y-4 text-sm font-bold">
                                <div>
                                    <p className="text-zinc-400 font-medium text-[11px] mb-1">Due By</p>
                                    <p>{new Date(invoice.date + 14 * 24 * 60 * 60 * 1000).toLocaleDateString()}</p>
                                </div>
                                {invoice.paymentMethod && (
                                    <div>
                                        <p className="text-zinc-400 font-medium text-[11px] mb-1">Method</p>
                                        <p>{invoice.paymentMethod}</p>
                                    </div>
                                )}
                                <div>
                                    <p className="text-zinc-400 font-medium text-[11px] mb-1">Amount Due</p>
                                    <p className="text-xl font-black tracking-tight">{formatCurrency(invoice.status === "paid" ? 0 : invoice.amount, settings?.currency)}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Items Table */}
                <div className="space-y-6">
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Line Items</p>
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b-2 border-zinc-100">
                                <th className="pb-6 text-sm font-black uppercase tracking-tight w-[45%]">Item & Description</th>
                                <th className="pb-6 text-sm font-black uppercase tracking-tight text-center w-[15%]">Qty</th>
                                <th className="pb-6 text-sm font-black uppercase tracking-tight text-right w-[20%]">Rate</th>
                                <th className="pb-6 text-sm font-black uppercase tracking-tight text-right w-[20%]">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-50">
                            {invoice.items?.map((item: any, idx: number) => (
                                <tr key={idx} className="group">
                                    <td className="py-8 pr-4">
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
                                    <td className="py-8 text-center">
                                        <span className="text-sm font-bold text-zinc-700 bg-zinc-50 px-3 py-1 rounded-lg">{item.amount}</span>
                                    </td>
                                    <td className="py-8 text-right font-bold text-zinc-700">
                                        {formatCurrency(item.unitPrice, settings?.currency)}
                                    </td>
                                    <td className="py-8 text-right font-black text-zinc-900">
                                        {formatCurrency(item.amount * item.unitPrice, settings?.currency)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Summary Section */}
                <div className="flex justify-end pt-12 border-t-2 border-zinc-100">
                    <div className="w-full md:w-80 space-y-6">
                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">Subtotal</span>
                                <span className="font-bold text-zinc-900">{formatCurrency(invoice.amount, settings?.currency)}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">Tax (0%)</span>
                                <span className="font-bold text-zinc-900">$0.00</span>
                            </div>
                        </div>
                        <div className="pt-6 border-t border-zinc-100 flex justify-between items-end">
                            <div>
                                <span className="text-zinc-400 font-bold uppercase tracking-widest text-[10px] block mb-1">Total Amount</span>
                                <span className="text-4xl font-black tracking-tighter text-zinc-900">{formatCurrency(invoice.amount, settings?.currency)}</span>
                            </div>
                            {invoice.status === "paid" && (
                                <div className="bg-emerald-50 text-emerald-600 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 mb-2">
                                    <CheckCircle2 size={12} />
                                    Fully Paid
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Attached Supplier Invoices */}
                {invoice.orders && invoice.orders.length > 0 && (
                    <div className="pt-16 border-t border-zinc-100 no-print">
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-8 text-center">Attached Documents & Supplier Invoices</p>
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
                <div className="pt-20 border-t border-zinc-100">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 text-zinc-500 text-[11px] font-medium leading-relaxed uppercase tracking-wider">
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
