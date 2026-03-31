"use client";

import { ClerkProvider } from "@clerk/nextjs";

const isPreview = process.env.NEXT_PUBLIC_PREVIEW_MODE === "true";

export function ConditionalClerkProvider({ children }: { children: React.ReactNode }) {
    if (isPreview) return <>{children}</>;
    return <ClerkProvider>{children}</ClerkProvider>;
}
