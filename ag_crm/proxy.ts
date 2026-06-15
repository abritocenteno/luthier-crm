import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest, NextFetchEvent } from "next/server";

// The dashboard and onboarding wizard are gated. Public routes — the landing
// page ("/"), the client intake form ("/request"), the client portal
// ("/portal/*") and the print/checklist views ("/jobs/*") — pass straight through.
const isProtectedRoute = createRouteMatcher(["/dashboard(.*)", "/onboarding(.*)"]);

const clerk = clerkMiddleware(async (auth, req) => {
    if (!isProtectedRoute(req)) return;

    const { userId } = await auth();
    if (!userId) {
        // Send logged-out visitors to the landing page, which hosts the sign-in
        // modal and redirects back to /dashboard once authenticated.
        return NextResponse.redirect(new URL("/", req.url));
    }
});

export default function middleware(req: NextRequest, evt: NextFetchEvent) {
    // Preview deployments run without Clerk (see ConditionalClerkProvider), so
    // the proxy must be a no-op there.
    if (process.env.NEXT_PUBLIC_PREVIEW_MODE === "true") {
        return NextResponse.next();
    }
    return clerk(req, evt);
}

export const config = {
    matcher: [
        // Skip Next.js internals and all static files, unless found in search params
        "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
        // Always run for API routes
        "/(api|trpc)(.*)",
    ],
};
