"use client";

import { useState } from "react";
import { useConvex } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Loader2, Guitar, CheckCircle2 } from "lucide-react";

const INSTRUMENT_TYPES = [
    "Guitar",
    "Bass",
    "Ukulele",
    "Mandolin",
    "Banjo",
    "Violin",
    "Viola",
    "Cello",
    "Other",
];

export default function RequestPage() {
    const convex = useConvex();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [instrumentType, setInstrumentType] = useState("");
    const [description, setDescription] = useState("");

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!name.trim() || !email.trim() || !instrumentType || !description.trim()) {
            setError("Please fill in all required fields.");
            return;
        }

        setIsSubmitting(true);
        try {
            await convex.mutation(api.intake.submitRequest, {
                name: name.trim(),
                email: email.trim(),
                phone: phone.trim() || undefined,
                instrumentType,
                description: description.trim(),
            });
            setSubmitted(true);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Something went wrong. Please try again.";
            setError(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-zinc-50 flex flex-col">
            {/* Header */}
            <header className="bg-white border-b border-zinc-200">
                <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: "#402A1B" }}>
                        <span className="text-sm font-bold" style={{ color: "#C9914C", fontFamily: "var(--font-domine)" }}>F</span>
                    </div>
                    <span className="text-lg font-bold tracking-tight" style={{ fontFamily: "var(--font-domine)", color: "#23211E" }}>Fret<span style={{ color: "#C9914C" }}>Ops</span></span>
                </div>
            </header>

            {/* Main content */}
            <main className="flex-1 flex items-start justify-center px-4 py-12">
                <div className="w-full max-w-lg">
                    {submitted ? (
                        /* Thank-you state */
                        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-8 text-center space-y-4">
                            <div className="flex justify-center">
                                <CheckCircle2 className="h-14 w-14 text-emerald-500" strokeWidth={1.5} />
                            </div>
                            <h2 className="text-2xl font-bold text-zinc-900">Request Received!</h2>
                            <p className="text-zinc-500 leading-relaxed">
                                Thanks for reaching out. We&apos;ve received your service request and will be in touch soon to discuss next steps.
                            </p>
                            <p className="text-sm text-zinc-400">You can close this page.</p>
                        </div>
                    ) : (
                        /* Form */
                        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
                            <div className="px-8 pt-8 pb-6 border-b border-zinc-100">
                                <div className="flex items-center gap-3 mb-2">
                                    <Guitar className="h-5 w-5 text-zinc-400" />
                                    <h1 className="text-xl font-bold text-zinc-900">Service Request</h1>
                                </div>
                                <p className="text-sm text-zinc-500">
                                    Tell us about your instrument and what you need. We&apos;ll get back to you to confirm the details.
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="px-8 py-6 space-y-5">
                                {/* Full Name */}
                                <div className="space-y-1.5">
                                    <label className="block text-sm font-medium text-zinc-700">
                                        Full Name <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Jane Smith"
                                        className="w-full px-4 py-2.5 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-shadow placeholder:text-zinc-300"
                                        autoComplete="name"
                                    />
                                </div>

                                {/* Email */}
                                <div className="space-y-1.5">
                                    <label className="block text-sm font-medium text-zinc-700">
                                        Email <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="jane@example.com"
                                        className="w-full px-4 py-2.5 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-shadow placeholder:text-zinc-300"
                                        autoComplete="email"
                                    />
                                </div>

                                {/* Phone */}
                                <div className="space-y-1.5">
                                    <label className="block text-sm font-medium text-zinc-700">
                                        Phone <span className="text-zinc-400 font-normal text-xs">(optional)</span>
                                    </label>
                                    <input
                                        type="tel"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        placeholder="+1 555 000 0000"
                                        className="w-full px-4 py-2.5 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-shadow placeholder:text-zinc-300"
                                        autoComplete="tel"
                                    />
                                </div>

                                {/* Instrument Type */}
                                <div className="space-y-1.5">
                                    <label className="block text-sm font-medium text-zinc-700">
                                        Instrument Type <span className="text-red-400">*</span>
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={instrumentType}
                                            onChange={(e) => setInstrumentType(e.target.value)}
                                            className="w-full px-4 py-2.5 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent bg-white appearance-none transition-shadow text-zinc-700"
                                        >
                                            <option value="" disabled className="text-zinc-400">Select an instrument…</option>
                                            {INSTRUMENT_TYPES.map((type) => (
                                                <option key={type} value={type}>{type}</option>
                                            ))}
                                        </select>
                                        <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                                            <svg className="h-4 w-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>

                                {/* Description */}
                                <div className="space-y-1.5">
                                    <label className="block text-sm font-medium text-zinc-700">
                                        Description of Issue <span className="text-red-400">*</span>
                                    </label>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Describe what's going on with your instrument — buzzing frets, tuning issues, pickup problems, etc."
                                        rows={4}
                                        className="w-full px-4 py-2.5 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-shadow resize-y placeholder:text-zinc-300"
                                    />
                                </div>

                                {/* Error message */}
                                {error && (
                                    <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                                        {error}
                                    </p>
                                )}

                                {/* Submit */}
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full flex items-center justify-center gap-2 bg-zinc-900 text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-zinc-800 transition-colors active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Sending…
                                        </>
                                    ) : (
                                        "Send Request"
                                    )}
                                </button>

                                <p className="text-center text-xs text-zinc-400">
                                    We&apos;ll review your request and reach out by email.
                                </p>
                            </form>
                        </div>
                    )}
                </div>
            </main>

            {/* Footer */}
            <footer className="py-6 text-center text-xs text-zinc-400">
                Powered by FretOps
            </footer>
        </div>
    );
}
