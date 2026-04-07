"use client";

import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { SignInButton, SignUpButton, UserButton } from "@/components/clerk-compat";
import Link from "next/link";
import { motion } from "motion/react";
import {
    Users, LayoutDashboard, ChevronRight,
    Wrench, BarChart3, ArrowRight, FileText, Bell, Package,
} from "lucide-react";

// ── Brand tokens ──────────────────────────────────────────────────────────────
const BROWN  = "#402A1B";
const AMBER  = "#C9914C";
const CREAM  = "#FEE9D6";
const DARK   = "#23211E";

export default function Home() {
    return (
        <main className="min-h-screen" style={{ background: "#FEF7EE", color: DARK }}>

            {/* ── Nav ── */}
            <nav
                className="fixed top-0 w-full z-50 border-b"
                style={{ background: "rgba(254,247,238,0.88)", backdropFilter: "blur(14px)", borderColor: "#E8D4BE" }}
            >
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    {/* Wordmark */}
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: BROWN }}>
                            <span className="font-bold text-sm" style={{ color: AMBER, fontFamily: "var(--font-domine)" }}>F</span>
                        </div>
                        <span className="text-xl font-bold tracking-tight" style={{ fontFamily: "var(--font-domine)", color: DARK }}>
                            Fret<span style={{ color: AMBER }}>Ops</span>
                        </span>
                    </div>

                    <div className="flex items-center gap-3">
                        <AuthLoading>
                            <div className="h-4 w-20 rounded animate-pulse" style={{ background: "#E8D4BE" }} />
                        </AuthLoading>
                        <Unauthenticated>
                            <SignInButton mode="modal">
                                <button className="text-sm font-semibold px-4 py-2 transition-colors" style={{ color: "#7A5234" }}>
                                    Sign In
                                </button>
                            </SignInButton>
                            <SignUpButton mode="modal">
                                <button
                                    className="text-sm font-bold px-5 py-2.5 rounded-xl transition-all active:scale-95 shadow-lg"
                                    style={{ background: BROWN, color: CREAM }}
                                >
                                    Get Started
                                </button>
                            </SignUpButton>
                        </Unauthenticated>
                        <Authenticated>
                            <Link
                                href="/dashboard"
                                className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 transition-colors"
                                style={{ color: "#7A5234" }}
                            >
                                Dashboard <ChevronRight size={14} />
                            </Link>
                            <UserButton afterSignOutUrl="/" />
                        </Authenticated>
                    </div>
                </div>
            </nav>

            {/* ── Hero ── */}
            <section className="pt-40 pb-24 px-6">
                <div className="max-w-6xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.65 }}
                        className="text-center space-y-8 max-w-3xl mx-auto"
                    >
                        {/* Badge */}
                        <div
                            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border"
                            style={{ background: CREAM, borderColor: "#D4A87A", color: "#7A5234" }}
                        >
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: AMBER }} />
                                <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: AMBER }} />
                            </span>
                            CRM for Luthiers
                        </div>

                        {/* Heading */}
                        <h1
                            className="text-6xl lg:text-8xl font-bold tracking-tight leading-[1.05]"
                            style={{ fontFamily: "var(--font-domine)", color: DARK }}
                        >
                            Run your shop.{" "}
                            <em style={{ color: AMBER, fontStyle: "italic" }}>Your way.</em>
                        </h1>

                        {/* Subheading */}
                        <p className="text-xl leading-relaxed" style={{ color: "#7A5234" }}>
                            FretOps gives independent luthiers and repair shops a complete workspace —
                            clients, jobs, invoices, parts inventory, and more. All in one place.
                        </p>

                        {/* CTA buttons */}
                        <div className="flex flex-wrap gap-4 justify-center pt-2">
                            <Unauthenticated>
                                <SignUpButton mode="modal">
                                    <button
                                        className="flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-lg transition-all active:scale-95 shadow-xl"
                                        style={{ background: BROWN, color: CREAM }}
                                    >
                                        Start free <ArrowRight size={20} />
                                    </button>
                                </SignUpButton>
                                <SignInButton mode="modal">
                                    <button
                                        className="flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-lg border-2 transition-all"
                                        style={{ borderColor: "#C9914C", color: BROWN }}
                                    >
                                        Sign in
                                    </button>
                                </SignInButton>
                            </Unauthenticated>
                            <Authenticated>
                                <Link href="/dashboard">
                                    <button
                                        className="flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-lg transition-all active:scale-95 shadow-xl"
                                        style={{ background: BROWN, color: CREAM }}
                                    >
                                        Open Dashboard <LayoutDashboard size={20} />
                                    </button>
                                </Link>
                            </Authenticated>
                        </div>
                    </motion.div>

                    {/* ── Dashboard preview ── */}
                    <motion.div
                        initial={{ opacity: 0, y: 48 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                        className="mt-20 relative"
                    >
                        <div className="absolute -inset-8 rounded-3xl blur-3xl opacity-20" style={{ background: AMBER }} />
                        <div
                            className="relative rounded-2xl border-2 overflow-hidden shadow-2xl"
                            style={{ borderColor: "#D4B896", background: "white" }}
                        >
                            {/* Browser chrome */}
                            <div className="flex items-center gap-1.5 px-4 py-3 border-b" style={{ background: "#F5EAD8", borderColor: "#E4CCB0" }}>
                                <div className="w-3 h-3 rounded-full" style={{ background: "#D9967A" }} />
                                <div className="w-3 h-3 rounded-full" style={{ background: "#E8C860" }} />
                                <div className="w-3 h-3 rounded-full" style={{ background: "#8EC87A" }} />
                                <div className="ml-4 w-48 h-5 rounded-lg" style={{ background: "#E4CCB0" }} />
                            </div>

                            {/* Stats row */}
                            <div className="p-5 grid grid-cols-4 gap-3">
                                {[
                                    { label: "Active Jobs",   value: "14",    accent: AMBER },
                                    { label: "This Month",   value: "€3,840", accent: BROWN },
                                    { label: "Clients",      value: "47",    accent: AMBER },
                                    { label: "Invoices Due", value: "3",     accent: BROWN },
                                ].map((s) => (
                                    <div key={s.label} className="rounded-xl p-4 border" style={{ background: "#FFFAF4", borderColor: "#EDE0CF" }}>
                                        <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: "#9E7A58" }}>{s.label}</p>
                                        <p className="text-2xl font-black" style={{ color: s.accent, fontFamily: "var(--font-domine)" }}>{s.value}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Job rows */}
                            <div className="px-5 pb-5 space-y-2">
                                {[
                                    { name: "Gibson ES-335 Setup",      client: "Marc Janssen",  status: "In Progress", statusBg: "#FEF3CD", statusColor: "#856404" },
                                    { name: "Fender Strat Refret",       client: "Lisa de Vries", status: "Ready",       statusBg: "#D1FAE5", statusColor: "#065F46" },
                                    { name: "Martin D-28 Crack Repair",  client: "Tom Bakker",    status: "Quoted",      statusBg: "#EDE0CF", statusColor: "#7A5234" },
                                ].map((j) => (
                                    <div
                                        key={j.name}
                                        className="flex items-center justify-between p-3 rounded-xl border"
                                        style={{ borderColor: "#EDE0CF", background: "#FFFAF4" }}
                                    >
                                        <div>
                                            <p className="text-sm font-bold" style={{ color: DARK }}>{j.name}</p>
                                            <p className="text-xs" style={{ color: "#9E7A58" }}>{j.client}</p>
                                        </div>
                                        <span
                                            className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full"
                                            style={{ background: j.statusBg, color: j.statusColor }}
                                        >
                                            {j.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* ── Features ── */}
            <section className="py-24 px-6 border-y" style={{ background: "white", borderColor: "#E4CCB0" }}>
                <div className="max-w-6xl mx-auto space-y-16">
                    <div className="text-center space-y-3">
                        <p className="text-xs font-black uppercase tracking-widest" style={{ color: AMBER }}>Everything you need</p>
                        <h2 className="text-4xl lg:text-5xl font-bold" style={{ fontFamily: "var(--font-domine)", color: DARK }}>
                            Built for the bench
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[
                            { icon: Users,     title: "Client Management",  desc: "Full contact history, job records, and a private portal for each client to track their repairs." },
                            { icon: Wrench,    title: "Job Tracking",        desc: "Intake to completion. Track status, work items, parts, and photos for every repair job." },
                            { icon: FileText,  title: "Invoicing",           desc: "Generate and email professional PDF invoices. Automated overdue reminders included." },
                            { icon: Package,   title: "Parts Inventory",     desc: "Keep stock of components with automatic low-stock alerts when supplies run low." },
                            { icon: BarChart3, title: "Reports",             desc: "Monthly revenue, job throughput, and business insights — always up to date." },
                            { icon: Bell,      title: "Smart Notifications", desc: "New requests, overdue invoices, and low stock alerts all surfaced in one notification bell." },
                        ].map(({ icon: Icon, title, desc }) => (
                            <div
                                key={title}
                                className="p-6 rounded-2xl border space-y-3 transition-all hover:shadow-lg"
                                style={{ borderColor: "#E4CCB0", background: "#FFFAF4" }}
                            >
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: CREAM }}>
                                    <Icon size={18} style={{ color: AMBER }} />
                                </div>
                                <h3 className="font-bold text-base" style={{ color: DARK }}>{title}</h3>
                                <p className="text-sm leading-relaxed" style={{ color: "#7A5234" }}>{desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CTA ── */}
            <section className="py-28 px-6">
                <div className="max-w-3xl mx-auto text-center space-y-8">
                    <h2
                        className="text-5xl lg:text-6xl font-bold leading-tight"
                        style={{ fontFamily: "var(--font-domine)", color: DARK }}
                    >
                        Ready to take your shop to the next level?
                    </h2>
                    <p className="text-lg" style={{ color: "#7A5234" }}>
                        Join luthiers and repair technicians who use FretOps to run a tighter, more professional shop.
                    </p>
                    <Unauthenticated>
                        <SignUpButton mode="modal">
                            <button
                                className="inline-flex items-center gap-3 px-10 py-5 rounded-2xl font-bold text-xl transition-all active:scale-95 shadow-2xl"
                                style={{ background: BROWN, color: CREAM }}
                            >
                                Get started for free <ArrowRight size={22} />
                            </button>
                        </SignUpButton>
                    </Unauthenticated>
                    <Authenticated>
                        <Link href="/dashboard">
                            <button
                                className="inline-flex items-center gap-3 px-10 py-5 rounded-2xl font-bold text-xl transition-all active:scale-95 shadow-2xl"
                                style={{ background: BROWN, color: CREAM }}
                            >
                                Open Dashboard <LayoutDashboard size={22} />
                            </button>
                        </Link>
                    </Authenticated>
                </div>
            </section>

            {/* ── Footer ── */}
            <footer className="py-10 px-6 border-t" style={{ background: DARK, borderColor: "#3A2A1E" }}>
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: BROWN }}>
                            <span className="font-bold text-xs" style={{ color: AMBER, fontFamily: "var(--font-domine)" }}>F</span>
                        </div>
                        <span className="font-bold text-lg" style={{ fontFamily: "var(--font-domine)", color: "#D4B896" }}>
                            Fret<span style={{ color: AMBER }}>Ops</span>
                        </span>
                        <span className="text-xs ml-2" style={{ color: "#6B5040" }}>CRM for Luthiers.</span>
                    </div>
                    <div className="flex gap-8 text-sm font-medium" style={{ color: "#8A7060" }}>
                        {["Documentation", "Privacy Policy", "Support"].map((l) => (
                            <Link key={l} href="#" className="transition-colors hover:text-[#C9914C]">{l}</Link>
                        ))}
                    </div>
                    <p className="text-sm" style={{ color: "#6B5040" }}>
                        © {new Date().getFullYear()} FretOps. Built with precision.
                    </p>
                </div>
            </footer>
        </main>
    );
}
