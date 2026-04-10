"use client";

import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { SignInButton, SignUpButton, UserButton } from "@/components/clerk-compat";
import Link from "next/link";
import { motion } from "motion/react";
import {
    Users, LayoutDashboard, ChevronRight,
    Wrench, BarChart3, ArrowRight, FileText, Bell, Package,
} from "lucide-react";

const DARK_BG = "#0C0906";
const SURFACE = "#161009";
const BROWN   = "#3D2718";
const AMBER   = "#D4924A";
const CREAM   = "#EDD9B4";
const MUTED   = "#6E5438";
const SUBTLE  = "#2A1D11";

export default function Home() {
    return (
        <main style={{ background: DARK_BG, color: CREAM, minHeight: "100vh" }}>

            {/* ── Font import + global styles ── */}
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500&family=Barlow+Condensed:wght@300;400;500;600;700&display=swap');

                :root {
                    --display: 'Cormorant Garamond', Georgia, serif;
                    --ui: 'Barlow Condensed', 'Arial Narrow', sans-serif;
                }

                * { box-sizing: border-box; }

                .fo-display { font-family: 'Cormorant Garamond', Georgia, serif; }
                .fo-ui      { font-family: 'Barlow Condensed', 'Arial Narrow', sans-serif; }

                /* Nav link hover */
                .fo-nav-link { color: ${MUTED}; transition: color 0.2s; text-decoration: none; }
                .fo-nav-link:hover { color: ${CREAM}; }

                /* CTA button shimmer */
                .fo-cta {
                    position: relative; overflow: hidden;
                    transition: transform 0.25s ease, box-shadow 0.25s ease;
                }
                .fo-cta::after {
                    content: '';
                    position: absolute; top: -50%; left: -120%;
                    width: 55%; height: 200%;
                    background: linear-gradient(105deg, transparent, rgba(255,255,255,0.12), transparent);
                    transition: left 0.55s ease;
                }
                .fo-cta:hover::after { left: 150%; }
                .fo-cta:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 16px 48px rgba(64, 39, 24, 0.6);
                }
                .fo-cta:active { transform: scale(0.97); }

                /* Outline button hover */
                .fo-outline {
                    transition: color 0.2s, border-color 0.2s;
                    color: ${MUTED};
                    border: 1px solid rgba(212,146,74,0.2);
                }
                .fo-outline:hover {
                    color: ${CREAM};
                    border-color: rgba(212,146,74,0.55);
                }

                /* Feature item hover */
                .fo-feature { transition: background 0.25s; }
                .fo-feature:hover { background: rgba(212,146,74,0.05); }
                .fo-feature:hover .fo-feat-num { color: ${AMBER}; }
                .fo-feat-num { transition: color 0.25s; color: rgba(212,146,74,0.28); }

                /* Footer link hover */
                .fo-foot-link { color: #3D2B1A; transition: color 0.2s; text-decoration: none; }
                .fo-foot-link:hover { color: ${AMBER}; }

                /* Scroll animation trigger */
                .fo-reveal { opacity: 0; transform: translateY(20px); transition: opacity 0.6s ease, transform 0.6s ease; }
                .fo-reveal.visible { opacity: 1; transform: translateY(0); }

                /* Responsive */
                @media (max-width: 900px) {
                    .fo-hero-grid { grid-template-columns: 1fr !important; }
                    .fo-mockup-col { display: none; }
                    .fo-hero-h1 { font-size: 62px !important; }
                    .fo-features-grid { grid-template-columns: 1fr !important; }
                    .fo-cta-h2 { font-size: 48px !important; }
                    .fo-section-h2 { font-size: 52px !important; }
                    .fo-footer-inner { flex-direction: column !important; gap: 24px !important; text-align: center; }
                }
            `}</style>

            {/* ────────────────── NAV ────────────────── */}
            <nav style={{
                position: "fixed", top: 0, width: "100%", zIndex: 50,
                background: `rgba(12, 9, 6, 0.93)`,
                backdropFilter: "blur(20px)",
                borderBottom: "1px solid rgba(212,146,74,0.12)",
            }}>
                <div style={{ maxWidth: "1320px", margin: "0 auto", padding: "0 2rem", height: "62px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>

                    {/* Wordmark */}
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{ width: "30px", height: "30px", borderRadius: "5px", background: BROWN, border: "1px solid rgba(212,146,74,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <span className="fo-display" style={{ color: AMBER, fontWeight: 500, fontSize: "15px" }}>F</span>
                        </div>
                        <span className="fo-display" style={{ fontSize: "22px", fontWeight: 500, color: CREAM, letterSpacing: "-0.01em" }}>
                            Fret<span style={{ color: AMBER }}>Ops</span>
                        </span>
                    </div>

                    {/* Nav actions */}
                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                        <AuthLoading>
                            <div style={{ height: "14px", width: "72px", borderRadius: "3px", background: SUBTLE, opacity: 0.8 }} />
                        </AuthLoading>
                        <Unauthenticated>
                            <SignInButton mode="modal">
                                <button className="fo-nav-link fo-ui" style={{ fontSize: "13px", fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", background: "none", border: "none", cursor: "pointer", padding: "6px 4px" }}>
                                    Sign In
                                </button>
                            </SignInButton>
                            <SignUpButton mode="modal">
                                <button className="fo-cta fo-ui" style={{ fontSize: "12px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", padding: "9px 22px", borderRadius: "3px", background: AMBER, color: DARK_BG, border: "none", cursor: "pointer" }}>
                                    Get Started
                                </button>
                            </SignUpButton>
                        </Unauthenticated>
                        <Authenticated>
                            <Link href="/dashboard" className="fo-nav-link fo-ui" style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "13px", fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                                Dashboard <ChevronRight size={12} />
                            </Link>
                            <UserButton afterSignOutUrl="/" />
                        </Authenticated>
                    </div>
                </div>
            </nav>

            {/* ────────────────── HERO ────────────────── */}
            <section style={{ minHeight: "100vh", display: "flex", alignItems: "center", paddingTop: "62px", position: "relative", overflow: "hidden" }}>

                {/* Background ambient glow */}
                <div style={{ position: "absolute", top: "-15%", right: "-8%", width: "700px", height: "700px", borderRadius: "50%", background: "radial-gradient(circle, rgba(212,146,74,0.09) 0%, transparent 68%)", pointerEvents: "none" }} />
                <div style={{ position: "absolute", bottom: "5%", left: "-5%", width: "500px", height: "500px", borderRadius: "50%", background: "radial-gradient(circle, rgba(61,39,24,0.35) 0%, transparent 68%)", pointerEvents: "none" }} />

                {/* Large decorative letter */}
                <div className="fo-display" style={{ position: "absolute", right: "-30px", bottom: "-60px", fontSize: "520px", fontWeight: 300, fontStyle: "italic", color: "rgba(212,146,74,0.028)", lineHeight: 1, pointerEvents: "none", userSelect: "none" }}>F</div>

                <div className="fo-hero-grid" style={{ maxWidth: "1320px", margin: "0 auto", padding: "6rem 2rem 4rem", width: "100%", display: "grid", gridTemplateColumns: "55fr 45fr", gap: "5rem", alignItems: "center" }}>

                    {/* ── Left: Text ── */}
                    <motion.div
                        initial={{ opacity: 0, y: 36 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
                        style={{ display: "flex", flexDirection: "column", gap: "32px" }}
                    >
                        {/* Label */}
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <div style={{ display: "flex", gap: "3px" }}>
                                {[0,1,2].map(i => (
                                    <div key={i} style={{ width: "3px", height: "3px", borderRadius: "50%", background: AMBER, opacity: 1 - i * 0.3 }} />
                                ))}
                            </div>
                            <span className="fo-ui" style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.22em", textTransform: "uppercase", color: AMBER }}>
                                CRM for Luthiers
                            </span>
                        </div>

                        {/* Main heading */}
                        <h1 className="fo-display fo-hero-h1" style={{ fontSize: "88px", fontWeight: 300, lineHeight: "0.93", color: CREAM, margin: 0, letterSpacing: "-0.025em" }}>
                            Run your<br />
                            shop.<br />
                            <em style={{ fontStyle: "italic", color: AMBER }}>Your way.</em>
                        </h1>

                        {/* Subtext with decorative rule */}
                        <div style={{ display: "flex", gap: "16px", alignItems: "flex-start", paddingTop: "4px" }}>
                            <div style={{ width: "1px", background: `linear-gradient(180deg, ${AMBER} 0%, transparent 100%)`, minHeight: "80px", opacity: 0.45, flexShrink: 0, marginTop: "3px" }} />
                            <p className="fo-ui" style={{ fontSize: "17px", fontWeight: 300, color: MUTED, margin: 0, lineHeight: "1.65", letterSpacing: "0.02em" }}>
                                FretOps gives independent luthiers and repair shops a complete workspace — clients, jobs, invoices, parts inventory, and more. All in one place.
                            </p>
                        </div>

                        {/* CTAs */}
                        <div style={{ display: "flex", gap: "14px", alignItems: "center", flexWrap: "wrap" }}>
                            <Unauthenticated>
                                <SignUpButton mode="modal">
                                    <button className="fo-cta fo-ui" style={{ fontSize: "13px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", padding: "16px 36px", background: AMBER, color: DARK_BG, border: "none", cursor: "pointer", borderRadius: "2px", display: "inline-flex", alignItems: "center", gap: "10px" }}>
                                        Start Free <ArrowRight size={14} />
                                    </button>
                                </SignUpButton>
                                <SignInButton mode="modal">
                                    <button className="fo-outline fo-ui" style={{ fontSize: "13px", fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", padding: "16px 36px", background: "transparent", cursor: "pointer", borderRadius: "2px" }}>
                                        Sign In
                                    </button>
                                </SignInButton>
                            </Unauthenticated>
                            <Authenticated>
                                <Link href="/dashboard">
                                    <button className="fo-cta fo-ui" style={{ fontSize: "13px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", padding: "16px 36px", background: AMBER, color: DARK_BG, border: "none", cursor: "pointer", borderRadius: "2px", display: "inline-flex", alignItems: "center", gap: "10px" }}>
                                        Open Dashboard <LayoutDashboard size={14} />
                                    </button>
                                </Link>
                            </Authenticated>
                        </div>
                    </motion.div>

                    {/* ── Right: Dashboard mockup ── */}
                    <motion.div
                        className="fo-mockup-col"
                        initial={{ opacity: 0, x: 32, y: 16 }}
                        animate={{ opacity: 1, x: 0, y: 0 }}
                        transition={{ duration: 1, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
                        style={{ position: "relative" }}
                    >
                        {/* Glow aura */}
                        <div style={{ position: "absolute", inset: "-40px", background: "radial-gradient(ellipse at 50% 40%, rgba(212,146,74,0.16) 0%, transparent 65%)", borderRadius: "20px", pointerEvents: "none" }} />

                        {/* Mockup card */}
                        <div style={{ background: "#130E08", border: "1px solid rgba(212,146,74,0.18)", borderRadius: "10px", overflow: "hidden", boxShadow: "0 48px 96px rgba(0,0,0,0.7), inset 0 1px 0 rgba(212,146,74,0.08)" }}>

                            {/* Browser chrome */}
                            <div style={{ background: "#0E0A05", borderBottom: "1px solid rgba(212,146,74,0.1)", padding: "11px 14px", display: "flex", alignItems: "center", gap: "6px" }}>
                                {["#3A2316", "#3A2316", "#3A2316"].map((bg, i) => (
                                    <div key={i} style={{ width: "9px", height: "9px", borderRadius: "50%", background: bg }} />
                                ))}
                                <div style={{ marginLeft: "10px", width: "150px", height: "16px", borderRadius: "3px", background: "#1E140A" }} />
                            </div>

                            <div style={{ padding: "14px" }}>
                                {/* Stats row */}
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "7px", marginBottom: "10px" }}>
                                    {[
                                        { label: "Active Jobs", value: "14",    color: AMBER },
                                        { label: "Revenue",     value: "€3,840", color: CREAM },
                                        { label: "Clients",     value: "47",    color: AMBER },
                                        { label: "Overdue",     value: "3",     color: "#C97070" },
                                    ].map((s) => (
                                        <div key={s.label} style={{ padding: "11px 10px", borderRadius: "5px", background: "#0D0906", border: "1px solid rgba(212,146,74,0.08)" }}>
                                            <p className="fo-ui" style={{ fontSize: "8px", fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", color: MUTED, margin: "0 0 5px 0" }}>{s.label}</p>
                                            <p className="fo-display" style={{ fontSize: "20px", fontWeight: 500, color: s.color, margin: 0, lineHeight: 1 }}>{s.value}</p>
                                        </div>
                                    ))}
                                </div>

                                {/* Section label */}
                                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "7px", padding: "0 2px" }}>
                                    <div style={{ height: "1px", width: "16px", background: `rgba(212,146,74,0.25)` }} />
                                    <span className="fo-ui" style={{ fontSize: "9px", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: MUTED }}>Active Jobs</span>
                                </div>

                                {/* Job rows */}
                                <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                                    {[
                                        { name: "Gibson ES-335 Setup",     client: "Marc Janssen",  status: "In Progress", sc: "#D4924A", sb: "rgba(212,146,74,0.1)" },
                                        { name: "Fender Strat Refret",      client: "Lisa de Vries", status: "Ready",       sc: "#7FC48A", sb: "rgba(127,196,138,0.1)" },
                                        { name: "Martin D-28 Crack Repair", client: "Tom Bakker",    status: "Quoted",      sc: MUTED,     sb: "rgba(110,84,56,0.15)" },
                                    ].map((j) => (
                                        <div key={j.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 11px", borderRadius: "5px", background: "#0D0906", border: "1px solid rgba(212,146,74,0.07)" }}>
                                            <div>
                                                <p className="fo-ui" style={{ fontSize: "11px", fontWeight: 600, color: CREAM, margin: "0 0 2px 0" }}>{j.name}</p>
                                                <p className="fo-ui" style={{ fontSize: "9px", color: MUTED, margin: 0 }}>{j.client}</p>
                                            </div>
                                            <span className="fo-ui" style={{ fontSize: "8px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", padding: "3px 7px", borderRadius: "2px", background: j.sb, color: j.sc }}>
                                                {j.status}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Floating stat accent */}
                        <motion.div
                            animate={{ y: [0, -8, 0] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                            style={{ position: "absolute", bottom: "-20px", left: "-24px", background: "#1A1208", border: "1px solid rgba(212,146,74,0.25)", borderRadius: "8px", padding: "12px 16px", boxShadow: "0 20px 40px rgba(0,0,0,0.5)" }}
                        >
                            <p className="fo-ui" style={{ fontSize: "9px", fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", color: MUTED, margin: "0 0 4px 0" }}>This Month</p>
                            <p className="fo-display" style={{ fontSize: "26px", fontWeight: 500, color: AMBER, margin: 0, lineHeight: 1 }}>€3,840</p>
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* ────────────────── FEATURES ────────────────── */}
            <section style={{ borderTop: "1px solid rgba(212,146,74,0.1)", padding: "120px 0", position: "relative" }}>
                <div style={{ position: "absolute", inset: 0, background: `linear-gradient(180deg, rgba(22,16,9,0.4) 0%, transparent 40%, rgba(22,16,9,0.4) 100%)`, pointerEvents: "none" }} />

                <div style={{ maxWidth: "1320px", margin: "0 auto", padding: "0 2rem", position: "relative" }}>

                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-80px" }}
                        transition={{ duration: 0.7 }}
                        style={{ marginBottom: "80px", maxWidth: "560px" }}
                    >
                        <p className="fo-ui" style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.28em", textTransform: "uppercase", color: AMBER, margin: "0 0 20px 0" }}>
                            Everything you need
                        </p>
                        <h2 className="fo-display fo-section-h2" style={{ fontSize: "68px", fontWeight: 300, color: CREAM, margin: 0, lineHeight: "0.97", letterSpacing: "-0.025em" }}>
                            Built for<br />
                            <em style={{ fontStyle: "italic" }}>the bench</em>
                        </h2>
                    </motion.div>

                    {/* Feature grid — editorial list */}
                    <div className="fo-features-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
                        {[
                            { num: "01", icon: Users,     title: "Client Management",    desc: "Full contact history, job records, and a private portal for each client to track their repairs." },
                            { num: "02", icon: Wrench,    title: "Job Tracking",          desc: "Intake to completion. Track status, work items, parts, and photos for every repair job." },
                            { num: "03", icon: FileText,  title: "Invoicing",             desc: "Generate and email professional PDF invoices. Automated overdue reminders included." },
                            { num: "04", icon: Package,   title: "Parts Inventory",       desc: "Keep stock of components with automatic low-stock alerts when supplies run low." },
                            { num: "05", icon: BarChart3, title: "Reports",               desc: "Monthly revenue, job throughput, and business insights — always up to date." },
                            { num: "06", icon: Bell,      title: "Smart Notifications",   desc: "New requests, overdue invoices, and low stock alerts all surfaced in one place." },
                        ].map(({ num, icon: Icon, title, desc }, i) => (
                            <motion.div
                                key={title}
                                className="fo-feature"
                                initial={{ opacity: 0, y: 16 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-40px" }}
                                transition={{ duration: 0.5, delay: (i % 2) * 0.1 }}
                                style={{
                                    padding: "44px 36px",
                                    borderBottom: "1px solid rgba(212,146,74,0.08)",
                                    borderRight: i % 2 === 0 ? "1px solid rgba(212,146,74,0.08)" : "none",
                                    display: "flex", gap: "24px", alignItems: "flex-start",
                                }}
                            >
                                <span className="fo-feat-num fo-display" style={{ fontSize: "13px", fontWeight: 300, letterSpacing: "0.05em", paddingTop: "3px", minWidth: "26px" }}>{num}</span>
                                <div>
                                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
                                        <Icon size={15} style={{ color: AMBER, flexShrink: 0 }} />
                                        <h3 className="fo-ui" style={{ fontSize: "14px", fontWeight: 600, color: CREAM, margin: 0, letterSpacing: "0.1em", textTransform: "uppercase" }}>{title}</h3>
                                    </div>
                                    <p className="fo-ui" style={{ fontSize: "15px", fontWeight: 300, color: MUTED, margin: 0, lineHeight: "1.7", letterSpacing: "0.02em" }}>{desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ────────────────── CTA ────────────────── */}
            <section style={{ padding: "160px 0", position: "relative", overflow: "hidden", borderTop: "1px solid rgba(212,146,74,0.1)" }}>
                {/* Ambient glow */}
                <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "900px", height: "500px", background: "radial-gradient(ellipse at center, rgba(212,146,74,0.1) 0%, transparent 65%)", pointerEvents: "none" }} />
                {/* Top decorative line */}
                <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: "1px", height: "60px", background: `linear-gradient(180deg, transparent, ${AMBER}, transparent)`, opacity: 0.4 }} />

                <div style={{ maxWidth: "760px", margin: "0 auto", padding: "0 2rem", textAlign: "center", position: "relative" }}>
                    <motion.div
                        initial={{ opacity: 0, y: 32 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-80px" }}
                        transition={{ duration: 0.8 }}
                        style={{ display: "flex", flexDirection: "column", gap: "32px", alignItems: "center" }}
                    >
                        <h2 className="fo-display fo-cta-h2" style={{ fontSize: "72px", fontWeight: 300, color: CREAM, margin: 0, lineHeight: "1.02", letterSpacing: "-0.025em" }}>
                            Ready to take your shop to the next level?
                        </h2>
                        <p className="fo-ui" style={{ fontSize: "16px", fontWeight: 300, color: MUTED, margin: 0, lineHeight: "1.65", letterSpacing: "0.03em" }}>
                            Join luthiers and repair technicians who use FretOps to run a tighter, more professional shop.
                        </p>
                        <div style={{ display: "flex", gap: "14px", alignItems: "center", flexWrap: "wrap", justifyContent: "center" }}>
                            <Unauthenticated>
                                <SignUpButton mode="modal">
                                    <button className="fo-cta fo-ui" style={{ fontSize: "13px", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", padding: "18px 48px", background: AMBER, color: DARK_BG, border: "none", cursor: "pointer", borderRadius: "2px", display: "inline-flex", alignItems: "center", gap: "12px" }}>
                                        Get Started — It&apos;s Free <ArrowRight size={14} />
                                    </button>
                                </SignUpButton>
                            </Unauthenticated>
                            <Authenticated>
                                <Link href="/dashboard">
                                    <button className="fo-cta fo-ui" style={{ fontSize: "13px", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", padding: "18px 48px", background: AMBER, color: DARK_BG, border: "none", cursor: "pointer", borderRadius: "2px", display: "inline-flex", alignItems: "center", gap: "12px" }}>
                                        Open Dashboard <LayoutDashboard size={14} />
                                    </button>
                                </Link>
                            </Authenticated>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* ────────────────── FOOTER ────────────────── */}
            <footer style={{ borderTop: "1px solid rgba(212,146,74,0.08)", padding: "36px 0", background: "#080604" }}>
                <div className="fo-footer-inner" style={{ maxWidth: "1320px", margin: "0 auto", padding: "0 2rem", display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: "16px" }}>

                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{ width: "24px", height: "24px", borderRadius: "4px", background: BROWN, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <span className="fo-display" style={{ color: AMBER, fontWeight: 500, fontSize: "12px" }}>F</span>
                        </div>
                        <span className="fo-display" style={{ fontSize: "17px", fontWeight: 500, color: "#7A5A38" }}>
                            Fret<span style={{ color: AMBER }}>Ops</span>
                        </span>
                        <span className="fo-ui" style={{ fontSize: "10px", color: "#2E1F12", letterSpacing: "0.15em", textTransform: "uppercase", marginLeft: "6px" }}>
                            CRM for Luthiers
                        </span>
                    </div>

                    <div style={{ display: "flex", gap: "32px" }}>
                        {["Documentation", "Privacy", "Support"].map((l) => (
                            <Link key={l} href="#" className="fo-foot-link fo-ui" style={{ fontSize: "11px", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase" }}>
                                {l}
                            </Link>
                        ))}
                    </div>

                    <p className="fo-ui" style={{ fontSize: "10px", color: "#2E1F12", letterSpacing: "0.1em", textTransform: "uppercase", margin: 0 }}>
                        © {new Date().getFullYear()} FretOps
                    </p>
                </div>
            </footer>
        </main>
    );
}
