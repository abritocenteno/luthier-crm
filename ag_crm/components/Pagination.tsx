"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Hook ─────────────────────────────────────────────────────────────────────
//
// Client-side pagination over an already-loaded array. `resetKey` should be a
// string signature of the active search/filters/sort — when it changes we jump
// back to page 1 so you're never stranded on an out-of-range page.

export type PaginationState = {
    page: number;
    setPage: (p: number) => void;
    totalPages: number;
    total: number;
    startIndex: number;
    endIndex: number;
};

export function usePagination<T>(
    items: T[],
    pageSize = 15,
    resetKey = ""
): PaginationState & { pageItems: T[] } {
    const [page, setPage] = useState(1);
    const total = items.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    // Reset to the first page whenever the filter/sort signature changes.
    // Adjusting state during render (React's recommended pattern) instead of in
    // an effect avoids a wasted render + cascading update.
    const [prevKey, setPrevKey] = useState(resetKey);
    if (prevKey !== resetKey) {
        setPrevKey(resetKey);
        setPage(1);
    }

    // Clamp for display without mutating state — keeps things stable if the list
    // shrinks under the current page (e.g. after a delete).
    const safePage = Math.min(Math.max(1, page), totalPages);
    const startIndex = (safePage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, total);
    const pageItems = useMemo(
        () => items.slice(startIndex, startIndex + pageSize),
        [items, startIndex, pageSize]
    );

    return { page: safePage, setPage, totalPages, total, startIndex, endIndex, pageItems };
}

// ── Page-number range with ellipses ──────────────────────────────────────────

function pageRange(current: number, total: number): (number | "ellipsis")[] {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const pages: (number | "ellipsis")[] = [1];
    const left = Math.max(2, current - 1);
    const right = Math.min(total - 1, current + 1);
    if (left > 2) pages.push("ellipsis");
    for (let p = left; p <= right; p++) pages.push(p);
    if (right < total - 1) pages.push("ellipsis");
    pages.push(total);
    return pages;
}

// ── Footer control ───────────────────────────────────────────────────────────

export function Pagination({
    pager,
    unit = "items",
    variant = "card",
    className,
}: {
    pager: PaginationState;
    unit?: string;
    variant?: "card" | "plain";
    className?: string;
}) {
    const { page, setPage, totalPages, total, startIndex, endIndex } = pager;
    if (totalPages <= 1) return null;

    const pages = pageRange(page, totalPages);
    const navBtn =
        "flex items-center justify-center w-8 h-8 rounded-lg text-zinc-500 transition-all hover:bg-zinc-100 disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed";

    return (
        <div
            className={cn(
                "flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4",
                variant === "card" && "border-t border-zinc-100 bg-zinc-50/30",
                className
            )}
        >
            <p className="text-xs text-zinc-500 font-medium tabular-nums">
                Showing{" "}
                <span className="font-bold text-zinc-700">
                    {total === 0 ? 0 : startIndex + 1}–{endIndex}
                </span>{" "}
                of <span className="font-bold text-zinc-700">{total}</span> {unit}
            </p>
            <div className="flex items-center gap-1">
                <button onClick={() => setPage(page - 1)} disabled={page <= 1} className={navBtn} title="Previous page">
                    <ChevronLeft size={16} />
                </button>
                {pages.map((p, i) =>
                    p === "ellipsis" ? (
                        <span key={`e${i}`} className="px-1.5 text-zinc-300 text-xs select-none">…</span>
                    ) : (
                        <button
                            key={p}
                            onClick={() => setPage(p)}
                            className={cn(
                                "min-w-8 h-8 px-2 rounded-lg text-xs font-bold tabular-nums transition-all",
                                p === page ? "bg-black text-white shadow-sm" : "text-zinc-500 hover:bg-zinc-100"
                            )}
                        >
                            {p}
                        </button>
                    )
                )}
                <button onClick={() => setPage(page + 1)} disabled={page >= totalPages} className={navBtn} title="Next page">
                    <ChevronRight size={16} />
                </button>
            </div>
        </div>
    );
}
