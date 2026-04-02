"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import {
    Package, Plus, Trash2, Edit2, X, Check, AlertTriangle,
    ChevronDown, Minus, Search,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";

const CATEGORIES = ["Strings", "Tuners", "Nuts & Saddles", "Pickups", "Electronics", "Hardware", "Frets", "Finishing", "Other"];

const Card = ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={cn("bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden", className)}>
        {children}
    </div>
);

type PartDraft = {
    name: string;
    description: string;
    sku: string;
    category: string;
    quantity: number;
    unitCost: string;
    reorderThreshold: string;
    supplier: string;
};

const emptyDraft = (): PartDraft => ({
    name: "", description: "", sku: "", category: "Other",
    quantity: 1, unitCost: "", reorderThreshold: "", supplier: "",
});

export default function PartsPage() {
    const parts = useQuery(api.parts.list);
    const settings = useQuery(api.settings.get);
    const addPart = useMutation(api.parts.add);
    const updatePart = useMutation(api.parts.update);
    const removePart = useMutation(api.parts.remove);
    const adjustQty = useMutation(api.parts.adjustQuantity);

    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<Id<"parts"> | null>(null);
    const [draft, setDraft] = useState<PartDraft>(emptyDraft());
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [search, setSearch] = useState("");
    const [filterCategory, setFilterCategory] = useState("all");

    const filtered = (parts ?? []).filter((p) => {
        const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
            (p.sku ?? "").toLowerCase().includes(search.toLowerCase()) ||
            (p.supplier ?? "").toLowerCase().includes(search.toLowerCase());
        const matchCat = filterCategory === "all" || p.category === filterCategory;
        return matchSearch && matchCat;
    });

    const lowStock = (parts ?? []).filter((p) => p.reorderThreshold != null && p.quantity <= (p.reorderThreshold ?? 0));

    const openNew = () => { setDraft(emptyDraft()); setEditingId(null); setShowForm(true); };

    const openEdit = (p: typeof parts extends (infer T)[] | undefined ? T : never) => {
        if (!p) return;
        setDraft({
            name: (p as any).name ?? "",
            description: (p as any).description ?? "",
            sku: (p as any).sku ?? "",
            category: (p as any).category ?? "Other",
            quantity: (p as any).quantity ?? 0,
            unitCost: (p as any).unitCost != null ? String((p as any).unitCost) : "",
            reorderThreshold: (p as any).reorderThreshold != null ? String((p as any).reorderThreshold) : "",
            supplier: (p as any).supplier ?? "",
        });
        setEditingId((p as any)._id);
        setShowForm(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        const payload = {
            name: draft.name,
            description: draft.description || undefined,
            sku: draft.sku || undefined,
            category: draft.category || undefined,
            quantity: draft.quantity,
            unitCost: draft.unitCost ? parseFloat(draft.unitCost) : undefined,
            reorderThreshold: draft.reorderThreshold ? parseInt(draft.reorderThreshold) : undefined,
            supplier: draft.supplier || undefined,
        };
        try {
            if (editingId) {
                await updatePart({ id: editingId, ...payload });
            } else {
                await addPart(payload);
            }
            setShowForm(false);
            setEditingId(null);
            setDraft(emptyDraft());
        } catch (err) {
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const totalValue = (parts ?? []).reduce((sum, p) => sum + p.quantity * (p.unitCost ?? 0), 0);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
            {/* Header */}
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-black flex items-center justify-center text-white shadow-lg shadow-black/10">
                        <Package size={22} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Parts & Inventory</h1>
                        <p className="text-zinc-500 text-sm">Track stock levels for commonly used parts.</p>
                    </div>
                </div>
                <button
                    onClick={openNew}
                    className="flex items-center gap-2 px-5 py-2.5 bg-black text-white rounded-xl text-sm font-bold hover:bg-zinc-800 transition-all shadow-lg shadow-black/10 active:scale-95"
                >
                    <Plus size={16} /> Add Part
                </button>
            </header>

            {/* Low stock alert */}
            {lowStock.length > 0 && (
                <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                    <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-bold text-amber-800">Low stock alert</p>
                        <p className="text-sm text-amber-700 mt-0.5">
                            {lowStock.map((p) => p.name).join(", ")} {lowStock.length === 1 ? "is" : "are"} at or below reorder threshold.
                        </p>
                    </div>
                </div>
            )}

            {/* Stats row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: "Total SKUs", value: (parts ?? []).length.toString() },
                    { label: "Low Stock", value: lowStock.length.toString(), warn: lowStock.length > 0 },
                    { label: "Total Items", value: (parts ?? []).reduce((s, p) => s + p.quantity, 0).toString() },
                    { label: "Stock Value", value: formatCurrency(totalValue, settings?.currency) },
                ].map((s) => (
                    <Card key={s.label} className="p-5">
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">{s.label}</p>
                        <p className={cn("text-2xl font-black tracking-tight", s.warn ? "text-amber-600" : "text-zinc-900")}>
                            {s.value}
                        </p>
                    </Card>
                ))}
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="relative flex-1 max-w-sm">
                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input
                        type="text"
                        placeholder="Search parts, SKU, supplier…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
                    />
                </div>
                <div className="relative">
                    <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="pl-4 pr-9 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm font-medium appearance-none focus:outline-none focus:ring-2 focus:ring-black/5 cursor-pointer"
                    >
                        <option value="all">All Categories</option>
                        {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                </div>
            </div>

            {/* Parts Table */}
            <Card>
                {filtered.length === 0 ? (
                    <div className="px-6 py-16 flex flex-col items-center justify-center space-y-3 text-center">
                        <div className="w-14 h-14 bg-zinc-50 rounded-full flex items-center justify-center text-zinc-300">
                            <Package size={28} />
                        </div>
                        <p className="text-zinc-500 font-medium">
                            {search || filterCategory !== "all" ? "No parts match your filters." : "No parts in inventory yet."}
                        </p>
                        {!search && filterCategory === "all" && (
                            <button onClick={openNew} className="text-sm font-bold text-black underline underline-offset-4">Add your first part</button>
                        )}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-100 bg-zinc-50/30">
                                    <th className="px-6 py-4">Part</th>
                                    <th className="px-6 py-4">Category</th>
                                    <th className="px-6 py-4">SKU</th>
                                    <th className="px-6 py-4 text-center">Qty</th>
                                    <th className="px-6 py-4 text-right">Unit Cost</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100">
                                {filtered.map((part) => {
                                    const isLow = part.reorderThreshold != null && part.quantity <= (part.reorderThreshold ?? 0);
                                    return (
                                        <tr key={part._id} className="group hover:bg-zinc-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <p className="text-sm font-bold text-zinc-900">{part.name}</p>
                                                {part.description && <p className="text-xs text-zinc-400 mt-0.5">{part.description}</p>}
                                                {part.supplier && <p className="text-xs text-zinc-400 mt-0.5">Supplier: {part.supplier}</p>}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 bg-zinc-100 text-zinc-500 rounded-lg">
                                                    {part.category ?? "—"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-zinc-500 font-mono">{part.sku ?? "—"}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => adjustQty({ id: part._id, delta: -1 })}
                                                        className="w-7 h-7 rounded-lg border border-zinc-200 flex items-center justify-center text-zinc-400 hover:border-zinc-300 hover:text-black transition-all"
                                                    >
                                                        <Minus size={12} />
                                                    </button>
                                                    <span className={cn(
                                                        "text-sm font-black w-8 text-center",
                                                        isLow ? "text-amber-600" : "text-zinc-900"
                                                    )}>
                                                        {part.quantity}
                                                    </span>
                                                    <button
                                                        onClick={() => adjustQty({ id: part._id, delta: 1 })}
                                                        className="w-7 h-7 rounded-lg border border-zinc-200 flex items-center justify-center text-zinc-400 hover:border-zinc-300 hover:text-black transition-all"
                                                    >
                                                        <Plus size={12} />
                                                    </button>
                                                </div>
                                                {isLow && (
                                                    <p className="text-[9px] font-bold text-amber-600 text-center mt-1 uppercase tracking-wider">Low</p>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right text-sm font-bold text-zinc-900">
                                                {part.unitCost != null ? formatCurrency(part.unitCost, settings?.currency) : "—"}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => openEdit(part)}
                                                        className="p-2 text-zinc-400 hover:text-black hover:bg-zinc-100 rounded-lg transition-all"
                                                        title="Edit"
                                                    >
                                                        <Edit2 size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => removePart({ id: part._id })}
                                                        className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            {/* Add / Edit Drawer */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setShowForm(false)} />
                    <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-zinc-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
                        <div className="p-6 space-y-5 max-h-[90vh] overflow-y-auto">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-bold">{editingId ? "Edit Part" : "Add Part"}</h3>
                                <button onClick={() => setShowForm(false)} className="p-2 hover:bg-zinc-100 rounded-xl transition-colors text-zinc-400 hover:text-black">
                                    <X size={20} />
                                </button>
                            </div>
                            <form onSubmit={handleSubmit} className="space-y-5">
                                {/* Name */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Name *</label>
                                    <input
                                        required
                                        value={draft.name}
                                        onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                                        placeholder="e.g. D'Addario NYXL 10-46"
                                        className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    {/* Category */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Category</label>
                                        <div className="relative">
                                            <select
                                                value={draft.category}
                                                onChange={(e) => setDraft({ ...draft, category: e.target.value })}
                                                className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-black/5 pr-9"
                                            >
                                                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                                            </select>
                                            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                                        </div>
                                    </div>
                                    {/* SKU */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">SKU / Part #</label>
                                        <input
                                            value={draft.sku}
                                            onChange={(e) => setDraft({ ...draft, sku: e.target.value })}
                                            placeholder="e.g. NYX1046"
                                            className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-black/5"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                    {/* Quantity */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Quantity *</label>
                                        <input
                                            required
                                            type="number"
                                            min="0"
                                            value={draft.quantity}
                                            onChange={(e) => setDraft({ ...draft, quantity: parseInt(e.target.value) || 0 })}
                                            className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-black/5"
                                        />
                                    </div>
                                    {/* Unit Cost */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Unit Cost</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={draft.unitCost}
                                            onChange={(e) => setDraft({ ...draft, unitCost: e.target.value })}
                                            placeholder="0.00"
                                            className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
                                        />
                                    </div>
                                    {/* Reorder Threshold */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Reorder At</label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={draft.reorderThreshold}
                                            onChange={(e) => setDraft({ ...draft, reorderThreshold: e.target.value })}
                                            placeholder="e.g. 2"
                                            className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
                                        />
                                    </div>
                                </div>

                                {/* Supplier */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Supplier</label>
                                    <input
                                        value={draft.supplier}
                                        onChange={(e) => setDraft({ ...draft, supplier: e.target.value })}
                                        placeholder="e.g. D'Addario, Hosco…"
                                        className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
                                    />
                                </div>

                                {/* Description */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Description</label>
                                    <textarea
                                        rows={2}
                                        value={draft.description}
                                        onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                                        placeholder="Optional notes about this part…"
                                        className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5 resize-none"
                                    />
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button type="button" onClick={() => setShowForm(false)}
                                        className="flex-1 py-3 border border-zinc-200 rounded-xl text-sm font-bold text-zinc-600 hover:bg-zinc-50 transition-all">
                                        Cancel
                                    </button>
                                    <button type="submit" disabled={isSubmitting}
                                        className="flex-1 py-3 bg-black text-white rounded-xl text-sm font-bold hover:bg-zinc-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                                        <Check size={16} />
                                        {isSubmitting ? "Saving…" : editingId ? "Save Changes" : "Add Part"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
