"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import Link from "next/link";
import {
    FileText,
    Plus,
    Search,
    MoreVertical,
    Trash2,
    Edit2,
    Eye,
    Loader2,
    ChevronRight,
    Calendar,
    DollarSign,
    User,
    Clock,
    CheckCircle2,
    AlertCircle,
    Download,
} from "lucide-react";
import { exportInvoices } from "@/lib/exportCsv";
import { motion, AnimatePresence } from "motion/react";
import { cn, formatCurrency } from "@/lib/utils";
import { Id } from "../../../convex/_generated/dataModel";

// --- Components ---

const Card = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <div className={cn("bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden", className)}>
        {children}
    </div>
);

const Badge = ({ children, variant = 'neutral' }: { children: React.ReactNode, variant?: 'neutral' | 'success' | 'info' | 'warning' | 'error' }) => {
    const variants = {
        neutral: "bg-zinc-100 text-zinc-600",
        success: "bg-emerald-50 text-emerald-700 border border-emerald-100",
        info: "bg-blue-50 text-blue-700 border border-blue-100",
        warning: "bg-amber-50 text-amber-700 border border-amber-100",
        error: "bg-red-50 text-red-700 border border-red-100",
    };

    return (
        <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider", variants[variant])}>
            {children}
        </span>
    );
};

// --- Invoices Page ---

export default function InvoicesPage() {
    const settings = useQuery(api.settings.get);
    const invoices = useQuery(api.invoices.list);
    const removeInvoice = useMutation(api.invoices.remove);

    const [search, setSearch] = useState("");

    const filteredInvoices = invoices?.filter(inv =>
        inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
        inv.clientName.toLowerCase().includes(search.toLowerCase())
    );

    const handleDelete = async (id: Id<"invoices">) => {
        if (!confirm("Are you sure you want to delete this invoice?")) return;
        try {
            await removeInvoice({ id });
        } catch (error) {
            console.error("Failed to delete invoice:", error);
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
                    <p className="text-zinc-500">Track and manage your workshop's billing and payments.</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => invoices && exportInvoices(invoices as any)}
                        disabled={!invoices || invoices.length === 0}
                        className="flex items-center gap-2 px-4 py-2.5 bg-white border border-zinc-200 text-zinc-600 rounded-xl text-sm font-semibold hover:bg-zinc-50 transition-all active:scale-95 disabled:opacity-40"
                    >
                        <Download size={15} />
                        Export CSV
                    </button>
                    <Link
                        href="/dashboard/invoices/create"
                        className="flex items-center gap-2 px-6 py-2.5 bg-black text-white rounded-xl text-sm font-semibold hover:bg-zinc-800 transition-all shadow-lg shadow-black/10 active:scale-95"
                    >
                        <Plus size={18} />
                        Add Invoice
                    </Link>
                </div>
            </header>

            <Card>
                <div className="p-4 border-b border-zinc-100 bg-zinc-50/50">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search by invoice # or client name..."
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5 transition-all"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-100 bg-zinc-50/30">
                                <th className="px-6 py-4">Invoice Number</th>
                                <th className="px-6 py-4">Client</th>
                                <th className="px-6 py-4 text-right">Total Amount</th>
                                <th className="px-6 py-4 text-center">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                            {filteredInvoices ? (
                                filteredInvoices.map((invoice) => (
                                    <tr key={invoice._id} className="group hover:bg-zinc-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-400 border border-zinc-200 transition-all group-hover:bg-white group-hover:shadow-sm">
                                                    <FileText size={18} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-zinc-900">{invoice.invoiceNumber}</p>
                                                    <div className="flex items-center gap-1 text-[10px] text-zinc-400 font-medium whitespace-nowrap">
                                                        <Calendar size={10} />
                                                        {new Date(invoice.date).toLocaleDateString()}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Link href={`/dashboard/clients/${invoice.clientId}`} className="flex items-center gap-3 group/link">
                                                <div className="w-8 h-8 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-400 border border-zinc-100 overflow-hidden shadow-sm transition-all group-hover/link:shadow-md group-hover/link:scale-105">
                                                    {(invoice as any).clientImageUrl ? (
                                                        <img src={(invoice as any).clientImageUrl} alt={invoice.clientName} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <User size={14} />
                                                    )}
                                                </div>
                                                <span className="text-sm font-semibold text-zinc-900 group-hover/link:text-black group-hover/link:underline underline-offset-4 decoration-zinc-300">
                                                    {invoice.clientName}
                                                </span>
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <p className="text-sm font-bold text-zinc-900">{formatCurrency(invoice.amount, settings?.currency)}</p>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <Badge
                                                variant={
                                                    invoice.status === 'paid' ? 'success' :
                                                        invoice.status === 'pending' ? 'warning' : 'error'
                                                }
                                            >
                                                {invoice.status}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 text-zinc-400">
                                                {invoice.status !== 'paid' && (
                                                    <Link
                                                        href={`/dashboard/invoices/${invoice._id}/edit`}
                                                        className="p-2 hover:text-black hover:bg-zinc-100 rounded-lg transition-all"
                                                        title="Edit Invoice"
                                                    >
                                                        <Edit2 size={16} />
                                                    </Link>
                                                )}
                                                <button
                                                    onClick={() => handleDelete(invoice._id)}
                                                    className="p-2 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                    title="Delete Invoice"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                                <Link
                                                    href={`/dashboard/invoices/${invoice._id}`}
                                                    className="p-2 hover:text-black hover:bg-zinc-100 rounded-lg transition-all"
                                                    title="View Detail"
                                                >
                                                    <ChevronRight size={16} />
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                [1, 2, 3].map(i => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={5} className="px-6 py-6">
                                            <div className="h-10 bg-zinc-100 rounded-xl w-full" />
                                        </td>
                                    </tr>
                                ))
                            )}
                            {filteredInvoices?.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center justify-center space-y-3">
                                            <div className="w-12 h-12 bg-zinc-50 rounded-full flex items-center justify-center text-zinc-300">
                                                <FileText size={24} />
                                            </div>
                                            <p className="text-zinc-500 font-medium">No invoices found matching your search.</p>
                                            <Link href="/dashboard/invoices/create" className="text-sm font-bold text-black underline underline-offset-4">
                                                Create your first invoice
                                            </Link>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
