"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import Link from "next/link";
import {
    Users, FileText, Clock, ChevronRight, Plus,
    Wrench, AlertCircle, CheckCircle2, Package, ArrowRight, CalendarClock,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";

// ─── Helpers ───────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; dot: string; badge: string }> = {
    intake:        { label: "Intake",         dot: "bg-zinc-400",   badge: "bg-zinc-100 text-zinc-600" },
    in_progress:   { label: "In Progress",    dot: "bg-blue-500",   badge: "bg-blue-50 text-blue-700" },
    waiting_parts: { label: "Waiting Parts",  dot: "bg-amber-400",  badge: "bg-amber-50 text-amber-700" },
    ready:         { label: "Ready",          dot: "bg-emerald-500",badge: "bg-emerald-50 text-emerald-700" },
    closed:        { label: "Closed",         dot: "bg-zinc-300",   badge: "bg-zinc-50 text-zinc-400" },
};

function formatRelativeTime(ts: number) {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60_000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (mins > 0) return `${mins}m ago`;
    return "just now";
}

function formatDate(ts: number) {
    return new Date(ts).toLocaleDateString("en-NL", { day: "numeric", month: "short" });
}

function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
}

// ─── Sub-components ────────────────────────────────────────────────────────

function StatCard({
    label, value, sub, icon: Icon, accent, href,
}: {
    label: string; value: string | number; sub?: string;
    icon: React.ElementType; accent: string; href?: string;
}) {
    const inner = (
        <div className={cn(
            "bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm transition-all duration-200 group relative overflow-hidden",
            href && "hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
        )}>
            <div className={cn("absolute inset-0 opacity-0 group-hover:opacity-[0.025] transition-opacity rounded-2xl", accent)} />
            <div className="flex items-start justify-between mb-4">
                <div className={cn("p-2.5 rounded-xl", accent, "bg-opacity-10")}>
                    <Icon size={20} />
                </div>
                {href && <ChevronRight size={14} className="text-zinc-300 group-hover:text-zinc-500 group-hover:translate-x-0.5 transition-all mt-1" />}
            </div>
            <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-1">{label}</p>
            <p className="text-3xl font-black tracking-tight text-zinc-900">{value}</p>
            {sub && <p className="text-xs text-zinc-400 font-medium mt-1">{sub}</p>}
        </div>
    );
    return href ? <Link href={href}>{inner}</Link> : inner;
}

function StatusPill({ status }: { status: string }) {
    const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.intake;
    return (
        <span className={cn("inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg", cfg.badge)}>
            <span className={cn("w-1.5 h-1.5 rounded-full", cfg.dot)} />
            {cfg.label}
        </span>
    );
}

// ─── Main Page ─────────────────────────────────────────────────────────────

export default function Dashboard() {
    const user = useQuery(api.users.currentUser);
    const settings = useQuery(api.settings.get);
    const data = useQuery(api.dashboard.getStats);

    const currency = settings?.currency;
    const firstName = user?.name?.split(" ")[0] || "Artisan";

    return (
        <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">

            {/* ── Header ── */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-black text-white text-[10px] font-black uppercase tracking-widest rounded-lg">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Workshop Live
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight">
                        {getGreeting()}, {firstName}
                    </h1>
                    <p className="text-zinc-500 font-medium">Here's what's happening in your workshop today.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Link href="/dashboard/invoices/create">
                        <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm font-bold text-zinc-600 hover:bg-zinc-50 transition-all shadow-sm active:scale-95">
                            <FileText size={16} />
                            New Invoice
                        </button>
                    </Link>
                    <Link href="/dashboard/jobs/create">
                        <button className="flex items-center gap-2 px-6 py-2.5 bg-black text-white rounded-xl text-sm font-bold hover:bg-zinc-800 transition-all shadow-lg shadow-black/10 active:scale-95">
                            <Plus size={16} />
                            New Job
                        </button>
                    </Link>
                </div>
            </header>

            {/* ── Stats ── */}
            {data ? (
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                    <StatCard
                        label="Open Jobs"
                        value={data.stats?.openJobs ?? 0}
                        sub={data.stats ? `${data.stats.jobBreakdown.in_progress} in progress · ${data.stats.jobBreakdown.waiting_parts} waiting` : undefined}
                        icon={Wrench}
                        accent="bg-blue-500 text-blue-600"
                        href="/dashboard/jobs"
                    />
                    <StatCard
                        label="Ready for Pickup"
                        value={data.stats?.readyForPickup ?? 0}
                        sub="awaiting collection"
                        icon={CheckCircle2}
                        accent="bg-emerald-500 text-emerald-600"
                        href="/dashboard/jobs"
                    />
                    <StatCard
                        label="Unpaid Invoices"
                        value={formatCurrency(data.stats?.pendingAmount ?? 0, currency)}
                        sub="outstanding balance"
                        icon={AlertCircle}
                        accent="bg-amber-500 text-amber-600"
                        href="/dashboard/invoices"
                    />
                    <StatCard
                        label="Total Clients"
                        value={data.stats?.totalClients ?? 0}
                        icon={Users}
                        accent="bg-purple-500 text-purple-600"
                        href="/dashboard/clients"
                    />
                    <StatCard
                        label="Total Invoiced"
                        value={formatCurrency(data.stats?.totalInvoiced ?? 0, currency)}
                        sub="paid invoices"
                        icon={FileText}
                        accent="bg-zinc-800 text-zinc-700"
                        href="/dashboard/invoices"
                    />
                </div>
            ) : (
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-36 bg-zinc-100 rounded-2xl animate-pulse" />
                    ))}
                </div>
            )}

            {/* ── Main content ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Active Jobs — left 2/3 */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold tracking-tight">Active Jobs</h2>
                        <Link href="/dashboard/jobs" className="flex items-center gap-1 text-sm font-bold text-zinc-400 hover:text-black transition-colors group">
                            View all
                            <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                        </Link>
                    </div>

                    <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
                        {!data ? (
                            <div className="divide-y divide-zinc-100">
                                {[...Array(4)].map((_, i) => (
                                    <div key={i} className="h-16 px-6 py-4 flex items-center gap-4">
                                        <div className="w-24 h-4 bg-zinc-100 rounded animate-pulse" />
                                        <div className="flex-1 h-4 bg-zinc-100 rounded animate-pulse" />
                                        <div className="w-16 h-4 bg-zinc-100 rounded animate-pulse" />
                                    </div>
                                ))}
                            </div>
                        ) : data.activeJobs.length === 0 ? (
                            <div className="py-16 text-center space-y-3">
                                <Wrench className="mx-auto text-zinc-200" size={40} />
                                <p className="text-zinc-400 font-medium">No active jobs right now.</p>
                                <Link href="/dashboard/jobs/create">
                                    <button className="mt-2 px-4 py-2 bg-black text-white rounded-xl text-sm font-bold hover:bg-zinc-800 transition-all active:scale-95">
                                        Create your first job
                                    </button>
                                </Link>
                            </div>
                        ) : (
                            <div className="divide-y divide-zinc-100">
                                {data.activeJobs.map((job) => (
                                    <Link key={job.id} href={`/dashboard/jobs/${job.id}`}>
                                        <div className="flex items-center gap-4 px-6 py-4 hover:bg-zinc-50 transition-colors group cursor-pointer">
                                            {/* Status */}
                                            <StatusPill status={job.status} />

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-zinc-900 truncate">{job.title}</p>
                                                <p className="text-xs text-zinc-400 truncate">
                                                    {job.clientName} · {job.instrumentType}{job.instrumentBrand ? ` ${job.instrumentBrand}` : ""}
                                                    {job.instrumentModel ? ` ${job.instrumentModel}` : ""}
                                                </p>
                                            </div>

                                            {/* Dates */}
                                            <div className="hidden sm:block text-right shrink-0">
                                                {job.estimatedCompletionDate ? (
                                                    <p className={cn(
                                                        "text-xs font-bold",
                                                        job.estimatedCompletionDate < Date.now() ? "text-red-500" : "text-zinc-500"
                                                    )}>
                                                        {job.estimatedCompletionDate < Date.now() ? "Overdue · " : "Due "}
                                                        {formatDate(job.estimatedCompletionDate)}
                                                    </p>
                                                ) : (
                                                    <p className="text-xs text-zinc-300">No due date</p>
                                                )}
                                                <p className="text-[10px] text-zinc-300">in {formatDate(job.intakeDate)}</p>
                                            </div>

                                            <ChevronRight size={14} className="text-zinc-300 group-hover:text-zinc-500 group-hover:translate-x-0.5 transition-all shrink-0" />
                                        </div>
                                    </Link>
                                ))}

                                {/* Footer */}
                                <div className="px-6 py-3 bg-zinc-50/60 flex items-center justify-between">
                                    <div className="flex items-center gap-3 flex-wrap">
                                        {Object.entries(STATUS_CONFIG).filter(([k]) => k !== "closed").map(([key, cfg]) => {
                                            const count = data.stats?.jobBreakdown[key as keyof typeof data.stats.jobBreakdown] ?? 0;
                                            if (count === 0) return null;
                                            return (
                                                <span key={key} className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-500">
                                                    <span className={cn("w-1.5 h-1.5 rounded-full", cfg.dot)} />
                                                    {count} {cfg.label}
                                                </span>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right column */}
                <div className="space-y-6">

                    {/* Upcoming Deadlines */}
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
                            <CalendarClock size={18} className="text-zinc-400" />
                            Due Soon
                        </h2>
                        <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
                            {!data ? (
                                <div className="p-6 space-y-3">
                                    {[...Array(3)].map((_, i) => <div key={i} className="h-10 bg-zinc-100 rounded animate-pulse" />)}
                                </div>
                            ) : data.upcomingDeadlines.length === 0 ? (
                                <div className="py-10 text-center">
                                    <Clock className="mx-auto text-zinc-200 mb-2" size={28} />
                                    <p className="text-xs text-zinc-400 font-medium">No deadlines in the next 14 days.</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-zinc-100">
                                    {data.upcomingDeadlines.map((job) => (
                                        <Link key={job.id} href={`/dashboard/jobs/${job.id}`}>
                                            <div className="flex items-center gap-3 px-4 py-3.5 hover:bg-zinc-50 transition-colors group cursor-pointer">
                                                <div className={cn(
                                                    "w-1.5 h-8 rounded-full shrink-0",
                                                    job.isOverdue ? "bg-red-400" : job.status === "ready" ? "bg-emerald-400" : "bg-amber-400"
                                                )} />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-zinc-800 truncate">{job.title}</p>
                                                    <p className="text-xs text-zinc-400 truncate">{job.clientName}</p>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <p className={cn("text-xs font-black", job.isOverdue ? "text-red-500" : "text-zinc-700")}>
                                                        {formatDate(job.estimatedCompletionDate)}
                                                    </p>
                                                    {job.isOverdue && <p className="text-[9px] font-bold text-red-400 uppercase tracking-wider">Overdue</p>}
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold tracking-tight">Recent Activity</h2>
                        <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
                            {!data ? (
                                <div className="p-6 space-y-3">
                                    {[...Array(4)].map((_, i) => <div key={i} className="h-10 bg-zinc-100 rounded animate-pulse" />)}
                                </div>
                            ) : data.recentActivity.length === 0 ? (
                                <div className="py-10 text-center">
                                    <p className="text-xs text-zinc-400">No recent activity yet.</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-zinc-100">
                                    {data.recentActivity.map((item) => {
                                        const Icon = item.type === "job" ? Wrench : item.type === "invoice" ? FileText : item.type === "client" ? Users : Package;
                                        return (
                                            <Link key={item.id} href={item.href}>
                                                <div className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-50 transition-colors group cursor-pointer">
                                                    <div className="w-8 h-8 rounded-xl bg-zinc-50 flex items-center justify-center text-zinc-400 group-hover:bg-black group-hover:text-white transition-all shrink-0">
                                                        <Icon size={14} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-semibold text-zinc-900 truncate">{item.title}</p>
                                                        <p className="text-xs text-zinc-400 truncate">{item.subtitle}</p>
                                                    </div>
                                                    <p className="text-[10px] font-bold text-zinc-300 shrink-0">{formatRelativeTime(item.time)}</p>
                                                </div>
                                            </Link>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
