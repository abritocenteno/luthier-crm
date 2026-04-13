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

const conditionColor = (val: string | undefined) => {
    if (val === "good") return "#16a34a";
    if (val === "fair") return "#d97706";
    if (val === "poor") return "#dc2626";
    return "#999";
};

const fmt = (ts: number | undefined) =>
    ts ? new Date(ts).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "—";

function ChecklistPrint({ id }: { id: Id<"jobs"> }) {
    const job      = useQuery(api.jobs.get, { id });
    const svcs     = useQuery(api.services.list);
    const settings = useQuery(api.settings.get);

    if (job === undefined || svcs === undefined || settings === undefined) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="animate-spin text-zinc-300" size={32} />
            </div>
        );
    }
    if (!job) return <div className="p-12 text-center text-zinc-400">Job not found.</div>;

    // Aggregate checklist items from matching services
    const workNames = new Set((job.workItems ?? []).map((wi) => wi.name.toLowerCase()));
    const checklistItems: string[] = [];
    for (const svc of svcs) {
        if (workNames.has(svc.name.toLowerCase()) && svc.checklistItems?.length) {
            for (const item of svc.checklistItems) {
                if (!checklistItems.includes(item)) checklistItems.push(item);
            }
        }
    }

    const checklist   = job.intakeChecklist as Record<string, string> | undefined;
    const hasIntake   = checklist && CHECKLIST_PARTS.some((p) => checklist[p.key]);
    const instrument  = [job.instrumentBrand, job.instrumentModel].filter(Boolean).join(" ") || job.instrumentType;
    const company     = settings?.companyName || "FretOps";
    const services    = (job.workItems ?? []).map(w => w.name).join(", ") || "—";

    const FONT  = "Helvetica, Arial, sans-serif";
    const BLACK = "#111111";
    const GRAY  = "#888888";
    const PAGE  = { maxWidth: 680, margin: "0 auto", fontFamily: FONT, color: BLACK, position: "relative" as const, overflow: "hidden" };

    return (
        <>
            {/* Print / Close buttons — shown only when opened as a standalone page, not in iframe */}
            {typeof window !== "undefined" && window.self === window.top && (
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
            )}

            {/* Outer page */}
            <div style={{ background: "#fff", minHeight: "100vh", padding: "40px 24px" }} className="print:p-0">
                <div style={PAGE}>

                    {/* ── Watermark ── */}
                    <div style={{
                        position: "absolute",
                        top: "38%", left: "50%",
                        transform: "translate(-50%, -50%) rotate(-30deg)",
                        fontSize: 96,
                        fontFamily: "Georgia, serif",
                        fontStyle: "italic",
                        fontWeight: 700,
                        color: "rgba(0,0,0,0.045)",
                        whiteSpace: "nowrap",
                        pointerEvents: "none",
                        userSelect: "none",
                        zIndex: 0,
                    }}>
                        {company}
                    </div>

                    {/* All content sits above watermark */}
                    <div style={{ position: "relative", zIndex: 1 }}>

                        {/* ── Header ── */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", paddingBottom: 14, borderBottom: "1px solid #111" }}>
                            <div>
                                <div style={{ fontWeight: 700, fontSize: 14, letterSpacing: "0.01em" }}>{company}</div>
                                <div style={{ fontSize: 8, color: GRAY, letterSpacing: "0.18em", textTransform: "uppercase", marginTop: 3 }}>
                                    Instrument Completion Checklist
                                </div>
                            </div>
                            {/* Circular logomark */}
                            <svg width="36" height="36" viewBox="0 0 36 36">
                                <circle cx="18" cy="18" r="16" fill="none" stroke="#111" strokeWidth="1" />
                                <text x="18" y="23" textAnchor="middle" fontFamily="Helvetica, Arial, sans-serif" fontWeight="700" fontSize="14" fill="#111">F</text>
                            </svg>
                        </div>

                        {/* ── Job info row ── */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px 20px", padding: "16px 0 14px", borderBottom: "0.5px solid #ddd" }}>
                            <InfoCell label="Client" value={(job as any).client?.name ?? "—"} />
                            <InfoCell label="Instrument" value={instrument} />
                            <InfoCell label="Service(s)" value={services} />
                        </div>

                        {/* ── Completion items ── */}
                        <div style={{ paddingTop: 20 }}>
                            <SectionHeader text="Completion Items" />
                            <div style={{ marginTop: 14 }}>
                                {checklistItems.length === 0 ? (
                                    <p style={{ fontSize: 10, color: GRAY, fontStyle: "italic", margin: 0 }}>
                                        No checklist items defined for this service. Add them in Settings → Services.
                                    </p>
                                ) : (
                                    checklistItems.map((item, i) => (
                                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                                            {/* Square checkbox */}
                                            <svg width="10" height="10" viewBox="0 0 10 10" style={{ flexShrink: 0 }}>
                                                <rect x="0.5" y="0.5" width="9" height="9" fill="none" stroke="#111" strokeWidth="0.8" />
                                            </svg>
                                            <span style={{ fontSize: 10.5 }}>{item}</span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* ── Condition at intake ── */}
                        {hasIntake && (
                            <div style={{ paddingTop: 20 }}>
                                <SectionHeader text="Condition at Intake" />
                                <div style={{ marginTop: 14, display: "flex", flexWrap: "wrap" as const, gap: "8px 20px" }}>
                                    {CHECKLIST_PARTS.map(({ key, label }) => {
                                        const val = checklist?.[key];
                                        if (!val) return null;
                                        return (
                                            <div key={key} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 10 }}>
                                                <span style={{ color: GRAY }}>{label}:</span>
                                                <span style={{ fontWeight: 700, color: conditionColor(val), textTransform: "capitalize" }}>{val}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                                {checklist?.notes && (
                                    <p style={{ fontSize: 9.5, color: "#555", marginTop: 10, fontStyle: "italic" }}>
                                        Note: {checklist.notes}
                                    </p>
                                )}
                            </div>
                        )}

                        {/* ── Details ── */}
                        <div style={{ paddingTop: 24 }}>
                            <SectionHeader text="Details" />
                            <div style={{ marginTop: 14 }}>
                                {["Guitar", "Technician", "Date"].map((label) => (
                                    <div key={label} style={{ display: "flex", alignItems: "flex-end", gap: 16, marginBottom: 18 }}>
                                        <span style={{ fontSize: 10, width: 80, flexShrink: 0 }}>{label}</span>
                                        <div style={{ flex: 1, borderBottom: "0.6px solid #111", height: 18 }} />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* ── Notes / Remarks ── */}
                        <div style={{ paddingTop: 20 }}>
                            <SectionHeader text="Notes / Remarks" />
                            <div style={{
                                marginTop: 12,
                                border: "0.6px solid #111",
                                height: 100,
                                width: "100%",
                            }} />
                        </div>

                        {/* ── Footer ── */}
                        <div style={{ paddingTop: 28, paddingBottom: 8 }}>
                            <p style={{ fontSize: 7, color: GRAY, margin: 0 }}>fretops.com</p>
                        </div>

                    </div>
                </div>
            </div>

            <style>{`
                @media print {
                    @page { margin: 18mm; size: A4; }
                    body { background: #fff !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                }
            `}</style>
        </>
    );
}

function SectionHeader({ text }: { text: string }) {
    return (
        <div style={{ display: "inline-block" }}>
            <span style={{
                fontFamily: "Helvetica, Arial, sans-serif",
                fontWeight: 700,
                fontSize: 9,
                textTransform: "uppercase" as const,
                letterSpacing: "0.06em",
                textDecoration: "underline",
                textUnderlineOffset: 3,
            }}>
                {text}
            </span>
        </div>
    );
}

function InfoCell({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <div style={{ fontSize: 7.5, color: "#888", textTransform: "uppercase" as const, letterSpacing: "0.12em", marginBottom: 3 }}>{label}</div>
            <div style={{ fontSize: 10, fontWeight: 600 }}>{value}</div>
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
