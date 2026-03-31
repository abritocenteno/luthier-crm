"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import Link from "next/link";
import { TrendingUp, TrendingDown, Minus, ArrowRight } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";

// ── Helpers ────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; bar: string }> = {
    quoted:        { label: "Quoted",         color: "text-zinc-500",   bar: "bg-zinc-300" },
    intake:        { label: "Intake",          color: "text-blue-600",   bar: "bg-blue-400" },
    in_progress:   { label: "In Progress",    color: "text-indigo-600", bar: "bg-indigo-400" },
    waiting_parts: { label: "Waiting Parts",  color: "text-amber-600",  bar: "bg-amber-400" },
    ready:         { label: "Ready",          color: "text-emerald-600",bar: "bg-emerald-400" },
    closed:        { label: "Closed",         color: "text-zinc-400",   bar: "bg-zinc-200" },
};

// ── Sub-components ─────────────────────────────────────────────────────────

const Card = ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={cn("bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden", className)}>
        {children}
    </div>
);

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">{children}</p>
);

function BarChart({
    data,
    valueKey,
    formatValue,
    color = "bg-zinc-900",
    height = "h-36",
}: {
    data: { label: string; [key: string]: any }[];
    valueKey: string;
    formatValue: (v: number) => string;
    color?: string;
    height?: string;
}) {
    const values = data.map((d) => d[valueKey] as number);
    const max = Math.max(...values, 1);
    const currentMonthIdx = data.length - 1;

    return (
        <div className={cn("flex items-end gap-1", height)}>
            {data.map((d, i) => {
                const val = d[valueKey] as number;
                const pct = (val / max) * 100;
                const isCurrent = i === currentMonthIdx;
                return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group relative">
                        {/* Tooltip */}
                        {val > 0 && (
                            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-zinc-900 text-white text-[9px] font-bold px-2 py-1 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                {formatValue(val)}
                            </div>
                        )}
                        {/* Bar */}
                        <div
                            className={cn(
                                "w-full rounded-t-md transition-all",
                                val === 0 ? "bg-zinc-100" : isCurrent ? "bg-black" : color,
                            )}
                            style={{ height: `${Math.max(pct, val > 0 ? 4 : 1)}%` }}
                        />
                        {/* Label */}
                        <span className={cn("text-[8px] font-bold uppercase tracking-wide shrink-0", isCurrent ? "text-black" : "text-zinc-300")}>
                            {d.label}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}

function StatCard({
    label,
    value,
    sub,
    trend,
    trendLabel,
}: {
    label: string;
    value: string;
    sub?: string;
    trend?: "up" | "down" | "flat";
    trendLabel?: string;
}) {
    const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
    const trendColor = trend === "up" ? "text-emerald-600 bg-emerald-50" : trend === "down" ? "text-red-500 bg-red-50" : "text-zinc-400 bg-zinc-100";

    return (
        <Card className="p-6">
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3">{label}</p>
            <p className="text-3xl font-black tracking-tight text-zinc-900">{value}</p>
            {sub && <p className="text-xs text-zinc-400 font-medium mt-1">{sub}</p>}
            {trend && trendLabel && (
                <div className={cn("inline-flex items-center gap-1 mt-3 px-2 py-1 rounded-lg text-[10px] font-bold", trendColor)}>
                    <TrendIcon size={11} />
                    {trendLabel}
                </div>
            )}
        </Card>
    );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function ReportsPage() {
    const data = useQuery(api.reports.getData);
    const settings = useQuery(api.settings.get);
    const currency = settings?.currency;

    const fmt = (n: number) => formatCurrency(n, currency);

    // Month-on-month revenue trend
    const revTrend = (() => {
        if (!data) return undefined;
        const { thisMonthRevenue: cur, lastMonthRevenue: prev } = data.summary;
        if (prev === 0 && cur === 0) return { dir: "flat" as const, label: "No data yet" };
        if (prev === 0) return { dir: "up" as const, label: "First revenue this month!" };
        const pct = ((cur - prev) / prev) * 100;
        if (Math.abs(pct) < 1) return { dir: "flat" as const, label: "Same as last month" };
        return {
            dir: pct > 0 ? "up" as const : "down" as const,
            label: `${pct > 0 ? "+" : ""}${pct.toFixed(0)}% vs last month`,
        };
    })();

    if (!data) {
        return (
            <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-700">
                <div className="space-y-2">
                    <div className="h-9 w-64 bg-zinc-100 rounded-xl animate-pulse" />
                    <div className="h-4 w-48 bg-zinc-100 rounded animate-pulse" />
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-zinc-100 rounded-2xl animate-pulse" />)}
                </div>
                <div className="h-64 bg-zinc-100 rounded-2xl animate-pulse" />
            </div>
        );
    }

    const totalJobs = data.summary.totalJobs;
    const maxStatusCount = Math.max(...Object.values(data.statusBreakdown), 1);

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">

            {/* Header */}
            <header>
                <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
                <p className="text-zinc-500 font-medium mt-1">Revenue, job performance, and business insights.</p>
            </header>

            {/* ── Summary Stats ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    label="Total Revenue"
                    value={fmt(data.summary.totalRevenue)}
                    sub={`${data.summary.paidCount} paid invoice${data.summary.paidCount !== 1 ? "s" : ""}`}
                    trend={revTrend?.dir}
                    trendLabel={revTrend?.label}
                />
                <StatCard
                    label="This Month"
                    value={fmt(data.summary.thisMonthRevenue)}
                    sub={data.summary.lastMonthRevenue > 0 ? `Last month: ${fmt(data.summary.lastMonthRevenue)}` : undefined}
                />
                <StatCard
                    label="Avg Invoice Value"
                    value={fmt(data.summary.avgInvoiceValue)}
                    sub="across paid invoices"
                />
                <StatCard
                    label="Avg Turnaround"
                    value={data.summary.avgTurnaround > 0 ? `${Math.round(data.summary.avgTurnaround)}d` : "—"}
                    sub="intake to completion"
                />
            </div>

            {/* ── Revenue Chart ── */}
            <Card className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <SectionTitle>Monthly Revenue</SectionTitle>
                        <p className="text-xs text-zinc-400 mt-1">Paid invoices — last 12 months</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Pending</p>
                        <p className="text-sm font-black text-amber-600">{fmt(data.summary.pendingRevenue)}</p>
                    </div>
                </div>
                <BarChart
                    data={data.monthlyRevenue}
                    valueKey="amount"
                    formatValue={fmt}
                    color="bg-zinc-200"
                    height="h-44"
                />
            </Card>

            {/* ── Jobs Chart + Status Breakdown ── */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <Card className="lg:col-span-3 p-6 space-y-6">
                    <div>
                        <SectionTitle>Jobs per Month</SectionTitle>
                        <p className="text-xs text-zinc-400 mt-1">New intakes — last 12 months</p>
                    </div>
                    <BarChart
                        data={data.monthlyJobs}
                        valueKey="count"
                        formatValue={(v) => `${v} job${v !== 1 ? "s" : ""}`}
                        color="bg-zinc-200"
                        height="h-36"
                    />
                </Card>

                <Card className="lg:col-span-2 p-6 space-y-5">
                    <div className="flex items-center justify-between">
                        <SectionTitle>Jobs by Status</SectionTitle>
                        <span className="text-xs font-bold text-zinc-400">{totalJobs} total</span>
                    </div>
                    {totalJobs === 0 ? (
                        <p className="text-sm text-zinc-400 italic py-4 text-center">No jobs yet.</p>
                    ) : (
                        <div className="space-y-3">
                            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
                                const count = data.statusBreakdown[key] ?? 0;
                                const pct = (count / totalJobs) * 100;
                                return (
                                    <div key={key} className="space-y-1">
                                        <div className="flex items-center justify-between">
                                            <span className={cn("text-[11px] font-bold", cfg.color)}>{cfg.label}</span>
                                            <span className="text-xs font-black text-zinc-700">{count}</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
                                            <div
                                                className={cn("h-full rounded-full transition-all", cfg.bar)}
                                                style={{ width: `${pct}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </Card>
            </div>

            {/* ── Top Services + Top Clients ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Top Services */}
                <Card className="overflow-hidden">
                    <div className="px-6 pt-6 pb-4 flex items-center justify-between">
                        <div>
                            <SectionTitle>Top Services</SectionTitle>
                            <p className="text-xs text-zinc-400 mt-1">Most-performed work items</p>
                        </div>
                    </div>
                    {data.topServices.length === 0 ? (
                        <div className="px-6 py-10 text-center text-zinc-400 text-sm italic">
                            No work items recorded yet.
                        </div>
                    ) : (
                        <div className="divide-y divide-zinc-50">
                            {data.topServices.map((svc, i) => {
                                const maxCount = data.topServices[0]?.count ?? 1;
                                const pct = (svc.count / maxCount) * 100;
                                return (
                                    <div key={i} className="px-6 py-3 space-y-1.5">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <span className="text-[10px] font-black text-zinc-300 w-4 shrink-0">{i + 1}</span>
                                                <span className="text-sm font-semibold text-zinc-900 truncate">{svc.name}</span>
                                            </div>
                                            <div className="text-right shrink-0 ml-4">
                                                <span className="text-xs font-black text-zinc-700">{fmt(svc.revenue)}</span>
                                                <span className="text-[10px] text-zinc-400 ml-2">×{svc.count}</span>
                                            </div>
                                        </div>
                                        <div className="h-1 w-full bg-zinc-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-black rounded-full" style={{ width: `${pct}%` }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </Card>

                {/* Top Clients */}
                <Card className="overflow-hidden">
                    <div className="px-6 pt-6 pb-4 flex items-center justify-between">
                        <div>
                            <SectionTitle>Top Clients</SectionTitle>
                            <p className="text-xs text-zinc-400 mt-1">By revenue from paid invoices</p>
                        </div>
                        <Link href="/dashboard/clients" className="flex items-center gap-1 text-xs font-bold text-zinc-400 hover:text-black transition-colors group">
                            All clients
                            <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                        </Link>
                    </div>
                    {data.topClients.length === 0 ? (
                        <div className="px-6 py-10 text-center text-zinc-400 text-sm italic">
                            No revenue data yet.
                        </div>
                    ) : (
                        <div className="divide-y divide-zinc-50">
                            {data.topClients.map((client, i) => {
                                const maxRev = data.topClients[0]?.revenue ?? 1;
                                const pct = (client.revenue / Math.max(maxRev, 1)) * 100;
                                return (
                                    <Link key={i} href={`/dashboard/clients/${client.clientId}`}>
                                        <div className="px-6 py-3 space-y-1.5 hover:bg-zinc-50 transition-colors cursor-pointer group">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <span className="text-[10px] font-black text-zinc-300 w-4 shrink-0">{i + 1}</span>
                                                    <span className="text-sm font-semibold text-zinc-900 truncate group-hover:underline">{client.name}</span>
                                                </div>
                                                <div className="text-right shrink-0 ml-4">
                                                    <span className="text-xs font-black text-zinc-700">{fmt(client.revenue)}</span>
                                                    <span className="text-[10px] text-zinc-400 ml-2">{client.jobCount} job{client.jobCount !== 1 ? "s" : ""}</span>
                                                </div>
                                            </div>
                                            <div className="h-1 w-full bg-zinc-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-zinc-800 rounded-full" style={{ width: `${pct}%` }} />
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
}
