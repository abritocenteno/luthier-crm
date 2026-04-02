"use client";

import { useQuery } from "convex/react";
import { useParams, useRouter } from "next/navigation";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import {
    Mail,
    Phone,
    Globe,
    MapPin,
    ArrowLeft,
    Package,
    Calendar,
    DollarSign,
    Clock,
    Building2,
    Truck,
    Edit2,
    ChevronRight,
    ShoppingBag,
    Plus,
    Trash2,
    X,
    Camera,
    User,
} from "lucide-react";
import { useMutation } from "convex/react";
import { useState } from "react";
import { motion } from "motion/react";
import { cn, formatCurrency } from "@/lib/utils";
import Link from "next/link";

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

export default function SupplierDetailPage() {
    const params = useParams();
    const router = useRouter();
    const supplierId = params.id as Id<"suppliers">;

    const supplier = useQuery(api.suppliers.get, { id: supplierId });
    const orders = useQuery(api.orders.listBySupplier, { supplierId });
    const settings = useQuery(api.settings.get);
    const contacts = useQuery(api.contacts.listBySupplier, { supplierId });
    const addContact = useMutation(api.contacts.add);
    const removeContact = useMutation(api.contacts.remove);
    const generateUploadUrl = useMutation(api.contacts.generateUploadUrl);

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [newContact, setNewContact] = useState({
        name: "",
        email: "",
        phone: "",
        role: "",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAddContact = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            let imageStorageId = undefined;

            if (selectedImage) {
                const postUrl = await generateUploadUrl();
                const result = await fetch(postUrl, {
                    method: "POST",
                    headers: { "Content-Type": selectedImage.type },
                    body: selectedImage,
                });
                const { storageId } = await result.json();
                imageStorageId = storageId;
            }

            await addContact({
                ...newContact,
                supplierId,
                imageStorageId,
            });
            setNewContact({ name: "", email: "", phone: "", role: "" });
            setSelectedImage(null);
            setImagePreview(null);
            setIsAddModalOpen(false);
        } catch (error) {
            console.error("Failed to add contact:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (supplier === undefined) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-zinc-200 border-t-black rounded-full animate-spin" />
            </div>
        );
    }

    if (supplier === null) {
        return (
            <div className="text-center py-20">
                <h2 className="text-2xl font-bold text-zinc-900">Supplier not found</h2>
                <p className="text-zinc-500 mt-2">The supplier you are looking for does not exist or you don't have access.</p>
                <button
                    onClick={() => router.push("/dashboard/suppliers")}
                    className="mt-6 text-sm font-bold text-black underline underline-offset-4"
                >
                    Back to Suppliers
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <header className="space-y-6">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-sm font-bold text-zinc-400 hover:text-black transition-colors group"
                >
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    Back to Suppliers
                </button>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                        <div className="w-20 h-20 rounded-3xl bg-zinc-100 flex items-center justify-center text-zinc-400 border border-zinc-200 overflow-hidden shadow-sm">
                            {supplier.imageUrl ? (
                                <img src={supplier.imageUrl} alt={supplier.name} className="w-full h-full object-cover" />
                            ) : (
                                <Building2 size={32} />
                            )}
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center gap-3">
                                <h1 className="text-3xl font-bold tracking-tight">{supplier.name}</h1>
                                <Badge variant={supplier.type === 'distributor' ? 'info' : 'neutral'}>
                                    {supplier.type}
                                </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-zinc-500 font-medium">
                                <div className="flex items-center gap-1.5 focus:text-black">
                                    <Mail size={14} />
                                    {supplier.email}
                                </div>
                                {supplier.city && (
                                    <div className="flex items-center gap-1.5">
                                        <MapPin size={14} />
                                        {supplier.city}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button className="flex items-center gap-2 px-6 py-2.5 bg-black text-white rounded-xl text-sm font-semibold hover:bg-zinc-800 transition-all shadow-lg shadow-black/10 active:scale-95">
                            <Edit2 size={16} />
                            Edit Profile
                        </button>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Supplier Details */}
                <div className="lg:col-span-1 space-y-8">
                    <Card className="p-6 space-y-6">
                        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Contact Information</h3>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 text-sm group cursor-pointer hover:bg-zinc-50 p-2 -m-2 rounded-xl transition-colors">
                                <div className="w-8 h-8 rounded-lg bg-zinc-50 flex items-center justify-center text-zinc-400 group-hover:bg-white group-hover:shadow-sm transition-all">
                                    <Mail size={14} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none mb-1">Email</p>
                                    <p className="font-semibold text-zinc-900">{supplier.email}</p>
                                </div>
                            </div>
                            {supplier.phone && (
                                <div className="flex items-center gap-3 text-sm group cursor-pointer hover:bg-zinc-50 p-2 -m-2 rounded-xl transition-colors">
                                    <div className="w-8 h-8 rounded-lg bg-zinc-50 flex items-center justify-center text-zinc-400 group-hover:bg-white group-hover:shadow-sm transition-all">
                                        <Phone size={14} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none mb-1">Phone</p>
                                        <p className="font-semibold text-zinc-900">{supplier.phone}</p>
                                    </div>
                                </div>
                            )}
                            {supplier.website && (
                                <div className="flex items-center gap-3 text-sm group cursor-pointer hover:bg-zinc-50 p-2 -m-2 rounded-xl transition-colors">
                                    <div className="w-8 h-8 rounded-lg bg-zinc-50 flex items-center justify-center text-zinc-400 group-hover:bg-white group-hover:shadow-sm transition-all">
                                        <Globe size={14} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none mb-1">Website</p>
                                        <p className="font-semibold text-zinc-900">{supplier.website}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </Card>

                    <Card className="p-6 space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Contacts</h3>
                            <button
                                onClick={() => setIsAddModalOpen(true)}
                                className="p-1 hover:bg-zinc-100 rounded-lg transition-colors text-zinc-400 hover:text-black"
                            >
                                <Plus size={16} />
                            </button>
                        </div>
                        <div className="space-y-4">
                            {contacts && contacts.length > 0 ? (
                                contacts.map((contact) => (
                                    <div key={contact._id} className="group relative bg-zinc-50/50 p-4 rounded-2xl border border-zinc-100 hover:border-zinc-200 transition-all">
                                        <button
                                            onClick={() => removeContact({ id: contact._id })}
                                            className="absolute top-2 right-2 p-1.5 text-zinc-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-400 border border-zinc-200 overflow-hidden shrink-0">
                                                {contact.imageUrl ? (
                                                    <img src={contact.imageUrl} alt={contact.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <User size={20} />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-zinc-900 truncate">{contact.name}</p>
                                                {contact.role && (
                                                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5 truncate">{contact.role}</p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="mt-3 space-y-1.5 pt-3 border-t border-zinc-100">
                                                {contact.email && (
                                                    <div className="flex items-center gap-2 text-xs text-zinc-500 font-medium">
                                                        <Mail size={12} className="text-zinc-300" />
                                                        {contact.email}
                                                    </div>
                                                )}
                                                {contact.phone && (
                                                    <div className="flex items-center gap-2 text-xs text-zinc-500 font-medium">
                                                        <Phone size={12} className="text-zinc-300" />
                                                        {contact.phone}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                ))
                            ) : (
                                <p className="text-xs text-zinc-400 text-center py-4 italic">No contacts added yet.</p>
                            )}
                        </div>
                    </Card>

                    <Card className="p-6 space-y-6">
                        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Address</h3>
                        <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-lg bg-zinc-50 flex items-center justify-center text-zinc-400 shrink-0">
                                <MapPin size={14} />
                            </div>
                            <div className="space-y-1 text-sm">
                                <p className="font-semibold text-zinc-900">{supplier.street || 'No street address'}</p>
                                <p className="text-zinc-500">{supplier.postcode} {supplier.city}</p>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Right Column: Orders Placeholder */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold tracking-tight">Supply Orders</h3>
                        <Link
                            href={`/dashboard/suppliers/${supplierId}/orders/create`}
                            className="flex items-center gap-2 text-sm font-bold text-black border border-zinc-200 px-4 py-2 rounded-xl hover:bg-zinc-50 transition-all shadow-sm active:scale-95"
                        >
                            <Plus size={16} />
                            Create Order
                        </Link>
                    </div>

                    <Card>
                        {orders === undefined ? (
                            <div className="px-6 py-12 text-center">
                                <div className="w-8 h-8 border-4 border-zinc-200 border-t-black rounded-full animate-spin mx-auto" />
                            </div>
                        ) : orders.length === 0 ? (
                            <div className="px-6 py-12 text-center">
                                <div className="flex flex-col items-center justify-center space-y-3">
                                    <div className="w-12 h-12 bg-zinc-50 rounded-full flex items-center justify-center text-zinc-300">
                                        <ShoppingBag size={24} />
                                    </div>
                                    <h4 className="text-lg font-bold text-zinc-900">No orders yet</h4>
                                    <p className="text-zinc-500 font-medium max-w-xs mx-auto">
                                        Once you start placing orders with this supplier, they will appear here.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-100 bg-zinc-50/30">
                                            <th className="px-6 py-4">Order Details</th>
                                            <th className="px-6 py-4">Status</th>
                                            <th className="px-6 py-4 text-right">Amount</th>
                                            <th className="px-6 py-4 text-right"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-100">
                                        {orders.map((order) => (
                                            <tr key={order._id} className="group hover:bg-zinc-50/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <Link 
                                                        href={`/dashboard/suppliers/${supplierId}/orders/${order._id}`}
                                                        className="flex items-center gap-3"
                                                    >
                                                        <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-400 group-hover:bg-white group-hover:shadow-sm transition-all border border-zinc-200">
                                                            <ShoppingBag size={18} />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-zinc-900">{order.orderNumber}</p>
                                                            <p className="text-xs text-zinc-400 font-medium">
                                                                {new Date(order.date).toLocaleDateString()}
                                                            </p>
                                                        </div>
                                                    </Link>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <Badge variant={order.status === 'paid' ? 'success' : order.status === 'pending' ? 'warning' : 'neutral'}>
                                                        {order.status}
                                                    </Badge>
                                                </td>
                                                <td className="px-6 py-4 text-right font-bold text-zinc-900">
                                                    {formatCurrency(order.amount, settings?.currency)}
                                                </td>
                                                 <td className="px-6 py-4 text-right">
                                                     <div className="flex items-center justify-end gap-2 text-zinc-400">
                                                         {order.status !== 'paid' && (
                                                             <Link
                                                                 href={`/dashboard/suppliers/${supplierId}/orders/${order._id}/edit`}
                                                                 className="p-2 hover:text-black hover:bg-zinc-100 rounded-lg transition-all"
                                                                 title="Edit Order"
                                                             >
                                                                 <Edit2 size={16} />
                                                             </Link>
                                                         )}
                                                         <Link href={`/dashboard/suppliers/${supplierId}/orders/${order._id}`}>
                                                             <ChevronRight size={16} className="text-zinc-300 group-hover:text-black transition-colors" />
                                                         </Link>
                                                     </div>
                                                 </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </Card>
                </div>
            </div>
            {/* Add Contact Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsAddModalOpen(false)}
                        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-zinc-200"
                    >
                        <div className="p-6 space-y-5">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <h3 className="text-lg font-bold text-zinc-900">Add Contact</h3>
                                    <p className="text-sm text-zinc-500 mt-0.5">New representative for {supplier.name}.</p>
                                </div>
                                <button
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="p-1.5 hover:bg-zinc-100 rounded-xl transition-colors text-zinc-400 hover:text-black shrink-0"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <form onSubmit={handleAddContact} className="space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="relative group/avatar shrink-0">
                                        <div className="w-14 h-14 rounded-2xl bg-zinc-50 border-2 border-dashed border-zinc-200 flex items-center justify-center text-zinc-400 overflow-hidden transition-all group-hover/avatar:border-zinc-400 group-hover/avatar:bg-zinc-100 cursor-pointer">
                                            {imagePreview ? (
                                                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                            ) : (
                                                <Camera size={18} className="text-zinc-300" />
                                            )}
                                        </div>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageChange}
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                        />
                                        {imagePreview && (
                                            <button
                                                type="button"
                                                onClick={() => { setSelectedImage(null); setImagePreview(null); }}
                                                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-lg flex items-center justify-center shadow border-2 border-white hover:scale-110 transition-all"
                                            >
                                                <X size={10} />
                                            </button>
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-zinc-700">Photo</p>
                                        <p className="text-xs text-zinc-400 mt-0.5">Optional — click to upload</p>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Full Name</label>
                                    <input
                                        required
                                        type="text"
                                        value={newContact.name}
                                        onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                                        placeholder="John Doe"
                                        className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-black/5 outline-none transition-all font-medium"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Email</label>
                                        <input
                                            type="email"
                                            value={newContact.email}
                                            onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                                            placeholder="john@example.com"
                                            className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-black/5 outline-none transition-all font-medium"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Phone</label>
                                        <input
                                            type="text"
                                            value={newContact.phone}
                                            onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                                            placeholder="+31..."
                                            className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-black/5 outline-none transition-all font-medium"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Role / Position</label>
                                    <input
                                        type="text"
                                        value={newContact.role}
                                        onChange={(e) => setNewContact({ ...newContact, role: e.target.value })}
                                        placeholder="Account Manager"
                                        className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-black/5 outline-none transition-all font-medium"
                                    />
                                </div>

                                <button
                                    disabled={isSubmitting}
                                    type="submit"
                                    className="w-full bg-black text-white rounded-2xl py-3 text-sm font-bold hover:bg-zinc-800 transition-all active:scale-[0.98] disabled:opacity-50"
                                >
                                    {isSubmitting ? "Adding..." : "Save Contact"}
                                </button>
                            </form>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
