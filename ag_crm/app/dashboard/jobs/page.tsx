"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    Plus,
    Wrench,
    Guitar,
    Clock,
    CheckCircle2,
    Package,
    Inbox,
    ChevronRight,
    Download,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { exportJobs } from "@/lib/exportCsv";

const STATUS_CONFIG = {
    intake:        { label: "Intake",             color: "bg-blue-50 text-blue-700 border-blue-100",   dot: "bg-blue-500" },
    in_progress:   { label: "In Progress",        color: "bg-amber-50 text-amber-700 border-amber-100", dot: "bg-amber-500" },
    waiting_parts: { label: "Waiting for Parts",  color: "bg-orange-50 text-orange-700 border-orange-100", dot: "bg-orange-500" },
    ready:         { label: "Ready for Pickup",   color: "bg-emerald-50 text-emerald-700 border-emerald-100", dot: "bg-emerald-500" },
    closed:        { label: "Closed",             color: "bg-zinc-100 text-zinc-500 border-zinc-200",  dot: "bg-zinc-400" },
} as const;

type StatusKey = keyof typeof STATUS_CONFIG;

const STATUS_ORDER: StatusKey[] = ["intake", "in_progress", "waiting_parts", "ready", "closed"];

function StatusBadge({ status }: { status: string }) {
    const cfg = STATUS_CONFIG[status as StatusKey] ?? STATUS_CONFIG.intake;
    return (
        <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border", cfg.color)}>
            <span className={cn("w-1.5 h-1.5 rounded-full", cfg.dot)} />
            {cfg.label}
        </span>
    );
}

export default function JobsPage() {
    const router = useRouter();
    const jobs = useQuery(api.jobs.list);

    const tabs = [
        { key: "all",           label: "All" },
        { key: "intake",        label: "Intake" },
        { key: "in_progress",   label: "In Progress" },
        { key: "waiting_parts", label: "Waiting for Parts" },
        { key: "ready",         label: "Ready" },
        { key: "closed",        label: "Closed" },
    ];

    const [activeTab, setActiveTab] = useState("all");

    const filtered = jobs?.filter((j) => activeTab === "all" || j.status === activeTab) ?? [];

    // Counts per status for badges
    const counts = jobs?.reduce<Record<string, number>>((acc, j) => {
        acc[j.status] = (acc[j.status] ?? 0) + 1;
        return acc;
    }, {}) ?? {};

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-black flex items-center justify-center text-white shadow-lg shadow-black/10">
                        <Wrench size={24} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Jobs</h1>
                        <p className="text-zinc-500">Track repairs and work orders.</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto">
                    <button
                        onClick={() => jobs && exportJobs(jobs as any)}
                        disabled={!jobs || jobs.length === 0}
                        className="flex items-center gap-2 px-4 py-2.5 bg-white border border-zinc-200 text-zinc-600 rounded-xl text-sm font-bold hover:bg-zinc-50 transition-all active:scale-95 disabled:opacity-40"
                    >
                        <Download size={15} />
                        Export CSV
                    </button>
                    <Link
                        href="/dashboard/jobs/create"
                        className="flex items-center gap-2 px-5 py-2.5 bg-black text-white rounded-xl text-sm font-bold hover:bg-zinc-800 transition-all active:scale-95 shadow-lg shadow-black/10"
                    >
                        <Plus size={16} />
                        New Job
                    </Link>
                </div>
            </header>

            {/* Status Tabs */}
            <div className="flex gap-1 bg-zinc-100 p-1 rounded-xl w-full overflow-x-auto">
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all",
                            activeTab === tab.key
                                ? "bg-white text-black shadow-sm"
                                : "text-zinc-500 hover:text-black"
                        )}
                    >
                        {tab.label}
                        {tab.key !== "all" && counts[tab.key] ? (
                            <span className="bg-zinc-200 text-zinc-600 px-1.5 py-0.5 rounded-full text-[9px] font-black">
                                {counts[tab.key]}
                            </span>
                        ) : null}
                    </button>
                ))}
            </div>

            {/* Job Cards */}
            {jobs === undefined ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="h-44 rounded-2xl bg-zinc-100 animate-pulse" />
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
                    <div className="w-16 h-16 rounded-2xl bg-zinc-100 flex items-center justify-center text-zinc-300">
                        <Wrench size={32} />
                    </div>
                    <div>
                        <p className="font-bold text-zinc-900">No jobs found</p>
                        <p className="text-sm text-zinc-400 mt-1">
                            {activeTab === "all" ? "Create your first repair job to get started." : `No jobs with status "${tabs.find(t => t.key === activeTab)?.label}".`}
                        </p>
                    </div>
                    {activeTab === "all" && (
                        <Link href="/dashboard/jobs/create" className="text-sm font-bold text-black underline underline-offset-4">
                            Create first job →
                        </Link>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filtered.map((job) => (
                        <Link
                            key={job._id}
                            href={`/dashboard/jobs/${job._id}`}
                            className="group bg-white border border-zinc-200 rounded-2xl p-6 hover:border-zinc-300 hover:shadow-lg hover:shadow-zinc-100 transition-all space-y-4"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="space-y-1 min-w-0">
                                    <p className="font-black text-zinc-900 truncate">{job.title}</p>
                                    <p className="text-sm text-zinc-500 font-medium truncate">{job.clientName}</p>
                                </div>
                                <StatusBadge status={job.status} />
                            </div>

                            <div className="flex items-center gap-2 text-xs text-zinc-500 font-medium">
                                <Guitar size={13} className="text-zinc-300 shrink-0" />
                                <span className="truncate">
                                    {[job.instrumentBrand, job.instrumentModel, job.instrumentType]
                                        .filter(Boolean).join(" ") || job.instrumentType}
                                </span>
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-zinc-50">
                                <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 font-medium">
                                    <Inbox size={11} />
                                    {new Date(job.intakeDate).toLocaleDateString()}
                                </div>
                                {job.estimatedCompletionDate && (
                                    <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 font-medium">
                                        <Clock size={11} />
                                        Due {new Date(job.estimatedCompletionDate).toLocaleDateString()}
                                    </div>
                                )}
                                <ChevronRight size={14} className="text-zinc-300 group-hover:text-zinc-500 transition-colors" />
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}

