"use client";

import Link from "next/link";
import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

/**
 * Catches anything a dashboard page throws — most often a Convex query rejecting
 * a malformed ID from an old bookmark or a mistyped URL — and keeps the sidebar
 * on screen instead of replacing the whole app with Next's crash page.
 */
export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    // Convex reports a bad `v.id(...)` argument as an ArgumentValidationError.
    const badLink = /ArgumentValidationError|Value does not match validator/.test(error.message);

    return (
        <div className="text-center py-20 space-y-6">
            <div className="w-16 h-16 mx-auto bg-zinc-100 rounded-2xl flex items-center justify-center text-zinc-400">
                <AlertTriangle size={32} />
            </div>
            <div className="space-y-2">
                <h2 className="text-2xl font-bold text-zinc-900">
                    {badLink ? "This link doesn't point to anything" : "Something went wrong"}
                </h2>
                <p className="text-zinc-500 max-w-md mx-auto">
                    {badLink
                        ? "The address looks malformed — perhaps an old bookmark or a mistyped URL."
                        : "This page hit an unexpected error. Trying again usually helps."}
                </p>
            </div>
            <div className="flex items-center justify-center gap-4">
                {!badLink && (
                    <button
                        onClick={reset}
                        className="flex items-center gap-2 bg-black text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-zinc-800 transition-all active:scale-95"
                    >
                        <RefreshCw size={16} />
                        Try again
                    </button>
                )}
                <Link href="/dashboard" className="text-sm font-bold text-black underline underline-offset-4">
                    Back to Dashboard
                </Link>
            </div>
        </div>
    );
}
