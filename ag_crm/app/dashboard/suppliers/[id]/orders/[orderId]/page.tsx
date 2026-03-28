"use client";

import { use, Suspense } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
    ArrowLeft,
    FileText,
    Calendar,
    ShoppingBag,
    Download,
    ExternalLink,
    Building2,
    Clock,
    DollarSign,
    Loader2,
    AlertCircle,
    Paperclip,
    Edit2,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { Id } from "../../../../../../convex/_generated/dataModel";

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

function OrderDetail({ orderId }: { orderId: Id<"orders"> }) {
    const router = useRouter();
    const order = useQuery(api.orders.get, { id: orderId });
    const settings = useQuery(api.settings.get);

    if (order === undefined) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="animate-spin text-zinc-300" size={32} />
            </div>
        );
    }

    if (order === null) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <AlertCircle className="text-red-500" size={48} />
                <h2 className="text-xl font-bold">Order Not Found</h2>
                <button onClick={() => router.back()} className="text-sm font-bold text-black underline">Go Back</button>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-4">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-sm font-bold text-zinc-400 hover:text-black transition-colors group"
                    >
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                        Back to Supplier
                    </button>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-zinc-900 flex items-center justify-center text-white shadow-lg">
                            <ShoppingBag size={24} />
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-3xl font-bold tracking-tight">{order.orderNumber}</h1>
                                <Badge variant={order.status === 'paid' ? 'success' : order.status === 'pending' ? 'warning' : 'neutral'}>
                                    {order.status}
                                </Badge>
                            </div>
                            <p className="text-zinc-500 font-medium tracking-tight">Supply order for {order.supplierName}</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {order.status !== 'paid' && (
                        <Link
                            href={`/dashboard/suppliers/${order.supplierId}/orders/${order._id}/edit`}
                            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-zinc-200 text-zinc-900 rounded-xl text-sm font-bold hover:bg-zinc-50 transition-all active:scale-95 shadow-sm"
                        >
                            <Edit2 size={18} />
                            Edit Order
                        </Link>
                    )}
                    {order.invoiceUrl && (
                        <a
                            href={order.invoiceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-5 py-2.5 bg-black text-white rounded-xl text-sm font-bold hover:bg-zinc-800 transition-all active:scale-95 shadow-lg shadow-black/10"
                        >
                            <ExternalLink size={18} />
                            View Attached Invoice
                        </a>
                    )}
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Order Items */}
                    <Card className="p-8">
                        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-8">Line Items</h3>
                        <div className="space-y-6">
                            {order.items && order.items.length > 0 ? (
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-zinc-100">
                                            <th className="pb-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Item</th>
                                            <th className="pb-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-center">Qty</th>
                                            <th className="pb-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-right">Price</th>
                                            <th className="pb-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-right">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-50">
                                        {order.items.map((item, idx) => (
                                            <tr key={idx} className="group">
                                                <td className="py-6">
                                                    <div className="space-y-1">
                                                        <p className="font-bold text-zinc-900">{item.name}</p>
                                                        {item.description && (
                                                            <p className="text-xs text-zinc-500">{item.description}</p>
                                                        )}
                                                        {item.remark && (
                                                            <p className="text-[10px] text-zinc-400 italic">Note: {item.remark}</p>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-6 text-center">
                                                    <span className="text-sm font-bold text-zinc-700 bg-zinc-50 px-2 py-1 rounded-lg">{item.amount}</span>
                                                </td>
                                                <td className="py-6 text-right font-bold text-zinc-700">
                                                    {formatCurrency(item.unitPrice, settings?.currency)}
                                                </td>
                                                <td className="py-6 text-right font-black text-zinc-900">
                                                    {formatCurrency(item.amount * item.unitPrice, settings?.currency)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr className="border-t-2 border-zinc-100">
                                            <td colSpan={3} className="pt-6 text-right">
                                                <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Total Amount</span>
                                            </td>
                                            <td className="pt-6 text-right">
                                                <span className="text-2xl font-black tracking-tighter text-zinc-900">
                                                    {formatCurrency(order.amount, settings?.currency)}
                                                </span>
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            ) : (
                                <div className="py-12 text-center">
                                    <p className="text-zinc-400 font-medium">No items recorded for this order.</p>
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* File Attachment Mobile/Fallthrough */}
                    {order.invoiceUrl && (
                        <Card className="p-8 lg:hidden">
                            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-6">Attached Invoice</h3>
                            <div className="flex items-center justify-between p-4 bg-zinc-50 rounded-2xl border border-zinc-100 group">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-zinc-400 shadow-sm border border-zinc-100 transition-colors">
                                        <FileText size={24} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-zinc-900">Invoice Document</p>
                                        <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">PDF/Image Attachment</p>
                                    </div>
                                </div>
                                <a
                                    href={order.invoiceUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-3 bg-white text-black rounded-xl hover:bg-zinc-100 transition-all border border-zinc-200 shadow-sm"
                                >
                                    <Download size={20} />
                                </a>
                            </div>
                        </Card>
                    )}
                </div>

                {/* Sidebar Info */}
                <div className="space-y-8">
                    <Card className="p-6 space-y-6">
                        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Order Summary</h3>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-zinc-50 flex items-center justify-center text-zinc-400">
                                    <Calendar size={14} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none mb-1">Date</p>
                                    <p className="font-bold text-zinc-900">{new Date(order.date).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-zinc-50 flex items-center justify-center text-zinc-400">
                                    <DollarSign size={14} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none mb-1">Total</p>
                                    <p className="font-bold text-zinc-900">{formatCurrency(order.amount, settings?.currency)}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-zinc-50 flex items-center justify-center text-zinc-400">
                                    <Clock size={14} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none mb-1">Status</p>
                                    <p className="font-bold text-zinc-900 uppercase tracking-wide text-xs">{order.status}</p>
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6 space-y-6">
                        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Supplier</h3>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-400 border border-zinc-200 overflow-hidden shadow-sm shrink-0">
                                {order.supplierImageUrl ? (
                                    <img src={order.supplierImageUrl} alt={order.supplierName} className="w-full h-full object-cover" />
                                ) : (
                                    <Building2 size={24} />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-zinc-900 truncate">{order.supplierName}</p>
                                <p className="text-xs text-zinc-500 font-medium">Verified Supplier</p>
                            </div>
                        </div>
                    </Card>

                    {order.invoiceUrl && (
                        <Card className="p-6 space-y-4 hidden lg:block">
                            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Documents</h3>
                            <div className="flex items-center justify-between p-4 bg-zinc-50 rounded-2xl border border-zinc-100 group">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-zinc-400 shadow-sm border border-zinc-100">
                                        <Paperclip size={18} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-zinc-900">Invoice File</p>
                                        <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">Attached</p>
                                    </div>
                                </div>
                                <a
                                    href={order.invoiceUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2.5 bg-white text-zinc-400 rounded-lg hover:text-black hover:bg-zinc-100 transition-all border border-zinc-200 shadow-sm"
                                >
                                    <Download size={16} />
                                </a>
                            </div>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function OrderDetailsPage({ params }: { params: Promise<{ id: string, orderId: string }> }) {
    const { orderId } = use(params);
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen text-zinc-400"><Loader2 className="animate-spin" /></div>}>
            <OrderDetail orderId={orderId as Id<"orders">} />
        </Suspense>
    );
}
