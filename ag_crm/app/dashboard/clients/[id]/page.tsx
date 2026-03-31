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
    FileText,
    Calendar,
    DollarSign,
    Clock,
    User,
    Camera,
    Store,
    Edit2,
    ChevronRight,
    Plus,
    Trash2,
    X,
    Wrench,
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

export default function ClientDetailPage() {
    const params = useParams();
    const router = useRouter();
    const clientId = params.id as Id<"clients">;

    const client = useQuery(api.clients.get, { id: clientId });
    const invoices = useQuery(api.invoices.listByClient, { clientId });
    const jobs = useQuery(api.jobs.listByClient, { clientId });
    const settings = useQuery(api.settings.get);
    const contacts = useQuery(api.contacts.listByClient, { clientId });
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
                clientId,
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

    if (client === undefined) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-zinc-200 border-t-black rounded-full animate-spin" />
            </div>
        );
    }

    if (client === null) {
        return (
            <div className="text-center py-20">
                <h2 className="text-2xl font-bold text-zinc-900">Client not found</h2>
                <p className="text-zinc-500 mt-2">The client you are looking for does not exist or you don't have access.</p>
                <button
                    onClick={() => router.push("/dashboard/clients")}
                    className="mt-6 text-sm font-bold text-black underline underline-offset-4"
                >
                    Back to Clients
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
                    Back to Clients
                </button>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                        <div className="w-20 h-20 rounded-3xl bg-zinc-100 flex items-center justify-center text-zinc-400 border border-zinc-200 overflow-hidden shadow-sm">
                            {client.imageUrl ? (
                                <img src={client.imageUrl} alt={client.name} className="w-full h-full object-cover" />
                            ) : (
                                <User size={32} />
                            )}
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center gap-3">
                                <h1 className="text-3xl font-bold tracking-tight">{client.name}</h1>
                                <Badge variant={client.type === 'store' ? 'info' : 'neutral'}>
                                    {client.type}
                                </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-zinc-500 font-medium">
                                <div className="flex items-center gap-1.5 focus:text-black">
                                    <Mail size={14} />
                                    {client.email}
                                </div>
                                {client.city && (
                                    <div className="flex items-center gap-1.5">
                                        <MapPin size={14} />
                                        {client.city}
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
                {/* Left Column: Client Details */}
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
                                    <p className="font-semibold text-zinc-900">{client.email}</p>
                                </div>
                            </div>
                            {client.phone && (
                                <div className="flex items-center gap-3 text-sm group cursor-pointer hover:bg-zinc-50 p-2 -m-2 rounded-xl transition-colors">
                                    <div className="w-8 h-8 rounded-lg bg-zinc-50 flex items-center justify-center text-zinc-400 group-hover:bg-white group-hover:shadow-sm transition-all">
                                        <Phone size={14} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none mb-1">Phone</p>
                                        <p className="font-semibold text-zinc-900">{client.phone}</p>
                                    </div>
                                </div>
                            )}
                            {client.website && (
                                <div className="flex items-center gap-3 text-sm group cursor-pointer hover:bg-zinc-50 p-2 -m-2 rounded-xl transition-colors">
                                    <div className="w-8 h-8 rounded-lg bg-zinc-50 flex items-center justify-center text-zinc-400 group-hover:bg-white group-hover:shadow-sm transition-all">
                                        <Globe size={14} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none mb-1">Website</p>
                                        <p className="font-semibold text-zinc-900">{client.website}</p>
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
                                <p className="font-semibold text-zinc-900">{client.street || 'No street address'}</p>
                                <p className="text-zinc-500">{client.postcode} {client.city}</p>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Right Column: Invoices */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold tracking-tight">Recent Invoices</h3>
                        <Link
                            href={`/dashboard/invoices/create?clientId=${clientId}`}
                            className="flex items-center gap-2 text-sm font-bold text-black border border-zinc-200 px-4 py-2 rounded-xl hover:bg-zinc-50 transition-all"
                        >
                            Create Invoice
                        </Link>
                    </div>

                    <Card>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-100 bg-zinc-50/30">
                                        <th className="px-6 py-4">Invoice #</th>
                                        <th className="px-6 py-4">Date</th>
                                        <th className="px-6 py-4 text-right">Amount</th>
                                        <th className="px-6 py-4 text-center">Status</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-100">
                                    {invoices && invoices.length > 0 ? (
                                        invoices.map((invoice) => (
                                            <tr key={invoice._id} className="group hover:bg-zinc-50/50 transition-colors">
                                                <td className="px-6 py-4 font-bold text-sm text-zinc-900">
                                                    {invoice.invoiceNumber}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-zinc-500 font-medium whitespace-nowrap">
                                                    {new Date(invoice.date).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 text-right font-bold text-sm">
                                                    {formatCurrency(invoice.amount, settings?.currency)}
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
                                                    <Link
                                                        href={`/dashboard/invoices/${invoice._id}`}
                                                        className="inline-block p-2 text-zinc-400 hover:text-black hover:bg-zinc-100 rounded-lg transition-all"
                                                        title="View Detail"
                                                    >
                                                        <ChevronRight size={16} />
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-12 text-center">
                                                <div className="flex flex-col items-center justify-center space-y-3">
                                                    <div className="w-12 h-12 bg-zinc-50 rounded-full flex items-center justify-center text-zinc-300">
                                                        <FileText size={24} />
                                                    </div>
                                                    <p className="text-zinc-500 font-medium">No invoices found for this client.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>

                    {/* Repair History */}
                    <div className="flex items-center justify-between pt-4">
                        <h3 className="text-xl font-bold tracking-tight">Repair History</h3>
                        <Link
                            href={`/dashboard/jobs/create?clientId=${clientId}`}
                            className="flex items-center gap-2 text-sm font-bold text-black border border-zinc-200 px-4 py-2 rounded-xl hover:bg-zinc-50 transition-all"
                        >
                            <Plus size={14} />
                            New Job
                        </Link>
                    </div>

                    <Card>
                        {jobs && jobs.length > 0 ? (
                            <div className="divide-y divide-zinc-100">
                                {jobs.map((job) => {
                                    const statusColors: Record<string, string> = {
                                        intake:        "bg-blue-50 text-blue-700 border-blue-100",
                                        in_progress:   "bg-amber-50 text-amber-700 border-amber-100",
                                        waiting_parts: "bg-orange-50 text-orange-700 border-orange-100",
                                        ready:         "bg-emerald-50 text-emerald-700 border-emerald-100",
                                        closed:        "bg-zinc-100 text-zinc-500 border-zinc-200",
                                    };
                                    const statusLabels: Record<string, string> = {
                                        intake: "Intake", in_progress: "In Progress",
                                        waiting_parts: "Waiting", ready: "Ready", closed: "Closed",
                                    };
                                    return (
                                        <div key={job._id} className="flex items-center justify-between px-6 py-4 group hover:bg-zinc-50/50 transition-colors">
                                            <div className="space-y-0.5 min-w-0 flex-1">
                                                <div className="flex items-center gap-2">
                                                    <Wrench size={12} className="text-zinc-300 shrink-0" />
                                                    <p className="text-sm font-bold text-zinc-900 truncate">{job.title}</p>
                                                </div>
                                                <p className="text-xs text-zinc-400 ml-5">
                                                    {[job.instrumentBrand, job.instrumentModel, job.instrumentType].filter(Boolean).join(" ")}
                                                    {" · "}
                                                    {new Date(job.intakeDate).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-3 shrink-0 ml-4">
                                                <span className={cn("text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border", statusColors[job.status] ?? statusColors.closed)}>
                                                    {statusLabels[job.status] ?? job.status}
                                                </span>
                                                <Link href={`/dashboard/jobs/${job._id}`}
                                                    className="p-1.5 text-zinc-300 hover:text-black hover:bg-zinc-100 rounded-lg transition-all">
                                                    <ChevronRight size={16} />
                                                </Link>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="px-6 py-12 text-center">
                                <div className="flex flex-col items-center justify-center space-y-3">
                                    <div className="w-12 h-12 bg-zinc-50 rounded-full flex items-center justify-center text-zinc-300">
                                        <Wrench size={24} />
                                    </div>
                                    <p className="text-zinc-500 font-medium">No repair jobs for this client yet.</p>
                                </div>
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
                        <div className="p-8 space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <h3 className="text-xl font-bold text-zinc-900">Add Contact</h3>
                                    <p className="text-sm text-zinc-500">Add a new representative for {client.name}.</p>
                                </div>
                                <button
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="p-2 hover:bg-zinc-50 rounded-xl transition-colors text-zinc-400 hover:text-black"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleAddContact} className="space-y-5">
                                <div className="flex flex-col items-center gap-4 pb-2">
                                    <div className="relative group/avatar">
                                        <div className="w-24 h-24 rounded-3xl bg-zinc-50 border-2 border-dashed border-zinc-200 flex items-center justify-center text-zinc-400 overflow-hidden transition-all group-hover/avatar:border-black/20 group-hover/avatar:bg-zinc-100">
                                            {imagePreview ? (
                                                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="flex flex-col items-center gap-2">
                                                    <Camera size={24} />
                                                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 group-hover/avatar:text-zinc-600 transition-colors">Add Photo</span>
                                                </div>
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
                                                onClick={() => {
                                                    setSelectedImage(null);
                                                    setImagePreview(null);
                                                }}
                                                className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 text-white rounded-xl flex items-center justify-center shadow-lg border-2 border-white hover:scale-110 transition-all"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        )}
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
                                        placeholder="Purchasing Manager"
                                        className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-black/5 outline-none transition-all font-medium"
                                    />
                                </div>

                                <button
                                    disabled={isSubmitting}
                                    type="submit"
                                    className="w-full bg-black text-white rounded-2xl py-4 text-sm font-bold shadow-xl shadow-black/10 hover:bg-zinc-800 transition-all active:scale-[0.98] disabled:opacity-50 mt-4"
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
