"use client";

import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { motion } from "motion/react";
import {
  Users,
  LayoutDashboard,
  ChevronRight,
  ShieldCheck,
  Zap,
  BarChart3,
  ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";

const Card = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={cn("bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden p-6", className)}>
    {children}
  </div>
);

const Feature = ({ icon: Icon, title, description }: { icon: any, title: string, description: string }) => (
  <div className="flex gap-4">
    <div className="w-10 h-10 rounded-lg bg-zinc-100 flex items-center justify-center flex-shrink-0 text-black">
      <Icon size={20} />
    </div>
    <div className="space-y-1">
      <h3 className="font-semibold">{title}</h3>
      <p className="text-sm text-zinc-500 leading-relaxed">{description}</p>
    </div>
  </div>
);

export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-50 selection:bg-black selection:text-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-zinc-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 group cursor-default">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center transition-transform group-hover:scale-105">
              <span className="text-white font-bold text-lg leading-none">L</span>
            </div>
            <span className="font-bold text-xl tracking-tight">Luthier<span className="text-zinc-400">CRM</span></span>
          </div>

          <div className="flex items-center gap-4">
            <AuthLoading>
              <div className="h-4 w-20 bg-zinc-100 animate-pulse rounded" />
            </AuthLoading>
            <Unauthenticated>
              <SignInButton mode="modal">
                <button className="text-sm font-medium hover:text-black transition-colors px-4 py-2">
                  Sign In
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="bg-black text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-zinc-800 transition-all active:scale-95 shadow-lg shadow-black/10">
                  Get Started
                </button>
              </SignUpButton>
            </Unauthenticated>
            <Authenticated>
              <Link href="/dashboard" className="text-sm font-medium hover:text-black transition-colors px-4 py-2 flex items-center gap-1.5">
                Go to Dashboard <ChevronRight size={14} />
              </Link>
              <UserButton afterSignOutUrl="/" />
            </Authenticated>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-8"
            >
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-zinc-100 rounded-full text-xs font-bold text-zinc-600 uppercase tracking-wider">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  Everything is live
                </div>
                <h1 className="text-5xl lg:text-7xl font-bold tracking-tight text-zinc-900 leading-[1.1]">
                  Manage your craft with <span className="text-zinc-400 underline decoration-zinc-200 underline-offset-8">precision</span>.
                </h1>
                <p className="text-lg text-zinc-500 max-w-lg leading-relaxed">
                  Luthier CRM provides a streamlined workspace for independent craftsmen and small workshops to manage clients, suppliers, and billing.
                </p>
              </div>

              <div className="flex flex-wrap gap-4">
                <Unauthenticated>
                  <SignUpButton mode="modal">
                    <button className="bg-black text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-zinc-800 transition-all active:scale-95 flex items-center gap-2 shadow-xl shadow-black/20">
                      Start your workshop <ArrowRight size={20} />
                    </button>
                  </SignUpButton>
                </Unauthenticated>
                <Authenticated>
                  <Link href="/dashboard">
                    <button className="bg-black text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-zinc-800 transition-all active:scale-95 flex items-center gap-2 shadow-xl shadow-black/20">
                      Access Workspace <LayoutDashboard size={20} />
                    </button>
                  </Link>
                </Authenticated>
              </div>

              <div className="flex items-center gap-6 pt-4">
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="w-10 h-10 rounded-full border-4 border-zinc-50 bg-zinc-200 overflow-hidden">
                      <img src={`https://i.pravatar.cc/100?img=${i}`} alt="user" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
                <p className="text-sm text-zinc-500">
                  Join <span className="text-black font-bold">500+</span> workshops worldwide.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="absolute -inset-4 bg-zinc-200 blur-2xl opacity-30 rounded-full" />
              <Card className="relative border-4 border-white shadow-2xl p-0">
                <div className="bg-zinc-50 border-b border-zinc-100 p-4 flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-zinc-200" />
                  <div className="w-2.5 h-2.5 rounded-full bg-zinc-200" />
                  <div className="w-2.5 h-2.5 rounded-full bg-zinc-200" />
                </div>
                <div className="p-8 space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest">Total Revenue</p>
                      <p className="text-3xl font-bold">$12,450.00</p>
                    </div>
                    <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                      <BarChart3 size={24} />
                    </div>
                  </div>
                  <div className="space-y-3">
                    {[
                      { label: "Gibson Store", amount: "$1,200", status: "Paid" },
                      { label: "Marshall Parts", amount: "$850", status: "Pending" },
                      { label: "Fender Service", amount: "$2,100", status: "Paid" },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-white border border-zinc-100 rounded-lg shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-zinc-100" />
                          <p className="text-sm font-semibold">{item.label}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold">{item.amount}</p>
                          <p className="text-[10px] uppercase font-bold text-zinc-400">{item.status}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-white border-y border-zinc-100 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            <Feature
              icon={ShieldCheck}
              title="Secure Authentication"
              description="Enterprise-grade security powered by Clerk. Your workshop data is always protected and encrypted."
            />
            <Feature
              icon={Zap}
              title="Instant Deployment"
              description="Lightning-fast performance with Next.js and Convex. Focus on your craft while we handle the data."
            />
            <Feature
              icon={Users}
              title="Client Management"
              description="Keep track of every interaction, contact, and note for all your clients and suppliers effortlessly."
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-zinc-100">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2 grayscale brightness-50">
            <div className="w-6 h-6 bg-black rounded flex items-center justify-center">
              <span className="text-white font-bold text-sm">L</span>
            </div>
            <span className="font-bold text-lg tracking-tight">Luthier<span className="text-zinc-400">CRM</span></span>
          </div>
          <div className="flex gap-8 text-sm text-zinc-400 font-medium">
            <Link href="#" className="hover:text-black transition-colors">Documentation</Link>
            <Link href="#" className="hover:text-black transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-black transition-colors">Support</Link>
          </div>
          <p className="text-sm text-zinc-400">
            © {new Date().getFullYear()} Luthier CRM. Built with precision.
          </p>
        </div>
      </footer>
    </main>
  );
}
