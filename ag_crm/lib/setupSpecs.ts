/**
 * Setup Sheet reference data + helpers.
 *
 * Shared by the job detail Setup Sheet, the print view and the client portal.
 * Everything here is pure data / math — no Convex, no React — so it can run
 * anywhere (including the static-render print route).
 *
 * The numbers are sensible workshop defaults, not gospel: every target is
 * editable per job. Tunings carry note+octave so we can compute pitch
 * frequencies, and gauge sets carry a wound flag per string so the tension
 * estimate is reasonable for both plain and wound strings.
 */

// ---------------------------------------------------------------------------
// Measurements
// ---------------------------------------------------------------------------

export type MeasurementKey =
    | "actionTreble"
    | "actionBass"
    | "relief"
    | "nutTreble"
    | "nutBass"
    | "pickupTreble"
    | "pickupBass";

export interface MeasurementField {
    key: MeasurementKey;
    label: string;
    unit: string;
    hint: string;
    /** Instrument categories this field applies to. */
    appliesTo: SetupCategory[];
}

/** Ordered list of every measurement the Setup Sheet can record. */
export const MEASUREMENT_FIELDS: MeasurementField[] = [
    { key: "actionTreble", label: "Action — treble (12th fret)", unit: "mm", hint: "High-E / 1st string", appliesTo: ["guitar", "bass", "ukulele", "generic"] },
    { key: "actionBass", label: "Action — bass (12th fret)", unit: "mm", hint: "Low-E / thickest string", appliesTo: ["guitar", "bass", "ukulele", "generic"] },
    { key: "relief", label: "Neck relief", unit: "mm", hint: "Measured at ~7th–8th fret, capo 1st", appliesTo: ["guitar", "bass", "generic"] },
    { key: "nutTreble", label: "Nut slot — treble (1st fret)", unit: "mm", hint: "String clearance over 1st fret", appliesTo: ["guitar", "bass", "ukulele", "generic"] },
    { key: "nutBass", label: "Nut slot — bass (1st fret)", unit: "mm", hint: "String clearance over 1st fret", appliesTo: ["guitar", "bass", "ukulele", "generic"] },
    { key: "pickupTreble", label: "Pickup height — treble", unit: "mm", hint: "Bottom of string to pole, fretted last fret", appliesTo: ["guitar", "bass"] },
    { key: "pickupBass", label: "Pickup height — bass", unit: "mm", hint: "Bottom of string to pole, fretted last fret", appliesTo: ["guitar", "bass"] },
];

// ---------------------------------------------------------------------------
// Instrument categories & default target specs
// ---------------------------------------------------------------------------

export type SetupCategory = "guitar" | "bass" | "ukulele" | "generic";

export interface SetupDefaults {
    scaleLength: number; // inches
    targets: Partial<Record<MeasurementKey, number>>; // mm
}

/** Maps a free-text instrumentType (e.g. "Guitar", "Bass") to a category. */
export function categoryForInstrument(instrumentType?: string): SetupCategory {
    const t = (instrumentType ?? "").toLowerCase();
    if (t.includes("bass")) return "bass";
    if (t.includes("ukulele")) return "ukulele";
    if (t.includes("guitar")) return "guitar";
    return "generic";
}

export const SETUP_DEFAULTS: Record<SetupCategory, SetupDefaults> = {
    guitar: {
        scaleLength: 25.5,
        targets: { actionTreble: 1.6, actionBass: 2.0, relief: 0.25, nutTreble: 0.3, nutBass: 0.5, pickupTreble: 2.0, pickupBass: 2.4 },
    },
    bass: {
        scaleLength: 34,
        targets: { actionTreble: 2.2, actionBass: 2.8, relief: 0.35, nutTreble: 0.5, nutBass: 0.8, pickupTreble: 3.0, pickupBass: 3.5 },
    },
    ukulele: {
        scaleLength: 15,
        targets: { actionTreble: 2.5, actionBass: 2.8, nutTreble: 0.5, nutBass: 0.6 },
    },
    generic: {
        scaleLength: 25.5,
        targets: { actionTreble: 2.0, actionBass: 2.5, relief: 0.3 },
    },
};

// ---------------------------------------------------------------------------
// Tunings
// ---------------------------------------------------------------------------

export interface Tuning {
    name: string;
    category: SetupCategory;
    /** Notes low → high, with octave, e.g. "E2". */
    notes: string[];
    /** Human-readable gauge label, e.g. ".010–.046". */
    gaugeLabel: string;
}

export const TUNINGS: Tuning[] = [
    // Guitar
    { name: "E Standard", category: "guitar", notes: ["E2", "A2", "D3", "G3", "B3", "E4"], gaugeLabel: ".010–.046" },
    { name: "Drop D", category: "guitar", notes: ["D2", "A2", "D3", "G3", "B3", "E4"], gaugeLabel: ".010–.046" },
    { name: "Eb / Half-step down", category: "guitar", notes: ["D#2", "G#2", "C#3", "F#3", "A#3", "D#4"], gaugeLabel: ".011–.049" },
    { name: "D Standard", category: "guitar", notes: ["D2", "G2", "C3", "F3", "A3", "D4"], gaugeLabel: ".011–.052" },
    { name: "Drop C", category: "guitar", notes: ["C2", "G2", "C3", "F3", "A3", "D4"], gaugeLabel: ".011–.056" },
    { name: "DADGAD", category: "guitar", notes: ["D2", "A2", "D3", "G3", "A3", "D4"], gaugeLabel: ".010–.046" },
    { name: "Open G", category: "guitar", notes: ["D2", "G2", "D3", "G3", "B3", "D4"], gaugeLabel: ".010–.046" },
    { name: "Open D", category: "guitar", notes: ["D2", "A2", "D3", "F#3", "A3", "D4"], gaugeLabel: ".010–.046" },
    { name: "7-string Standard (B)", category: "guitar", notes: ["B1", "E2", "A2", "D3", "G3", "B3", "E4"], gaugeLabel: ".010–.059" },
    // Bass
    { name: "Bass — E Standard (4)", category: "bass", notes: ["E1", "A1", "D2", "G2"], gaugeLabel: ".045–.105" },
    { name: "Bass — Eb / Half-step down (4)", category: "bass", notes: ["D#1", "G#1", "C#2", "F#2"], gaugeLabel: ".045–.105" },
    { name: "Bass — Drop D (4)", category: "bass", notes: ["D1", "A1", "D2", "G2"], gaugeLabel: ".045–.105" },
    { name: "Bass — B Standard (5)", category: "bass", notes: ["B0", "E1", "A1", "D2", "G2"], gaugeLabel: ".045–.130" },
    // Ukulele
    { name: "Ukulele — gCEA (reentrant)", category: "ukulele", notes: ["G4", "C4", "E4", "A4"], gaugeLabel: "Standard soprano/concert" },
];

// ---------------------------------------------------------------------------
// String gauge sets (low → high pitch), with wound flag per string
// ---------------------------------------------------------------------------

export interface GaugeString {
    gauge: number; // inches
    wound: boolean;
}

export interface GaugeSet {
    name: string;
    category: SetupCategory;
    strings: GaugeString[]; // ordered low → high pitch (thickest first)
}

const g = (gauge: number, wound: boolean): GaugeString => ({ gauge, wound });

export const GAUGE_SETS: GaugeSet[] = [
    // Guitar (6 strings, low → high)
    { name: "Extra Light (8–38)", category: "guitar", strings: [g(0.038, true), g(0.03, true), g(0.022, true), g(0.014, false), g(0.011, false), g(0.008, false)] },
    { name: "Super Light (9–42)", category: "guitar", strings: [g(0.042, true), g(0.032, true), g(0.024, true), g(0.016, false), g(0.011, false), g(0.009, false)] },
    { name: "Light (10–46)", category: "guitar", strings: [g(0.046, true), g(0.036, true), g(0.026, true), g(0.017, false), g(0.013, false), g(0.01, false)] },
    { name: "Medium (11–49)", category: "guitar", strings: [g(0.049, true), g(0.038, true), g(0.028, true), g(0.018, false), g(0.014, false), g(0.011, false)] },
    { name: "Heavy (12–54)", category: "guitar", strings: [g(0.054, true), g(0.042, true), g(0.032, true), g(0.024, true), g(0.016, false), g(0.012, false)] },
    { name: "7-string (10–59)", category: "guitar", strings: [g(0.059, true), g(0.046, true), g(0.036, true), g(0.026, true), g(0.017, false), g(0.013, false), g(0.01, false)] },
    // Bass (4 / 5 strings, low → high)
    { name: "Bass Light (40–95)", category: "bass", strings: [g(0.095, true), g(0.075, true), g(0.055, true), g(0.04, true)] },
    { name: "Bass Medium (45–105)", category: "bass", strings: [g(0.105, true), g(0.085, true), g(0.065, true), g(0.045, true)] },
    { name: "Bass 5-string (45–130)", category: "bass", strings: [g(0.13, true), g(0.105, true), g(0.085, true), g(0.065, true), g(0.045, true)] },
];

// ---------------------------------------------------------------------------
// Tension math
// ---------------------------------------------------------------------------

// Plain steel: unit weight (lb/in) = density(0.284 lb/in³) × π/4 × d² = 0.2231·d².
const STEEL_K = 0.2231;
// Nickel-wound strings carry extra mass from the wrap; this factor is calibrated
// against published D'Addario nickel-wound unit weights (within a few %).
const WOUND_FACTOR = 1.1;
// g in in/s² (used by the Mersenne tension formula).
const G_IN = 386.4;

const NOTE_SEMITONES: Record<string, number> = {
    C: -9, "C#": -8, Db: -8, D: -7, "D#": -6, Eb: -6, E: -5,
    F: -4, "F#": -3, Gb: -3, G: -2, "G#": -1, Ab: -1, A: 0, "A#": 1, Bb: 1, B: 2,
};

/** Frequency (Hz) of a scientific-pitch note like "E2" or "F#3". A4 = 440. */
export function noteToFrequency(note: string): number | null {
    const m = note.match(/^([A-G][#b]?)(-?\d+)$/);
    if (!m) return null;
    const semitone = NOTE_SEMITONES[m[1]];
    if (semitone === undefined) return null;
    const octave = parseInt(m[2], 10);
    // Semitones from A4 (octave 4). Each octave = 12 semitones.
    const fromA4 = semitone + (octave - 4) * 12;
    return 440 * Math.pow(2, fromA4 / 12);
}

function unitWeight(gauge: number, wound: boolean): number {
    return STEEL_K * gauge * gauge * (wound ? WOUND_FACTOR : 1);
}

/** Tension (lb) of one string. Mersenne: T = UW·(2·L·f)² / g. */
export function stringTension(gauge: number, wound: boolean, freqHz: number, scaleIn: number): number {
    const uw = unitWeight(gauge, wound);
    return (uw * Math.pow(2 * scaleIn * freqHz, 2)) / G_IN;
}

export interface TensionResult {
    perString: { note: string; gauge: number; tensionLb: number }[];
    totalLb: number;
    totalKg: number;
}

/**
 * Estimate total tension for a tuning + gauge set at a given scale length.
 * Pairs notes (low→high) with gauges (low→high) by index; returns null if the
 * string counts don't match or any note can't be parsed.
 */
export function estimateTension(notes: string[], set: GaugeSet, scaleIn: number): TensionResult | null {
    if (notes.length !== set.strings.length) return null;
    const perString: TensionResult["perString"] = [];
    let totalLb = 0;
    for (let i = 0; i < notes.length; i++) {
        const freq = noteToFrequency(notes[i]);
        if (freq === null) return null;
        const s = set.strings[i];
        const t = stringTension(s.gauge, s.wound, freq, scaleIn);
        perString.push({ note: notes[i], gauge: s.gauge, tensionLb: t });
        totalLb += t;
    }
    return { perString, totalLb, totalKg: totalLb * 0.453592 };
}

/** Format an inch gauge as a 3-decimal string, e.g. 0.046 → ".046". */
export function formatGauge(gauge: number): string {
    return gauge.toFixed(3).replace(/^0/, "");
}
