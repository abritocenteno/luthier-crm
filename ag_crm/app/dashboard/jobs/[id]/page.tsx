"use client";

import { use, Suspense, useState, useRef } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import {
    ArrowLeft, Wrench, Edit2, FileText, Guitar, Calendar, Clock,
    CheckCircle2, AlertCircle, Loader2, ExternalLink, StickyNote,
    ChevronRight, Package, User, Inbox, Bell, Send, ImagePlus, X, Trash2, Printer, ClipboardList,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";

const STATUS_STEPS = [
    { key: "quoted",        label: "Quote",             desc: "Awaiting approval" },
    { key: "intake",        label: "Intake",            desc: "Instrument received" },
    { key: "in_progress",   label: "In Progress",       desc: "Work underway" },
    { key: "waiting_parts", label: "Waiting for Parts", desc: "Parts on order" },
    { key: "ready",         label: "Ready for Pickup",  desc: "Work complete" },
    { key: "closed",        label: "Closed",            desc: "Picked up & paid" },
] as const;
type StatusKey = typeof STATUS_STEPS[number]["key"];

const CONDITION_COLORS: Record<string, string> = {
    good: "bg-emerald-50 text-emerald-700 border-emerald-100",
    fair: "bg-amber-50 text-amber-700 border-amber-100",
    poor: "bg-red-50 text-red-700 border-red-100",
};

const CHECKLIST_LABELS: Record<string, string> = {
    tuners: "Tuners", frets: "Frets", nut: "Nut",
    bridge: "Bridge", neck: "Neck", body: "Body", electronics: "Electronics",
};

const Card = ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={cn("bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden", className)}>
        {children}
    </div>
);

function JobDetail({ id }: { id: Id<"jobs"> }) {
    const router = useRouter();
    const job = useQuery(api.jobs.get, { id });
    const settings = useQuery(api.settings.get);
    const updateStatus = useMutation(api.jobs.updateStatus);
    const generateInvoice = useMutation(api.jobs.generateInvoice);
    const notifyClient = useAction(api.resend.sendJobReadyEmail);
    const sendQuote = useAction(api.resend.sendQuoteEmail);
    const markQuoteSent = useMutation(api.jobs.markQuoteSent);
    const generateUploadUrl = useMutation(api.jobs.generateUploadUrl);
    const addJobPhoto = useMutation(api.jobs.addJobPhoto);
    const removeJobPhoto = useMutation(api.jobs.removeJobPhoto);
    const deleteJob = useMutation(api.jobs.remove);

    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isNotifying, setIsNotifying] = useState(false);
    const [notified, setNotified] = useState(false);
    const [isSendingQuote, setIsSendingQuote] = useState(false);
    const [quoteSent, setQuoteSent] = useState(false);
    const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showChecklist, setShowChecklist] = useState(false);
    const photoInputRef = useRef<HTMLInputElement>(null);

    if (job === undefined) {
        return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="animate-spin text-zinc-300" size={32} /></div>;
    }
    if (job === null) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <AlertCircle className="text-red-500" size={48} />
                <h2 className="text-xl font-bold">Job Not Found</h2>
                <button onClick={() => router.back()} className="text-sm font-bold text-black underline">Go Back</button>
            </div>
        );
    }

    const currentStepIndex = STATUS_STEPS.findIndex((s) => s.key === job.status);
    const workTotal = (job.workItems ?? []).reduce((acc, wi) =>
        acc + (wi.type === "hourly" ? wi.unitPrice * (wi.hours ?? 1) : wi.unitPrice), 0);
    const checklist = job.intakeChecklist as Record<string, string> | undefined;

    const handleStatusChange = async (newStatus: StatusKey) => {
        if (newStatus === job.status) return;
        setIsUpdatingStatus(true);
        try {
            await updateStatus({
                id,
                status: newStatus,
                completionDate: newStatus === "ready" ? Date.now() : undefined,
            });
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    const handleGenerateInvoice = async () => {
        setIsGenerating(true);
        try {
            const invoiceId = await generateInvoice({ id });
            router.push(`/dashboard/invoices/${invoiceId}`);
        } catch (err: any) {
            alert(err.message ?? "Failed to generate invoice.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleNotifyClient = async () => {
        setIsNotifying(true);
        try {
            await notifyClient({ jobId: id });
            setNotified(true);
        } catch (err: any) {
            alert(err.message ?? "Failed to send notification.");
        } finally {
            setIsNotifying(false);
        }
    };

    const handleSendQuote = async () => {
        setIsSendingQuote(true);
        try {
            await sendQuote({ jobId: id });
            await markQuoteSent({ id });
            setQuoteSent(true);
        } catch (err: any) {
            alert(err.message ?? "Failed to send quote.");
        } finally {
            setIsSendingQuote(false);
        }
    };

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files ?? []);
        if (!files.length) return;
        setIsUploadingPhoto(true);
        try {
            for (const file of files) {
                const uploadUrl = await generateUploadUrl();
                const res = await fetch(uploadUrl, {
                    method: "POST",
                    headers: { "Content-Type": file.type },
                    body: file,
                });
                const { storageId } = await res.json();
                await addJobPhoto({ id, storageId });
            }
        } catch (err: any) {
            alert(err.message ?? "Failed to upload photo.");
        } finally {
            setIsUploadingPhoto(false);
            if (photoInputRef.current) photoInputRef.current.value = "";
        }
    };

    const handleRemovePhoto = async (storageId: string) => {
        if (!confirm("Remove this photo?")) return;
        try {
            await removeJobPhoto({ id, storageId: storageId as any });
        } catch (err: any) {
            alert(err.message ?? "Failed to remove photo.");
        }
    };

    const handleDelete = async () => {
        if (!confirm(`Delete "${job.title}"? This cannot be undone.`)) return;
        setIsDeleting(true);
        try {
            await deleteJob({ id });
            router.push("/dashboard/jobs");
        } catch (err: any) {
            alert(err.message ?? "Failed to delete job.");
            setIsDeleting(false);
        }
    };

    return (
        <>
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                <div className="space-y-4">
                    <button
                        onClick={() => router.push("/dashboard/jobs")}
                        className="flex items-center gap-2 text-sm font-bold text-zinc-400 hover:text-black transition-colors group"
                    >
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                        Back to Jobs
                    </button>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-black flex items-center justify-center text-white shadow-lg">
                            <Wrench size={24} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">{job.title}</h1>
                            <p className="text-zinc-500 font-medium">{(job as any).client?.name ?? "Unknown Client"}</p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 shrink-0">
                    <button
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="flex items-center gap-2 px-4 py-2.5 bg-white border border-red-200 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 transition-all active:scale-95 shadow-sm disabled:opacity-50"
                    >
                        {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                        Delete
                    </button>
                    <button
                        onClick={() => setShowChecklist(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm font-bold hover:bg-zinc-50 transition-all active:scale-95 shadow-sm"
                    >
                        <ClipboardList size={16} />
                        Checklist
                    </button>
                    <Link
                        href={`/dashboard/jobs/${id}/print`}
                        target="_blank"
                        className="flex items-center gap-2 px-5 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm font-bold hover:bg-zinc-50 transition-all active:scale-95 shadow-sm"
                    >
                        <Printer size={16} />
                        Print
                    </Link>
                    {job.status !== "closed" && (
                        <Link
                            href={`/dashboard/jobs/${id}/edit`}
                            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm font-bold hover:bg-zinc-50 transition-all active:scale-95 shadow-sm"
                        >
                            <Edit2 size={16} />
                            Edit
                        </Link>
                    )}
                    {job.status === "quoted" && (
                        <>
                            <button
                                onClick={handleSendQuote}
                                disabled={isSendingQuote || quoteSent}
                                className={cn(
                                    "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 shadow-lg disabled:opacity-60",
                                    quoteSent
                                        ? "bg-emerald-500 text-white shadow-emerald-500/20"
                                        : "bg-amber-500 text-white hover:bg-amber-600 shadow-amber-500/20"
                                )}
                            >
                                {isSendingQuote ? <Loader2 size={16} className="animate-spin" /> : quoteSent ? <CheckCircle2 size={16} /> : <Send size={16} />}
                                {quoteSent
                                    ? "Quote Sent"
                                    : (job as any).sentQuoteAt
                                        ? "Resend Quote"
                                        : "Send Quote"}
                            </button>
                            <button
                                onClick={() => handleStatusChange("intake")}
                                disabled={isUpdatingStatus}
                                className="flex items-center gap-2 px-5 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm font-bold hover:bg-zinc-50 transition-all active:scale-95 shadow-sm"
                            >
                                <CheckCircle2 size={16} className="text-emerald-500" />
                                Accept Quote
                            </button>
                        </>
                    )}
                    {job.status === "ready" && (
                        <button
                            onClick={handleNotifyClient}
                            disabled={isNotifying || notified}
                            className={cn(
                                "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 shadow-lg disabled:opacity-60",
                                notified
                                    ? "bg-emerald-500 text-white shadow-emerald-500/20"
                                    : "bg-amber-500 text-white hover:bg-amber-600 shadow-amber-500/20"
                            )}
                        >
                            {isNotifying ? (
                                <Loader2 size={16} className="animate-spin" />
                            ) : notified ? (
                                <CheckCircle2 size={16} />
                            ) : (
                                <Bell size={16} />
                            )}
                            {notified ? "Client Notified" : "Notify Client"}
                        </button>
                    )}
                    {!job.invoiceId && job.status !== "closed" ? (
                        <button
                            onClick={handleGenerateInvoice}
                            disabled={isGenerating}
                            className="flex items-center gap-2 px-6 py-2.5 bg-black text-white rounded-xl text-sm font-bold hover:bg-zinc-800 transition-all active:scale-95 shadow-lg shadow-black/10 disabled:opacity-50"
                        >
                            {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
                            Generate Invoice
                        </button>
                    ) : job.invoiceId ? (
                        <Link
                            href={`/dashboard/invoices/${job.invoiceId}`}
                            className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all active:scale-95 shadow-lg shadow-emerald-600/20"
                        >
                            <FileText size={16} />
                            View Invoice
                        </Link>
                    ) : null}
                </div>
            </header>

            {/* Status Progression */}
            <Card className={cn("p-6", job.status === "closed" && "opacity-70")}>
                {job.status === "closed" && (
                    <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-zinc-100 rounded-xl">
                        <CheckCircle2 size={14} className="text-zinc-500 shrink-0" />
                        <p className="text-xs font-bold text-zinc-500">This job is closed and locked for editing.</p>
                    </div>
                )}
                <div className={cn("relative flex items-start gap-0", job.status === "closed" && "pointer-events-none select-none")}>
                    {STATUS_STEPS.map((step, i) => {
                        const isDone = i <= currentStepIndex;
                        const isCurrent = i === currentStepIndex;
                        const isLast = i === STATUS_STEPS.length - 1;
                        return (
                            <div key={step.key} className="flex-1 flex flex-col items-center relative">
                                {/* Connector line */}
                                {!isLast && (
                                    <div className={cn(
                                        "absolute top-4 left-1/2 w-full h-0.5 z-0",
                                        i < currentStepIndex ? "bg-black" : "bg-zinc-200"
                                    )} />
                                )}
                                {/* Step button */}
                                <button
                                    onClick={() => handleStatusChange(step.key)}
                                    disabled={isUpdatingStatus}
                                    className={cn(
                                        "relative z-10 w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all",
                                        isDone && !isCurrent && "bg-black border-black text-white",
                                        isCurrent && "bg-black border-black text-white ring-4 ring-black/10",
                                        !isDone && "bg-white border-zinc-200 text-zinc-300 hover:border-zinc-400"
                                    )}
                                >
                                    {isDone ? <CheckCircle2 size={14} /> : <span className="text-[10px] font-black">{i + 1}</span>}
                                </button>
                                <div className="mt-2 text-center px-1">
                                    <p className={cn("text-[10px] font-black uppercase tracking-wider", isCurrent ? "text-black" : isDone ? "text-zinc-600" : "text-zinc-300")}>
                                        {step.label}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left column — Instrument + Checklist + Notes */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Instrument card */}
                    <Card className="p-6 space-y-4">
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] flex items-center gap-2">
                            <Guitar size={12} />
                            Instrument
                        </p>
                        <div className="space-y-2">
                            <p className="text-lg font-bold text-zinc-900">
                                {[job.instrumentBrand, job.instrumentModel].filter(Boolean).join(" ") || job.instrumentType}
                            </p>
                            <p className="text-sm text-zinc-500">{job.instrumentType}</p>
                            {job.instrumentColor && <p className="text-sm text-zinc-500">Finish: {job.instrumentColor}</p>}
                            {job.instrumentSerial && (
                                <p className="text-xs text-zinc-400 font-mono bg-zinc-50 px-2 py-1 rounded-lg inline-block">
                                    S/N: {job.instrumentSerial}
                                </p>
                            )}
                        </div>
                    </Card>

                    {/* Dates card */}
                    <Card className="p-6 space-y-4">
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Dates</p>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <Inbox size={14} className="text-zinc-300" />
                                <div>
                                    <p className="text-[10px] text-zinc-400 font-medium">Intake</p>
                                    <p className="text-sm font-bold">{new Date(job.intakeDate).toLocaleDateString()}</p>
                                </div>
                            </div>
                            {job.estimatedCompletionDate && (
                                <div className="flex items-center gap-3">
                                    <Clock size={14} className="text-zinc-300" />
                                    <div>
                                        <p className="text-[10px] text-zinc-400 font-medium">Est. Completion</p>
                                        <p className="text-sm font-bold">{new Date(job.estimatedCompletionDate).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            )}
                            {job.completionDate && (
                                <div className="flex items-center gap-3">
                                    <CheckCircle2 size={14} className="text-emerald-500" />
                                    <div>
                                        <p className="text-[10px] text-zinc-400 font-medium">Completed</p>
                                        <p className="text-sm font-bold">{new Date(job.completionDate).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Client card */}
                    <Card className="p-6 space-y-4">
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] flex items-center gap-2">
                            <User size={12} />
                            Client
                        </p>
                        <div className="space-y-1">
                            <Link href={`/dashboard/clients/${job.clientId}`} className="font-bold text-zinc-900 hover:underline">
                                {(job as any).client?.name}
                            </Link>
                            {(job as any).client?.email && <p className="text-sm text-zinc-500">{(job as any).client.email}</p>}
                            {(job as any).client?.phone && <p className="text-sm text-zinc-500">{(job as any).client.phone}</p>}
                        </div>
                    </Card>

                    {/* Internal notes */}
                    {job.internalNotes && (
                        <Card className="p-6 space-y-3">
                            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                <StickyNote size={12} />
                                Internal Notes
                            </p>
                            <p className="text-sm text-zinc-600 leading-relaxed whitespace-pre-wrap">{job.internalNotes}</p>
                        </Card>
                    )}
                </div>

                {/* Right column — Work items + Checklist + Orders */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Description */}
                    {job.description && (
                        <Card className="p-6 space-y-2">
                            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Description</p>
                            <p className="text-sm text-zinc-600 leading-relaxed">{job.description}</p>
                        </Card>
                    )}

                    {/* Work Items */}
                    <Card>
                        <div className="px-6 pt-6 pb-2 flex items-center justify-between">
                            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Work Items</p>
                            {workTotal > 0 && (
                                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Labour Total</span>
                            )}
                        </div>
                        {(job.workItems ?? []).length === 0 ? (
                            <div className="px-6 py-8 text-center text-zinc-400 italic text-sm">
                                No work items added.
                            </div>
                        ) : (
                            <>
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-zinc-100 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                                            <th className="px-6 py-3">Service</th>
                                            <th className="px-6 py-3 text-center w-28">Type</th>
                                            <th className="px-6 py-3 text-right w-28">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-50">
                                        {job.workItems!.map((wi, i) => {
                                            const total = wi.type === "hourly" ? wi.unitPrice * (wi.hours ?? 1) : wi.unitPrice;
                                            return (
                                                <tr key={i}>
                                                    <td className="px-6 py-4">
                                                        <p className="font-bold text-sm text-zinc-900">{wi.name}</p>
                                                        {wi.description && <p className="text-xs text-zinc-500 mt-0.5">{wi.description}</p>}
                                                        {wi.type === "hourly" && (
                                                            <p className="text-[10px] text-zinc-400 mt-1">{wi.hours}h × {formatCurrency(wi.unitPrice, settings?.currency)}/h</p>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className={cn(
                                                            "text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg border",
                                                            wi.type === "hourly"
                                                                ? "bg-blue-50 text-blue-600 border-blue-100"
                                                                : "bg-zinc-50 text-zinc-500 border-zinc-100"
                                                        )}>
                                                            {wi.type === "hourly" ? "Hourly" : "Fixed"}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right font-black text-sm">{formatCurrency(total, settings?.currency)}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                    <tfoot>
                                        <tr className="bg-zinc-50/80 border-t border-zinc-100">
                                            <td colSpan={2} className="px-6 py-4 text-right text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Total (Labour)</td>
                                            <td className="px-6 py-4 text-right text-xl font-black text-black tracking-tight">{formatCurrency(workTotal, settings?.currency)}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </>
                        )}
                    </Card>

                    {/* Intake Condition Checklist */}
                    {checklist && Object.keys(CHECKLIST_LABELS).some((k) => checklist[k]) && (
                        <Card>
                            <div className="px-6 pt-6 pb-2">
                                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Condition at Intake</p>
                            </div>
                            <div className="divide-y divide-zinc-50">
                                {Object.entries(CHECKLIST_LABELS).map(([key, label]) => {
                                    const val = checklist[key];
                                    if (!val) return null;
                                    return (
                                        <div key={key} className="flex items-center justify-between px-6 py-3">
                                            <span className="text-sm text-zinc-600">{label}</span>
                                            <span className={cn("text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border", CONDITION_COLORS[val] ?? "bg-zinc-50 text-zinc-400 border-zinc-100")}>
                                                {val}
                                            </span>
                                        </div>
                                    );
                                })}
                                {checklist.notes && (
                                    <div className="px-6 py-4 space-y-1">
                                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Notes</p>
                                        <p className="text-sm text-zinc-600">{checklist.notes}</p>
                                    </div>
                                )}
                            </div>
                        </Card>
                    )}

                    {/* Photos */}
                    <Card>
                        <div className="px-6 pt-6 pb-4 flex items-center justify-between">
                            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Photos</p>
                            <button
                                type="button"
                                onClick={() => photoInputRef.current?.click()}
                                disabled={isUploadingPhoto}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 text-white rounded-xl text-xs font-bold hover:bg-black transition-all active:scale-95 disabled:opacity-50"
                            >
                                {isUploadingPhoto ? <Loader2 size={12} className="animate-spin" /> : <ImagePlus size={12} />}
                                {isUploadingPhoto ? "Uploading…" : "Add Photos"}
                            </button>
                            <input
                                ref={photoInputRef}
                                type="file"
                                accept="image/*"
                                multiple
                                className="hidden"
                                onChange={handlePhotoUpload}
                            />
                        </div>
                        {!(job as any).photoUrls?.length ? (
                            <div className="px-6 pb-8 text-center text-zinc-400 italic text-sm">
                                No photos yet. Add before &amp; after shots.
                            </div>
                        ) : (
                            <div className="px-6 pb-6 grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {(job as any).photoUrls.map((url: string, i: number) => {
                                    const storageId = (job as any).photoIds?.[i];
                                    return (
                                        <div key={i} className="relative group aspect-square rounded-xl overflow-hidden border border-zinc-100 bg-zinc-50">
                                            <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                                            <button
                                                onClick={() => handleRemovePhoto(storageId)}
                                                className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/60 hover:bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                                            >
                                                <X size={10} />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </Card>

                    {/* Linked Orders */}
                    {(job as any).orders?.length > 0 && (
                        <Card>
                            <div className="px-6 pt-6 pb-2 flex items-center gap-2">
                                <Package size={12} className="text-zinc-400" />
                                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Linked Supplier Orders</p>
                            </div>
                            <div className="divide-y divide-zinc-50">
                                {(job as any).orders.map((order: any) => (
                                    <div key={order._id} className="flex items-center justify-between px-6 py-4">
                                        <div className="space-y-0.5">
                                            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{order.supplierName}</p>
                                            <p className="text-sm font-bold">{order.orderNumber}</p>
                                            <p className="text-xs text-zinc-400">{formatCurrency(order.amount, settings?.currency)}</p>
                                        </div>
                                        {order.invoiceUrl && (
                                            <a href={order.invoiceUrl} target="_blank" rel="noopener noreferrer"
                                                className="w-9 h-9 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center justify-center text-zinc-400 hover:text-black hover:border-black transition-all">
                                                <ExternalLink size={14} />
                                            </a>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}
                </div>
            </div>
        </div>

        {/* ── Checklist Modal ── */}
        {showChecklist && (
            <div className="modal-overlay flex items-center justify-center p-4">
                <div className="absolute inset-0 modal-backdrop" onClick={() => setShowChecklist(false)} />
                <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col" style={{ maxHeight: "90vh" }}>
                    {/* Modal header */}
                    <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 shrink-0">
                        <div className="flex items-center gap-2">
                            <ClipboardList size={16} className="text-zinc-400" />
                            <span className="text-sm font-bold text-zinc-900">Completion Checklist</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <a
                                href={`/dashboard/jobs/${id}/checklist`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 text-white rounded-xl text-xs font-bold hover:bg-black transition-all"
                            >
                                <Printer size={12} /> Print / Save PDF
                            </a>
                            <button
                                onClick={() => setShowChecklist(false)}
                                className="p-1.5 text-zinc-400 hover:text-black hover:bg-zinc-100 rounded-xl transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </div>
                    {/* iframe */}
                    <iframe
                        src={`/dashboard/jobs/${id}/checklist`}
                        className="flex-1 w-full border-0"
                        style={{ minHeight: 600 }}
                        title="Completion Checklist"
                    />
                </div>
            </div>
        )}
        </>
    );
}

export default function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin text-zinc-300" /></div>}>
            <JobDetail id={id as Id<"jobs">} />
        </Suspense>
    );
}
