"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { useParams } from "next/navigation";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import {
    Wrench, FileText, CheckCircle2, Clock, AlertTriangle,
    Guitar, Calendar, ChevronRight, Loader2, Check, ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(amount);

const formatDate = (ts: number) =>
    new Date(ts).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode; step: number }> = {
    quoted:        { label: "Quote Sent",         color: "text-violet-600 bg-violet-50 border-violet-200",  icon: <FileText size={14} />,     step: 0 },
    intake:        { label: "Received",            color: "text-blue-600 bg-blue-50 border-blue-200",        icon: <Wrench size={14} />,       step: 1 },
    in_progress:   { label: "In Progress",         color: "text-amber-600 bg-amber-50 border-amber-200",     icon: <Clock size={14} />,        step: 2 },
    waiting_parts: { label: "Waiting for Parts",   color: "text-orange-600 bg-orange-50 border-orange-200",  icon: <AlertTriangle size={14} />, step: 2 },
    ready:         { label: "Ready for Pickup! 🎉", color: "text-emerald-600 bg-emerald-50 border-emerald-200", icon: <CheckCircle2 size={14} />, step: 3 },
};

const PROGRESS_STEPS = ["Quote", "Received", "In Progress", "Ready"];

function JobCard({ job, token }: {
    job: {
        _id: Id<"jobs">;
        title: string;
        status: string;
        instrumentType: string;
        instrumentBrand?: string;
        instrumentModel?: string;
        intakeDate: number;
        estimatedCompletionDate?: number;
        workItems?: Array<{ name: string; description?: string; type: string; unitPrice: number; hours?: number }>;
        description?: string;
        sentQuoteAt?: number;
    };
    token: string;
}) {
    const acceptQuote = useMutation(api.portal.acceptQuote);
    const [accepting, setAccepting] = useState(false);
    const [accepted, setAccepted] = useState(false);

    const cfg = STATUS_CONFIG[job.status] ?? STATUS_CONFIG.intake;
    const step = cfg.step;
    const instrumentLabel = [job.instrumentBrand, job.instrumentModel, job.instrumentType].filter(Boolean).join(" ");

    const workItems = job.workItems ?? [];
    const workTotal = workItems.reduce((sum, wi) =>
        sum + (wi.type === "hourly" ? wi.unitPrice * (wi.hours ?? 1) : wi.unitPrice), 0);

    const handleAccept = async () => {
        setAccepting(true);
        try {
            await acceptQuote({ token, jobId: job._id });
            setAccepted(true);
        } catch (err) {
            console.error(err);
        } finally {
            setAccepting(false);
        }
    };

    return (
        <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
            {/* Card header */}
            <div className="px-6 pt-6 pb-4">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                        <h3 className="text-lg font-bold text-zinc-900">{job.title}</h3>
                        <div className="flex items-center gap-1.5 mt-1 text-sm text-zinc-500">
                            <Guitar size={14} />
                            <span>{instrumentLabel}</span>
                        </div>
                    </div>
                    <span className={cn(
                        "px-3 py-1.5 rounded-full text-xs font-bold border flex items-center gap-1.5 shrink-0",
                        cfg.color
                    )}>
                        {cfg.icon}
                        {cfg.label}
                    </span>
                </div>

                {job.description && (
                    <p className="mt-3 text-sm text-zinc-600 leading-relaxed bg-zinc-50 rounded-xl px-4 py-3">
                        {job.description}
                    </p>
                )}
            </div>

            {/* Progress bar */}
            <div className="px-6 py-4 border-t border-zinc-100">
                <div className="flex items-center gap-0">
                    {PROGRESS_STEPS.map((label, i) => {
                        const done = i < step;
                        const current = i === step;
                        const last = i === PROGRESS_STEPS.length - 1;
                        return (
                            <div key={label} className="flex items-center flex-1 last:flex-none">
                                <div className="flex flex-col items-center gap-1.5">
                                    <div className={cn(
                                        "w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all",
                                        done    ? "bg-black border-black text-white" :
                                        current ? "bg-white border-black text-black" :
                                                  "bg-white border-zinc-200 text-zinc-300"
                                    )}>
                                        {done ? <Check size={14} /> : (
                                            <span className="text-[10px] font-black">{i + 1}</span>
                                        )}
                                    </div>
                                    <span className={cn(
                                        "text-[10px] font-bold whitespace-nowrap",
                                        done || current ? "text-zinc-900" : "text-zinc-400"
                                    )}>{label}</span>
                                </div>
                                {!last && (
                                    <div className={cn(
                                        "flex-1 h-0.5 mb-5 mx-1",
                                        done ? "bg-black" : "bg-zinc-200"
                                    )} />
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Dates */}
            <div className="px-6 pb-4 flex items-center gap-6 text-sm text-zinc-500 flex-wrap">
                <div className="flex items-center gap-1.5">
                    <Calendar size={14} />
                    <span>Dropped off: <span className="font-semibold text-zinc-700">{formatDate(job.intakeDate)}</span></span>
                </div>
                {job.estimatedCompletionDate && (
                    <div className="flex items-center gap-1.5">
                        <Clock size={14} />
                        <span>Est. ready: <span className="font-semibold text-zinc-700">{formatDate(job.estimatedCompletionDate)}</span></span>
                    </div>
                )}
            </div>

            {/* Work items (shown for quotes) */}
            {(job.status === "quoted" || workItems.length > 0) && workItems.length > 0 && (
                <div className="border-t border-zinc-100 px-6 py-4">
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3">Work to be done</p>
                    <div className="space-y-2">
                        {workItems.map((wi, i) => {
                            const lineTotal = wi.type === "hourly" ? wi.unitPrice * (wi.hours ?? 1) : wi.unitPrice;
                            return (
                                <div key={i} className="flex items-center justify-between gap-4 py-1.5 border-b border-zinc-50 last:border-0">
                                    <div>
                                        <p className="text-sm font-semibold text-zinc-800">{wi.name}</p>
                                        {wi.description && <p className="text-xs text-zinc-400">{wi.description}</p>}
                                    </div>
                                    <span className="text-sm font-bold text-zinc-900 shrink-0">{formatCurrency(lineTotal)}</span>
                                </div>
                            );
                        })}
                        <div className="flex justify-between items-center pt-2 border-t border-zinc-200">
                            <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Estimated Total</span>
                            <span className="text-lg font-black text-zinc-900">{formatCurrency(workTotal)}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Quote accept CTA */}
            {job.status === "quoted" && !accepted && (
                <div className="px-6 pb-6 pt-2">
                    <div className="bg-violet-50 border border-violet-100 rounded-2xl p-4 space-y-3">
                        <p className="text-sm font-bold text-violet-900">Your quote is ready for approval</p>
                        <p className="text-xs text-violet-700 leading-relaxed">
                            Review the work items above and click below to approve — we'll get started right away.
                        </p>
                        <button
                            onClick={handleAccept}
                            disabled={accepting}
                            className="w-full py-3 bg-black text-white rounded-xl text-sm font-bold hover:bg-zinc-800 transition-all shadow-lg shadow-black/10 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {accepting ? (
                                <><Loader2 size={16} className="animate-spin" /> Accepting…</>
                            ) : (
                                <><Check size={16} /> Accept Quote & Approve Work</>
                            )}
                        </button>
                    </div>
                </div>
            )}

            {accepted && (
                <div className="px-6 pb-6 pt-2">
                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3">
                        <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
                        <div>
                            <p className="text-sm font-bold text-emerald-800">Quote accepted!</p>
                            <p className="text-xs text-emerald-700">We'll get to work right away. You'll be notified when it's ready.</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function ClientPortalPage() {
    const { token } = useParams<{ token: string }>();
    const portal = useQuery(api.portal.getByToken, { token });

    if (portal === undefined) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 size={32} className="animate-spin text-zinc-300" />
            </div>
        );
    }

    if (portal === null) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center">
                <div className="w-16 h-16 bg-zinc-100 rounded-2xl flex items-center justify-center text-zinc-400">
                    <ShieldCheck size={28} />
                </div>
                <h1 className="text-2xl font-bold text-zinc-900">Link not found</h1>
                <p className="text-zinc-500 max-w-sm">
                    This portal link is invalid or has been revoked. Please contact your luthier for a new link.
                </p>
            </div>
        );
    }

    const { client, jobs, invoices } = portal;
    const hasContent = jobs.length > 0 || invoices.length > 0;

    return (
        <div className="max-w-2xl mx-auto px-4 py-10 space-y-8">
            {/* Header */}
            <header className="space-y-1">
                <div className="flex items-center gap-2 mb-6">
                    <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                        <span className="text-white font-black text-lg">L</span>
                    </div>
                    <span className="font-bold text-lg tracking-tight">Luthier Workshop</span>
                </div>
                <h1 className="text-3xl font-black tracking-tight text-zinc-900">
                    Hey, {client.name.split(" ")[0]}! 👋
                </h1>
                <p className="text-zinc-500 text-base">
                    Here's the latest on your instruments and invoices.
                </p>
            </header>

            {!hasContent ? (
                <div className="bg-white border border-zinc-200 rounded-2xl p-12 text-center space-y-3">
                    <div className="w-14 h-14 bg-zinc-50 rounded-full flex items-center justify-center text-zinc-300 mx-auto">
                        <Wrench size={26} />
                    </div>
                    <p className="font-bold text-zinc-700">Nothing active right now</p>
                    <p className="text-sm text-zinc-400">When you drop off an instrument or receive an invoice it'll appear here.</p>
                </div>
            ) : (
                <>
                    {/* Active jobs */}
                    {jobs.length > 0 && (
                        <section className="space-y-4">
                            <h2 className="text-xs font-black text-zinc-400 uppercase tracking-widest">
                                Your Instruments
                            </h2>
                            {jobs.map((job) => (
                                <JobCard key={job._id} job={job} token={token} />
                            ))}
                        </section>
                    )}

                    {/* Pending invoices */}
                    {invoices.length > 0 && (
                        <section className="space-y-4">
                            <h2 className="text-xs font-black text-zinc-400 uppercase tracking-widest">
                                Outstanding Invoices
                            </h2>
                            {invoices.map((inv) => (
                                <div key={inv._id} className="bg-white border border-zinc-200 rounded-2xl p-6 flex items-center justify-between gap-4">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <FileText size={14} className="text-zinc-400" />
                                            <span className="text-sm font-bold text-zinc-900">Invoice {inv.invoiceNumber}</span>
                                            <span className={cn(
                                                "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border",
                                                inv.status === "overdue"
                                                    ? "bg-red-50 text-red-700 border-red-200"
                                                    : "bg-amber-50 text-amber-700 border-amber-200"
                                            )}>
                                                {inv.status}
                                            </span>
                                        </div>
                                        <p className="text-xs text-zinc-400 ml-5">{formatDate(inv.date)}</p>
                                    </div>
                                    <span className="text-xl font-black text-zinc-900 shrink-0">
                                        {formatCurrency(inv.amount)}
                                    </span>
                                </div>
                            ))}
                        </section>
                    )}
                </>
            )}

            {/* Footer */}
            <footer className="text-center pt-4 border-t border-zinc-100">
                <p className="text-xs text-zinc-400">
                    This is a private link — please don't share it with others.
                </p>
            </footer>
        </div>
    );
}
