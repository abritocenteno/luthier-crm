"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "../convex/_generated/api";
import {
    Bell, AlertTriangle, CheckCircle2, Clock, X, CheckCheck, Wrench,
} from "lucide-react";
import { cn } from "@/lib/utils";

const TYPE_CONFIG: Record<string, {
    icon: React.ReactNode;
    color: string;
    dot: string;
}> = {
    overdue_invoice: {
        icon: <AlertTriangle size={14} />,
        color: "bg-red-50 text-red-600",
        dot: "bg-red-500",
    },
    job_ready: {
        icon: <CheckCircle2 size={14} />,
        color: "bg-emerald-50 text-emerald-600",
        dot: "bg-emerald-500",
    },
    job_due_soon: {
        icon: <Clock size={14} />,
        color: "bg-amber-50 text-amber-600",
        dot: "bg-amber-500",
    },
    job_overdue: {
        icon: <Wrench size={14} />,
        color: "bg-orange-50 text-orange-600",
        dot: "bg-orange-500",
    },
};

function timeAgo(ts: number) {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 2) return "just now";
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(ts).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export function NotificationBell() {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);
    const notifications = useQuery(api.notifications.list) ?? [];
    const markRead = useMutation(api.notifications.markRead);
    const markAllRead = useMutation(api.notifications.markAllRead);

    const unread = notifications.filter((n) => !n.read);
    const unreadCount = unread.length;

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        if (open) document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [open]);

    const handleClick = async (n: typeof notifications[number]) => {
        if (!n.read) await markRead({ key: n.key });
        setOpen(false);
        router.push(n.href);
    };

    const handleMarkAll = async () => {
        const unreadKeys = unread.map((n) => n.key);
        if (unreadKeys.length > 0) await markAllRead({ keys: unreadKeys });
    };

    return (
        <div ref={panelRef} className="relative">
            {/* Bell button */}
            <button
                onClick={() => setOpen((v) => !v)}
                className={cn(
                    "relative p-2 rounded-xl transition-all",
                    open ? "bg-zinc-100 text-black" : "text-zinc-500 hover:bg-zinc-100 hover:text-black"
                )}
                title="Notifications"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center leading-none">
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown panel */}
            {open && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-zinc-200 rounded-2xl shadow-2xl shadow-black/10 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-zinc-900">Notifications</h3>
                            {unreadCount > 0 && (
                                <span className="px-1.5 py-0.5 bg-red-50 text-red-600 text-[10px] font-black rounded-full">
                                    {unreadCount} new
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            {unreadCount > 0 && (
                                <button
                                    onClick={handleMarkAll}
                                    className="flex items-center gap-1 text-[11px] font-bold text-zinc-400 hover:text-black transition-colors"
                                    title="Mark all as read"
                                >
                                    <CheckCheck size={13} />
                                    All read
                                </button>
                            )}
                            <button
                                onClick={() => setOpen(false)}
                                className="p-1 text-zinc-400 hover:text-black hover:bg-zinc-100 rounded-lg transition-all"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    </div>

                    {/* List */}
                    <div className="max-h-[420px] overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 gap-3">
                                <div className="w-12 h-12 bg-zinc-50 rounded-full flex items-center justify-center text-zinc-300">
                                    <Bell size={22} />
                                </div>
                                <p className="text-sm text-zinc-400 font-medium">You're all caught up!</p>
                                <p className="text-xs text-zinc-300 text-center px-6">
                                    Overdue invoices, ready jobs and upcoming deadlines will show up here.
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y divide-zinc-50">
                                {notifications.map((n) => {
                                    const cfg = TYPE_CONFIG[n.type] ?? TYPE_CONFIG.job_overdue;
                                    return (
                                        <button
                                            key={n.key}
                                            onClick={() => handleClick(n)}
                                            className={cn(
                                                "w-full flex items-start gap-3 px-5 py-3.5 text-left transition-colors hover:bg-zinc-50",
                                                !n.read && "bg-zinc-50/60"
                                            )}
                                        >
                                            {/* Icon */}
                                            <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5", cfg.color)}>
                                                {cfg.icon}
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2">
                                                    <p className={cn("text-sm leading-snug", n.read ? "text-zinc-600 font-medium" : "text-zinc-900 font-bold")}>
                                                        {n.title}
                                                    </p>
                                                    <div className="flex items-center gap-1.5 shrink-0">
                                                        <span className="text-[10px] text-zinc-400 whitespace-nowrap">{timeAgo(n.createdAt)}</span>
                                                        {!n.read && <span className={cn("w-2 h-2 rounded-full shrink-0", cfg.dot)} />}
                                                    </div>
                                                </div>
                                                <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">{n.body}</p>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                        <div className="px-5 py-3 border-t border-zinc-100 bg-zinc-50/50 text-center">
                            <p className="text-[10px] text-zinc-400 font-medium">
                                {notifications.length} notification{notifications.length !== 1 ? "s" : ""} ·{" "}
                                {unreadCount > 0 ? `${unreadCount} unread` : "all read"}
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
