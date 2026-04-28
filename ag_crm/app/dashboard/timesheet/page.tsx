"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import Link from "next/link";
import { api } from "../../../convex/_generated/api";
import { ChevronLeft, ChevronRight, Clock, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getMonday(d: Date): Date {
    const day = d.getDay();
    const diff = (day === 0 ? -6 : 1 - day);
    const monday = new Date(d);
    monday.setDate(d.getDate() + diff);
    monday.setHours(0, 0, 0, 0);
    return monday;
}

function addDays(d: Date, n: number): Date {
    const r = new Date(d);
    r.setDate(r.getDate() + n);
    return r;
}

function fmtDuration(minutes: number): string {
    if (minutes === 0) return "—";
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? (m > 0 ? `${h}h ${m}m` : `${h}h`) : `${m}m`;
}

export default function TimesheetPage() {
    const [weekOffset, setWeekOffset] = useState(0);

    const monday = getMonday(new Date());
    monday.setDate(monday.getDate() + weekOffset * 7);
    const weekStart = monday.getTime();
    const weekEnd = addDays(monday, 6).setHours(23, 59, 59, 999);
    const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i));

    const entries = useQuery(api.timeEntries.listByWeek, { weekStart, weekEnd });
    const jobs = useQuery(api.jobs.list);

    const jobMap = Object.fromEntries((jobs ?? []).map((j) => [j._id, j]));

    const weekTotal = (entries ?? []).reduce((sum: number, e: any) => sum + e.durationMinutes, 0);

    const weekLabel = (() => {
        const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
        const start = monday.toLocaleDateString("nl-NL", opts);
        const end = addDays(monday, 6).toLocaleDateString("nl-NL", opts);
        const year = monday.getFullYear();
        return `${start} – ${end}, ${year}`;
    })();

    const isCurrentWeek = weekOffset === 0;

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
            {/* Header */}
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight">Timesheet</h1>
                    <p className="text-zinc-500 text-sm">Your logged hours, week by week.</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setWeekOffset((n) => n - 1)}
                        className="p-2 rounded-xl bg-white border border-zinc-200 hover:bg-zinc-50 transition-all shadow-sm"
                    >
                        <ChevronLeft size={18} />
                    </button>
                    <button
                        onClick={() => setWeekOffset(0)}
                        disabled={isCurrentWeek}
                        className={cn(
                            "px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-sm border",
                            isCurrentWeek
                                ? "bg-zinc-100 text-zinc-400 border-zinc-100 cursor-default"
                                : "bg-white border-zinc-200 hover:bg-zinc-50 text-zinc-900"
                        )}
                    >
                        This week
                    </button>
                    <button
                        onClick={() => setWeekOffset((n) => n + 1)}
                        className="p-2 rounded-xl bg-white border border-zinc-200 hover:bg-zinc-50 transition-all shadow-sm"
                    >
                        <ChevronRight size={18} />
                    </button>
                </div>
            </header>

            {/* Week label + total */}
            <div className="flex items-center justify-between px-6 py-4 bg-white border border-zinc-200 rounded-2xl shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-black flex items-center justify-center">
                        <Clock size={16} className="text-white" />
                    </div>
                    <div>
                        <p className="text-xs text-zinc-400 font-medium">Week</p>
                        <p className="font-bold text-zinc-900">{weekLabel}</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-xs text-zinc-400 font-medium uppercase tracking-widest">Total</p>
                    <p className="text-2xl font-black tracking-tight">{fmtDuration(weekTotal)}</p>
                </div>
            </div>

            {/* Day columns */}
            <div className="grid grid-cols-7 gap-3">
                {days.map((day, i) => {
                    const dayStart = day.getTime();
                    const dayEnd = new Date(day).setHours(23, 59, 59, 999);
                    const dayEntries = (entries ?? []).filter((e: any) => e.date >= dayStart && e.date <= dayEnd);
                    const dayTotal = dayEntries.reduce((sum: number, e: any) => sum + e.durationMinutes, 0);
                    const isToday = new Date().toDateString() === day.toDateString();

                    return (
                        <div key={i} className={cn(
                            "flex flex-col bg-white border rounded-2xl overflow-hidden shadow-sm",
                            isToday ? "border-black" : "border-zinc-200"
                        )}>
                            {/* Day header */}
                            <div className={cn(
                                "px-3 py-2 text-center border-b",
                                isToday ? "bg-black text-white border-black" : "bg-zinc-50 border-zinc-100"
                            )}>
                                <p className={cn("text-[10px] font-black uppercase tracking-widest", isToday ? "text-zinc-300" : "text-zinc-400")}>{DAYS[i]}</p>
                                <p className={cn("text-lg font-black leading-none mt-0.5", isToday ? "text-white" : "text-zinc-900")}>{day.getDate()}</p>
                            </div>

                            {/* Entries */}
                            <div className="flex-1 p-2 space-y-1.5 min-h-[100px]">
                                {dayEntries.map((entry: any) => {
                                    const job = jobMap[entry.jobId];
                                    return (
                                        <Link
                                            key={entry._id}
                                            href={`/dashboard/jobs/${entry.jobId}`}
                                            className="block p-2 bg-zinc-50 hover:bg-zinc-100 border border-zinc-100 rounded-xl transition-colors group"
                                        >
                                            <div className="flex items-center gap-1 mb-0.5">
                                                <Wrench size={9} className="text-zinc-400 shrink-0" />
                                                <p className="text-[10px] font-bold text-zinc-700 truncate leading-tight">{job?.title ?? "Job"}</p>
                                            </div>
                                            <p className="text-[11px] font-black text-zinc-900">{fmtDuration(entry.durationMinutes)}</p>
                                            {entry.description && (
                                                <p className="text-[10px] text-zinc-400 truncate mt-0.5">{entry.description}</p>
                                            )}
                                            {entry.billable && (
                                                <span className={cn(
                                                    "text-[9px] font-bold px-1.5 py-0.5 rounded-md",
                                                    entry.invoiced
                                                        ? "bg-zinc-100 text-zinc-400"
                                                        : "bg-blue-50 text-blue-600"
                                                )}>
                                                    {entry.invoiced ? "invoiced" : "billable"}
                                                </span>
                                            )}
                                        </Link>
                                    );
                                })}
                            </div>

                            {/* Day total */}
                            <div className={cn(
                                "px-3 py-2 text-center border-t",
                                dayTotal > 0 ? "border-zinc-100 bg-zinc-50" : "border-transparent"
                            )}>
                                <p className={cn("text-xs font-black", dayTotal > 0 ? "text-zinc-900" : "text-zinc-200")}>
                                    {fmtDuration(dayTotal)}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* All entries table */}
            {(entries ?? []).length > 0 && (
                <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className="px-6 pt-5 pb-3">
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">All entries this week</p>
                    </div>
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-zinc-100 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                                <th className="px-6 py-3">Date</th>
                                <th className="px-6 py-3">Job</th>
                                <th className="px-6 py-3">Description</th>
                                <th className="px-6 py-3 text-center">Duration</th>
                                <th className="px-6 py-3 text-center">Billable</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-50">
                            {(entries ?? [])
                                .slice()
                                .sort((a: any, b: any) => b.date - a.date)
                                .map((entry: any) => {
                                    const job = jobMap[entry.jobId];
                                    const dateStr = new Date(entry.date).toLocaleDateString("nl-NL", { weekday: "short", day: "numeric", month: "short" });
                                    return (
                                        <tr key={entry._id} className="hover:bg-zinc-50 transition-colors">
                                            <td className="px-6 py-3 text-sm text-zinc-500 whitespace-nowrap">{dateStr}</td>
                                            <td className="px-6 py-3">
                                                <Link href={`/dashboard/jobs/${entry.jobId}`} className="text-sm font-bold text-zinc-900 hover:underline">
                                                    {job?.title ?? "—"}
                                                </Link>
                                            </td>
                                            <td className="px-6 py-3 text-sm text-zinc-500">{entry.description ?? "—"}</td>
                                            <td className="px-6 py-3 text-center font-bold text-sm">{fmtDuration(entry.durationMinutes)}</td>
                                            <td className="px-6 py-3 text-center">
                                                {entry.billable ? (
                                                    <span className={cn(
                                                        "text-[10px] font-bold px-2 py-0.5 rounded-md border",
                                                        entry.invoiced
                                                            ? "bg-zinc-50 text-zinc-400 border-zinc-100"
                                                            : "bg-blue-50 text-blue-600 border-blue-100"
                                                    )}>
                                                        {entry.invoiced ? "Invoiced" : "Billable"}
                                                    </span>
                                                ) : (
                                                    <span className="text-zinc-300 text-xs">—</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                        </tbody>
                        <tfoot>
                            <tr className="bg-zinc-50 border-t border-zinc-100">
                                <td colSpan={3} className="px-6 py-3 text-right text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Week Total</td>
                                <td className="px-6 py-3 text-center text-sm font-black text-zinc-900">{fmtDuration(weekTotal)}</td>
                                <td />
                            </tr>
                        </tfoot>
                    </table>
                </div>
            )}

            {(entries ?? []).length === 0 && (
                <div className="text-center py-16 space-y-3">
                    <div className="w-14 h-14 bg-zinc-100 rounded-2xl flex items-center justify-center mx-auto">
                        <Clock size={24} className="text-zinc-300" />
                    </div>
                    <p className="text-zinc-400 font-medium">No time logged this week.</p>
                    <p className="text-zinc-300 text-sm">Open a job and use the Time Log section to add entries.</p>
                </div>
            )}
        </div>
    );
}
