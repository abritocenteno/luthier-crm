"use client";

import { use, Suspense } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import { Loader2, Printer } from "lucide-react";

const CHECKLIST_PARTS = [
    { key: "tuners",      label: "Tuners" },
    { key: "frets",       label: "Frets" },
    { key: "nut",         label: "Nut" },
    { key: "bridge",      label: "Bridge / Saddle" },
    { key: "neck",        label: "Neck / Truss Rod" },
    { key: "body",        label: "Body / Finish" },
    { key: "electronics", label: "Electronics" },
] as const;

const conditionBadgeStyle = (val: string | undefined): React.CSSProperties => {
    const base: React.CSSProperties = {
        display: "inline-block",
        fontSize: 8,
        fontWeight: 700,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        padding: "2px 7px",
        borderRadius: 2,
        border: "0.6px solid",
    };
    if (val === "good") return { ...base, color: "#166534", borderColor: "#166534", background: "#f0fdf4" };
    if (val === "fair") return { ...base, color: "#92400e", borderColor: "#92400e", background: "#fffbeb" };
    if (val === "poor") return { ...base, color: "#991b1b", borderColor: "#991b1b", background: "#fef2f2" };
    return { ...base, color: "#888", borderColor: "#ccc" };
};

// ── Section header with extending rule ──────────────────────────────────────
function SectionRule({ text }: { text: string }) {
    return (
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <span style={{
                fontFamily: "Helvetica, Arial, sans-serif",
                fontWeight: 700,
                fontSize: 8,
                textTransform: "uppercase",
                letterSpacing: "0.2em",
                color: "#111",
                whiteSpace: "nowrap",
                flexShrink: 0,
            }}>
                {text}
            </span>
            <div style={{ flex: 1, height: "0.6px", background: "#111" }} />
        </div>
    );
}

function InfoCell({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <div style={{
                fontSize: 7,
                color: "#aaa",
                textTransform: "uppercase",
                letterSpacing: "0.16em",
                marginBottom: 4,
                fontWeight: 600,
            }}>
                {label}
            </div>
            <div style={{ fontSize: 10.5, fontWeight: 600, color: "#111", lineHeight: 1.3 }}>{value}</div>
        </div>
    );
}

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

    const checklist  = job.intakeChecklist as Record<string, string> | undefined;
    const hasIntake  = checklist && CHECKLIST_PARTS.some((p) => checklist[p.key]);
    const instrument = [job.instrumentBrand, job.instrumentModel].filter(Boolean).join(" ") || job.instrumentType;
    const company    = settings?.companyName || "FretOps";
    const services   = (job.workItems ?? []).map(w => w.name).join(", ") || "—";

    const FONT = "'Helvetica Neue', Helvetica, Arial, sans-serif";

    // Split checklist into two columns
    const half = Math.ceil(checklistItems.length / 2);
    const col1 = checklistItems.slice(0, half);
    const col2 = checklistItems.slice(half);

    return (
        <>
            {/* Print / Close buttons — standalone only */}
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

            <div style={{ background: "#fff" }} className="print:p-0">
                <div style={{
                    maxWidth: 680,
                    margin: "0 auto",
                    fontFamily: FONT,
                    color: "#111",
                    position: "relative",
                    padding: "48px 40px 40px",
                    overflow: "hidden",
                }}>

                    {/* ── Watermark ── */}
                    <div className="checklist-watermark" style={{
                        position: "absolute",
                        top: "42%", left: "50%",
                        transform: "translate(-50%, -50%)",
                        width: 850,
                        height: 850,
                        pointerEvents: "none",
                        userSelect: "none",
                        zIndex: 0,
                        opacity: 0.055,
                    }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/thedot-logo.png" alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                    </div>

                    <div style={{ position: "relative", zIndex: 1 }}>

                        {/* ── Header ── */}
                        {/* Thick top rule */}
                        <div style={{ height: 3, background: "#111", marginBottom: 20 }} />

                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                            {/* Left: brand + doc type */}
                            <div>
                                <div style={{
                                    fontWeight: 800,
                                    fontSize: 28,
                                    letterSpacing: "-0.02em",
                                    lineHeight: 1,
                                    marginBottom: 8,
                                }}>
                                    {company.toUpperCase()}
                                </div>
                                <div style={{
                                    fontSize: 7.5,
                                    color: "#888",
                                    letterSpacing: "0.28em",
                                    textTransform: "uppercase",
                                    fontWeight: 500,
                                }}>
                                    Instrument Completion Checklist
                                </div>
                            </div>

                            {/* Right: TheDot logo */}
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src="/thedot-logo.png"
                                alt="The Dot Guitars"
                                style={{ width: 64, height: 64, objectFit: "contain", flexShrink: 0, marginTop: 2 }}
                            />
                        </div>

                        {/* Thin rule */}
                        <div style={{ height: "0.6px", background: "#ddd", marginBottom: 18 }} />

                        {/* ── Job info ── */}
                        <div style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr 1fr",
                            gap: "0 24px",
                            padding: "14px 0 16px",
                            borderBottom: "0.6px solid #ddd",
                            marginBottom: 28,
                        }}>
                            <InfoCell label="Client"       value={(job as any).client?.name ?? "—"} />
                            <InfoCell label="Instrument"   value={instrument} />
                            <InfoCell label="Service(s)"   value={services} />
                        </div>

                        {/* ── Completion items ── */}
                        <div style={{ marginBottom: 28 }}>
                            <SectionRule text="Completion Items" />
                            {checklistItems.length === 0 ? (
                                <p style={{ fontSize: 10, color: "#aaa", fontStyle: "italic", margin: 0 }}>
                                    No checklist items defined for this service. Add them in Settings → Services.
                                </p>
                            ) : (
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 32px" }}>
                                    {[col1, col2].map((col, ci) => (
                                        <div key={ci}>
                                            {col.map((item, i) => (
                                                <div key={i} style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: 11,
                                                    paddingBottom: 13,
                                                    borderBottom: "0.4px solid #eee",
                                                    marginBottom: 13,
                                                }}>
                                                    {/* Square checkbox */}
                                                    <svg width="11" height="11" viewBox="0 0 11 11" style={{ flexShrink: 0 }}>
                                                        <rect x="0.6" y="0.6" width="9.8" height="9.8" fill="none" stroke="#111" strokeWidth="0.8" />
                                                    </svg>
                                                    <span style={{ fontSize: 10, lineHeight: 1.4, color: "#222" }}>{item}</span>
                                                </div>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* ── Condition at intake ── */}
                        {hasIntake && (
                            <div style={{ marginBottom: 28 }}>
                                <SectionRule text="Condition at Intake" />
                                <div style={{ marginBottom: checklist?.notes ? 12 : 0 }}>
                                    {CHECKLIST_PARTS.map(({ key, label }) => {
                                        const val = checklist?.[key];
                                        if (!val) return null;
                                        return (
                                            <div key={key} style={{
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "space-between",
                                                paddingTop: 9,
                                                paddingBottom: 9,
                                                borderBottom: "0.4px solid #eee",
                                            }}>
                                                <span style={{ fontSize: 10, color: "#444" }}>{label}</span>
                                                <span style={conditionBadgeStyle(val)}>{val}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                                {checklist?.notes && (
                                    <p style={{
                                        fontSize: 9,
                                        color: "#666",
                                        fontStyle: "italic",
                                        margin: 0,
                                        paddingTop: 10,
                                        borderTop: "0.4px solid #eee",
                                        lineHeight: 1.5,
                                    }}>
                                        {checklist.notes}
                                    </p>
                                )}
                            </div>
                        )}

                        {/* ── Sign-off ── */}
                        <div style={{ marginBottom: 28 }}>
                            <SectionRule text="Sign-off" />
                            <div style={{ display: "grid", gridTemplateColumns: "80px 1fr", rowGap: 18, alignItems: "end" }}>
                                {["Guitar", "Technician", "Date"].map((label) => (
                                    <>
                                        <span key={label + "-label"} style={{ fontSize: 9.5, color: "#555", paddingBottom: 4 }}>{label}</span>
                                        <div key={label + "-line"} style={{
                                            borderBottom: "0.6px solid #bbb",
                                            height: 20,
                                            backgroundImage: "none",
                                        }} />
                                    </>
                                ))}
                            </div>
                        </div>

                        {/* ── Notes / Remarks ── */}
                        <div style={{ marginBottom: 32 }}>
                            <SectionRule text="Notes / Remarks" />
                            {/* Box with corner marks */}
                            <div style={{ position: "relative", height: 110 }}>
                                <div style={{
                                    position: "absolute", inset: 0,
                                    border: "0.6px solid #ccc",
                                }} />
                                {/* Corner ticks */}
                                {[
                                    { top: -1, left: -1, borderTop: "1.5px solid #111", borderLeft: "1.5px solid #111", borderRight: "none", borderBottom: "none" },
                                    { top: -1, right: -1, borderTop: "1.5px solid #111", borderRight: "1.5px solid #111", borderLeft: "none", borderBottom: "none" },
                                    { bottom: -1, left: -1, borderBottom: "1.5px solid #111", borderLeft: "1.5px solid #111", borderTop: "none", borderRight: "none" },
                                    { bottom: -1, right: -1, borderBottom: "1.5px solid #111", borderRight: "1.5px solid #111", borderTop: "none", borderLeft: "none" },
                                ].map((s, i) => (
                                    <div key={i} style={{
                                        position: "absolute",
                                        width: 12, height: 12,
                                        ...s,
                                    }} />
                                ))}
                            </div>
                        </div>

                        {/* ── Footer ── */}
                        <div style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr 1fr",
                            alignItems: "center",
                            paddingTop: 14,
                            borderTop: "0.6px solid #e5e5e5",
                        }}>
                            <span style={{ fontSize: 7, color: "#bbb", letterSpacing: "0.06em" }}>
                                www.thedotguitars.com
                            </span>
                            <span style={{ fontSize: 7, color: "#bbb", letterSpacing: "0.06em", textAlign: "center" }}>
                                {company} — {new Date().getFullYear()}
                            </span>
                            <span style={{ fontSize: 7, color: "#ddd", letterSpacing: "0.1em", textTransform: "uppercase", textAlign: "right" }}>
                                Completion Record
                            </span>
                        </div>

                    </div>
                </div>
            </div>

            <style>{`
                @media print {
                    @page { margin: 16mm; size: A4; }
                    body { background: #fff !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    /* Fix watermark: pin it to the printed page so it never triggers a page break */
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

export default function ChecklistPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="animate-spin text-zinc-300" />
            </div>
        }>
            <ChecklistPrint id={id as Id<"jobs">} />
        </Suspense>
    );
}
