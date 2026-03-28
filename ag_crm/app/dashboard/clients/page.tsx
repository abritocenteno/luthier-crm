"use client";

import { useState, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import Link from "next/link";
import {
    Users,
    Plus,
    Search,
    MoreVertical,
    Mail,
    User,
    Store,
    X,
    Trash2,
    Edit2,
    Eye,
    Loader2,
    ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { Id } from "../../../convex/_generated/dataModel";
import { useSortableData } from "@/lib/hooks/useSortableData";
import { SortableHeader } from "@/components/SortableHeader";

// --- Components ---

const Card = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <div className={cn("bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden", className)}>
        {children}
    </div>
);

const Badge = ({ children, variant = 'neutral' }: { children: React.ReactNode, variant?: 'neutral' | 'success' | 'info' }) => {
    const variants = {
        neutral: "bg-zinc-100 text-zinc-600",
        success: "bg-emerald-50 text-emerald-700 border border-emerald-100",
        info: "bg-blue-50 text-blue-700 border border-blue-100"
    };

    return (
        <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider", variants[variant])}>
            {children}
        </span>
    );
};

// --- Clients Page ---

export default function ClientsPage() {
    const clients = useQuery(api.clients.list);
    const addClient = useMutation(api.clients.add);
    const updateClient = useMutation(api.clients.update);
    const removeClient = useMutation(api.clients.remove);
    const generateUploadUrl = useMutation(api.clients.generateUploadUrl);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [search, setSearch] = useState("");
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [editingClient, setEditingClient] = useState<any>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        type: "regular",
        phone: "",
        website: "",
        street: "",
        postcode: "",
        city: "",
        imageUrl: "",
        imageStorageId: undefined as Id<"_storage"> | undefined,
    });

    const filteredClients = clients ? clients.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.email.toLowerCase().includes(search.toLowerCase())
    ) : null;

    const { items: sortedClients, requestSort, sortConfig } = useSortableData(filteredClients || []);

    const handleOpenDrawer = (client?: any) => {
        if (client) {
            setEditingClient(client);
            setFormData({
                name: client.name,
                email: client.email,
                type: client.type,
                phone: client.phone || "",
                website: client.website || "",
                street: client.street || "",
                postcode: client.postcode || "",
                city: client.city || "",
                imageUrl: client.imageUrl || "",
                imageStorageId: client.imageStorageId,
            });
        } else {
            setEditingClient(null);
            setFormData({
                name: "",
                email: "",
                type: "regular",
                phone: "",
                website: "",
                street: "",
                postcode: "",
                city: "",
                imageUrl: "",
                imageStorageId: undefined,
            });
        }
        setIsDrawerOpen(true);
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
                imageStorageId: storageId as Id<"_storage">,
                imageUrl: URL.createObjectURL(file)
            }));
        } catch (error) {
            console.error("Upload failed:", error);
        } finally {
            setIsUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (editingClient) {
                await updateClient({
                    id: editingClient._id,
                    ...formData
                });
            } else {
                await addClient(formData);
            }
            setIsDrawerOpen(false);
        } catch (error) {
            console.error("Failed to save client:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: Id<"clients">) => {
        if (!confirm("Are you sure you want to delete this client?")) return;
        try {
            await removeClient({ id });
        } catch (error) {
            console.error("Failed to delete client:", error);
        }
    };

    return (
        <>
            <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
                        <p className="text-zinc-500">Manage your workshop's client relationships and store partnerships.</p>
                    </div>
                    <button
                        onClick={() => handleOpenDrawer()}
                        className="flex items-center gap-2 px-6 py-2.5 bg-black text-white rounded-xl text-sm font-semibold hover:bg-zinc-800 transition-all shadow-lg shadow-black/10 active:scale-95"
                    >
                        <Plus size={18} />
                        Add Client
                    </button>
                </header>

                <Card>
                    <div className="p-4 border-b border-zinc-100 bg-zinc-50/50">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search clients by name or email..."
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
                                    <SortableHeader 
                                        label="Client Information" 
                                        sortKey="name" 
                                        currentSortKey={sortConfig.key as string} 
                                        currentDirection={sortConfig.direction} 
                                        onSort={requestSort} 
                                    />
                                    <SortableHeader 
                                        label="Type" 
                                        sortKey="type" 
                                        currentSortKey={sortConfig.key as string} 
                                        currentDirection={sortConfig.direction} 
                                        onSort={requestSort} 
                                    />
                                    <SortableHeader 
                                        label="Contact" 
                                        sortKey="email" 
                                        currentSortKey={sortConfig.key as string} 
                                        currentDirection={sortConfig.direction} 
                                        onSort={requestSort} 
                                    />
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100">
                                {clients === undefined ? (
                                    [1, 2, 3].map(i => (
                                        <tr key={i} className="animate-pulse">
                                            <td colSpan={4} className="px-6 py-6 border-b border-zinc-50">
                                                <div className="h-10 bg-zinc-100 rounded-xl w-full" />
                                            </td>
                                        </tr>
                                    ))
                                ) : sortedClients.map((client) => (
                                        <tr key={client._id} className="group hover:bg-zinc-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <Link href={`/dashboard/clients/${client._id}`} className="flex items-center gap-3 group/link">
                                                    <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-400 group-hover/link:bg-black group-hover/link:text-white transition-all overflow-hidden border border-zinc-200 group-hover/link:border-black">
                                                        {client.imageUrl ? (
                                                            <img src={client.imageUrl} alt={client.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <User size={18} />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-zinc-900 group-hover/link:underline underline-offset-4">{client.name}</p>
                                                        <p className="text-xs text-zinc-400 font-medium">{client.city || 'No city set'}</p>
                                                    </div>
                                                </Link>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-1.5">
                                                    {client.type === 'store' ? <Store size={14} className="text-blue-500" /> : <User size={14} className="text-zinc-400" />}
                                                    <Badge variant={client.type === 'store' ? 'info' : 'neutral'}>
                                                        {client.type}
                                                    </Badge>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-1.5 text-sm text-zinc-600 font-medium">
                                                        <Mail size={14} className="text-zinc-400" />
                                                        {client.email}
                                                    </div>
                                                    {client.phone && (
                                                        <p className="text-xs text-zinc-400">{client.phone}</p>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleOpenDrawer(client)}
                                                        className="p-2 text-zinc-400 hover:text-black hover:bg-zinc-100 rounded-lg transition-all"
                                                        title="Edit Client"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(client._id)}
                                                        className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                        title="Delete Client"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                    <Link
                                                        href={`/dashboard/clients/${client._id}`}
                                                        className="p-2 text-zinc-400 hover:text-black hover:bg-zinc-100 rounded-lg transition-all"
                                                    >
                                                        <ChevronRight size={16} />
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                }
                                {filteredClients?.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center">
                                            <div className="flex flex-col items-center justify-center space-y-3">
                                                <div className="w-12 h-12 bg-zinc-50 rounded-full flex items-center justify-center text-zinc-300">
                                                    <Users size={24} />
                                                </div>
                                                <p className="text-zinc-500 font-medium">No clients found matching your search.</p>
                                                <button onClick={() => handleOpenDrawer()} className="text-sm font-bold text-black underline underline-offset-4">
                                                    Add your first client
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>

            {/* Side Drawer */}
            <AnimatePresence>
                {isDrawerOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsDrawerOpen(false)}
                            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[60]"
                        />
                        <motion.div
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed inset-y-0 right-0 w-full max-w-xl bg-white shadow-2xl z-[70] flex flex-col"
                        >
                            <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
                                <div>
                                    <h3 className="text-xl font-bold tracking-tight">
                                        {editingClient ? "Edit Client" : "Add New Client"}
                                    </h3>
                                    <p className="text-sm text-zinc-500 font-medium">
                                        {editingClient ? "Update client details and preferences." : "Enter your new client's information."}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setIsDrawerOpen(false)}
                                    className="p-2 hover:bg-zinc-100 rounded-xl transition-all"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-8">
                                {/* Avatar Section */}
                                <div className="space-y-4">
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Client Profile Image</label>
                                    <div className="flex items-center gap-6">
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={isUploading}
                                            className="w-24 h-24 rounded-3xl bg-zinc-100 border-2 border-dashed border-zinc-200 flex flex-col items-center justify-center text-zinc-400 hover:border-black hover:text-black transition-all group overflow-hidden relative disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isUploading ? (
                                                <Loader2 size={24} className="animate-spin" />
                                            ) : formData.imageUrl ? (
                                                <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                                            ) : (
                                                <>
                                                    <Plus size={24} />
                                                    <span className="text-[10px] font-bold mt-1">UPLOAD</span>
                                                </>
                                            )}
                                        </button>
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleImageUpload}
                                            accept="image/*"
                                            className="hidden"
                                        />
                                        <div className="flex-1 space-y-1">
                                            <p className="text-sm font-bold text-zinc-900">
                                                {formData.imageStorageId ? "Image Selected" : "No file chosen"}
                                            </p>
                                            <p className="text-[10px] text-zinc-500 font-medium leading-relaxed">
                                                Click the avatar box to choose an image from your gallery.
                                                Professional headshots or store logos work best.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Internal Section Title */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Full Name / Store Name</label>
                                        <input
                                            required
                                            className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5 transition-all"
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="e.g. Gibson Store London"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Client Type</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setFormData({ ...formData, type: "regular" })}
                                                className={cn(
                                                    "flex items-center justify-center gap-2 py-2.5 border rounded-xl transition-all",
                                                    formData.type === "regular"
                                                        ? "border-black bg-black text-white shadow-lg"
                                                        : "border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300"
                                                )}
                                            >
                                                <User size={16} />
                                                <span className="text-xs font-bold">Regular</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setFormData({ ...formData, type: "store" })}
                                                className={cn(
                                                    "flex items-center justify-center gap-2 py-2.5 border rounded-xl transition-all",
                                                    formData.type === "store"
                                                        ? "border-black bg-black text-white shadow-lg"
                                                        : "border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300"
                                                )}
                                            >
                                                <Store size={16} />
                                                <span className="text-xs font-bold">Store</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-zinc-100">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Email Address</label>
                                        <input
                                            type="email"
                                            required
                                            className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5 transition-all"
                                            value={formData.email}
                                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                                            placeholder="client@example.com"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Phone Number</label>
                                        <input
                                            className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5 transition-all"
                                            value={formData.phone}
                                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                            placeholder="+44 7000 000000"
                                        />
                                    </div>
                                    <div className="md:col-span-2 space-y-1.5">
                                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Website</label>
                                        <input
                                            className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5 transition-all"
                                            value={formData.website}
                                            onChange={e => setFormData({ ...formData, website: e.target.value })}
                                            placeholder="https://example.com"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4 pt-4 border-t border-zinc-100">
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Address Details</label>
                                    <div className="space-y-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-medium text-zinc-400">Street Name</label>
                                            <input
                                                className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5 transition-all"
                                                value={formData.street}
                                                onChange={e => setFormData({ ...formData, street: e.target.value })}
                                                placeholder="123 Workshop Blvd"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-medium text-zinc-400">Post Code</label>
                                                <input
                                                    className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5 transition-all"
                                                    value={formData.postcode}
                                                    onChange={e => setFormData({ ...formData, postcode: e.target.value })}
                                                    placeholder="E1 6AN"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-medium text-zinc-400">City</label>
                                                <input
                                                    className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5 transition-all"
                                                    value={formData.city}
                                                    onChange={e => setFormData({ ...formData, city: e.target.value })}
                                                    placeholder="London"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </form>

                            <div className="p-6 border-t border-zinc-100 bg-zinc-50/50 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsDrawerOpen(false)}
                                    className="flex-1 px-6 py-3 bg-white border border-zinc-200 rounded-xl text-sm font-bold text-zinc-600 hover:bg-zinc-100 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={isSubmitting}
                                    className="flex-1 px-6 py-3 bg-black text-white rounded-xl text-sm font-bold hover:bg-zinc-800 transition-all shadow-lg shadow-black/10 flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                                    {editingClient ? "Save Changes" : "Add Client"}
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
