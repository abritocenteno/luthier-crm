"use client";

import { ReactNode, useEffect, useState } from "react";
import { ConvexReactClient, ConvexProviderWithAuth, useConvexAuth, useMutation } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { useAuth, useClerk } from "@clerk/nextjs";
import { api } from "../convex/_generated/api";

if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
    throw new Error("Missing NEXT_PUBLIC_CONVEX_URL in your .env file");
}

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL);

function usePreviewAuth() {
    return { isLoading: false, isAuthenticated: false, fetchAccessToken: async () => null };
}

function AccessDenied() {
    const { signOut } = useClerk();
    return (
        <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-6">
            <div className="max-w-sm w-full bg-white rounded-2xl border border-zinc-200 shadow-sm p-8 text-center space-y-5">
                <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto">
                    <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                    </svg>
                </div>
                <div className="space-y-2">
                    <h1 className="text-xl font-bold tracking-tight text-zinc-900">Access Denied</h1>
                    <p className="text-sm text-zinc-500 leading-relaxed">
                        Your account is not authorised to use FretOps. Please contact the administrator if you believe this is a mistake.
                    </p>
                </div>
                <button
                    onClick={() => signOut({ redirectUrl: "/" })}
                    className="w-full py-2.5 px-4 bg-zinc-900 hover:bg-zinc-700 text-white text-sm font-medium rounded-xl transition-colors"
                >
                    Sign out
                </button>
            </div>
        </div>
    );
}

function SyncUser({ children }: { children: ReactNode }) {
    const { isAuthenticated } = useConvexAuth();
    const storeUser = useMutation(api.users.store);
    const [isUnauthorized, setIsUnauthorized] = useState(false);

    useEffect(() => {
        if (isAuthenticated) {
            storeUser().catch((err) => {
                if (err?.data === "unauthorized" || err?.message?.includes("unauthorized")) {
                    setIsUnauthorized(true);
                }
            });
        }
    }, [isAuthenticated, storeUser]);

    if (isUnauthorized) {
        return <AccessDenied />;
    }

    return <>{children}</>;
}

export default function ConvexClientProvider({
    children,
}: {
    children: ReactNode;
}) {
    if (process.env.NEXT_PUBLIC_PREVIEW_MODE === "true") {
        return (
            <ConvexProviderWithAuth client={convex} useAuth={usePreviewAuth}>
                {children}
            </ConvexProviderWithAuth>
        );
    }
    return (
        <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
            <SyncUser>{children}</SyncUser>
        </ConvexProviderWithClerk>
    );
}
