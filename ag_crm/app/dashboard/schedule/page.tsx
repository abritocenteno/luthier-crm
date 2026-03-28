"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
    Calendar,
    Plus,
    Search,
    Clock,
    Truck,
    User,
    X,
    Trash2,
    Edit2,
    Loader2,
    ChevronRight,
    CalendarDays,
    Info
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { format, isSameDay, startOfToday } from "date-fns";
import { Id } from "../../../convex/_generated/dataModel";

// --- Components ---

const Card = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <div className={cn("bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden", className)}>
        {children}
    </div>
);

const Badge = ({ children, variant = 'neutral' }: { children: React.ReactNode, variant?: 'neutral' | 'success' | 'info' | 'warning' }) => {
    const variants = {
        neutral: "bg-zinc-100 text-zinc-600",
        success: "bg-emerald-50 text-emerald-700 border border-emerald-100",
        info: "bg-blue-50 text-blue-700 border border-blue-100",
        warning: "bg-amber-50 text-amber-700 border border-amber-100"
    };

    return (
        <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider", variants[variant])}>
            {children}
        </span>
    );
};

// --- Schedule Page ---

export default function SchedulePage() {
    const events = useQuery(api.events.list);
    const clients = useQuery(api.clients.list);
    const suppliers = useQuery(api.suppliers.list);

    const addEvent = useMutation(api.events.add);
    const updateEvent = useMutation(api.events.update);
    const removeEvent = useMutation(api.events.remove);

    const [search, setSearch] = useState("");
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<any>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        start: Date.now(),
        type: "appointment" as "appointment" | "supplier_order",
        clientId: undefined as Id<"clients"> | undefined,
        supplierId: undefined as Id<"suppliers"> | undefined,
    });

    const filteredEvents = events?.filter(e =>
        e.title.toLowerCase().includes(search.toLowerCase()) ||
        e.description?.toLowerCase().includes(search.toLowerCase())
    );

    const handleOpenDrawer = (event?: any) => {
        if (event) {
            setEditingEvent(event);
            setFormData({
                title: event.title,
                description: event.description || "",
                start: event.start,
                type: event.type,
                clientId: event.clientId,
                supplierId: event.supplierId,
            });
        } else {
            setEditingEvent(null);
            setFormData({
                title: "",
                description: "",
                start: Date.now(),
                type: "appointment",
                clientId: undefined,
                supplierId: undefined,
            });
        }
        setIsDrawerOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (editingEvent) {
                await updateEvent({
                    id: editingEvent._id,
                    ...formData
                });
            } else {
                await addEvent(formData);
            }
            setIsDrawerOpen(false);
        } catch (error) {
            console.error("Failed to save event:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: Id<"events">) => {
        if (!confirm("Are you sure you want to delete this event?")) return;
        try {
            await removeEvent({ id });
        } catch (error) {
            console.error("Failed to delete event:", error);
        }
    };

    return (
        <>
            <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-bold tracking-tight">Schedule</h1>
                        <p className="text-zinc-500">Track your workshop appointments and supplier orders.</p>
                    </div>
                    <button
                        onClick={() => handleOpenDrawer()}
                        className="flex items-center gap-2 px-6 py-2.5 bg-black text-white rounded-xl text-sm font-semibold hover:bg-zinc-800 transition-all shadow-lg shadow-black/10 active:scale-95"
                    >
                        <Plus size={18} />
                        Add Event
                    </button>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Timeline/List */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card>
                            <div className="p-4 border-b border-zinc-100 bg-zinc-50/50">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                                    <input
                                        type="text"
                                        placeholder="Search events..."
                                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5 transition-all"
                                        value={search}
                                        onChange={e => setSearch(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="divide-y divide-zinc-100">
                                {filteredEvents ? (
                                    filteredEvents.length > 0 ? (
                                        filteredEvents.map((event) => (
                                            <div
                                                key={event._id}
                                                onClick={() => handleOpenDrawer(event)}
                                                className="group p-6 hover:bg-zinc-50/50 transition-colors cursor-pointer flex items-start gap-6"
                                            >
                                                <div className="flex flex-col items-center justify-center w-14 h-14 rounded-2xl bg-zinc-50 border border-zinc-100 group-hover:bg-black group-hover:text-white transition-all shrink-0">
                                                    <span className="text-[10px] font-bold uppercase tracking-widest leading-none mb-1 opacity-60">
                                                        {format(event.start, "MMM")}
                                                    </span>
                                                    <span className="text-xl font-bold leading-none">
                                                        {format(event.start, "dd")}
                                                    </span>
                                                </div>

                                                <div className="flex-1 space-y-2">
                                                    <div className="flex items-start justify-between">
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <h3 className="font-bold text-zinc-900 group-hover:underline underline-offset-4 decoration-zinc-300">
                                                                    {event.title}
                                                                </h3>
                                                                <Badge variant={event.type === 'appointment' ? 'info' : 'warning'}>
                                                                    {event.type.replace('_', ' ')}
                                                                </Badge>
                                                            </div>
                                                            <p className="text-xs text-zinc-500 flex items-center gap-1.5 mt-1">
                                                                <Clock size={12} />
                                                                {format(event.start, "HH:mm")}
                                                                {event.type === 'appointment' && event.clientId && (
                                                                    <>
                                                                        <span className="mx-1 opacity-30">•</span>
                                                                        <User size={12} />
                                                                        {clients?.find(c => c._id === event.clientId)?.name}
                                                                    </>
                                                                )}
                                                                {event.type === 'supplier_order' && event.supplierId && (
                                                                    <>
                                                                        <span className="mx-1 opacity-30">•</span>
                                                                        <Truck size={12} />
                                                                        {suppliers?.find(s => s._id === event.supplierId)?.name}
                                                                    </>
                                                                )}
                                                            </p>
                                                        </div>
                                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); handleDelete(event._id); }}
                                                                className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                            <ChevronRight size={16} className="text-zinc-300 ml-1" />
                                                        </div>
                                                    </div>
                                                    {event.description && (
                                                        <p className="text-sm text-zinc-600 line-clamp-1 leading-relaxed">
                                                            {event.description}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-12 text-center space-y-3">
                                            <div className="w-12 h-12 bg-zinc-50 rounded-full flex items-center justify-center text-zinc-300 mx-auto">
                                                <Calendar size={24} />
                                            </div>
                                            <p className="text-zinc-500 font-medium">No events found.</p>
                                            <button onClick={() => handleOpenDrawer()} className="text-sm font-bold text-black underline underline-offset-4">
                                                Add your first event
                                            </button>
                                        </div>
                                    )
                                ) : (
                                    [1, 2, 3].map(i => (
                                        <div key={i} className="p-6 animate-pulse">
                                            <div className="h-14 bg-zinc-50 rounded-2xl w-full" />
                                        </div>
                                    ))
                                )}
                            </div>
                        </Card>
                    </div>

                    {/* Sidebar / Mini Calendar View Placeholder */}
                    <div className="space-y-6">
                        <Card className="p-6 bg-black text-white border-black">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                                        <CalendarDays size={20} className="text-white" />
                                    </div>
                                    <Badge variant="success">Upcoming</Badge>
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold">Quick Overview</h3>
                                    <p className="text-zinc-400 text-sm mt-1">
                                        You have {filteredEvents?.filter(e => e.start > Date.now()).length || 0} upcoming events this week.
                                    </p>
                                </div>
                                <div className="pt-2">
                                    <button
                                        onClick={() => handleOpenDrawer()}
                                        className="w-full py-3 bg-white text-black rounded-xl text-sm font-bold hover:bg-zinc-100 transition-all flex items-center justify-center gap-2"
                                    >
                                        <Plus size={16} />
                                        New Appointment
                                    </button>
                                </div>
                            </div>
                        </Card>

                        <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 flex gap-3">
                            <Info size={18} className="text-blue-500 shrink-0 mt-0.5" />
                            <div className="space-y-1">
                                <p className="text-xs font-bold text-blue-900 uppercase tracking-wider">Pro Tip</p>
                                <p className="text-xs text-blue-700 leading-relaxed font-medium">
                                    Categorize events correctly to stay organized. Supplier orders are marked with a truck icon.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
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
                                        {editingEvent ? "Edit Event" : "Add New Event"}
                                    </h3>
                                    <p className="text-sm text-zinc-500 font-medium">
                                        {editingEvent ? "Update event details." : "Enter the details for your workshop event."}
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
                                <div className="space-y-6">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Event Title</label>
                                        <input
                                            required
                                            className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5 transition-all outline-none"
                                            value={formData.title}
                                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                                            placeholder="e.g. Guitar Setup for John Doe"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Event Type</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setFormData({ ...formData, type: "appointment" })}
                                                className={cn(
                                                    "flex items-center justify-center gap-2 py-2.5 border rounded-xl transition-all",
                                                    formData.type === "appointment"
                                                        ? "border-black bg-black text-white shadow-lg"
                                                        : "border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300"
                                                )}
                                            >
                                                <Calendar size={16} />
                                                <span className="text-xs font-bold">Appointment</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setFormData({ ...formData, type: "supplier_order" })}
                                                className={cn(
                                                    "flex items-center justify-center gap-2 py-2.5 border rounded-xl transition-all",
                                                    formData.type === "supplier_order"
                                                        ? "border-black bg-black text-white shadow-lg"
                                                        : "border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300"
                                                )}
                                            >
                                                <Truck size={16} />
                                                <span className="text-xs font-bold">Supplier Order</span>
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Date & Time</label>
                                        <input
                                            type="datetime-local"
                                            required
                                            className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5 transition-all outline-none"
                                            value={format(formData.start, "yyyy-MM-dd'T'HH:mm")}
                                            onChange={e => setFormData({ ...formData, start: new Date(e.target.value).getTime() })}
                                        />
                                    </div>

                                    {formData.type === 'appointment' ? (
                                        <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-300">
                                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Link to Client (Optional)</label>
                                            <select
                                                className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5 transition-all outline-none"
                                                value={formData.clientId || ""}
                                                onChange={e => setFormData({ ...formData, clientId: e.target.value as Id<"clients"> || undefined })}
                                            >
                                                <option value="">Select a client...</option>
                                                {clients?.map(client => (
                                                    <option key={client._id} value={client._id}>{client.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    ) : (
                                        <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-300">
                                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Link to Supplier (Optional)</label>
                                            <select
                                                className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5 transition-all outline-none"
                                                value={formData.supplierId || ""}
                                                onChange={e => setFormData({ ...formData, supplierId: e.target.value as Id<"suppliers"> || undefined })}
                                            >
                                                <option value="">Select a supplier...</option>
                                                {suppliers?.map(supplier => (
                                                    <option key={supplier._id} value={supplier._id}>{supplier.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}

                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Description</label>
                                        <textarea
                                            rows={4}
                                            className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5 transition-all outline-none resize-none"
                                            value={formData.description}
                                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                                            placeholder="Add any notes about this event..."
                                        />
                                    </div>
                                </div>
                            </form>

                            <div className="p-6 border-t border-zinc-100 bg-zinc-50/50 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsDrawerOpen(false)}
                                    className="flex-1 px-6 py-3 bg-white border border-zinc-200 rounded-xl text-sm font-bold text-zinc-600 hover:bg-zinc-100 transition-all font-sans"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={isSubmitting}
                                    className="flex-1 px-6 py-3 bg-black text-white rounded-xl text-sm font-bold hover:bg-zinc-800 transition-all shadow-lg shadow-black/10 flex items-center justify-center gap-2 disabled:opacity-50 font-sans"
                                >
                                    {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                                    {editingEvent ? "Save Changes" : "Add Event"}
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
