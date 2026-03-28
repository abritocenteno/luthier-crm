"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { useRouter, useParams } from "next/navigation";
import { api } from "@/convex/_generated/api";
import {
    ArrowLeft,
    FileText,
    Calendar,
    CheckCircle2,
    Loader2,
    Plus,
    Trash2,
    Upload,
    Sparkles,
    FileCheck,
} from "lucide-react";
import { cn, formatCurrency, getCurrencySymbol } from "@/lib/utils";
import { Id } from "@/convex/_generated/dataModel";

const Card = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <div className={cn("bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden", className)}>
        {children}
    </div>
);

function EditOrderForm() {
    const router = useRouter();
    const params = useParams();
    const supplierId = params.id as Id<"suppliers">;
    const orderId = params.orderId as Id<"orders">;

    const supplier = useQuery(api.suppliers.get, { id: supplierId });
    const order = useQuery(api.orders.get, { id: orderId });
    const settings = useQuery(api.settings.get);
    const updateOrder = useMutation(api.orders.update);
    const generateUploadUrl = useMutation(api.files.generateUploadUrl);
    const smartExtractAction = useAction(api.actions.smartExtract);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isExtracting, setIsExtracting] = useState(false);

    const [formData, setFormData] = useState({
        orderNumber: "",
        date: new Date().getTime(),
        amount: 0,
        status: "pending",
        items: [] as { name: string; description: string; remark: string; amount: number; unitPrice: number }[],
        invoiceStorageId: undefined as Id<"_storage"> | undefined,
    });

    useEffect(() => {
        if (order) {
            if (order.status === "paid") {
                alert("Paid orders cannot be edited.");
                router.back();
                return;
            }
            setFormData({
                orderNumber: order.orderNumber,
                date: order.date,
                amount: order.amount,
                status: order.status,
                items: order.items || [],
                invoiceStorageId: order.invoiceStorageId as Id<"_storage"> | undefined,
            });
        }
    }, [order, router]);

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

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const postUrl = await generateUploadUrl();
            const result = await fetch(postUrl, {
                method: "POST",
                headers: { "Content-Type": file.type },
                body: file,
            });
            const { storageId } = await result.json();

            setFormData(prev => ({
                ...prev,
                invoiceStorageId: storageId as Id<"_storage">,
            }));
        } catch (error) {
            console.error("Upload failed:", error);
            alert("File upload failed. Please try again.");
        } finally {
            setIsUploading(false);
        }
    };

    const handleSmartExtract = async () => {
        if (!formData.invoiceStorageId) {
            alert("Please upload an invoice file first.");
            return;
        }

        setIsExtracting(true);
        try {
            const extracted = await smartExtractAction({ storageId: formData.invoiceStorageId });

            setFormData(prev => {
                const updatedItems = [...prev.items, ...(extracted.items || [])];
                return {
                    ...prev,
                    orderNumber: extracted.orderNumber || prev.orderNumber,
                    items: updatedItems,
                    amount: calculateTotal(updatedItems),
                };
            });
        } catch (error: any) {
            console.error("Extraction failed:", error);
            alert(`Smart extraction failed: ${error.message || "Unknown error"}. You can still fill in the details manually.`);
        } finally {
            setIsExtracting(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await updateOrder({
                id: orderId,
                supplierId: supplierId,
                ...formData
            });
            router.push(`/dashboard/suppliers/${supplierId}/orders/${orderId}`);
        } catch (error: any) {
            console.error("Failed to update order:", error);
            alert(`Failed to update order: ${error.message || "Unknown error"}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (supplier === undefined || order === undefined) return null;

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
            <header className="space-y-4">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-sm font-bold text-zinc-400 hover:text-black transition-colors group"
                >
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    Back to Order
                </button>
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-black flex items-center justify-center text-white shadow-lg shadow-black/10">
                        <FileText size={24} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Edit Order #{formData.orderNumber}</h1>
                        <p className="text-zinc-500">Update purchase details from {supplier?.name}.</p>
                    </div>
                </div>
            </header>

            <form onSubmit={handleSubmit} className="space-y-12">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                    {/* Header Information */}
                    <Card className="p-8 space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Order Number</label>
                                <div className="relative group flex items-center">
                                    <FileText className="absolute left-4 text-zinc-400 group-focus-within:text-black transition-colors" size={18} />
                                    <input
                                        required
                                        className="w-full pl-12 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5 transition-all placeholder:text-zinc-400/50 font-medium"
                                        value={formData.orderNumber}
                                        placeholder="ORD-0000"
                                        onChange={e => setFormData({ ...formData, orderNumber: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Order Date</label>
                                <div className="relative group flex items-center">
                                    <Calendar className="absolute left-4 text-zinc-400 group-focus-within:text-black transition-colors" size={18} />
                                    <input
                                        type="date"
                                        required
                                        className="w-full pl-12 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5 transition-all font-medium"
                                        value={new Date(formData.date).toISOString().split('T')[0]}
                                        onChange={e => setFormData({ ...formData, date: new Date(e.target.value).getTime() })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 pt-4 border-t border-zinc-100">
                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Payment Status</label>
                            <div className="flex gap-2">
                                {['pending', 'paid', 'cancelled'].map(status => (
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
                        </div>
                    </Card>

                    {/* File Upload / AI Extraction Section */}
                    <Card className="p-8 space-y-8 bg-zinc-50/50 border-dashed border-2">
                        <div className="space-y-4">
                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Invoice File Upload</label>

                            <div
                                onClick={() => !formData.invoiceStorageId && fileInputRef.current?.click()}
                                className={cn(
                                    "relative h-48 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center transition-all cursor-pointer overflow-hidden group",
                                    formData.invoiceStorageId
                                        ? "bg-emerald-50 border-emerald-200 text-emerald-600"
                                        : "bg-white border-zinc-200 hover:border-black text-zinc-400"
                                )}
                            >
                                {isUploading ? (
                                    <div className="flex flex-col items-center gap-3">
                                        <Loader2 className="animate-spin" size={32} />
                                        <p className="text-sm font-bold">Uploading File...</p>
                                    </div>
                                ) : formData.invoiceStorageId ? (
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm">
                                            <FileCheck size={24} className="text-emerald-500" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-center">Invoice Uploaded</p>
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setFormData(prev => ({ ...prev, invoiceStorageId: undefined }));
                                                }}
                                                className="text-[10px] uppercase font-black tracking-widest text-emerald-700/50 hover:text-red-500 transition-colors mt-1 block w-full"
                                            >
                                                Remove File
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="w-12 h-12 bg-zinc-50 rounded-full flex items-center justify-center group-hover:bg-black group-hover:text-white transition-all">
                                            <Upload size={24} />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-sm font-bold text-zinc-900">Drop your invoice here</p>
                                            <p className="text-[10px] font-medium text-zinc-400">PDF, JPG or PNG accepted</p>
                                        </div>
                                    </div>
                                )}
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileUpload}
                                    className="hidden"
                                    accept=".pdf,image/*"
                                />
                            </div>

                            <button
                                type="button"
                                onClick={handleSmartExtract}
                                disabled={!formData.invoiceStorageId || isExtracting}
                                className={cn(
                                    "w-full py-4 rounded-xl flex items-center justify-center gap-3 text-sm font-bold transition-all active:scale-95 shadow-lg shadow-black/5 disabled:opacity-50",
                                    formData.invoiceStorageId
                                        ? "bg-gradient-to-br from-indigo-500 to-purple-600 text-white hover:shadow-indigo-500/20"
                                        : "bg-white border border-zinc-200 text-zinc-300"
                                )}
                            >
                                {isExtracting ? (
                                    <>
                                        <Loader2 className="animate-spin" size={18} />
                                        Analyzing Invoice...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles size={18} />
                                        Smart Fill from File
                                    </>
                                )}
                            </button>
                        </div>
                    </Card>
                </div>

                {/* Line Items Section */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <h2 className="text-xl font-bold tracking-tight text-zinc-900">Order Items</h2>
                            <p className="text-sm text-zinc-500">List the materials or components purchased.</p>
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
                                                        placeholder="e.g. Cedar Top Board"
                                                        className="w-full bg-transparent border-none text-sm font-medium focus:ring-0 placeholder:text-zinc-300"
                                                        value={item.name}
                                                        onChange={e => handleUpdateItem(index, "name", e.target.value)}
                                                    />
                                                </td>
                                                <td className="px-6 py-3">
                                                    <input
                                                        placeholder="Grade A, 5mm..."
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
                                                No items added yet. Click "Add Item" to begin or use "Smart Fill".
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                                <tfoot>
                                    <tr className="bg-zinc-50/80 border-t border-zinc-100">
                                        <td colSpan={4} className="px-6 py-4 text-right">
                                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Estimated Total</span>
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

                {/* Submit Section */}
                <div className="flex flex-col items-center gap-6 pt-12 border-t border-zinc-100">
                    <div className="flex items-center justify-center gap-4">
                        <button
                            type="button"
                            onClick={() => router.back()}
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
                                    Updating Order...
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 size={18} />
                                    Update Order Record
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}

export default function EditOrderPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen text-zinc-400"><Loader2 className="animate-spin" /></div>}>
            <EditOrderForm />
        </Suspense>
    );
}
