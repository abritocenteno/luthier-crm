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
} from "lucide-react";
import { GlobalSearch } from "@/components/GlobalSearch";
import { NotificationBell } from "@/components/NotificationBell";
import { ThemeToggle } from "@/components/ThemeToggle";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";

// ── Brand tokens ─────────────────────────────────────────────────────────────
const BROWN      = "#2C1A0E";   // sidebar background
const BROWN_MID  = "#402A1B";   // logo mark bg, hover tint
const AMBER      = "#C9914C";   // brand accent
const AMBER_DIM  = "#A8723A";   // slightly deeper amber for borders
const CREAM      = "#E8D5B7";   // sidebar text (inactive)
const CREAM_DIM  = "#9C845F";   // sidebar text (very muted)

function SessionRecoveryButton() {
    return (
        <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 bg-black text-white px-8 py-3 rounded-xl font-bold hover:bg-zinc-800 transition-all active:scale-95 shadow-lg shadow-black/10"
        >
            <RefreshCw size={18} />
            Reconnect Session
        </button>
    );
}

const SidebarItem = ({
    icon: Icon,
    label,
    href,
    active,
    collapsed,
}: {
    icon: any;
    label: string;
    href: string;
    active: boolean;
    collapsed: boolean;
}) => (
    <Link
        href={href}
        style={
            active
                ? {
                      background: "rgba(201,145,76,0.14)",
                      color: AMBER,
                      borderLeft: `2px solid ${AMBER}`,
                  }
                : {
                      color: CREAM,
                      borderLeft: "2px solid transparent",
                  }
        }
        className={cn(
            "flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all rounded-r-xl group relative",
            !active && "hover:bg-white/5 hover:text-amber-200"
        )}
    >
        <Icon
            size={18}
            style={{ flexShrink: 0, opacity: active ? 1 : 0.7 }}
            className="transition-all group-hover:opacity-100"
        />
        {!collapsed && (
            <span className="truncate tracking-wide" style={{ fontSize: 13 }}>
                {label}
            </span>
        )}
    </Link>
);

function SidebarContent({
    navigation,
    pathname,
    collapsed,
    onCollapse,
}: {
    navigation: { label: string; icon: any; href: string }[];
    pathname: string;
    collapsed: boolean;
    onCollapse?: () => void;
}) {
    return (
        <div className="flex flex-col h-full" style={{ background: BROWN }}>
            {/* Logo */}
            <div
                className="h-16 flex items-center px-5 shrink-0"
                style={{ borderBottom: `1px solid rgba(255,255,255,0.07)` }}
            >
                {collapsed ? (
                    <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center mx-auto"
                        style={{ background: BROWN_MID }}
                    >
                        <span
                            className="font-bold text-lg"
                            style={{ color: AMBER, fontFamily: "var(--font-domine)" }}
                        >
                            F
                        </span>
                    </div>
                ) : (
                    <div className="flex items-center gap-2.5">
                        <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                            style={{ background: BROWN_MID }}
                        >
                            <span
                                className="font-bold text-lg"
                                style={{ color: AMBER, fontFamily: "var(--font-domine)" }}
                            >
                                F
                            </span>
                        </div>
                        <span
                            className="font-bold text-xl tracking-tight"
                            style={{ fontFamily: "var(--font-domine)", color: "#F5ECD7" }}
                        >
                            Fret<span style={{ color: AMBER }}>Ops</span>
                        </span>
                    </div>
                )}
            </div>

            {/* Nav */}
            <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
                {/* Section label */}
                {!collapsed && (
                    <p
                        className="px-3 pb-2 pt-1"
                        style={{
                            fontSize: 9,
                            letterSpacing: "0.14em",
                            textTransform: "uppercase",
                            color: CREAM_DIM,
                            fontWeight: 600,
                        }}
                    >
                        Workshop
                    </p>
                )}
                {navigation.slice(0, 7).map((item) => (
                    <SidebarItem
                        key={item.href}
                        {...item}
                        active={pathname === item.href}
                        collapsed={collapsed}
                    />
                ))}

                {!collapsed && (
                    <p
                        className="px-3 pb-2 pt-4"
                        style={{
                            fontSize: 9,
                            letterSpacing: "0.14em",
                            textTransform: "uppercase",
                            color: CREAM_DIM,
                            fontWeight: 600,
                        }}
                    >
                        Manage
                    </p>
                )}
                {collapsed && <div className="my-3" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }} />}
                {navigation.slice(7).map((item) => (
                    <SidebarItem
                        key={item.href}
                        {...item}
                        active={pathname === item.href}
                        collapsed={collapsed}
                    />
                ))}
            </nav>

            {/* Collapse toggle (desktop only) */}
            {onCollapse && (
                <div
                    className="p-3 shrink-0"
                    style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}
                >
                    <button
                        onClick={onCollapse}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-xl transition-all hover:bg-white/5"
                        style={{ color: CREAM_DIM }}
                    >
                        {collapsed ? (
                            <ChevronRight size={18} className="mx-auto" />
                        ) : (
                            <>
                                <ChevronLeft size={18} />
                                <span style={{ fontSize: 12 }}>Collapse</span>
                            </>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    const navigation = [
        { label: "Dashboard",  icon: LayoutDashboard, href: "/dashboard" },
        { label: "Clients",    icon: Users,            href: "/dashboard/clients" },
        { label: "Jobs",       icon: Wrench,           href: "/dashboard/jobs" },
        { label: "Suppliers",  icon: Truck,            href: "/dashboard/suppliers" },
        { label: "Invoices",   icon: FileText,         href: "/dashboard/invoices" },
        { label: "Orders",     icon: ShoppingBag,      href: "/dashboard/orders" },
        { label: "Parts",      icon: Package,          href: "/dashboard/parts" },
        { label: "Calendar",   icon: Calendar,         href: "/dashboard/schedule" },
        { label: "Reports",    icon: BarChart2,        href: "/dashboard/reports" },
        { label: "Settings",   icon: Settings,         href: "/dashboard/settings" },
    ];

    return (
        <div className="min-h-screen flex" style={{ background: "#F7F3EE" }}>
            <GlobalSearch />

            {/* ── Desktop Sidebar ── */}
            <aside
                className={cn(
                    "fixed inset-y-0 left-0 z-50 transition-all duration-300 hidden lg:block",
                    collapsed ? "w-20" : "w-64"
                )}
            >
                <SidebarContent
                    navigation={navigation}
                    pathname={pathname}
                    collapsed={collapsed}
                    onCollapse={() => setCollapsed(!collapsed)}
                />
            </aside>

            {/* ── Mobile overlay ── */}
            <div
                className={cn(
                    "fixed inset-0 z-50 bg-black/50 backdrop-blur-sm lg:hidden transition-opacity duration-300",
                    mobileOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
                onClick={() => setMobileOpen(false)}
            />
            <aside
                className={cn(
                    "fixed inset-y-0 left-0 z-50 w-64 transition-transform duration-300 lg:hidden",
                    mobileOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                <div className="h-16 flex items-center justify-between px-5" style={{ background: BROWN, borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: BROWN_MID }}>
                            <span className="font-bold text-lg" style={{ color: AMBER, fontFamily: "var(--font-domine)" }}>F</span>
                        </div>
                        <span className="font-bold text-xl tracking-tight" style={{ fontFamily: "var(--font-domine)", color: "#F5ECD7" }}>
                            Fret<span style={{ color: AMBER }}>Ops</span>
                        </span>
                    </div>
                    <button onClick={() => setMobileOpen(false)} className="p-1 rounded-lg hover:bg-white/10" style={{ color: CREAM }}>
                        <X size={20} />
                    </button>
                </div>
                <nav className="py-4 px-3 space-y-0.5" style={{ background: BROWN, height: "calc(100% - 4rem)" }} onClick={() => setMobileOpen(false)}>
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

            {/* ── Main ── */}
            <main
                className={cn(
                    "flex-1 transition-all duration-300 min-h-screen flex flex-col",
                    "lg:ml-64",
                    collapsed && "lg:ml-20"
                )}
            >
                {/* Topbar */}
                <header
                    className="h-16 sticky top-0 z-30 flex items-center justify-between px-6"
                    style={{
                        background: "rgba(247,243,238,0.85)",
                        backdropFilter: "blur(12px)",
                        WebkitBackdropFilter: "blur(12px)",
                        borderBottom: "1px solid rgba(64,42,27,0.1)",
                    }}
                >
                    <button
                        onClick={() => setMobileOpen(true)}
                        className="p-2 rounded-lg lg:hidden hover:bg-black/5 transition-colors"
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
                            className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all hover:bg-black/5"
                            style={{
                                background: "rgba(64,42,27,0.07)",
                                color: "#7A5C3D",
                            }}
                        >
                            <Search size={13} />
                            <span>Search</span>
                            <kbd
                                className="ml-1 px-1.5 py-0.5 rounded text-[10px] font-bold"
                                style={{
                                    background: "rgba(255,255,255,0.8)",
                                    border: "1px solid rgba(64,42,27,0.15)",
                                    color: "#9C7A52",
                                }}
                            >
                                ⌘K
                            </kbd>
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
                    <Authenticated>{children}</Authenticated>
                    <Unauthenticated>
                        <div className="h-full flex flex-col items-center justify-center space-y-6">
                            <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "rgba(64,42,27,0.08)" }}>
                                <Users size={32} style={{ color: AMBER }} />
                            </div>
                            <div className="text-center space-y-2">
                                <h2 className="text-2xl font-bold tracking-tight">Access Restricted</h2>
                                <p className="text-zinc-500 max-w-sm">Please sign in to your workshop account to access the dashboard.</p>
                            </div>
                            <SessionRecoveryButton />
                        </div>
                    </Unauthenticated>
                    <AuthLoading>
                        <div className="h-full flex items-center justify-center">
                            <div className="w-8 h-8 border-4 border-zinc-200 rounded-full animate-spin" style={{ borderTopColor: AMBER }} />
                        </div>
                    </AuthLoading>
                </div>
            </main>
        </div>
    );
}
