"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import {
    ArrowLeft, Wrench, User, Calendar, Plus, Trash2,
    ChevronDown, Guitar, Clock, StickyNote, CheckCircle2, Loader2, BookOpen, LayoutTemplate,
} from "lucide-react";
import { cn, formatCurrency, getCurrencySymbol } from "@/lib/utils";
import { Suspense } from "react";

const Card = ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={cn("bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden", className)}>
        {children}
    </div>
);

const INSTRUMENT_TYPES = ["Guitar", "Bass", "Ukulele", "Mandolin", "Banjo", "Violin", "Viola", "Cello", "Other"];
const CHECKLIST_PARTS = [
    { key: "tuners",      label: "Tuners / Tuning Machines" },
    { key: "frets",       label: "Frets" },
    { key: "nut",         label: "Nut" },
    { key: "bridge",      label: "Bridge / Saddle" },
    { key: "neck",        label: "Neck / Truss Rod" },
    { key: "body",        label: "Body / Finish" },
    { key: "electronics", label: "Electronics / Pickups" },
] as const;

type ChecklistKey = typeof CHECKLIST_PARTS[number]["key"];
type Condition = "good" | "fair" | "poor" | "";

type WorkItem = {
    name: string;
    description: string;
    type: "fixed" | "hourly";
    unitPrice: number;
    hours: number;
};

function CreateJobForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialClientId = searchParams.get("clientId") as Id<"clients"> | null;

    const clients = useQuery(api.clients.list);
    const settings = useQuery(api.settings.get);
    const services = useQuery(api.services.list);
    const templates = useQuery(api.jobTemplates.list);
    const addJob = useMutation(api.jobs.add);

    const [isSubmitting, setIsSubmitting] = useState(false);

    // Basic info
    const [clientId, setClientId] = useState<Id<"clients"> | "">(initialClientId ?? "");
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [startAsQuote, setStartAsQuote] = useState(false);
    const status = startAsQuote ? "quoted" : "intake";

    // Instrument
    const [instrumentType, setInstrumentType] = useState("Guitar");
    const [instrumentBrand, setInstrumentBrand] = useState("");
    const [instrumentModel, setInstrumentModel] = useState("");
    const [instrumentSerial, setInstrumentSerial] = useState("");
    const [instrumentColor, setInstrumentColor] = useState("");

    // Dates
    const [intakeDate, setIntakeDate] = useState(new Date().toISOString().split("T")[0]);
    const [estimatedCompletionDate, setEstimatedCompletionDate] = useState("");

    // Intake checklist
    const [checklist, setChecklist] = useState<Record<ChecklistKey, Condition>>({
        tuners: "", frets: "", nut: "", bridge: "", neck: "", body: "", electronics: "",
    });
    const [checklistNotes, setChecklistNotes] = useState("");

    // Work items
    const [workItems, setWorkItems] = useState<WorkItem[]>([]);
    const [showLibrary, setShowLibrary] = useState(false);
    const [librarySearch, setLibrarySearch] = useState("");
    const [showTemplates, setShowTemplates] = useState(false);

    // Internal notes
    const [internalNotes, setInternalNotes] = useState("");

    const workTotal = workItems.reduce((acc, wi) =>
        acc + (wi.type === "hourly" ? wi.unitPrice * wi.hours : wi.unitPrice), 0);

    const addWorkItem = () =>
        setWorkItems((prev) => [...prev, { name: "", description: "", type: "fixed", unitPrice: 0, hours: 1 }]);

    const addFromLibrary = (svc: { name: string; description?: string; type: string; defaultPrice: number }) => {
        setWorkItems((prev) => [...prev, {
            name: svc.name,
            description: svc.description ?? "",
            type: svc.type as "fixed" | "hourly",
            unitPrice: svc.defaultPrice,
            hours: 1,
        }]);
        setShowLibrary(false);
    };

    const applyTemplate = (tpl: {
        name: string;
        description?: string;
        instrumentType?: string;
        workItems?: Array<{ name: string; description?: string; type: string; unitPrice: number; hours?: number }>;
        internalNotes?: string;
    }) => {
        if (tpl.name && !title) setTitle(tpl.name);
        if (tpl.description && !description) setDescription(tpl.description);
        if (tpl.instrumentType) setInstrumentType(tpl.instrumentType);
        if (tpl.internalNotes && !internalNotes) setInternalNotes(tpl.internalNotes);
        if (tpl.workItems && tpl.workItems.length > 0) {
            setWorkItems(tpl.workItems.map((wi) => ({
                name: wi.name,
                description: wi.description ?? "",
                type: wi.type as "fixed" | "hourly",
                unitPrice: wi.unitPrice,
                hours: wi.hours ?? 1,
            })));
        }
        setShowTemplates(false);
    };

    const removeWorkItem = (i: number) =>
        setWorkItems((prev) => prev.filter((_, idx) => idx !== i));

    const updateWorkItem = <K extends keyof WorkItem>(i: number, key: K, value: WorkItem[K]) =>
        setWorkItems((prev) => prev.map((wi, idx) => idx === i ? { ...wi, [key]: value } : wi));

    const setCondition = (part: ChecklistKey, val: Condition) =>
        setChecklist((prev) => ({ ...prev, [part]: val }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!clientId) { alert("Please select a client"); return; }

        setIsSubmitting(true);
        try {
            const id = await addJob({
                clientId: clientId as Id<"clients">,
                title,
                description: description || undefined,
                status,
                instrumentType,
                instrumentBrand: instrumentBrand || undefined,
                instrumentModel: instrumentModel || undefined,
                instrumentSerial: instrumentSerial || undefined,
                instrumentColor: instrumentColor || undefined,
                intakeChecklist: {
                    ...checklist,
                    notes: checklistNotes || undefined,
                },
                workItems: workItems.map((wi) => ({
                    name: wi.name,
                    description: wi.description || undefined,
                    type: wi.type,
                    unitPrice: wi.unitPrice,
                    hours: wi.type === "hourly" ? wi.hours : undefined,
                })),
                intakeDate: new Date(intakeDate).getTime(),
                estimatedCompletionDate: estimatedCompletionDate
                    ? new Date(estimatedCompletionDate).getTime()
                    : undefined,
                internalNotes: internalNotes || undefined,
            });
            router.push(`/dashboard/jobs/${id}`);
        } catch (err) {
            console.error(err);
            alert("Failed to create job. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
            <header className="space-y-4">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-sm font-bold text-zinc-400 hover:text-black transition-colors group"
                >
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    Back to Jobs
                </button>
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-black flex items-center justify-center text-white shadow-lg shadow-black/10">
                        <Plus size={24} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">New Job</h1>
                        <p className="text-zinc-500">Create a new repair or work order.</p>
                    </div>
                </div>
            </header>

            <form onSubmit={handleSubmit} className="space-y-10">
                {/* ── Basic Info ── */}
                <div className="w-full lg:w-2/3">
                    <Card className="p-8 space-y-6">
                        <h2 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Job Details</h2>

                        {/* Client */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Client</label>
                            <div className="relative flex items-center">
                                <User className="absolute left-4 text-zinc-400" size={18} />
                                <select
                                    required
                                    value={clientId}
                                    onChange={(e) => setClientId(e.target.value as Id<"clients">)}
                                    className="w-full pl-12 pr-10 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5 appearance-none cursor-pointer"
                                >
                                    <option value="" disabled>Select a client…</option>
                                    {clients?.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                                </select>
                                <ChevronDown className="absolute right-4 text-zinc-400 pointer-events-none" size={18} />
                            </div>
                        </div>

                        {/* Title */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Job Title</label>
                            <input
                                required
                                placeholder="e.g. Full setup + fret leveling"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
                            />
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Description <span className="text-zinc-300">(optional)</span></label>
                            <textarea
                                rows={3}
                                placeholder="Describe what the client reported or what needs to be done…"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5 resize-none"
                            />
                        </div>

                        {/* Start as Quote toggle */}
                        <div className="flex items-center justify-between p-4 bg-zinc-50 rounded-xl border border-zinc-100">
                            <div>
                                <p className="text-sm font-bold text-zinc-800">Start as Quote</p>
                                <p className="text-xs text-zinc-500 mt-0.5">Send the client a price estimate before starting work.</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setStartAsQuote((v) => !v)}
                                className={cn(
                                    "relative w-11 h-6 rounded-full transition-colors",
                                    startAsQuote ? "bg-black" : "bg-zinc-200"
                                )}
                            >
                                <span className={cn(
                                    "absolute top-1 left-0 w-4 h-4 bg-white rounded-full shadow transition-transform",
                                    startAsQuote ? "translate-x-6" : "translate-x-1"
                                )} />
                            </button>
                        </div>

                        {/* Dates */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-zinc-100">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Intake Date</label>
                                <div className="relative flex items-center">
                                    <Calendar className="absolute left-4 text-zinc-400" size={18} />
                                    <input
                                        type="date"
                                        required
                                        value={intakeDate}
                                        onChange={(e) => setIntakeDate(e.target.value)}
                                        className="w-full pl-12 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Est. Completion <span className="text-zinc-300">(optional)</span></label>
                                <div className="relative flex items-center">
                                    <Clock className="absolute left-4 text-zinc-400" size={18} />
                                    <input
                                        type="date"
                                        value={estimatedCompletionDate}
                                        onChange={(e) => setEstimatedCompletionDate(e.target.value)}
                                        className="w-full pl-12 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
                                    />
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* ── Instrument Details ── */}
                <div className="space-y-4">
                    <div className="space-y-1">
                        <h2 className="text-xl font-bold tracking-tight">Instrument</h2>
                        <p className="text-sm text-zinc-500">Details about the instrument being repaired.</p>
                    </div>
                    <div className="w-full lg:w-2/3">
                        <Card className="p-8 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Type */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Type</label>
                                    <div className="relative flex items-center">
                                        <Guitar className="absolute left-4 text-zinc-400" size={18} />
                                        <select
                                            value={instrumentType}
                                            onChange={(e) => setInstrumentType(e.target.value)}
                                            className="w-full pl-12 pr-10 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5 appearance-none"
                                        >
                                            {INSTRUMENT_TYPES.map((t) => <option key={t}>{t}</option>)}
                                        </select>
                                        <ChevronDown className="absolute right-4 text-zinc-400 pointer-events-none" size={18} />
                                    </div>
                                </div>
                                {/* Brand */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Brand <span className="text-zinc-300">(optional)</span></label>
                                    <input
                                        placeholder="e.g. Fender, Gibson…"
                                        value={instrumentBrand}
                                        onChange={(e) => setInstrumentBrand(e.target.value)}
                                        className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
                                    />
                                </div>
                                {/* Model */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Model <span className="text-zinc-300">(optional)</span></label>
                                    <input
                                        placeholder="e.g. Stratocaster, Les Paul…"
                                        value={instrumentModel}
                                        onChange={(e) => setInstrumentModel(e.target.value)}
                                        className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
                                    />
                                </div>
                                {/* Serial */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Serial Number <span className="text-zinc-300">(optional)</span></label>
                                    <input
                                        placeholder="e.g. US12345678"
                                        value={instrumentSerial}
                                        onChange={(e) => setInstrumentSerial(e.target.value)}
                                        className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
                                    />
                                </div>
                                {/* Color */}
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Color / Finish <span className="text-zinc-300">(optional)</span></label>
                                    <input
                                        placeholder="e.g. Sunburst, Olympic White…"
                                        value={instrumentColor}
                                        onChange={(e) => setInstrumentColor(e.target.value)}
                                        className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
                                    />
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>

                {/* ── Intake Condition Checklist ── */}
                <div className="space-y-4">
                    <div className="space-y-1">
                        <h2 className="text-xl font-bold tracking-tight">Condition at Intake</h2>
                        <p className="text-sm text-zinc-500">Rate each part of the instrument on arrival.</p>
                    </div>
                    <Card>
                        <div className="divide-y divide-zinc-100">
                            {CHECKLIST_PARTS.map(({ key, label }) => (
                                <div key={key} className="flex items-center justify-between px-6 py-4 gap-4">
                                    <span className="text-sm font-medium text-zinc-700 w-48 shrink-0">{label}</span>
                                    <div className="flex gap-2">
                                        {(["good", "fair", "poor"] as Condition[]).map((val) => (
                                            <button
                                                key={val}
                                                type="button"
                                                onClick={() => setCondition(key, checklist[key] === val ? "" : val)}
                                                className={cn(
                                                    "px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all",
                                                    checklist[key] === val && val === "good"  && "bg-emerald-50 border-emerald-200 text-emerald-700",
                                                    checklist[key] === val && val === "fair"  && "bg-amber-50 border-amber-200 text-amber-700",
                                                    checklist[key] === val && val === "poor"  && "bg-red-50 border-red-200 text-red-700",
                                                    checklist[key] !== val && "bg-white border-zinc-200 text-zinc-400 hover:border-zinc-300"
                                                )}
                                            >
                                                {val}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                            <div className="px-6 py-4 space-y-2">
                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Condition Notes</label>
                                <textarea
                                    rows={3}
                                    placeholder="Any additional observations at intake…"
                                    value={checklistNotes}
                                    onChange={(e) => setChecklistNotes(e.target.value)}
                                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5 resize-none"
                                />
                            </div>
                        </div>
                    </Card>
                </div>

                {/* ── Work Items ── */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <h2 className="text-xl font-bold tracking-tight">Work Items</h2>
                            <p className="text-sm text-zinc-500">Services to be performed. Fixed price or hourly.</p>
                        </div>
                        <div className="flex items-center gap-2">
                            {/* Apply Template */}
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => { setShowTemplates((v) => !v); setShowLibrary(false); }}
                                    className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 text-zinc-700 rounded-xl text-xs font-bold hover:bg-zinc-50 hover:border-zinc-300 transition-all active:scale-95"
                                >
                                    <LayoutTemplate size={14} />
                                    From Template
                                </button>
                                {showTemplates && (
                                    <>
                                        <div className="fixed inset-0 z-10" onClick={() => setShowTemplates(false)} />
                                        <div className="absolute right-0 top-full mt-2 z-20 w-72 bg-white border border-zinc-200 rounded-2xl shadow-xl overflow-hidden">
                                            <div className="px-4 py-3 border-b border-zinc-100">
                                                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.15em]">Job Templates</p>
                                            </div>
                                            {!templates || templates.length === 0 ? (
                                                <div className="px-4 py-6 text-center text-zinc-400 text-sm italic">
                                                    No templates saved yet.<br />
                                                    <span className="text-xs">Add them in Settings → Job Templates.</span>
                                                </div>
                                            ) : (
                                                <div className="max-h-64 overflow-y-auto divide-y divide-zinc-50">
                                                    {templates.map((tpl) => (
                                                        <button
                                                            key={tpl._id}
                                                            type="button"
                                                            onClick={() => applyTemplate(tpl)}
                                                            className="w-full flex flex-col gap-0.5 px-4 py-3 hover:bg-zinc-50 transition-colors text-left group"
                                                        >
                                                            <span className="text-sm font-semibold text-zinc-900">{tpl.name}</span>
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                {tpl.instrumentType && (
                                                                    <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-zinc-100 text-zinc-500">
                                                                        {tpl.instrumentType}
                                                                    </span>
                                                                )}
                                                                {tpl.workItems && tpl.workItems.length > 0 && (
                                                                    <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-600">
                                                                        {tpl.workItems.length} item{tpl.workItems.length > 1 ? "s" : ""}
                                                                    </span>
                                                                )}
                                                                {tpl.description && (
                                                                    <span className="text-xs text-zinc-400 truncate">{tpl.description}</span>
                                                                )}
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                            {/* Add from Library */}
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => { setShowLibrary((v) => !v); setShowTemplates(false); }}
                                    className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 text-zinc-700 rounded-xl text-xs font-bold hover:bg-zinc-50 hover:border-zinc-300 transition-all active:scale-95"
                                >
                                    <BookOpen size={14} />
                                    From Library
                                </button>
                                {showLibrary && (
                                    <>
                                        <div className="fixed inset-0 z-10" onClick={() => setShowLibrary(false)} />
                                        <div className="absolute right-0 top-full mt-2 z-20 w-80 bg-white border border-zinc-200 rounded-2xl shadow-xl overflow-hidden">
                                            <div className="px-3 py-2.5 border-b border-zinc-100">
                                                <input
                                                    autoFocus
                                                    type="text"
                                                    placeholder="Search services…"
                                                    value={librarySearch}
                                                    onChange={(e) => setLibrarySearch(e.target.value)}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="w-full text-sm bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-1.5 outline-none focus:border-zinc-400 placeholder:text-zinc-400"
                                                />
                                            </div>
                                            {!services || services.length === 0 ? (
                                                <div className="px-4 py-6 text-center text-zinc-400 text-sm italic">
                                                    No services saved yet.<br />
                                                    <span className="text-xs">Add them in Settings → Service Library.</span>
                                                </div>
                                            ) : (() => {
                                                const filtered = services.filter((s) =>
                                                    s.name.toLowerCase().includes(librarySearch.toLowerCase()) ||
                                                    (s.description ?? "").toLowerCase().includes(librarySearch.toLowerCase())
                                                );
                                                return filtered.length === 0 ? (
                                                    <div className="px-4 py-6 text-center text-zinc-400 text-sm">No matches.</div>
                                                ) : (
                                                    <div className="max-h-64 overflow-y-auto divide-y divide-zinc-50">
                                                        {filtered.map((svc) => (
                                                            <button
                                                                key={svc._id}
                                                                type="button"
                                                                onClick={() => { addFromLibrary(svc); setLibrarySearch(""); }}
                                                                className="w-full flex items-center justify-between px-4 py-3 hover:bg-zinc-50 transition-colors text-left group"
                                                            >
                                                                <div className="flex flex-col gap-0.5 min-w-0 mr-3">
                                                                    <span className="text-sm font-semibold text-zinc-900 truncate">{svc.name}</span>
                                                                    {svc.description && (
                                                                        <span className="text-xs text-zinc-400 truncate">{svc.description}</span>
                                                                    )}
                                                                </div>
                                                                <div className="flex items-center gap-2 shrink-0">
                                                                    <span className={cn(
                                                                        "text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md",
                                                                        svc.type === "hourly" ? "bg-blue-50 text-blue-600" : "bg-emerald-50 text-emerald-600"
                                                                    )}>{svc.type}</span>
                                                                    <span className="text-sm font-black text-zinc-800">
                                                                        {formatCurrency(svc.defaultPrice, settings?.currency)}
                                                                    </span>
                                                                </div>
                                                            </button>
                                                        ))}
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    </>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={addWorkItem}
                                className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-xl text-xs font-bold hover:bg-black transition-all active:scale-95"
                            >
                                <Plus size={14} />
                                Add Item
                            </button>
                        </div>
                    </div>

                    <Card>
                        {workItems.length === 0 ? (
                            <div className="px-6 py-12 text-center text-zinc-400 italic text-sm">
                                No work items yet. Add services or tasks to be performed.
                            </div>
                        ) : (
                            <div className="divide-y divide-zinc-100">
                                {workItems.map((wi, i) => (
                                    <div key={i} className="p-6 space-y-4 group">
                                        <div className="flex items-start gap-4">
                                            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {/* Name */}
                                                <input
                                                    required
                                                    placeholder="e.g. Full setup, Fret leveling…"
                                                    value={wi.name}
                                                    onChange={(e) => updateWorkItem(i, "name", e.target.value)}
                                                    className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black/5"
                                                />
                                                {/* Description */}
                                                <input
                                                    placeholder="Description (optional)"
                                                    value={wi.description}
                                                    onChange={(e) => updateWorkItem(i, "description", e.target.value)}
                                                    className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm text-zinc-500 focus:outline-none focus:ring-2 focus:ring-black/5"
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeWorkItem(i)}
                                                className="p-2 text-zinc-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100 mt-0.5"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>

                                        <div className="flex items-center gap-3 flex-wrap">
                                            {/* Type toggle */}
                                            <div className="flex rounded-lg overflow-hidden border border-zinc-200 text-xs font-bold">
                                                {(["fixed", "hourly"] as const).map((t) => (
                                                    <button
                                                        key={t}
                                                        type="button"
                                                        onClick={() => updateWorkItem(i, "type", t)}
                                                        className={cn(
                                                            "px-3 py-1.5 uppercase tracking-wider transition-all",
                                                            wi.type === t ? "bg-black text-white" : "bg-white text-zinc-400 hover:bg-zinc-50"
                                                        )}
                                                    >
                                                        {t === "fixed" ? "Fixed Price" : "Hourly"}
                                                    </button>
                                                ))}
                                            </div>

                                            {/* Price */}
                                            <div className="flex items-center gap-1">
                                                <span className="text-xs text-zinc-400 font-bold">{getCurrencySymbol(settings?.currency)}</span>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    required
                                                    placeholder={wi.type === "hourly" ? "Rate/hr" : "Price"}
                                                    value={wi.unitPrice || ""}
                                                    onChange={(e) => updateWorkItem(i, "unitPrice", parseFloat(e.target.value) || 0)}
                                                    className="w-24 px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm font-bold text-right focus:outline-none focus:ring-2 focus:ring-black/5"
                                                />
                                            </div>

                                            {/* Hours (hourly only) */}
                                            {wi.type === "hourly" && (
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-xs text-zinc-400 font-bold">×</span>
                                                    <input
                                                        type="number"
                                                        step="0.25"
                                                        min="0.25"
                                                        value={wi.hours || ""}
                                                        placeholder="hrs"
                                                        onChange={(e) => updateWorkItem(i, "hours", parseFloat(e.target.value) || 0)}
                                                        className="w-20 px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm font-bold text-right focus:outline-none focus:ring-2 focus:ring-black/5"
                                                    />
                                                    <span className="text-xs text-zinc-400">hrs</span>
                                                </div>
                                            )}

                                            {/* Line total */}
                                            <span className="ml-auto text-sm font-black text-zinc-900">
                                                {formatCurrency(
                                                    wi.type === "hourly" ? wi.unitPrice * wi.hours : wi.unitPrice,
                                                    settings?.currency
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                ))}

                                {/* Work total footer */}
                                <div className="px-6 py-4 bg-zinc-50/80 flex justify-between items-center">
                                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Estimated Total (Labour)</span>
                                    <span className="text-xl font-black text-black tracking-tight">
                                        {formatCurrency(workTotal, settings?.currency)}
                                    </span>
                                </div>
                            </div>
                        )}
                    </Card>
                </div>

                {/* ── Internal Notes ── */}
                <div className="w-full lg:w-2/3 space-y-4">
                    <div className="space-y-1">
                        <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
                            <StickyNote size={18} />
                            Internal Notes
                        </h2>
                        <p className="text-sm text-zinc-500">Private notes — not visible to the client.</p>
                    </div>
                    <Card className="p-6">
                        <textarea
                            rows={4}
                            placeholder="Parts ordered, quirks to remember, special client requests…"
                            value={internalNotes}
                            onChange={(e) => setInternalNotes(e.target.value)}
                            className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5 resize-none"
                        />
                    </Card>
                </div>

                {/* ── Submit ── */}
                <div className="flex flex-col items-center gap-6 pt-12 border-t border-zinc-100">
                    <div className="flex items-center gap-4">
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
                                <><Loader2 size={18} className="animate-spin" /> Creating Job…</>
                            ) : (
                                <><CheckCircle2 size={18} /> Create Job</>
                            )}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}

export default function CreateJobPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin text-zinc-300" /></div>}>
            <CreateJobForm />
        </Suspense>
    );
}
