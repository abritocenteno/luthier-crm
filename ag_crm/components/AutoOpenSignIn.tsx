"use client";

import { useAuth, useClerk } from "@clerk/nextjs";
import { useEffect, useRef } from "react";

/**
 * When the landing page is reached with `?signin=1` (e.g. from the dashboard's
 * "Sign In Again" recovery button), open Clerk's sign-in modal automatically so
 * a signed-out user lands straight on a login prompt instead of the marketing
 * page.
 *
 * Gated on Clerk's OWN signed-out state — never Convex's. If Clerk still
 * considers the user signed in (a common case where only Convex lost its token),
 * opening the modal throws `cannot_render_single_session_enabled`; instead we do
 * nothing and let the landing page's <Authenticated> redirect carry the user
 * back to the dashboard once Convex reconnects.
 *
 * This component is only ever rendered outside preview mode (see clerk-compat),
 * so the Clerk hooks always have a provider.
 */
export function AutoOpenSignIn() {
    const { isLoaded, isSignedIn } = useAuth();
    const { openSignIn } = useClerk();
    const opened = useRef(false);

    useEffect(() => {
        if (opened.current || !isLoaded) return;

        const params = new URLSearchParams(window.location.search);
        if (params.get("signin") !== "1") return;

        // Clerk session still alive — let the Convex reconnect + redirect win.
        if (isSignedIn) return;

        opened.current = true;
        openSignIn({ forceRedirectUrl: "/dashboard" });

        // Strip the flag so a manual refresh doesn't reopen the modal.
        const url = new URL(window.location.href);
        url.searchParams.delete("signin");
        window.history.replaceState({}, "", url.toString());
    }, [isLoaded, isSignedIn, openSignIn]);

    return null;
}
