// Lead/acquisition source for clients and jobs.
//
// Distinguishes work you win through your own channels ("direct") from work
// routed to you by an external platform such as Gitaarafstellen.nl. Kept as a
// small data table so new platforms can be added in one place and every form,
// badge, filter and report stays in sync.

export type LeadSource = "direct" | "gitaarafstellen";

export const DEFAULT_SOURCE: LeadSource = "direct";

export interface SourceMeta {
    value: LeadSource;
    /** Full label used in selects and reports. */
    label: string;
    /** Compact label used on badges. */
    short: string;
    /** Tailwind classes for the badge pill. */
    badgeClass: string;
}

export const LEAD_SOURCES: SourceMeta[] = [
    {
        value: "direct",
        label: "Direct",
        short: "Direct",
        badgeClass: "bg-zinc-100 text-zinc-600 border-zinc-200",
    },
    {
        value: "gitaarafstellen",
        label: "Gitaarafstellen.nl",
        short: "Gitaarafstellen",
        badgeClass: "bg-orange-50 text-orange-700 border-orange-200",
    },
];

/** Resolve a stored source value to its metadata, defaulting to "direct". */
export function sourceMeta(value?: string | null): SourceMeta {
    return LEAD_SOURCES.find((s) => s.value === value) ?? LEAD_SOURCES[0];
}
