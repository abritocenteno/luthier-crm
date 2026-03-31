"use client";

import { useEffect, useState, useCallback } from "react";
import { useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "../convex/_generated/api";
import { Search, FileText, Users, Wrench, X, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Result = {
    id: string;
    label: string;
    sublabel?: string;
    href: string;
    type: "client" | "job" | "invoice";
};

export function GlobalSearch() {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [selected, setSelected] = useState(0);

    const clients = useQuery(api.clients.list);
    const jobs = useQuery(api.jobs.list);
    const invoices = useQuery(api.invoices.list);

    // Keyboard shortcut: Cmd+K / Ctrl+K
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                e.preventDefault();
                setOpen((v) => !v);
            }
            if (e.key === "Escape") setOpen(false);
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, []);

    // Reset on open
    useEffect(() => {
        if (open) { setQuery(""); setSelected(0); }
    }, [open]);

    const q = query.toLowerCase().trim();

    const results: Result[] = q.length < 1 ? [] : [
        ...(clients ?? [])
            .filter((c) => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q))
            .slice(0, 4)
            .map((c) => ({
                id: c._id,
                label: c.name,
                sublabel: c.email,
                href: `/dashboard/clients/${c._id}`,
                type: "client" as const,
            })),
        ...(jobs ?? [])
            .filter((j) => j.title.toLowerCase().includes(q) || (j.instrumentBrand ?? "").toLowerCase().includes(q) || (j.instrumentModel ?? "").toLowerCase().includes(q))
            .slice(0, 4)
            .map((j) => ({
                id: j._id,
                label: j.title,
                sublabel: [j.instrumentBrand, j.instrumentModel, j.instrumentType].filter(Boolean).join(" "),
                href: `/dashboard/jobs/${j._id}`,
                type: "job" as const,
            })),
        ...(invoices ?? [])
            .filter((i) => i.invoiceNumber.toLowerCase().includes(q) || (i.clientName ?? "").toLowerCase().includes(q))
            .slice(0, 4)
            .map((i) => ({
                id: i._id,
                label: `Invoice ${i.invoiceNumber}`,
                sublabel: i.clientName,
                href: `/dashboard/invoices/${i._id}`,
                type: "invoice" as const,
            })),
    ];

    const navigate = useCallback((href: string) => {
        setOpen(false);
        router.push(href);
    }, [router]);

    // Arrow key navigation
    useEffect(() => {
        if (!open) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === "ArrowDown") { e.preventDefault(); setSelected((s) => Math.min(s + 1, results.length - 1)); }
            if (e.key === "ArrowUp") { e.preventDefault(); setSelected((s) => Math.max(s - 1, 0)); }
            if (e.key === "Enter" && results[selected]) navigate(results[selected].href);
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [open, results, selected, navigate]);

    // Reset selected when results change
    useEffect(() => { setSelected(0); }, [q]);

    const typeIcon = (type: Result["type"]) => {
        if (type === "client") return <Users size={14} />;
        if (type === "job") return <Wrench size={14} />;
        return <FileText size={14} />;
    };

    const typeColor = (type: Result["type"]) => {
        if (type === "client") return "bg-blue-50 text-blue-600";
        if (type === "job") return "bg-amber-50 text-amber-600";
        return "bg-emerald-50 text-emerald-600";
    };

    const typeLabel = (type: Result["type"]) => {
        if (type === "client") return "Client";
        if (type === "job") return "Job";
        return "Invoice";
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/30 backdrop-blur-sm"
                onClick={() => setOpen(false)}
            />

            {/* Modal */}
            <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-zinc-200 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-200">
                {/* Input */}
                <div className="flex items-center gap-3 px-5 py-4 border-b border-zinc-100">
                    <Search size={18} className="text-zinc-400 shrink-0" />
                    <input
                        autoFocus
                        type="text"
                        placeholder="Search clients, jobs, invoices…"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="flex-1 text-sm font-medium text-zinc-900 placeholder:text-zinc-400 outline-none bg-transparent"
                    />
                    {query && (
                        <button onClick={() => setQuery("")} className="text-zinc-400 hover:text-black transition-colors">
                            <X size={16} />
                        </button>
                    )}
                    <kbd className="hidden sm:flex items-center gap-1 px-2 py-1 bg-zinc-100 text-zinc-400 rounded-lg text-[10px] font-bold ml-1 shrink-0">
                        ESC
                    </kbd>
                </div>

                {/* Results */}
                {q.length > 0 && (
                    <div className="max-h-[60vh] overflow-y-auto">
                        {results.length === 0 ? (
                            <div className="px-5 py-10 text-center text-zinc-400 text-sm">
                                No results for <span className="font-semibold text-zinc-600">"{query}"</span>
                            </div>
                        ) : (
                            <div className="py-2">
                                {results.map((r, i) => (
                                    <button
                                        key={r.id}
                                        onClick={() => navigate(r.href)}
                                        onMouseEnter={() => setSelected(i)}
                                        className={cn(
                                            "w-full flex items-center gap-3 px-5 py-3 transition-colors text-left group",
                                            selected === i ? "bg-zinc-50" : "hover:bg-zinc-50/50"
                                        )}
                                    >
                                        <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0", typeColor(r.type))}>
                                            {typeIcon(r.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-zinc-900 truncate">{r.label}</p>
                                            {r.sublabel && <p className="text-xs text-zinc-400 truncate">{r.sublabel}</p>}
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <span className={cn("text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md", typeColor(r.type))}>
                                                {typeLabel(r.type)}
                                            </span>
                                            <ArrowRight size={14} className={cn("text-zinc-300 transition-transform", selected === i && "translate-x-0.5 text-zinc-500")} />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Footer hint */}
                {q.length === 0 && (
                    <div className="px-5 py-6 text-center text-zinc-400 text-sm">
                        Start typing to search across clients, jobs and invoices.
                    </div>
                )}

                <div className="flex items-center gap-4 px-5 py-3 border-t border-zinc-100 bg-zinc-50/50">
                    <span className="text-[10px] text-zinc-400 font-medium flex items-center gap-1.5">
                        <kbd className="px-1.5 py-0.5 bg-white border border-zinc-200 rounded text-[10px] font-bold shadow-sm">↑↓</kbd> navigate
                    </span>
                    <span className="text-[10px] text-zinc-400 font-medium flex items-center gap-1.5">
                        <kbd className="px-1.5 py-0.5 bg-white border border-zinc-200 rounded text-[10px] font-bold shadow-sm">↵</kbd> open
                    </span>
                    <span className="text-[10px] text-zinc-400 font-medium flex items-center gap-1.5">
                        <kbd className="px-1.5 py-0.5 bg-white border border-zinc-200 rounded text-[10px] font-bold shadow-sm">⌘K</kbd> toggle
                    </span>
                </div>
            </div>
        </div>
    );
}
