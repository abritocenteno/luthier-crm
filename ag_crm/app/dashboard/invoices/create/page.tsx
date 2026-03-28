"use client";

// Triggering re-compilation
import { useState, useEffect, Suspense, useRef } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "../../../../convex/_generated/api";
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
    Upload,
    Sparkles,
    FileCheck,
    X,
} from "lucide-react";
import { cn, formatCurrency, getCurrencySymbol } from "@/lib/utils";
import { Id } from "../../../../convex/_generated/dataModel";

const Card = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <div className={cn("bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden", className)}>
        {children}
    </div>
);

function CreateInvoiceForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialClientId = searchParams.get("clientId") as Id<"clients"> | null;

    const clients = useQuery(api.clients.list);
    const suppliers = useQuery(api.suppliers.list);
    const settings = useQuery(api.settings.get);
    const addInvoice = useMutation(api.invoices.add);
    const addOrder = useMutation(api.orders.add);
    const orders = useQuery(api.orders.list);
    const generateUploadUrl = useMutation(api.files.generateUploadUrl);
    const smartExtractAction = useAction(api.actions.smartExtract);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const quickAddFileInputRef = useRef<HTMLInputElement>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isExtracting, setIsExtracting] = useState(false);
    const [isQuickAdding, setIsQuickAdding] = useState(false);
    const [quickAddStep, setQuickAddStep] = useState<'upload' | 'extract' | 'confirm'>('upload');
    const [quickAddData, setQuickAddData] = useState<{
        storageId?: Id<"_storage">;
        extracted?: any;
        supplierId?: Id<"suppliers">;
    }>({});

    const [formData, setFormData] = useState({
        clientId: (initialClientId || "") as Id<"clients"> | "",
        invoiceNumber: `INV-${Math.floor(1000 + Math.random() * 9000)}`,
        date: new Date().getTime(),
        amount: 0,
        status: "pending",
        paymentMethod: "",
        items: [] as { name: string; description: string; remark: string; amount: number; unitPrice: number; fromOrderId?: Id<"orders"> }[],
        invoiceStorageId: undefined as Id<"_storage"> | undefined,
        orderIds: [] as Id<"orders">[],
    });

    // Sync clientId if it changes in URL or if it was initially null but now provided
    useEffect(() => {
        if (initialClientId && formData.clientId !== initialClientId) {
            setFormData(prev => ({ ...prev, clientId: initialClientId }));
        }
    }, [initialClientId, formData.clientId]);

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

    const handleQuickAddUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsQuickAdding(true);
        setQuickAddStep('extract');
        try {
            const postUrl = await generateUploadUrl();
            const result = await fetch(postUrl, {
                method: "POST",
                headers: { "Content-Type": file.type },
                body: file,
            });
            const { storageId } = await result.json();

            const extracted = await smartExtractAction({ storageId: storageId as Id<"_storage"> });
            
            // Try to find matching supplier
            const matchedSupplier = suppliers?.find(s => 
                s.name.toLowerCase().includes(extracted.supplierName?.toLowerCase() || "") ||
                extracted.supplierName?.toLowerCase().includes(s.name.toLowerCase())
            );

            setQuickAddData({
                storageId: storageId as Id<"_storage">,
                extracted,
                supplierId: matchedSupplier?._id
            });
            setQuickAddStep('confirm');
        } catch (error) {
            console.error("Quick add failed:", error);
            alert("Upload or extraction failed. Please try again.");
            setIsQuickAdding(false);
            setQuickAddStep('upload');
        }
    };

    const handleConfirmQuickAdd = async () => {
        if (!quickAddData.supplierId || !quickAddData.extracted) return;

        try {
            const orderId = await addOrder({
                supplierId: quickAddData.supplierId,
                orderNumber: quickAddData.extracted.orderNumber || `QUICK-${Math.floor(1000 + Math.random() * 9000)}`,
                date: quickAddData.extracted.date || new Date().getTime(),
                amount: quickAddData.extracted.totalAmount || 0,
                status: "pending",
                items: (quickAddData.extracted.items || []).map((item: any) => ({
                    ...item,
                    amount: Math.max(1, item.amount || 0)
                })),
                invoiceStorageId: quickAddData.storageId,
            });

            setFormData(prev => {
                const newExtractedItems = (quickAddData.extracted.items || []).map((item: any) => ({
                    ...item,
                    amount: Math.max(1, item.amount || 0),
                    remark: item.remark ? `${item.remark} (Ref: ${quickAddData.extracted.orderNumber})` : `(Ref: ${quickAddData.extracted.orderNumber})`,
                    fromOrderId: orderId as Id<"orders">
                }));
                const updatedItems = [...prev.items, ...newExtractedItems];
                return {
                    ...prev,
                    orderIds: [...prev.orderIds, orderId as Id<"orders">],
                    items: updatedItems,
                    amount: calculateTotal(updatedItems),
                };
            });

            setIsQuickAdding(false);
            setQuickAddStep('upload');
            setQuickAddData({});
        } catch (error) {
            console.error("Failed to create order:", error);
            alert("Failed to create order. Please try again.");
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
                const newExtractedItems = (extracted.items || []).map((item: any) => ({
                    ...item,
                    amount: Math.max(1, item.amount || 0)
                }));
                const updatedItems = [...prev.items, ...newExtractedItems];
                return {
                    ...prev,
                    invoiceNumber: extracted.orderNumber || prev.invoiceNumber,
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
        if (!formData.clientId) {
            alert("Please select a client");
            return;
        }

        setIsSubmitting(true);
        try {
            await addInvoice({
                ...formData,
                clientId: formData.clientId as Id<"clients">,
                orderIds: formData.orderIds,
            });
            router.push("/dashboard/invoices");
        } catch (error) {
            console.error("Failed to create invoice:", error);
            alert("Failed to create invoice. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
            <header className="space-y-4">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-sm font-bold text-zinc-400 hover:text-black transition-colors group"
                >
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    Back to Invoices
                </button>
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-black flex items-center justify-center text-white shadow-lg shadow-black/10">
                        <Plus size={24} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Create Invoice</h1>
                        <p className="text-zinc-500">Generate a new billing record for your client.</p>
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
                                        defaultValue={new Date().toISOString().split('T')[0]}
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
                            <p className="text-[10px] text-zinc-400 font-medium text-center italic">
                                Use AI to extract line items and amounts automatically from your PDF.
                            </p>
                        </div>
                    </Card>
                </div>

                {/* Linked Supplier Invoices/Orders */}
                <div className="space-y-4">
                    <div className="space-y-1">
                        <h2 className="text-xl font-bold tracking-tight text-zinc-900">Attached Supplier Invoices</h2>
                        <p className="text-sm text-zinc-500">Link relevant supplier invoices/orders to this client invoice.</p>
                    </div>
                    
                    <Card className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {/* Quick Add Card */}
                            <div 
                                className={cn(
                                    "p-4 rounded-xl border transition-all flex flex-col items-center justify-center text-center space-y-2 group min-h-[120px]",
                                    isQuickAdding ? "bg-zinc-50 border-zinc-200" : "bg-white border-zinc-200 border-dashed hover:border-black cursor-pointer"
                                )}
                                onClick={() => !isQuickAdding && quickAddFileInputRef.current?.click()}
                            >
                                {isQuickAdding ? (
                                    quickAddStep === 'extract' ? (
                                        <div className="flex flex-col items-center gap-2">
                                            <Loader2 className="animate-spin text-zinc-400" size={24} />
                                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Analyzing File...</p>
                                        </div>
                                    ) : (
                                        <div className="w-full space-y-3">
                                            <select 
                                                className="w-full py-1.5 px-2 bg-white border border-zinc-200 rounded-lg text-xs focus:ring-2 focus:ring-black/5 outline-none"
                                                value={quickAddData.supplierId || ""}
                                                onClick={e => e.stopPropagation()}
                                                onChange={e => setQuickAddData(prev => ({ ...prev, supplierId: e.target.value as Id<"suppliers"> }))}
                                            >
                                                <option value="" disabled>Select Supplier...</option>
                                                {suppliers?.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                                            </select>
                                            <div className="flex gap-2">
                                                <button 
                                                    onClick={e => { e.stopPropagation(); handleConfirmQuickAdd(); }}
                                                    disabled={!quickAddData.supplierId}
                                                    className="flex-1 py-1.5 bg-black text-white rounded-lg text-[10px] font-bold uppercase tracking-wider disabled:opacity-50"
                                                >
                                                    Add
                                                </button>
                                                <button 
                                                    onClick={e => { e.stopPropagation(); setIsQuickAdding(false); }}
                                                    className="px-2 py-1.5 bg-zinc-100 text-zinc-500 rounded-lg text-[10px] font-bold uppercase tracking-wider"
                                                >
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        </div>
                                    )
                                ) : (
                                    <>
                                        <div className="w-10 h-10 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-400 group-hover:bg-black group-hover:text-white transition-all">
                                            <Upload size={18} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-900">Upload New</p>
                                            <p className="text-[10px] text-zinc-400 font-medium">Add supplier invoice file</p>
                                        </div>
                                    </>
                                )}
                                <input 
                                    type="file" 
                                    ref={quickAddFileInputRef}
                                    onChange={handleQuickAddUpload}
                                    className="hidden"
                                    accept=".pdf,image/*"
                                />
                            </div>

                            {orders?.map(order => (
                                <div 
                                    key={order._id}
                                    onClick={() => {
                                        const exists = formData.orderIds.includes(order._id);
                                        setFormData(prev => {
                                            const newOrderIds = exists 
                                                ? prev.orderIds.filter(id => id !== order._id)
                                                : [...prev.orderIds, order._id];
                                            
                                            let updatedItems;
                                            if (exists) {
                                                // Remove items belonging to this order
                                                updatedItems = prev.items.filter(item => item.fromOrderId !== order._id);
                                            } else {
                                                // Add items belonging to this order
                                                const newItems = (order.items || []).map(item => ({
                                                    ...item,
                                                    amount: Math.max(1, item.amount || 0),
                                                    remark: item.remark ? `${item.remark} (Ref: ${order.orderNumber})` : `(Ref: ${order.orderNumber})`,
                                                    fromOrderId: order._id
                                                }));
                                                updatedItems = [...prev.items, ...newItems];
                                            }

                                            return {
                                                ...prev,
                                                orderIds: newOrderIds,
                                                items: updatedItems,
                                                amount: calculateTotal(updatedItems),
                                            };
                                        });
                                    }}
                                    className={cn(
                                        "p-4 rounded-xl border transition-all cursor-pointer flex justify-between items-start group",
                                        formData.orderIds.includes(order._id)
                                            ? "bg-black border-black text-white"
                                            : "bg-white border-zinc-200 hover:border-zinc-300"
                                    )}
                                >
                                    <div className="space-y-1">
                                        <p className={cn("text-xs font-bold truncate", formData.orderIds.includes(order._id) ? "text-zinc-300" : "text-zinc-500")}>
                                            {order.supplierName}
                                        </p>
                                        <p className="text-sm font-black">{order.orderNumber}</p>
                                        <p className={cn("text-[10px] font-medium", formData.orderIds.includes(order._id) ? "text-zinc-400" : "text-zinc-400")}>
                                            {formatCurrency(order.amount, settings?.currency)} • {new Date(order.date).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className={cn(
                                        "w-5 h-5 rounded-full border flex items-center justify-center transition-all",
                                        formData.orderIds.includes(order._id)
                                            ? "bg-white border-white text-black"
                                            : "bg-zinc-50 border-zinc-200 group-hover:border-zinc-300"
                                    )}>
                                        {formData.orderIds.includes(order._id) && <CheckCircle2 size={12} />}
                                    </div>
                                </div>
                            ))}
                            {orders?.length === 0 && (
                                <div className="col-span-full py-8 text-center text-zinc-400 italic text-sm">
                                    No supplier orders found.
                                </div>
                            )}
                        </div>
                    </Card>
                </div>

                {/* Line Items Section */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <h2 className="text-xl font-bold tracking-tight text-zinc-900">Invoice Items</h2>
                            <p className="text-sm text-zinc-500">Add products or services to this invoice.</p>
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
                                    Creating Invoice...
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 size={18} />
                                    Create Invoice
                                </>
                            )}
                        </button>
                    </div>
                    <p className="text-[10px] text-zinc-400 font-medium">Verify all information before finalizing the invoice.</p>
                </div>
            </form>
        </div>
    );
}

export default function CreateInvoicePage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen text-zinc-400"><Loader2 className="animate-spin" /></div>}>
            <CreateInvoiceForm />
        </Suspense>
    );
}
