"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import Link from "next/link";
import {
    ShoppingBag, Plus, Search, Trash2, Edit2, ChevronRight,
    Calendar, Building2, ChevronUp, ChevronDown, ChevronsUpDown,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { Id } from "../../../convex/_generated/dataModel";

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
        <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider", variants[variant])}>
            {children}
        </span>
    );
};

type SortField = "date" | "orderNumber" | "supplierName" | "amount" | "status";
type SortDir = "asc" | "desc";
type DateFilter = "all" | "1m" | "3m";

const DATE_FILTERS: { key: DateFilter; label: string }[] = [
    { key: "all", label: "All time" },
    { key: "1m",  label: "Past month" },
    { key: "3m",  label: "Past 3 months" },
];

const MS = { "1m": 30 * 86_400_000, "3m": 90 * 86_400_000 };

export default function OrdersPage() {
    const settings = useQuery(api.settings.get);
    const orders = useQuery(api.orders.list);
    const removeOrder = useMutation(api.orders.remove);

    const [search, setSearch]           = useState("");
    const [dateFilter, setDateFilter]   = useState<DateFilter>("all");
    const [sortField, setSortField]     = useState<SortField>("date");
    const [sortDir, setSortDir]         = useState<SortDir>("desc");

    const handleSort = (field: SortField) => {
        if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
        else { setSortField(field); setSortDir(field === "date" ? "desc" : "asc"); }
    };

    const handleDelete = async (id: Id<"orders">) => {
        if (!confirm("Are you sure you want to delete this order?")) return;
        try { await removeOrder({ id }); } catch (e) { console.error(e); }
    };

    const now = Date.now();
    const filtered = orders
        ?.filter(order =>
            (order.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
             order.supplierName.toLowerCase().includes(search.toLowerCase())) &&
            (dateFilter === "all" || order.date >= now - MS[dateFilter])
        )
        .sort((a, b) => {
            let cmp = 0;
            if      (sortField === "date")          cmp = a.date - b.date;
            else if (sortField === "orderNumber")    cmp = a.orderNumber.localeCompare(b.orderNumber);
            else if (sortField === "supplierName")   cmp = a.supplierName.localeCompare(b.supplierName);
            else if (sortField === "amount")         cmp = a.amount - b.amount;
            else if (sortField === "status")         cmp = a.status.localeCompare(b.status);
            return sortDir === "asc" ? cmp : -cmp;
        });

    const SortIcon = ({ field }: { field: SortField }) => {
        if (sortField !== field) return <ChevronsUpDown size={12} className="opacity-25 shrink-0" />;
        return sortDir === "asc"
            ? <ChevronUp size={12} className="shrink-0" />
            : <ChevronDown size={12} className="shrink-0" />;
    };

    const Th = ({ field, children, className }: { field: SortField; children: React.ReactNode; className?: string }) => (
        <th
            className={cn("px-6 py-4 cursor-pointer select-none hover:text-zinc-600 transition-colors", className)}
            onClick={() => handleSort(field)}
        >
            <div className="flex items-center gap-1">
                {children}
                <SortIcon field={field} />
            </div>
        </th>
    );

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight">Supply Orders</h1>
                    <p className="text-zinc-500">View and manage all your purchases from suppliers.</p>
                </div>
                <p className="text-xs text-zinc-400 font-medium max-w-[220px] text-right self-center">
                    Create new orders directly from a <Link href="/dashboard/suppliers" className="text-black underline">Supplier's page</Link>.
                </p>
            </header>

            <Card>
                {/* Filter bar */}
                <div className="p-4 border-b border-zinc-100 bg-zinc-50/50 flex flex-col sm:flex-row gap-3">
                    {/* Search */}
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search by order # or supplier name..."
                            className="w-full pl-9 pr-4 py-2 bg-white border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5 transition-all"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    {/* Date filter pills */}
                    <div className="flex items-center gap-1.5 shrink-0">
                        {DATE_FILTERS.map(f => (
                            <button
                                key={f.key}
                                onClick={() => setDateFilter(f.key)}
                                className={cn(
                                    "px-3 py-2 rounded-xl text-xs font-semibold transition-all",
                                    dateFilter === f.key
                                        ? "bg-black text-white shadow-sm"
                                        : "bg-white border border-zinc-200 text-zinc-500 hover:bg-zinc-50"
                                )}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-100 bg-zinc-50/30">
                                <Th field="date">Order # / Date</Th>
                                <Th field="supplierName">Supplier</Th>
                                <Th field="amount" className="text-right justify-end">Amount</Th>
                                <Th field="status" className="text-center justify-center">Status</Th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                            {filtered ? (
                                filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center">
                                            <div className="flex flex-col items-center justify-center space-y-3">
                                                <div className="w-12 h-12 bg-zinc-50 rounded-full flex items-center justify-center text-zinc-300">
                                                    <ShoppingBag size={24} />
                                                </div>
                                                <p className="text-zinc-500 font-medium">No orders found.</p>
                                                <Link href="/dashboard/suppliers" className="text-sm font-bold text-black underline underline-offset-4">
                                                    Go to Suppliers to create one
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filtered.map(order => (
                                    <tr key={order._id} className="group hover:bg-zinc-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-400 border border-zinc-200 transition-all group-hover:bg-white group-hover:shadow-sm">
                                                    <ShoppingBag size={18} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-zinc-900">{order.orderNumber}</p>
                                                    <div className="flex items-center gap-1 text-[10px] text-zinc-400 font-medium whitespace-nowrap">
                                                        <Calendar size={10} />
                                                        {new Date(order.date).toLocaleDateString()}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Link href={`/dashboard/suppliers/${order.supplierId}`} className="flex items-center gap-3 group/link">
                                                <div className="w-8 h-8 rounded-lg bg-zinc-50 flex items-center justify-center text-zinc-400 border border-zinc-100 overflow-hidden shadow-sm transition-all group-hover/link:shadow-md group-hover/link:scale-105">
                                                    {(order as any).supplierImageUrl ? (
                                                        <img src={(order as any).supplierImageUrl} alt={order.supplierName} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <Building2 size={14} />
                                                    )}
                                                </div>
                                                <span className="text-sm font-semibold text-zinc-900 group-hover/link:underline underline-offset-4 decoration-zinc-300">
                                                    {order.supplierName}
                                                </span>
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <p className="text-sm font-bold text-zinc-900">{formatCurrency(order.amount, settings?.currency)}</p>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <Badge variant={order.status === "paid" ? "success" : order.status === "pending" ? "warning" : "neutral"}>
                                                {order.status}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 text-zinc-400">
                                                {order.status !== "paid" && (
                                                    <Link href={`/dashboard/suppliers/${order.supplierId}/orders/${order._id}/edit`} className="p-2 hover:text-black hover:bg-zinc-100 rounded-lg transition-all" title="Edit">
                                                        <Edit2 size={16} />
                                                    </Link>
                                                )}
                                                <button onClick={() => handleDelete(order._id)} className="p-2 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Delete">
                                                    <Trash2 size={16} />
                                                </button>
                                                <Link href={`/dashboard/suppliers/${order.supplierId}/orders/${order._id}`} className="p-2 hover:text-black hover:bg-zinc-100 rounded-lg transition-all" title="View">
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
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
