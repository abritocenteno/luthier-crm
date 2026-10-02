"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback } from "react";

// ── In-app navigation history ───────────────────────────────────────────────
//
// The browser doesn't tell us where the user came from within the app, so the
// dashboard layout records each pathname here. Back buttons use it to return to
// the actual previous page (a client, the calendar, …) and fall back to a fixed
// parent when there is none — a fresh tab, a reload, or a pasted link.

const stack: string[] = [];
const forward: string[] = [];
let replacing = false;

// Only a popstate means the user moved through history (browser Back/Forward or
// our own router.back()). Revisiting a page by clicking a link is a new entry,
// even when it matches the previous page — e.g. client → job → that job's client.
let popping = false;
if (typeof window !== "undefined") {
    window.addEventListener("popstate", () => {
        popping = true;
    });
}

/** Called by the dashboard layout whenever the pathname changes. */
export function recordPath(path: string) {
    const wasPopping = popping;
    popping = false;
    if (stack[stack.length - 1] === path) return;

    if (wasPopping) {
        if (stack[stack.length - 2] === path) {
            forward.push(stack.pop()!);
        } else if (forward[forward.length - 1] === path) {
            stack.push(forward.pop()!);
        } else {
            // Jumped several entries at once (long-press on Back): we no longer
            // know what came before, so let back buttons use their fallback.
            stack.length = 0;
            forward.length = 0;
            stack.push(path);
        }
    } else if (replacing) {
        replacing = false;
        stack[stack.length - 1] = path;
    } else {
        stack.push(path);
        forward.length = 0;
    }
}

/** The page before `current`. Works whether or not `current` has been recorded yet. */
function previousOf(current: string) {
    const top = stack[stack.length - 1];
    return top === current ? stack[stack.length - 2] : top;
}

const SECTIONS: Record<string, string> = {
    clients: "Clients", jobs: "Jobs", suppliers: "Suppliers", invoices: "Invoices", orders: "Orders",
    parts: "Parts", library: "Library", schedule: "Calendar", timesheet: "Timesheet", reports: "Reports", settings: "Settings",
};
const DETAILS: Record<string, string> = { clients: "Client", jobs: "Job", suppliers: "Supplier", invoices: "Invoice" };

/** "Clients", "Client", "Order", … — what a back button should say it returns to. */
function labelFor(path: string): string | null {
    const parts = path.split("/").filter(Boolean).slice(1); // drop "dashboard"
    if (parts.length === 0) return "Dashboard";
    if (parts.length === 1) return SECTIONS[parts[0]] ?? null;
    if (parts.includes("create") || parts.includes("edit")) return null;
    if (parts[0] === "suppliers" && parts[2] === "orders" && parts.length === 4) return "Order";
    if (parts.length === 2) return DETAILS[parts[0]] ?? null;
    return null;
}

/**
 * Back navigation for a page whose natural parent is `fallback`.
 *  - `goBack()` returns to the previous in-app page, or to `fallback` if there is none.
 *  - `leaveTo(target)` finishes a form: returns to `target` without leaving the
 *    form behind in history (so the browser's Back button doesn't reopen it).
 */
export function useBackNav(fallback: string, fallbackLabel: string) {
    const router = useRouter();
    const pathname = usePathname();
    const previous = previousOf(pathname);
    const label = previous ? labelFor(previous) ?? "previous page" : fallbackLabel;

    const goBack = useCallback(() => {
        if (previousOf(pathname)) router.back();
        else {
            replacing = true;
            router.replace(fallback);
        }
    }, [router, pathname, fallback]);

    const leaveTo = useCallback((target: string) => {
        if (previousOf(pathname) === target) router.back();
        else {
            replacing = true;
            router.replace(target);
        }
    }, [router, pathname]);

    return { goBack, leaveTo, label };
}
