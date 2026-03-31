"use client";

import { ReactNode, useEffect } from "react";
import { ConvexReactClient, ConvexProviderWithAuth, useConvexAuth, useMutation } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { useAuth } from "@clerk/nextjs";
import { api } from "../convex/_generated/api";

if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
    throw new Error("Missing NEXT_PUBLIC_CONVEX_URL in your .env file");
}

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL);

function usePreviewAuth() {
    return { isLoading: false, isAuthenticated: false, fetchAccessToken: async () => null };
}

function SyncUser({ children }: { children: ReactNode }) {
    const { isAuthenticated } = useConvexAuth();
    const storeUser = useMutation(api.users.store);

    useEffect(() => {
        if (isAuthenticated) {
            storeUser();
        }
    }, [isAuthenticated, storeUser]);

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
