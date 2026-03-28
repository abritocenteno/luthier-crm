"use client";

import { useState, useEffect, Suspense, use } from "react";
import { useQuery, useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "../../../../../convex/_generated/api";
import {
    ArrowLeft,
    FileText,
    User,
    Calendar,
    DollarSign,
    CheckCircle2,
    AlertCircle,
    Loader2,
    ChevronDown,
    Plus,
    Trash2,
} from "lucide-react";
import { cn, formatCurrency, getCurrencySymbol } from "@/lib/utils";
import { Id } from "../../../../../convex/_generated/dataModel";

const Card = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <div className={cn("bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden", className)}>
        {children}
    </div>
);

function EditInvoiceForm({ id }: { id: Id<"invoices"> }) {
    const router = useRouter();

    const clients = useQuery(api.clients.list);
    const invoice = useQuery(api.invoices.get, { id });
    const settings = useQuery(api.settings.get);
    const updateInvoice = useMutation(api.invoices.update);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        clientId: "" as Id<"clients"> | "",
        invoiceNumber: "",
        date: new Date().getTime(),
        amount: 0,
        status: "pending",
        paymentMethod: "",
        items: [] as { name: string; description: string; remark: string; amount: number; unitPrice: number }[],
    });

    // Pre-fill form data when invoice is loaded
    useEffect(() => {
        if (invoice) {
            setFormData({
                clientId: invoice.clientId,
                invoiceNumber: invoice.invoiceNumber,
                date: invoice.date,
                amount: invoice.amount,
                status: invoice.status,
                paymentMethod: invoice.paymentMethod || "",
                items: invoice.items || [],
            });
        }
    }, [invoice]);

    const calculateTotal = (items: typeof formData.items) => {
        return items.reduce((acc, item) => acc + (item.amount * item.unitPrice), 0);
    };

    const handleAddItem = () => {
        setFormData(prev => ({
            ...prev,
            items: [...prev.items, { name: "", description: "", remark: "", amount: 1, unitPrice: 0 }]
        }));
    };

    const handleRemoveItem = (index: number) => {
        const newItems = formData.items.filter((_, i) => i !== index);
        setFormData(prev => ({
            ...prev,
            items: newItems,
            amount: calculateTotal(newItems)
        }));
    };

    const handleUpdateItem = (index: number, field: keyof typeof formData.items[0], value: string | number) => {
        const newItems = [...formData.items];
        newItems[index] = { ...newItems[index], [field]: value };
        setFormData(prev => ({
            ...prev,
            items: newItems,
            amount: calculateTotal(newItems)
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.clientId) {
            alert("Please select a client");
            return;
        }

        setIsSubmitting(true);
        try {
            await updateInvoice({
                id,
                ...formData,
                clientId: formData.clientId as Id<"clients">,
            });
            router.push("/dashboard/invoices");
        } catch (error) {
            console.error("Failed to update invoice:", error);
            alert("Failed to update invoice. Please try again.");
        } finally {
            setIsSubmitting(false);
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
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
            <header className="space-y-4">
                <button
                    onClick={() => router.push("/dashboard/invoices")}
                    className="flex items-center gap-2 text-sm font-bold text-zinc-400 hover:text-black transition-colors group"
                >
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    Back to Invoices
                </button>
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-black flex items-center justify-center text-white shadow-lg shadow-black/10">
                        <FileText size={24} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Edit Invoice</h1>
                        <p className="text-zinc-500">Update details for invoice {formData.invoiceNumber}.</p>
                    </div>
                </div>
            </header>

            <form onSubmit={handleSubmit} className="space-y-12">
                {/* Header Information */}
                <div className="w-full lg:w-1/2">
                    <Card className="p-8 space-y-8">
                        {/* Client Selection */}
                        <div className="space-y-4">
                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Client Selection</label>
                            <div className="relative group flex items-center">
                                <User className="absolute left-4 text-zinc-400 group-focus-within:text-black transition-colors" size={18} />
                                <select
                                    required
                                    value={formData.clientId}
                                    onChange={e => setFormData({ ...formData, clientId: e.target.value as Id<"clients"> })}
                                    className="w-full pl-12 pr-10 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5 transition-all appearance-none cursor-pointer placeholder:text-zinc-400/50"
                                >
                                    <option value="" disabled>Select a client...</option>
                                    {clients?.map(client => (
                                        <option key={client._id} value={client._id}>{client.name}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-4 text-zinc-400 pointer-events-none" size={18} />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Invoice Number */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Invoice Number</label>
                                <div className="relative group flex items-center">
                                    <FileText className="absolute left-4 text-zinc-400 group-focus-within:text-black transition-colors" size={18} />
                                    <input
                                        required
                                        className="w-full pl-12 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5 transition-all placeholder:text-zinc-400/50"
                                        value={formData.invoiceNumber}
                                        placeholder="INV-0000"
                                        onChange={e => setFormData({ ...formData, invoiceNumber: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Date Selection */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Invoice Date</label>
                                <div className="relative group flex items-center">
                                    <Calendar className="absolute left-4 text-zinc-400 group-focus-within:text-black transition-colors" size={18} />
                                    <input
                                        type="date"
                                        required
                                        className="w-full pl-12 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5 transition-all"
                                        value={new Date(formData.date).toISOString().split('T')[0]}
                                        onChange={e => setFormData({ ...formData, date: new Date(e.target.value).getTime() })}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Payment Method Selection */}
                        <div className="space-y-4 pt-4 border-t border-zinc-100">
                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Payment Method</label>
                            <div className="relative group flex items-center">
                                <DollarSign className="absolute left-4 text-zinc-400 group-focus-within:text-black transition-colors" size={18} />
                                <select
                                    value={formData.paymentMethod}
                                    onChange={e => setFormData({ ...formData, paymentMethod: e.target.value })}
                                    className="w-full pl-12 pr-10 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5 transition-all appearance-none cursor-pointer"
                                >
                                    <option value="" disabled>Select payment method (Optional)</option>
                                    <option value="Cash">Cash</option>
                                    <option value="iDeal/Wero">iDeal/Wero</option>
                                </select>
                                <ChevronDown className="absolute right-4 text-zinc-400 pointer-events-none" size={18} />
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Line Items Section */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <h2 className="text-xl font-bold tracking-tight text-zinc-900">Invoice Items</h2>
                            <p className="text-sm text-zinc-500">Edit the products or services for this invoice.</p>
                        </div>
                        <button
                            type="button"
                            onClick={handleAddItem}
                            className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-xl text-xs font-bold hover:bg-black transition-all active:scale-95 shadow-lg shadow-black/5"
                        >
                            <Plus size={14} />
                            Add Item
                        </button>
                    </div>

                    <Card>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[1000px]">
                                <thead>
                                    <tr className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-100 bg-zinc-50/50">
                                        <th className="px-6 py-4 w-[20%]">Item Name</th>
                                        <th className="px-6 py-4 w-[25%]">Description</th>
                                        <th className="px-6 py-4 w-[20%]">Remark</th>
                                        <th className="px-6 py-4 w-[10%] text-center">Amount</th>
                                        <th className="px-6 py-4 w-[12%] text-right">Unit Price</th>
                                        <th className="px-6 py-4 w-[13%] text-right">Total</th>
                                        <th className="px-4 py-4 w-[40px]"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-100">
                                    {formData.items.length > 0 ? (
                                        formData.items.map((item, index) => (
                                            <tr key={index} className="group hover:bg-zinc-50/30 transition-colors">
                                                <td className="px-6 py-3">
                                                    <input
                                                        required
                                                        placeholder="e.g. Oil Change"
                                                        className="w-full bg-transparent border-none text-sm font-medium focus:ring-0 placeholder:text-zinc-300"
                                                        value={item.name}
                                                        onChange={e => handleUpdateItem(index, "name", e.target.value)}
                                                    />
                                                </td>
                                                <td className="px-6 py-3">
                                                    <input
                                                        placeholder="Add detail..."
                                                        className="w-full bg-transparent border-none text-xs text-zinc-500 focus:ring-0 placeholder:text-zinc-200"
                                                        value={item.description}
                                                        onChange={e => handleUpdateItem(index, "description", e.target.value)}
                                                    />
                                                </td>
                                                <td className="px-6 py-3">
                                                    <input
                                                        placeholder="..."
                                                        className="w-full bg-transparent border-none text-[11px] text-zinc-400 focus:ring-0 placeholder:text-zinc-200 italic"
                                                        value={item.remark}
                                                        onChange={e => handleUpdateItem(index, "remark", e.target.value)}
                                                    />
                                                </td>
                                                <td className="px-6 py-3 text-center">
                                                    <input
                                                        type="number"
                                                        required
                                                        min="1"
                                                        className="w-16 mx-auto bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-bold text-center py-1 focus:ring-2 focus:ring-black/5 transition-all"
                                                        value={item.amount}
                                                        onChange={e => handleUpdateItem(index, "amount", parseInt(e.target.value) || 0)}
                                                    />
                                                </td>
                                                <td className="px-6 py-3 text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <span className="text-[10px] font-bold text-zinc-400">{getCurrencySymbol(settings?.currency)}</span>
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            required
                                                            className="w-24 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-bold text-right py-1 focus:ring-2 focus:ring-black/5 transition-all"
                                                            value={item.unitPrice || ""}
                                                            placeholder="0.00"
                                                            onChange={e => handleUpdateItem(index, "unitPrice", parseFloat(e.target.value) || 0)}
                                                        />
                                                    </div>
                                                </td>
                                                <td className="px-6 py-3 text-right">
                                                    <span className="text-sm font-bold text-zinc-900">
                                                        {cn(formatCurrency(item.amount * item.unitPrice, settings?.currency))}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveItem(index)}
                                                        className="p-1.5 text-zinc-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-12 text-center text-zinc-400 italic text-sm">
                                                No items added yet. Click "Add Item" to begin.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                                <tfoot>
                                    <tr className="bg-zinc-50/80 border-t border-zinc-100">
                                        <td colSpan={4} className="px-6 py-4 text-right">
                                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Grand Total</span>
                                        </td>
                                        <td colSpan={2} className="px-6 py-4 text-right">
                                            <span className="text-xl font-black text-black tracking-tight underline decoration-black/10 underline-offset-8">
                                                {formatCurrency(formData.amount, settings?.currency)}
                                            </span>
                                        </td>
                                        <td></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </Card>
                </div>

                <div className="w-full lg:w-1/2">
                    <Card className="p-8 space-y-4">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Payment Status</label>
                        <div className="flex gap-2">
                            {['pending', 'paid', 'overdue'].map(status => (
                                <button
                                    key={status}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, status })}
                                    className={cn(
                                        "flex-1 py-3 px-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border",
                                        formData.status === status
                                            ? "bg-black text-white border-black shadow-lg shadow-black/10 scale-[1.02]"
                                            : "bg-white text-zinc-400 border-zinc-200 hover:border-zinc-300"
                                    )}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>
                    </Card>
                </div>

                {/* Submit Section - Centered Block at bottom */}
                <div className="flex flex-col items-center gap-6 pt-12 border-t border-zinc-100">
                    <div className="flex items-center justify-center gap-4">
                        <button
                            type="button"
                            onClick={() => router.push("/dashboard/invoices")}
                            className="px-8 py-3 bg-white border border-zinc-200 rounded-xl text-sm font-bold text-zinc-600 hover:bg-zinc-100 transition-all active:scale-95 min-w-[140px]"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-12 py-3 bg-black text-white rounded-xl text-sm font-bold hover:bg-zinc-800 transition-all shadow-xl shadow-black/20 active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50 min-w-[220px]"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    Saving Changes...
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 size={18} />
                                    Save Changes
                                </>
                            )}
                        </button>
                    </div>
                    <p className="text-[10px] text-zinc-400 font-medium">Review your changes carefully before saving.</p>
                </div>
            </form>
        </div>
    );
}

export default function EditInvoicePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen text-zinc-400"><Loader2 className="animate-spin" /></div>}>
            <EditInvoiceForm id={id as Id<"invoices">} />
        </Suspense>
    );
}
