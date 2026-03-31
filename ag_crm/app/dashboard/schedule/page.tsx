"use client";

import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import Link from "next/link";
import { ChevronLeft, ChevronRight, X, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────

type DayEvent = {
    jobId: string;
    title: string;
    clientName: string;
    status: string;
    eventType: "intake" | "due" | "completion";
};

// ── Constants ──────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
    quoted:        "bg-zinc-400",
    intake:        "bg-blue-500",
    in_progress:   "bg-indigo-500",
    waiting_parts: "bg-amber-400",
    ready:         "bg-emerald-500",
    closed:        "bg-zinc-300",
};

const EVENT_TYPE_CONFIG = {
    intake:     { dot: "bg-blue-500",    label: "Intake",    badge: "bg-blue-50 text-blue-700 border border-blue-100" },
    due:        { dot: "bg-amber-400",   label: "Due",       badge: "bg-amber-50 text-amber-700 border border-amber-100" },
    completion: { dot: "bg-emerald-500", label: "Completed", badge: "bg-emerald-50 text-emerald-700 border border-emerald-100" },
};

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

// ── Helpers ────────────────────────────────────────────────────────────────

function toDateKey(ts: number) {
    const d = new Date(ts);
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function isToday(year: number, month: number, day: number) {
    const t = new Date();
    return t.getFullYear() === year && t.getMonth() === month && t.getDate() === day;
}

// ── Component ──────────────────────────────────────────────────────────────

export default function CalendarPage() {
    const jobs = useQuery(api.jobs.list);

    const today = new Date();
    const [viewYear, setViewYear] = useState(today.getFullYear());
    const [viewMonth, setViewMonth] = useState(today.getMonth());
    const [selectedDay, setSelectedDay] = useState<number | null>(null);

    const prevMonth = () => {
        if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11); }
        else setViewMonth((m) => m - 1);
        setSelectedDay(null);
    };
    const nextMonth = () => {
        if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0); }
        else setViewMonth((m) => m + 1);
        setSelectedDay(null);
    };
    const goToday = () => {
        setViewYear(today.getFullYear());
        setViewMonth(today.getMonth());
        setSelectedDay(today.getDate());
    };

    // Build the calendar grid (Mon-based week)
    const cells = useMemo(() => {
        const firstDow = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7;
        const dim = new Date(viewYear, viewMonth + 1, 0).getDate();
        const grid: (number | null)[] = [];
        for (let i = 0; i < firstDow; i++) grid.push(null);
        for (let d = 1; d <= dim; d++) grid.push(d);
        while (grid.length % 7 !== 0) grid.push(null);
        return grid;
    }, [viewYear, viewMonth]);

    // Build event map
    const eventMap = useMemo(() => {
        const map = new Map<string, DayEvent[]>();
        const add = (ts: number, evt: DayEvent) => {
            const key = toDateKey(ts);
            map.set(key, [...(map.get(key) ?? []), evt]);
        };
        (jobs ?? []).forEach((job) => {
            const base = { jobId: job._id, title: job.title, clientName: (job as any).clientName ?? "", status: job.status };
            add(job.intakeDate, { ...base, eventType: "intake" });
            if ((job as any).estimatedCompletionDate && job.status !== "closed") {
                add((job as any).estimatedCompletionDate, { ...base, eventType: "due" });
            }
            if ((job as any).completionDate) {
                add((job as any).completionDate, { ...base, eventType: "completion" });
            }
        });
        return map;
    }, [jobs]);

    const getEventsForDay = (day: number) =>
        eventMap.get(`${viewYear}-${viewMonth}-${day}`) ?? [];

    const selectedEvents = selectedDay ? getEventsForDay(selectedDay) : [];

    return (
        <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">

            {/* Header */}
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight">Schedule</h1>
                    <p className="text-zinc-500 font-medium">Job intake dates, deadlines and completions at a glance.</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={goToday}
                        className="px-4 py-2 bg-white border border-zinc-200 rounded-xl text-sm font-bold text-zinc-600 hover:bg-zinc-50 transition-all active:scale-95"
                    >
                        Today
                    </button>
                    <div className="flex items-center">
                        <button onClick={prevMonth} className="w-9 h-9 flex items-center justify-center bg-white border border-zinc-200 rounded-l-xl hover:bg-zinc-50 transition-all active:scale-95 border-r-0">
                            <ChevronLeft size={16} />
                        </button>
                        <span className="px-5 py-2 text-sm font-black tracking-tight bg-white border-y border-zinc-200 min-w-[160px] text-center">
                            {MONTHS[viewMonth]} {viewYear}
                        </span>
                        <button onClick={nextMonth} className="w-9 h-9 flex items-center justify-center bg-white border border-zinc-200 rounded-r-xl hover:bg-zinc-50 transition-all active:scale-95 border-l-0">
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </header>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-5">
                {Object.entries(EVENT_TYPE_CONFIG).map(([key, cfg]) => (
                    <div key={key} className="flex items-center gap-1.5">
                        <span className={cn("w-2 h-2 rounded-full", cfg.dot)} />
                        <span className="text-xs font-bold text-zinc-500">{cfg.label}</span>
                    </div>
                ))}
            </div>

            <div className={cn("grid gap-6", selectedDay ? "lg:grid-cols-3" : "")}>
                {/* Calendar grid */}
                <div className={cn("bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden", selectedDay ? "lg:col-span-2" : "")}>
                    {/* Weekday headers */}
                    <div className="grid grid-cols-7 border-b border-zinc-100 bg-zinc-50/50">
                        {WEEKDAYS.map((d) => (
                            <div key={d} className="py-3 text-center text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                                {d}
                            </div>
                        ))}
                    </div>

                    {/* Day cells */}
                    <div className="grid grid-cols-7">
                        {cells.map((day, i) => {
                            if (!day) {
                                return <div key={`e-${i}`} className={cn("min-h-[80px] border-b border-zinc-50", i % 7 !== 6 && "border-r")} />;
                            }

                            const events = getEventsForDay(day);
                            const isSelected = selectedDay === day;
                            const todayCell = isToday(viewYear, viewMonth, day);

                            return (
                                <div
                                    key={day}
                                    onClick={() => setSelectedDay(isSelected ? null : day)}
                                    className={cn(
                                        "min-h-[80px] p-2 border-b border-zinc-50 cursor-pointer transition-colors select-none",
                                        i % 7 !== 6 && "border-r",
                                        isSelected ? "bg-zinc-900" : "hover:bg-zinc-50/80",
                                    )}
                                >
                                    <div className={cn(
                                        "w-7 h-7 flex items-center justify-center rounded-full text-sm font-bold mb-1.5 transition-colors",
                                        todayCell && !isSelected && "bg-black text-white",
                                        isSelected && "bg-white text-black",
                                        !todayCell && !isSelected && "text-zinc-700",
                                    )}>
                                        {day}
                                    </div>

                                    {/* Event dots */}
                                    <div className="flex flex-wrap gap-0.5">
                                        {events.slice(0, 4).map((evt, ei) => (
                                            <span
                                                key={ei}
                                                className={cn("w-1.5 h-1.5 rounded-full shrink-0", EVENT_TYPE_CONFIG[evt.eventType]?.dot ?? "bg-zinc-400")}
                                            />
                                        ))}
                                        {events.length > 4 && (
                                            <span className={cn("text-[8px] font-black leading-none mt-0.5", isSelected ? "text-zinc-400" : "text-zinc-300")}>
                                                +{events.length - 4}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Day detail panel */}
                {selectedDay && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-200">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold tracking-tight">
                                {MONTHS[viewMonth]} {selectedDay}
                                {isToday(viewYear, viewMonth, selectedDay) && (
                                    <span className="ml-2 text-[10px] font-black uppercase tracking-widest text-white bg-black px-2 py-0.5 rounded-md">Today</span>
                                )}
                            </h3>
                            <button
                                onClick={() => setSelectedDay(null)}
                                className="w-7 h-7 flex items-center justify-center rounded-xl hover:bg-zinc-100 transition-colors text-zinc-400"
                            >
                                <X size={14} />
                            </button>
                        </div>

                        {selectedEvents.length === 0 ? (
                            <div className="bg-white border border-zinc-200 rounded-2xl p-10 text-center shadow-sm">
                                <CalendarDays className="mx-auto text-zinc-200 mb-3" size={32} />
                                <p className="text-sm text-zinc-400 font-medium">Nothing on this day.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {selectedEvents.map((evt, i) => {
                                    const cfg = EVENT_TYPE_CONFIG[evt.eventType];
                                    const statusDot = STATUS_COLORS[evt.status] ?? "bg-zinc-400";
                                    return (
                                        <Link key={i} href={`/dashboard/jobs/${evt.jobId}`}>
                                            <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer group">
                                                <div className="flex items-start justify-between gap-3 mb-2">
                                                    <span className={cn("text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg", cfg.badge)}>
                                                        {cfg.label}
                                                    </span>
                                                    <ChevronRight size={14} className="text-zinc-300 group-hover:text-black group-hover:translate-x-0.5 transition-all mt-0.5 shrink-0" />
                                                </div>
                                                <p className="text-sm font-bold text-zinc-900 leading-tight">{evt.title}</p>
                                                <p className="text-xs text-zinc-400 mt-0.5">{evt.clientName}</p>
                                                <div className="flex items-center gap-1.5 mt-3">
                                                    <span className={cn("w-1.5 h-1.5 rounded-full", statusDot)} />
                                                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                                                        {evt.status.replace(/_/g, " ")}
                                                    </span>
                                                </div>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
