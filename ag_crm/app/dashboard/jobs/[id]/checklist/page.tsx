"use client";

import { use, Suspense } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import { Loader2, Printer } from "lucide-react";

const CHECKLIST_PARTS = [
    { key: "tuners",      label: "Tuners / Tuning Machines" },
    { key: "frets",       label: "Frets" },
    { key: "nut",         label: "Nut" },
    { key: "bridge",      label: "Bridge / Saddle" },
    { key: "neck",        label: "Neck / Truss Rod" },
    { key: "body",        label: "Body / Finish" },
    { key: "electronics", label: "Electronics / Pickups" },
] as const;

const conditionLabel = (val: string | undefined) => {
    if (val === "good") return { label: "Good", cls: "text-emerald-700 border-emerald-300 bg-emerald-50" };
    if (val === "fair") return { label: "Fair", cls: "text-amber-700 border-amber-300 bg-amber-50" };
    if (val === "poor") return { label: "Poor", cls: "text-red-700 border-red-300 bg-red-50" };
    return null;
};

const fmt = (ts: number | undefined) =>
    ts ? new Date(ts).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "—";

function ChecklistPrint({ id }: { id: Id<"jobs"> }) {
    const job    = useQuery(api.jobs.get, { id });
    const svcs   = useQuery(api.services.list);
    const settings = useQuery(api.settings.get);

    if (job === undefined || svcs === undefined || settings === undefined) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="animate-spin text-zinc-300" size={32} />
            </div>
        );
    }
    if (!job) return <div className="p-12 text-center text-zinc-400">Job not found.</div>;

    // Aggregate checklist items from services matching the job's work items
    const workNames = new Set((job.workItems ?? []).map((wi) => wi.name.toLowerCase()));
    const checklistItems: string[] = [];
    for (const svc of svcs) {
        if (workNames.has(svc.name.toLowerCase()) && svc.checklistItems?.length) {
            for (const item of svc.checklistItems) {
                if (!checklistItems.includes(item)) checklistItems.push(item);
            }
        }
    }

    const checklist = job.intakeChecklist as Record<string, string> | undefined;
    const hasIntake = checklist && CHECKLIST_PARTS.some((p) => checklist[p.key]);
    const instrument = [job.instrumentBrand, job.instrumentModel].filter(Boolean).join(" ") || job.instrumentType;
    const company = settings.companyName || "FretOps";

    return (
        <>
            {/* Print button — hidden in print */}
            <div className="print:hidden fixed top-4 right-4 z-50 flex gap-2">
                <button
                    onClick={() => window.print()}
                    className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-xl text-sm font-bold hover:bg-zinc-800 transition-all shadow-lg"
                >
                    <Printer size={15} /> Print / Save PDF
                </button>
                <button
                    onClick={() => window.close()}
                    className="px-4 py-2 bg-white border border-zinc-200 rounded-xl text-sm font-bold hover:bg-zinc-50 transition-all shadow-sm"
                >
                    Close
                </button>
            </div>

            {/* Page */}
            <div
                className="min-h-screen p-10 print:p-0"
                style={{ background: "#FEE9D6", fontFamily: "Inter, system-ui, sans-serif" }}
            >
                <div
                    className="max-w-[680px] mx-auto print:max-w-none"
                    style={{ background: "#FEE9D6" }}
                >
                    {/* ── Top accent bar ── */}
                    <div style={{ height: 10, background: "#402A1B", borderRadius: "4px 4px 0 0" }} />
                    <div style={{ height: 4, background: "#C9914C" }} />

                    {/* ── Header ── */}
                    <div style={{ padding: "28px 36px 20px", borderBottom: "1px solid #D4B896" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                            <div>
                                <h1 style={{ fontSize: 30, fontWeight: 800, color: "#402A1B", fontFamily: "Georgia, serif", margin: 0, lineHeight: 1.1 }}>
                                    Completion Checklist
                                </h1>
                                <p style={{ fontSize: 9, color: "#C9914C", letterSpacing: "0.14em", textTransform: "uppercase", marginTop: 6, fontWeight: 600 }}>
                                    {company} · CRM for Luthiers
                                </p>
                            </div>
                            <div style={{ textAlign: "right" }}>
                                <p style={{ fontSize: 11, color: "#6B5744", fontWeight: 700, margin: 0 }}>
                                    {fmt(job.completionDate ?? job.intakeDate)}
                                </p>
                                <p style={{ fontSize: 10, color: "#9A7F6A", marginTop: 2 }}>
                                    Job #{id.slice(-6).toUpperCase()}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* ── Job summary ── */}
                    <div style={{ padding: "18px 36px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 24px", borderBottom: "1px solid #D4B896" }}>
                        <InfoRow label="Client" value={(job as any).client?.name ?? "—"} />
                        <InfoRow label="Instrument" value={instrument} />
                        <InfoRow label="Service(s)" value={(job.workItems ?? []).map(w => w.name).join(", ") || "—"} />
                        {job.instrumentSerial && <InfoRow label="Serial No." value={job.instrumentSerial} mono />}
                        <InfoRow label="Intake date" value={fmt(job.intakeDate)} />
                        {job.completionDate && <InfoRow label="Completed" value={fmt(job.completionDate)} />}
                    </div>

                    {/* ── Completion checklist ── */}
                    <div style={{ padding: "20px 36px", borderBottom: checklistItems.length ? "1px solid #D4B896" : undefined }}>
                        <p style={{ fontSize: 9, fontWeight: 800, color: "#9A7F6A", textTransform: "uppercase", letterSpacing: "0.16em", marginBottom: 12 }}>
                            Work Completed
                        </p>
                        {checklistItems.length === 0 ? (
                            <p style={{ fontSize: 11, color: "#B08060", fontStyle: "italic" }}>
                                No checklist items defined for this service. Add them in Settings → Services.
                            </p>
                        ) : (
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 20px" }}>
                                {checklistItems.map((item, i) => (
                                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                        <div style={{
                                            width: 16, height: 16, borderRadius: 3, border: "1.5px solid #C9914C",
                                            flexShrink: 0, background: "white",
                                        }} />
                                        <span style={{ fontSize: 12, color: "#23211E" }}>{item}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* ── Condition at intake ── */}
                    {hasIntake && (
                        <div style={{ padding: "20px 36px", borderBottom: "1px solid #D4B896" }}>
                            <p style={{ fontSize: 9, fontWeight: 800, color: "#9A7F6A", textTransform: "uppercase", letterSpacing: "0.16em", marginBottom: 12 }}>
                                Condition at Intake
                            </p>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                                {CHECKLIST_PARTS.map(({ key, label }) => {
                                    const c = conditionLabel(checklist?.[key]);
                                    if (!c) return null;
                                    return (
                                        <div key={key} style={{
                                            background: "white", border: "1px solid #D4B896",
                                            borderRadius: 8, padding: "8px 10px",
                                        }}>
                                            <p style={{ fontSize: 9, color: "#9A7F6A", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700, margin: 0 }}>{label}</p>
                                            <p style={{ fontSize: 11, fontWeight: 800, marginTop: 3, color: c.label === "Good" ? "#059669" : c.label === "Fair" ? "#D97706" : "#DC2626" }}>
                                                {c.label}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                            {checklist?.notes && (
                                <p style={{ fontSize: 11, color: "#6B5744", marginTop: 10, fontStyle: "italic" }}>
                                    Note: {checklist.notes}
                                </p>
                            )}
                        </div>
                    )}

                    {/* ── Sign-off ── */}
                    <div style={{ padding: "24px 36px 20px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px 40px" }}>
                        <SignLine label="Technician" />
                        <SignLine label="Date" />
                        <SignLine label="Customer signature" />
                        <SignLine label="Guitar collected" />
                    </div>

                    {/* ── Footer ── */}
                    <div style={{ height: 4, background: "#C9914C" }} />
                    <div style={{ background: "#402A1B", padding: "10px 36px", display: "flex", justifyContent: "space-between", alignItems: "center", borderRadius: "0 0 4px 4px" }}>
                        <span style={{ fontSize: 16, fontWeight: 700, color: "#FEE9D6", fontFamily: "Georgia, serif", fontStyle: "italic" }}>
                            {company}
                        </span>
                        <span style={{ fontSize: 9, color: "#C9914C", letterSpacing: "0.12em", textTransform: "uppercase" }}>
                            Thank you for trusting us with your instrument.
                        </span>
                    </div>
                </div>
            </div>

            <style>{`
                @media print {
                    @page { margin: 15mm; size: A4; }
                    body { background: #FEE9D6 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                }
            `}</style>
        </>
    );
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
    return (
        <div>
            <p style={{ fontSize: 9, fontWeight: 700, color: "#9A7F6A", textTransform: "uppercase", letterSpacing: "0.12em", margin: 0 }}>{label}</p>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#23211E", marginTop: 2, fontFamily: mono ? "monospace" : undefined }}>{value}</p>
        </div>
    );
}

function SignLine({ label }: { label: string }) {
    return (
        <div>
            <div style={{ borderBottom: "1px solid #C9914C", height: 28 }} />
            <p style={{ fontSize: 9, color: "#9A7F6A", marginTop: 4, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600 }}>{label}</p>
        </div>
    );
}

export default function ChecklistPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin text-zinc-300" /></div>}>
            <ChecklistPrint id={id as Id<"jobs">} />
        </Suspense>
    );
}
