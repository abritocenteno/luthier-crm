"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import Link from "next/link";
import {
    Users,
    Truck,
    FileText,
    Clock,
    ChevronRight,
    Plus,
    ArrowUpRight,
    TrendingUp
} from "lucide-react";
import { motion } from "motion/react";
import { cn, formatCurrency } from "@/lib/utils";

const StatCard = ({
    label,
    value,
    icon: Icon,
    trend,
    color
}: {
    label: string,
    value: string | number,
    icon: any,
    trend?: string,
    color: string
}) => (
    <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
        <div className={cn("absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 rounded-full opacity-[0.03] group-hover:scale-110 transition-transform", color)} />
        <div className="flex items-center justify-between mb-4">
            <div className={cn("p-2.5 rounded-xl bg-zinc-50 transition-colors group-hover:bg-zinc-100", color)}>
                <Icon size={22} />
            </div>
            {trend && (
                <div className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                    <TrendingUp size={12} />
                    {trend}
                </div>
            )}
        </div>
        <div className="space-y-1">
            <p className="text-sm text-zinc-500 font-medium tracking-tight">{label}</p>
            <p className="text-3xl font-bold tracking-tight">{value}</p>
        </div>
    </div>
);

const ActivityItem = ({ title, subtitle, time, icon: Icon }: { title: string, subtitle: string, time: string, icon: any }) => (
    <div className="flex items-center gap-4 py-4 border-b border-zinc-100 last:border-0 group cursor-pointer">
        <div className="w-10 h-10 rounded-xl bg-zinc-50 flex items-center justify-center text-zinc-400 group-hover:bg-black group-hover:text-white transition-all">
            <Icon size={18} />
        </div>
        <div className="flex-1">
            <p className="text-sm font-semibold text-zinc-900">{title}</p>
            <p className="text-xs text-zinc-500">{subtitle}</p>
        </div>
        <div className="text-right">
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{time}</p>
            <ChevronRight size={14} className="ml-auto mt-1 text-zinc-300 group-hover:text-black group-hover:translate-x-0.5 transition-all" />
        </div>
    </div>
);

export default function Dashboard() {
    const user = useQuery(api.users.currentUser);
    const settings = useQuery(api.settings.get);
    const dashboardData = useQuery(api.dashboard.getStats);

    const getIcon = (type: string) => {
        switch (type) {
            case 'invoice': return FileText;
            case 'client': return Users;
            case 'order': return Truck;
            case 'event': return Clock;
            default: return Clock;
        }
    };

    const formatTime = (timestamp: number) => {
        const diff = Date.now() - timestamp;
        const mins = Math.floor(diff / 60000);
        const hours = Math.floor(mins / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days}d ago`;
        if (hours > 0) return `${hours}h ago`;
        return `${mins}m ago`;
    };

    const stats = dashboardData?.stats.map((s: any) => ({
        ...s,
        icon: s.type === 'clients' ? Users : s.type === 'suppliers' ? Truck : s.type === 'invoiced' ? FileText : s.type === 'orders' ? Truck : Clock,
        color: s.type === 'clients' ? 'text-blue-600' : s.type === 'suppliers' ? 'text-purple-600' : s.type === 'invoiced' ? 'text-emerald-600' : s.type === 'orders' ? 'text-orange-600' : 'text-amber-600',
        value: s.type === 'invoiced' || s.type === 'pending' || s.type === 'orders' ? formatCurrency(s.value, settings?.currency) : s.value
    })) || [];

    return (
        <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Welcome Header */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 px-2.5 py-0.5 bg-black text-white text-[10px] font-bold uppercase tracking-widest rounded-md">
                        Workshop Live
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight">
                        Welcome back, {user?.name?.split(' ')[0] || 'Artisan'}
                    </h1>
                    <p className="text-zinc-500 font-medium">
                        Here's a summary of your workshop's performance today.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm font-semibold text-zinc-600 hover:bg-zinc-50 transition-all shadow-sm outline-none">
                        Export Data
                    </button>
                    <Link href="/dashboard/invoices">
                        <button className="flex items-center gap-2 px-6 py-2.5 bg-black text-white rounded-xl text-sm font-semibold hover:bg-zinc-800 transition-all shadow-lg shadow-black/10 active:scale-95 outline-none">
                            <Plus size={18} />
                            New Invoice
                        </button>
                    </Link>
                </div>
            </header>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
                {dashboardData ? (
                    stats.map((stat, i) => (
                        <StatCard key={i} {...stat} />
                    ))
                ) : (
                    [1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="h-32 bg-zinc-100 rounded-2xl animate-pulse" />
                    ))
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Activity Feed */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold tracking-tight">Recent Activity</h3>
                        <Link href="/dashboard/schedule" className="text-sm font-bold text-zinc-400 hover:text-black transition-colors">
                            View all activity
                        </Link>
                    </div>
                    <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm">
                        {dashboardData ? (
                            dashboardData.recentActivity.length > 0 ? (
                                dashboardData.recentActivity.map((activity: any) => (
                                    <ActivityItem
                                        key={activity.id}
                                        title={activity.title}
                                        subtitle={activity.subtitle}
                                        time={formatTime(activity.time)}
                                        icon={getIcon(activity.type)}
                                    />
                                ))
                            ) : (
                                <div className="py-12 text-center space-y-3">
                                    <p className="text-zinc-500 font-medium">No recent activity found.</p>
                                </div>
                            )
                        ) : (
                            [1, 2, 3, 4].map(i => (
                                <div key={i} className="h-16 bg-zinc-50 rounded-xl mb-4 animate-pulse last:mb-0" />
                            ))
                        )}
                    </div>
                </div>

                {/* Quick Actions / Insights */}
                <div className="space-y-6">
                    <h3 className="text-xl font-bold tracking-tight">Workshop Insights</h3>
                    <div className="bg-black text-white rounded-2xl p-6 shadow-xl shadow-black/10 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-20">
                            <ArrowUpRight size={48} />
                        </div>
                        <div className="relative z-10 space-y-6">
                            <div className="space-y-1">
                                <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest">Potential Growth</p>
                                <p className="text-3xl font-bold">+24.5%</p>
                            </div>
                            <p className="text-sm text-zinc-300 leading-relaxed">
                                Based on your recent invoice volume, your workshop is trending towards a record-breaking month.
                            </p>
                            <button className="w-full py-3 bg-white text-black rounded-xl font-bold text-sm tracking-tight hover:bg-zinc-100 transition-all active:scale-95">
                                View Growth Report
                            </button>
                        </div>
                    </div>

                    <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm space-y-4">
                        <h4 className="font-bold">Active Projects</h4>
                        <div className="space-y-3">
                            {[
                                { name: "Luthier Pro Build", progress: 75 },
                                { name: "Vintage Restoration", progress: 30 }
                            ].map((p, i) => (
                                <div key={i} className="space-y-1.5">
                                    <div className="flex justify-between text-xs font-bold">
                                        <span>{p.name}</span>
                                        <span className="text-zinc-400">{p.progress}%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-black rounded-full"
                                            style={{ width: `${p.progress}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
