"use client";

import { UserButton } from "@/components/clerk-compat";
import {
    Users,
    Truck,
    FileText,
    LayoutDashboard,
    Calendar,
    Settings,
    ChevronLeft,
    ChevronRight,
    Menu,
    X,
    ShoppingBag,
    RefreshCw,
    Wrench,
    BarChart2,
    Package,
    Search,
    Clock,
    Library,
} from "lucide-react";
import { GlobalSearch } from "@/components/GlobalSearch";
import { NotificationBell } from "@/components/NotificationBell";
import { ThemeToggle } from "@/components/ThemeToggle";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Authenticated, Unauthenticated, AuthLoading, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

/**
 * Recovery button shown when Convex reports Unauthenticated.
 *
 * Sends the user to the landing page ("/") — which is the app's auth entry
 * point — rather than reloading /dashboard. The landing page resolves both
 * cases on a fresh load:
 *  1. Clerk session still alive but Convex lost the token (common after a tab
 *     sits idle): "/" re-auths with a fresh JWT and <Authenticated> redirects
 *     straight back to /dashboard.
 *  2. Genuinely signed out: "/" shows <Unauthenticated> with the Sign In login
 *     modal.
 *
 * Note: reloading /dashboard here did nothing — with no Clerk middleware,
 * /dashboard just re-renders the same Unauthenticated state. A modal
 * SignInButton can't be used in-place either, as Clerk throws
 * "cannot_render_single_session_enabled" while it still considers the user
 * signed-in.
 */
function SessionRecoveryButton() {
    const handleRecover = () => {
        // Full navigation to the auth entry point (not a same-page reload). The
        // ?signin=1 flag tells the landing page to auto-open the sign-in modal
        // when the user is genuinely signed out; if the Clerk session is still
        // alive it's ignored and <Authenticated> redirects back to /dashboard.
        window.location.href = "/?signin=1";
    };

    return (
        <button
            onClick={handleRecover}
            className="flex items-center gap-2 bg-black text-white px-8 py-3 rounded-xl font-bold hover:bg-zinc-800 transition-all active:scale-95 shadow-lg shadow-black/10"
        >
            <RefreshCw size={18} />
            Sign In Again
        </button>
    );
}

/**
 * Routes a not-yet-onboarded user (authenticated, but no settings record) to the
 * onboarding wizard before they can use the dashboard. Existing users have a
 * settings row and pass straight through. Renders inside <Authenticated>, so the
 * Convex auth token is always present when this query runs.
 */
function OnboardingGate({ children }: { children: React.ReactNode }) {
    const settings = useQuery(api.settings.get);
    const router = useRouter();

    useEffect(() => {
        if (settings === null) router.replace("/onboarding");
    }, [settings, router]);

    // `undefined` = still loading; `null` = loaded but absent (redirecting).
    if (settings === undefined || settings === null) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-zinc-200 border-t-black rounded-full animate-spin" />
            </div>
        );
    }

    return <>{children}</>;
}

const SidebarItem = ({
    icon: Icon,
    label,
    href,
    active,
    collapsed
}: {
    icon: any,
    label: string,
    href: string,
    active: boolean,
    collapsed: boolean
}) => (
    <Link
        href={href}
        className={cn(
            "flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all rounded-xl group relative",
            active
                ? "bg-black text-white shadow-lg shadow-black/10"
                : "text-zinc-500 hover:text-black hover:bg-zinc-100"
        )}
    >
        <Icon size={20} className={cn("flex-shrink-0 transition-transform", active ? "" : "group-hover:scale-110")} />
        {!collapsed && <span className="truncate">{label}</span>}
        {collapsed && active && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-black rounded-r-full" />
        )}
    </Link>
);

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    const navigation = [
        { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
        { label: "Clients", icon: Users, href: "/dashboard/clients" },
        { label: "Jobs", icon: Wrench, href: "/dashboard/jobs" },
        { label: "Suppliers", icon: Truck, href: "/dashboard/suppliers" },
        { label: "Invoices", icon: FileText, href: "/dashboard/invoices" },
        { label: "Orders", icon: ShoppingBag, href: "/dashboard/orders" },
        { label: "Parts", icon: Package, href: "/dashboard/parts" },
        { label: "Library", icon: Library, href: "/dashboard/library" },
        { label: "Calendar", icon: Calendar, href: "/dashboard/schedule" },
        { label: "Timesheet", icon: Clock, href: "/dashboard/timesheet" },
        { label: "Reports", icon: BarChart2, href: "/dashboard/reports" },
        { label: "Settings", icon: Settings, href: "/dashboard/settings" },
    ];

    return (
        <div className="min-h-screen bg-zinc-50 flex">
            <GlobalSearch />
            {/* Desktop Sidebar */}
            <aside
                className={cn(
                    "fixed inset-y-0 left-0 z-50 bg-white border-r border-zinc-200 transition-all duration-300 hidden lg:flex flex-col",
                    collapsed ? "w-20" : "w-64"
                )}
            >
                <div className="h-16 flex items-center justify-between px-6 border-b border-zinc-100">
                    {!collapsed && (
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#402A1B" }}>
                                <span className="font-bold text-lg" style={{ color: "#C9914C", fontFamily: "var(--font-domine)" }}>F</span>
                            </div>
                            <span className="font-bold text-xl tracking-tight" style={{ fontFamily: "var(--font-domine)" }}>Fret<span style={{ color: "#C9914C" }}>Ops</span></span>
                        </div>
                    )}
                    {collapsed && (
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center mx-auto" style={{ background: "#402A1B" }}>
                            <span className="font-bold text-lg" style={{ color: "#C9914C", fontFamily: "var(--font-domine)" }}>F</span>
                        </div>
                    )}
                </div>

                <nav className="flex-1 overflow-y-auto p-4 space-y-2">
                    {navigation.map((item) => (
                        <SidebarItem
                            key={item.href}
                            {...item}
                            active={pathname === item.href}
                            collapsed={collapsed}
                        />
                    ))}
                </nav>

                <div className="p-4 border-t border-zinc-100">
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-zinc-500 hover:text-black hover:bg-zinc-100 rounded-xl transition-all"
                    >
                        {collapsed ? <ChevronRight size={20} className="mx-auto" /> : (
                            <>
                                <ChevronLeft size={20} />
                                <span>Collapse Sidebar</span>
                            </>
                        )}
                    </button>
                </div>
            </aside>

            {/* Mobile Sidebar */}
            <div
                className={cn(
                    "fixed inset-0 z-50 bg-black/40 backdrop-blur-sm lg:hidden transition-opacity duration-300",
                    mobileOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
                onClick={() => setMobileOpen(false)}
            />

            <aside
                className={cn(
                    "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-zinc-200 transition-transform duration-300 lg:hidden flex flex-col",
                    mobileOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                <div className="h-16 flex items-center justify-between px-6 border-b border-zinc-100">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#402A1B" }}>
                            <span className="font-bold text-lg" style={{ color: "#C9914C", fontFamily: "var(--font-domine)" }}>F</span>
                        </div>
                        <span className="font-bold text-xl tracking-tight" style={{ fontFamily: "var(--font-domine)" }}>Fret<span style={{ color: "#C9914C" }}>Ops</span></span>
                    </div>
                    <button onClick={() => setMobileOpen(false)} className="p-1 hover:bg-zinc-100 rounded-lg">
                        <X size={20} />
                    </button>
                </div>
                <nav className="flex-1 overflow-y-auto p-4 space-y-2" onClick={() => setMobileOpen(false)}>
                    {navigation.map((item) => (
                        <SidebarItem
                            key={item.href}
                            {...item}
                            active={pathname === item.href}
                            collapsed={false}
                        />
                    ))}
                </nav>
            </aside>

            {/* Main Content */}
            <main
                style={{ '--sidebar-w': collapsed ? '5rem' : '16rem' } as React.CSSProperties}
                className={cn(
                    "flex-1 transition-all duration-300 min-h-screen relative flex flex-col",
                    "lg:ml-64",
                    collapsed && "lg:ml-20"
                )}
            >
                {/* Header */}
                <header className="h-16 sticky top-0 z-30 bg-white/80 dark:bg-zinc-950/85 backdrop-blur-md border-b border-zinc-200 px-6 flex items-center justify-between">
                    <button
                        onClick={() => setMobileOpen(true)}
                        className="p-2 hover:bg-zinc-100 rounded-lg lg:hidden"
                    >
                        <Menu size={20} />
                    </button>

                    <div className="ml-auto flex items-center gap-3">
                        {/* Search trigger */}
                        <button
                            onClick={() => {
                                const e = new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true });
                                window.dispatchEvent(e);
                            }}
                            className="hidden sm:flex items-center gap-2 px-3 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-500 hover:text-zinc-700 rounded-xl text-xs font-medium transition-all"
                        >
                            <Search size={14} />
                            <span>Search</span>
                            <kbd className="ml-1 px-1.5 py-0.5 bg-white border border-zinc-200 rounded text-[10px] font-bold shadow-sm text-zinc-400">⌘K</kbd>
                        </button>
                        <ThemeToggle />
                        <Authenticated>
                            <NotificationBell />
                            <UserButton afterSignOutUrl="/" />
                        </Authenticated>
                    </div>
                </header>

                {/* Content */}
                <div className="flex-1 p-6 lg:p-8">
                    <Authenticated>
                        <OnboardingGate>{children}</OnboardingGate>
                    </Authenticated>
                    <Unauthenticated>
                        <div className="h-full flex flex-col items-center justify-center space-y-6">
                            <div className="w-16 h-16 bg-zinc-100 rounded-2xl flex items-center justify-center text-zinc-400">
                                <Users size={32} />
                            </div>
                            <div className="text-center space-y-2">
                                <h2 className="text-2xl font-bold tracking-tight">Access Restricted</h2>
                                <p className="text-zinc-500 max-w-sm">Please sign in to your workshop account to access the dashboard and manage your projects.</p>
                            </div>
                            <SessionRecoveryButton />
                        </div>
                    </Unauthenticated>
                    <AuthLoading>
                        <div className="h-full flex items-center justify-center">
                            <div className="w-8 h-8 border-4 border-zinc-200 border-t-black rounded-full animate-spin" />
                        </div>
                    </AuthLoading>
                </div>
            </main>
        </div>
    );
}
