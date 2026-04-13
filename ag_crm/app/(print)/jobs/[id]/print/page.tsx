"use client";

import { useQuery } from "convex/react";
import { useParams } from "next/navigation";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import { Printer, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const CHECKLIST_PARTS = [
    { key: "tuners",      label: "Tuners / Tuning Machines" },
    { key: "frets",       label: "Frets" },
    { key: "nut",         label: "Nut" },
    { key: "bridge",      label: "Bridge / Saddle" },
    { key: "neck",        label: "Neck / Truss Rod" },
    { key: "body",        label: "Body / Finish" },
    { key: "electronics", label: "Electronics / Pickups" },
] as const;

const conditionColor = (val: string | undefined) => {
    if (val === "good") return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (val === "fair") return "bg-amber-50 text-amber-700 border-amber-200";
    if (val === "poor") return "bg-red-50 text-red-700 border-red-200";
    return "bg-zinc-50 text-zinc-400 border-zinc-200";
};

const formatDate = (ts: number | undefined) =>
    ts ? new Date(ts).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "—";

const formatCurrency = (amount: number, currency = "EUR") =>
    new Intl.NumberFormat("nl-NL", { style: "currency", currency }).format(amount);

const STATUS_LABELS: Record<string, string> = {
    quoted: "Quote", intake: "Intake", in_progress: "In Progress",
    waiting_parts: "Waiting for Parts", ready: "Ready for Pickup", closed: "Closed",
};

export default function JobPrintPage() {
    const { id } = useParams();
    const job = useQuery(api.jobs.get, { id: id as Id<"jobs"> });
    const settings = useQuery(api.settings.get);

    if (job === undefined) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="animate-spin text-zinc-300" size={32} />
            </div>
        );
    }
    if (!job) return <div className="p-8 text-zinc-500">Job not found.</div>;

    const workItems = job.workItems ?? [];
    const workTotal = workItems.reduce((sum, wi) =>
        sum + (wi.type === "hourly" ? wi.unitPrice * (wi.hours ?? 1) : wi.unitPrice), 0);

    const instrumentLabel = [job.instrumentBrand, job.instrumentModel, job.instrumentType].filter(Boolean).join(" ");
    const isStandalone = typeof window !== "undefined" && window.self === window.top;

    return (
        <>
            {/* Toolbar — only shown when opened standalone (not in iframe) */}
            {isStandalone && (
                <div className="print:hidden sticky top-0 z-10 bg-white border-b border-zinc-200 px-6 py-3 flex items-center gap-4">
                    <div className="flex-1" />
                    <button
                        onClick={() => window.print()}
                        className="flex items-center gap-2 px-5 py-2 bg-black text-white rounded-xl text-sm font-bold hover:bg-zinc-800 transition-all active:scale-95 shadow-lg shadow-black/10"
                    >
                        <Printer size={16} />
                        Print / Save PDF
                    </button>
                </div>
            )}

            {/* Print sheet */}
            <div className="max-w-3xl mx-auto p-8 print:p-0 print:max-w-none font-sans text-zinc-900" style={{ position: "relative", overflow: "hidden" }}>

                {/* ── Watermark ── */}
                <div className="checklist-watermark" style={{
                    position: "absolute",
                    top: "42%", left: "50%",
                    transform: "translate(-50%, -50%)",
                    width: 850, height: 850,
                    pointerEvents: "none",
                    userSelect: "none",
                    zIndex: 0,
                    opacity: 0.055,
                }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/thedot-logo.png" alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                </div>

                {/* All content above watermark */}
                <div className="space-y-8" style={{ position: "relative", zIndex: 1 }}>

                {/* Letterhead */}
                <div className="flex items-start justify-between border-b-2 border-zinc-900 pb-6">
                    <div>
                        <h1 className="text-2xl font-black tracking-tight">{settings?.companyName ?? "Workshop"}</h1>
                        {settings?.addressLine1 && <p className="text-sm text-zinc-500 mt-1">{settings.addressLine1}</p>}
                        {settings?.addressLine2 && <p className="text-sm text-zinc-500">{settings.addressLine2}</p>}
                        {settings?.contactEmail && <p className="text-sm text-zinc-500">{settings.contactEmail}</p>}
                        {settings?.phone && <p className="text-sm text-zinc-500">{settings.phone}</p>}
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Work Order</p>
                        <p className="text-3xl font-black text-zinc-900 mt-1">{job.title}</p>
                        <p className="text-sm text-zinc-500 mt-1">
                            Status: <span className="font-bold text-zinc-800">{STATUS_LABELS[job.status] ?? job.status}</span>
                        </p>
                    </div>
                </div>

                {/* Two-column: client + instrument */}
                <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-3">
                        <h2 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Client</h2>
                        <div className="space-y-1 text-sm">
                            <p className="font-bold text-base">{(job as any).client?.name ?? "—"}</p>
                            {(job as any).client?.email && <p className="text-zinc-500">{(job as any).client.email}</p>}
                            {(job as any).client?.phone && <p className="text-zinc-500">{(job as any).client.phone}</p>}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <h2 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Instrument</h2>
                        <div className="space-y-1 text-sm">
                            <p className="font-bold text-base">{instrumentLabel || "—"}</p>
                            {job.instrumentSerial && <p className="text-zinc-500">Serial: {job.instrumentSerial}</p>}
                            {job.instrumentColor && <p className="text-zinc-500">Color: {job.instrumentColor}</p>}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <h2 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Dates</h2>
                        <div className="space-y-1 text-sm">
                            <p><span className="text-zinc-500">Intake:</span> <span className="font-bold">{formatDate(job.intakeDate)}</span></p>
                            <p><span className="text-zinc-500">Est. Completion:</span> <span className="font-bold">{formatDate(job.estimatedCompletionDate)}</span></p>
                        </div>
                    </div>

                    {job.description && (
                        <div className="space-y-3">
                            <h2 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Description</h2>
                            <p className="text-sm text-zinc-700 leading-relaxed">{job.description}</p>
                        </div>
                    )}
                </div>

                {/* Intake Condition */}
                {job.intakeChecklist && (
                    <div className="space-y-4">
                        <h2 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] border-t border-zinc-200 pt-6">
                            Condition at Intake
                        </h2>
                        <div className="grid grid-cols-2 gap-2">
                            {CHECKLIST_PARTS.map(({ key, label }) => {
                                const val = (job.intakeChecklist as any)?.[key] as string | undefined;
                                return (
                                    <div key={key} className="flex items-center justify-between py-2 border-b border-zinc-100">
                                        <span className="text-sm text-zinc-600">{label}</span>
                                        {val ? (
                                            <span className={cn("text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border", conditionColor(val))}>
                                                {val}
                                            </span>
                                        ) : (
                                            <span className="text-xs text-zinc-300">—</span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        {job.intakeChecklist?.notes && (
                            <p className="text-sm text-zinc-600 bg-zinc-50 rounded-xl p-4 mt-2">
                                <span className="font-bold text-zinc-800">Notes: </span>{job.intakeChecklist.notes}
                            </p>
                        )}
                    </div>
                )}

                {/* Work Items */}
                <div className="space-y-4">
                    <h2 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] border-t border-zinc-200 pt-6">
                        Work Items
                    </h2>
                    {workItems.length === 0 ? (
                        <p className="text-sm text-zinc-400 italic">No work items specified.</p>
                    ) : (
                        <table className="w-full border-collapse text-sm">
                            <thead>
                                <tr className="border-b-2 border-zinc-200">
                                    <th className="text-left py-2 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Service</th>
                                    <th className="text-left py-2 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Type</th>
                                    <th className="text-right py-2 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {workItems.map((wi, i) => {
                                    const total = wi.type === "hourly" ? wi.unitPrice * (wi.hours ?? 1) : wi.unitPrice;
                                    const detail = wi.type === "hourly"
                                        ? `${wi.hours}h × ${formatCurrency(wi.unitPrice, settings?.currency)}/h`
                                        : "Fixed price";
                                    return (
                                        <tr key={i} className="border-b border-zinc-100">
                                            <td className="py-3">
                                                <p className="font-semibold text-zinc-900">{wi.name}</p>
                                                {wi.description && <p className="text-xs text-zinc-500 mt-0.5">{wi.description}</p>}
                                            </td>
                                            <td className="py-3 text-xs text-zinc-500">{detail}</td>
                                            <td className="py-3 text-right font-bold">{formatCurrency(total, settings?.currency)}</td>
                                        </tr>
                                    );
                                })}
                                <tr className="border-t-2 border-zinc-900">
                                    <td colSpan={2} className="py-3 font-black text-zinc-900">Estimated Total</td>
                                    <td className="py-3 text-right font-black text-zinc-900 text-lg">
                                        {formatCurrency(workTotal, settings?.currency)}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Signature area */}
                <div className="border-t border-zinc-200 pt-8 grid grid-cols-2 gap-12">
                    <div className="space-y-8">
                        <div>
                            <div className="h-12 border-b-2 border-zinc-300" />
                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-2">Client Signature / Approval</p>
                        </div>
                        <div>
                            <div className="h-8 border-b border-zinc-200" />
                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-2">Date</p>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Notes / Remarks</p>
                        <div className="h-24 border border-zinc-200 rounded-xl" />
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t border-zinc-100 pt-4 text-center">
                    <p className="text-[10px] text-zinc-400">
                        {settings?.companyName ?? "Workshop"} · {settings?.contactEmail ?? ""} · Printed {new Date().toLocaleDateString("en-GB")}
                    </p>
                </div>

                </div> {/* end content z-index wrapper */}
            </div>

            <style>{`
                @media print {
                    @page { margin: 16mm; size: A4; }
                    body { background: #fff !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    .checklist-watermark {
                        position: fixed !important;
                        top: 50% !important;
                        left: 50% !important;
                        transform: translate(-50%, -50%) !important;
                    }
                }
            `}</style>
        </>
    );
}
