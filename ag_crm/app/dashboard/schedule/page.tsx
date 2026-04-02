"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import Link from "next/link";
import { ChevronLeft, ChevronRight, X, CalendarDays, Plus, Trash2 } from "lucide-react";
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

const MANUAL_EVENT_CONFIG: Record<string, { dot: string; label: string; badge: string }> = {
    appointment: { dot: "bg-violet-500", label: "Appointment", badge: "bg-violet-50 text-violet-700 border border-violet-100" },
    task:        { dot: "bg-orange-400", label: "Task",        badge: "bg-orange-50 text-orange-700 border border-orange-100" },
    reminder:    { dot: "bg-pink-400",   label: "Reminder",    badge: "bg-pink-50 text-pink-700 border border-pink-100" },
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
    const manualEvents = useQuery(api.events.list);
    const addEvent = useMutation(api.events.add);
    const removeEvent = useMutation(api.events.remove);

    const today = new Date();
    const [viewYear, setViewYear] = useState(today.getFullYear());
    const [viewMonth, setViewMonth] = useState(today.getMonth());
    const [selectedDay, setSelectedDay] = useState<number | null>(null);

    const [showEventForm, setShowEventForm] = useState(false);
    const [eventDraft, setEventDraft] = useState({ title: "", date: "", type: "appointment", description: "" });
    const [isSavingEvent, setIsSavingEvent] = useState(false);

    const openEventForm = (day?: number) => {
        const d = day ?? selectedDay;
        const dateStr = d
            ? `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`
            : "";
        setEventDraft({ title: "", date: dateStr, type: "appointment", description: "" });
        setShowEventForm(true);
    };

    const handleSaveEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!eventDraft.title || !eventDraft.date) return;
        setIsSavingEvent(true);
        try {
            const start = new Date(eventDraft.date + "T12:00:00").getTime();
            await addEvent({ title: eventDraft.title, start, type: eventDraft.type, description: eventDraft.description || undefined });
            setShowEventForm(false);
        } catch (err) { console.error(err); }
        finally { setIsSavingEvent(false); }
    };

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

    const manualEventMap = useMemo(() => {
        const map = new Map<string, typeof manualEvents>();
        (manualEvents ?? []).forEach((evt) => {
            const key = toDateKey(evt.start);
            map.set(key, [...(map.get(key) ?? []), evt]);
        });
        return map;
    }, [manualEvents]);

    const getEventsForDay = (day: number) =>
        eventMap.get(`${viewYear}-${viewMonth}-${day}`) ?? [];

    const getManualEventsForDay = (day: number) =>
        manualEventMap.get(`${viewYear}-${viewMonth}-${day}`) ?? [];

    const selectedEvents = selectedDay ? getEventsForDay(selectedDay) : [];
    const selectedManualEvents = selectedDay ? getManualEventsForDay(selectedDay) : [];

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
                        onClick={() => openEventForm()}
                        className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-xl text-sm font-bold hover:bg-zinc-800 transition-all active:scale-95 shadow-lg shadow-black/10"
                    >
                        <Plus size={15} />
                        New Event
                    </button>
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
                            const manEvts = getManualEventsForDay(day);
                            const totalDots = events.length + manEvts.length;
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
                                        {events.slice(0, 3).map((evt, ei) => (
                                            <span key={`j-${ei}`} className={cn("w-1.5 h-1.5 rounded-full shrink-0", EVENT_TYPE_CONFIG[evt.eventType]?.dot ?? "bg-zinc-400")} />
                                        ))}
                                        {manEvts.slice(0, 3).map((evt, ei) => (
                                            <span key={`m-${ei}`} className={cn("w-1.5 h-1.5 rounded-full shrink-0", MANUAL_EVENT_CONFIG[evt.type]?.dot ?? "bg-zinc-400")} />
                                        ))}
                                        {totalDots > 6 && (
                                            <span className={cn("text-[8px] font-black leading-none mt-0.5", isSelected ? "text-zinc-400" : "text-zinc-300")}>
                                                +{totalDots - 6}
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
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => openEventForm(selectedDay)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-black text-white rounded-lg text-xs font-bold hover:bg-zinc-800 transition-all active:scale-95"
                                >
                                    <Plus size={13} />
                                    Add
                                </button>
                                <button
                                    onClick={() => setSelectedDay(null)}
                                    className="w-7 h-7 flex items-center justify-center rounded-xl hover:bg-zinc-100 transition-colors text-zinc-400"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        </div>

                        {selectedEvents.length === 0 && selectedManualEvents.length === 0 ? (
                            <div className="bg-white border border-zinc-200 rounded-2xl p-10 text-center shadow-sm">
                                <CalendarDays className="mx-auto text-zinc-200 mb-3" size={32} />
                                <p className="text-sm text-zinc-400 font-medium">Nothing on this day.</p>
                                <button onClick={() => openEventForm(selectedDay)} className="mt-3 text-xs font-bold text-black underline underline-offset-4 hover:text-zinc-600 transition-colors">
                                    Add event →
                                </button>
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
                                {selectedManualEvents.map((evt) => {
                                    const cfg = MANUAL_EVENT_CONFIG[evt.type] ?? MANUAL_EVENT_CONFIG.appointment;
                                    return (
                                        <div key={evt._id} className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm group">
                                            <div className="flex items-start justify-between gap-3 mb-2">
                                                <span className={cn("text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg", cfg.badge)}>
                                                    {cfg.label}
                                                </span>
                                                <button
                                                    onClick={() => removeEvent({ id: evt._id })}
                                                    className="p-1 text-zinc-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                                >
                                                    <Trash2 size={13} />
                                                </button>
                                            </div>
                                            <p className="text-sm font-bold text-zinc-900 leading-tight">{evt.title}</p>
                                            {evt.description && <p className="text-xs text-zinc-400 mt-0.5">{evt.description}</p>}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>
            {/* New Event Modal */}
            {showEventForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setShowEventForm(false)} />
                    <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-zinc-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
                        <div className="p-6 space-y-5">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <h3 className="text-lg font-bold text-zinc-900">New Event</h3>
                                    <p className="text-sm text-zinc-500 mt-0.5">Add an appointment, task or reminder.</p>
                                </div>
                                <button onClick={() => setShowEventForm(false)} className="p-1.5 hover:bg-zinc-100 rounded-xl text-zinc-400 hover:text-black transition-colors shrink-0">
                                    <X size={18} />
                                </button>
                            </div>
                            <form onSubmit={handleSaveEvent} className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Title *</label>
                                    <input
                                        required
                                        autoFocus
                                        value={eventDraft.title}
                                        onChange={e => setEventDraft({ ...eventDraft, title: e.target.value })}
                                        placeholder="e.g. Client pickup, Order strings…"
                                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-black/5 outline-none transition-all"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Date *</label>
                                        <input
                                            required
                                            type="date"
                                            value={eventDraft.date}
                                            onChange={e => setEventDraft({ ...eventDraft, date: e.target.value })}
                                            className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-black/5 outline-none transition-all"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Type</label>
                                        <div className="relative">
                                            <select
                                                value={eventDraft.type}
                                                onChange={e => setEventDraft({ ...eventDraft, type: e.target.value })}
                                                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm appearance-none focus:ring-2 focus:ring-black/5 outline-none transition-all pr-8"
                                            >
                                                <option value="appointment">Appointment</option>
                                                <option value="task">Task</option>
                                                <option value="reminder">Reminder</option>
                                            </select>
                                            <ChevronRight size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none rotate-90" />
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Notes</label>
                                    <textarea
                                        rows={2}
                                        value={eventDraft.description}
                                        onChange={e => setEventDraft({ ...eventDraft, description: e.target.value })}
                                        placeholder="Optional notes…"
                                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-black/5 outline-none transition-all resize-none"
                                    />
                                </div>
                                <div className="flex gap-3 pt-1">
                                    <button type="button" onClick={() => setShowEventForm(false)} className="flex-1 py-2.5 border border-zinc-200 rounded-xl text-sm font-bold text-zinc-600 hover:bg-zinc-50 transition-all">Cancel</button>
                                    <button type="submit" disabled={isSavingEvent} className="flex-1 py-2.5 bg-black text-white rounded-xl text-sm font-bold hover:bg-zinc-800 transition-all disabled:opacity-50">
                                        {isSavingEvent ? "Saving…" : "Add Event"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
