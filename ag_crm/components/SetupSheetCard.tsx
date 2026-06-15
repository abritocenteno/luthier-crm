"use client";

import { useMemo, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { Ruler, Pencil, Check, X, RotateCcw, Loader2, Gauge } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    MEASUREMENT_FIELDS,
    MeasurementKey,
    TUNINGS,
    GAUGE_SETS,
    SETUP_DEFAULTS,
    categoryForInstrument,
    estimateTension,
} from "@/lib/setupSpecs";

type Pair = { target?: number; actual?: number };
type Measurements = Partial<Record<MeasurementKey, Pair>>;
type SetupSpec = {
    tuning?: string;
    gaugeSet?: string;
    scaleLength?: number;
    measurements?: Measurements;
    notes?: string;
};

const Card = ({ children }: { children: React.ReactNode }) => (
    <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">{children}</div>
);

const Label = ({ children }: { children: React.ReactNode }) => (
    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">{children}</p>
);

function numOrUndef(s: string): number | undefined {
    if (s.trim() === "") return undefined;
    const n = Number(s);
    return Number.isFinite(n) ? n : undefined;
}

function hasAnyData(spec?: SetupSpec): boolean {
    if (!spec) return false;
    if (spec.tuning || spec.gaugeSet || spec.scaleLength || spec.notes) return true;
    const m = spec.measurements ?? {};
    return Object.values(m).some((p) => p && (p.target !== undefined || p.actual !== undefined));
}

export function SetupSheetCard({
    jobId,
    instrumentType,
    setupSpec,
    readOnly,
}: {
    jobId: Id<"jobs">;
    instrumentType?: string;
    setupSpec?: SetupSpec;
    readOnly?: boolean;
}) {
    const save = useMutation(api.jobs.updateSetupSpec);
    const category = categoryForInstrument(instrumentType);

    const fields = useMemo(
        () => MEASUREMENT_FIELDS.filter((f) => f.appliesTo.includes(category)),
        [category]
    );
    const tunings = useMemo(
        () => TUNINGS.filter((t) => (category === "generic" ? true : t.category === category)),
        [category]
    );
    const gaugeSets = useMemo(
        () => GAUGE_SETS.filter((s) => (category === "generic" || category === "ukulele" ? true : s.category === category)),
        [category]
    );

    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [draft, setDraft] = useState<SetupSpec>(setupSpec ?? {});

    const spec = editing ? draft : setupSpec ?? {};
    const tension = useMemo(() => {
        const tuning = TUNINGS.find((t) => t.name === spec.tuning);
        const set = GAUGE_SETS.find((s) => s.name === spec.gaugeSet);
        if (!tuning || !set || !spec.scaleLength) return null;
        return estimateTension(tuning.notes, set, spec.scaleLength);
    }, [spec.tuning, spec.gaugeSet, spec.scaleLength]);

    const startEdit = () => {
        setDraft(setupSpec ?? {});
        setEditing(true);
    };

    const applyDefaults = () => {
        const d = SETUP_DEFAULTS[category];
        setDraft((prev) => {
            const measurements: Measurements = { ...prev.measurements };
            for (const f of fields) {
                const target = d.targets[f.key];
                if (target !== undefined) {
                    measurements[f.key] = { ...measurements[f.key], target };
                }
            }
            return { ...prev, scaleLength: prev.scaleLength ?? d.scaleLength, measurements };
        });
    };

    const setMeasurement = (key: MeasurementKey, which: "target" | "actual", value: string) => {
        setDraft((prev) => {
            const measurements: Measurements = { ...prev.measurements };
            measurements[key] = { ...measurements[key], [which]: numOrUndef(value) };
            return { ...prev, measurements };
        });
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Build a clean payload: drop empty measurement entries / undefined fields.
            const measurements: Measurements = {};
            for (const f of fields) {
                const p = draft.measurements?.[f.key];
                if (p && (p.target !== undefined || p.actual !== undefined)) {
                    measurements[f.key] = {
                        ...(p.target !== undefined ? { target: p.target } : {}),
                        ...(p.actual !== undefined ? { actual: p.actual } : {}),
                    };
                }
            }
            const payload: SetupSpec = {
                ...(draft.tuning ? { tuning: draft.tuning } : {}),
                ...(draft.gaugeSet ? { gaugeSet: draft.gaugeSet } : {}),
                ...(draft.scaleLength !== undefined ? { scaleLength: draft.scaleLength } : {}),
                ...(Object.keys(measurements).length ? { measurements } : {}),
                ...(draft.notes?.trim() ? { notes: draft.notes.trim() } : {}),
            };
            await save({ id: jobId, setupSpec: payload });
            setEditing(false);
        } finally {
            setSaving(false);
        }
    };

    const populated = hasAnyData(setupSpec);

    // ---- Read-only / print view -------------------------------------------
    if (readOnly) {
        if (!populated) return null;
        return (
            <Card>
                <div className="px-6 pt-6 pb-2 flex items-center gap-2">
                    <Ruler size={12} className="text-zinc-400" />
                    <Label>Setup Sheet</Label>
                </div>
                <SetupSummary spec={setupSpec!} fields={fields} tension={tension} />
            </Card>
        );
    }

    // ---- Empty state -------------------------------------------------------
    if (!editing && !populated) {
        return (
            <Card>
                <div className="px-6 pt-6 pb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Ruler size={12} className="text-zinc-400" />
                        <Label>Setup Sheet</Label>
                    </div>
                </div>
                <div className="px-6 pb-8 text-center space-y-3">
                    <p className="text-sm text-zinc-400 italic">No setup sheet yet — record tuning, string gauge and target vs. actual measurements.</p>
                    <button
                        onClick={() => { setDraft(setupSpec ?? {}); setEditing(true); }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 text-white rounded-xl text-xs font-bold hover:bg-black transition-all active:scale-95"
                    >
                        <Pencil size={12} /> Add Setup Sheet
                    </button>
                </div>
            </Card>
        );
    }

    // ---- Display (with data) ----------------------------------------------
    if (!editing) {
        return (
            <Card>
                <div className="px-6 pt-6 pb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Ruler size={12} className="text-zinc-400" />
                        <Label>Setup Sheet</Label>
                    </div>
                    <button
                        onClick={startEdit}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-50 border border-zinc-200 text-zinc-600 rounded-xl text-xs font-bold hover:border-black hover:text-black transition-all active:scale-95"
                    >
                        <Pencil size={12} /> Edit
                    </button>
                </div>
                <SetupSummary spec={setupSpec!} fields={fields} tension={tension} />
            </Card>
        );
    }

    // ---- Edit mode ---------------------------------------------------------
    return (
        <Card>
            <div className="px-6 pt-6 pb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Ruler size={12} className="text-zinc-400" />
                    <Label>Setup Sheet</Label>
                </div>
                <button
                    onClick={applyDefaults}
                    type="button"
                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-zinc-500 rounded-lg text-[11px] font-bold hover:text-black hover:bg-zinc-100 transition-all"
                    title="Fill target values from typical specs for this instrument"
                >
                    <RotateCcw size={11} /> Use defaults
                </button>
            </div>

            <div className="px-6 space-y-4 pb-4">
                {/* Tuning / gauge / scale */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Tuning</p>
                        <select
                            value={draft.tuning ?? ""}
                            onChange={(e) => setDraft((p) => ({ ...p, tuning: e.target.value || undefined }))}
                            className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:border-black"
                        >
                            <option value="">—</option>
                            {tunings.map((t) => <option key={t.name} value={t.name}>{t.name}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">String gauge</p>
                        <select
                            value={draft.gaugeSet ?? ""}
                            onChange={(e) => setDraft((p) => ({ ...p, gaugeSet: e.target.value || undefined }))}
                            className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:border-black"
                        >
                            <option value="">—</option>
                            {gaugeSets.map((s) => <option key={s.name} value={s.name}>{s.name}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Scale (in)</p>
                        <input
                            type="number" step="0.01" inputMode="decimal"
                            value={draft.scaleLength ?? ""}
                            onChange={(e) => setDraft((p) => ({ ...p, scaleLength: numOrUndef(e.target.value) }))}
                            placeholder="25.5"
                            className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:border-black"
                        />
                    </div>
                </div>

                {tension && (
                    <div className="flex items-center gap-2 text-xs text-zinc-500 bg-zinc-50 border border-zinc-100 rounded-xl px-3 py-2">
                        <Gauge size={13} className="text-zinc-400" />
                        Estimated total tension <span className="font-bold text-zinc-700">{tension.totalKg.toFixed(1)} kg</span>
                        <span className="text-zinc-400">({tension.totalLb.toFixed(0)} lb)</span>
                    </div>
                )}

                {/* Measurements grid */}
                <div className="space-y-2">
                    <div className="grid grid-cols-[1fr_5rem_5rem] gap-2 items-center px-1">
                        <span />
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-center">Target</span>
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-center">Actual</span>
                    </div>
                    {fields.map((f) => {
                        const p = draft.measurements?.[f.key] ?? {};
                        return (
                            <div key={f.key} className="grid grid-cols-[1fr_5rem_5rem] gap-2 items-center">
                                <div className="min-w-0">
                                    <p className="text-sm text-zinc-700 truncate">{f.label}</p>
                                    <p className="text-[10px] text-zinc-400 truncate">{f.hint}</p>
                                </div>
                                <input
                                    type="number" step="0.05" inputMode="decimal"
                                    value={p.target ?? ""}
                                    onChange={(e) => setMeasurement(f.key, "target", e.target.value)}
                                    placeholder="–"
                                    className="w-full px-2 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-center focus:outline-none focus:border-black"
                                />
                                <input
                                    type="number" step="0.05" inputMode="decimal"
                                    value={p.actual ?? ""}
                                    onChange={(e) => setMeasurement(f.key, "actual", e.target.value)}
                                    placeholder="–"
                                    className="w-full px-2 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-center focus:outline-none focus:border-black"
                                />
                            </div>
                        );
                    })}
                    <p className="text-[10px] text-zinc-400 px-1">All measurements in mm.</p>
                </div>

                {/* Notes */}
                <div className="space-y-1">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Notes</p>
                    <textarea
                        rows={2}
                        value={draft.notes ?? ""}
                        onChange={(e) => setDraft((p) => ({ ...p, notes: e.target.value }))}
                        placeholder="e.g. customer prefers low action, slight buzz acceptable"
                        className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:border-black resize-none"
                    />
                </div>
            </div>

            <div className="px-6 py-4 border-t border-zinc-100 flex items-center justify-end gap-2">
                <button
                    onClick={() => setEditing(false)}
                    disabled={saving}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-zinc-500 rounded-xl text-xs font-bold hover:bg-zinc-100 transition-all disabled:opacity-50"
                >
                    <X size={12} /> Cancel
                </button>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-1.5 px-4 py-1.5 bg-zinc-900 text-white rounded-xl text-xs font-bold hover:bg-black transition-all active:scale-95 disabled:opacity-50"
                >
                    {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                    {saving ? "Saving…" : "Save"}
                </button>
            </div>
        </Card>
    );
}

/** Shared read-only body for both the dashboard display and the print/portal views. */
function SetupSummary({
    spec,
    fields,
    tension,
}: {
    spec: SetupSpec;
    fields: typeof MEASUREMENT_FIELDS;
    tension: ReturnType<typeof estimateTension>;
}) {
    const chips = [
        spec.tuning && { label: "Tuning", value: spec.tuning },
        spec.gaugeSet && { label: "Gauge", value: spec.gaugeSet },
        spec.scaleLength && { label: "Scale", value: `${spec.scaleLength}"` },
    ].filter(Boolean) as { label: string; value: string }[];

    const rows = fields.filter((f) => {
        const p = spec.measurements?.[f.key];
        return p && (p.target !== undefined || p.actual !== undefined);
    });

    return (
        <div className="pb-2">
            {chips.length > 0 && (
                <div className="px-6 pb-3 flex flex-wrap gap-2">
                    {chips.map((c) => (
                        <span key={c.label} className="inline-flex items-center gap-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1">
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{c.label}</span>
                            <span className="font-semibold text-zinc-700">{c.value}</span>
                        </span>
                    ))}
                </div>
            )}

            {tension && (
                <div className="px-6 pb-3">
                    <span className="inline-flex items-center gap-2 text-xs text-zinc-500">
                        <Gauge size={13} className="text-zinc-400" />
                        Est. total tension <span className="font-bold text-zinc-700">{tension.totalKg.toFixed(1)} kg</span>
                        <span className="text-zinc-400">({tension.totalLb.toFixed(0)} lb)</span>
                    </span>
                </div>
            )}

            {rows.length > 0 && (
                <div className="border-t border-zinc-50">
                    <div className="grid grid-cols-[1fr_4.5rem_4.5rem] gap-2 px-6 py-2 border-b border-zinc-50">
                        <span />
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-right">Target</span>
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-right">Actual</span>
                    </div>
                    {rows.map((f) => {
                        const p = spec.measurements![f.key]!;
                        const off = p.target !== undefined && p.actual !== undefined && Math.abs(p.actual - p.target) > 0.001;
                        return (
                            <div key={f.key} className="grid grid-cols-[1fr_4.5rem_4.5rem] gap-2 px-6 py-2.5 items-center">
                                <span className="text-sm text-zinc-600 truncate">{f.label}</span>
                                <span className="text-sm text-zinc-400 text-right tabular-nums">{p.target !== undefined ? `${p.target}` : "–"}</span>
                                <span className={cn("text-sm text-right tabular-nums font-semibold", off ? "text-amber-600" : "text-zinc-700")}>
                                    {p.actual !== undefined ? `${p.actual}` : "–"}
                                </span>
                            </div>
                        );
                    })}
                    <p className="text-[10px] text-zinc-400 px-6 py-2">All measurements in mm.</p>
                </div>
            )}

            {spec.notes && (
                <div className="px-6 py-3 border-t border-zinc-50 space-y-1">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Notes</p>
                    <p className="text-sm text-zinc-600">{spec.notes}</p>
                </div>
            )}
        </div>
    );
}
