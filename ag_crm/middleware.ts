import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";

// Preview deployments run without Clerk (see ConditionalClerkProvider), so the
// middleware must be a no-op there — otherwise every request would hit Clerk
// with no keys configured.
const isPreview = process.env.NEXT_PUBLIC_PREVIEW_MODE === "true";

// Only the dashboard is gated. Public routes — the landing page ("/"), the
// client intake form ("/request"), the client portal ("/portal/*") and the
// print/checklist views ("/jobs/*") — pass straight through.
const isProtectedRoute = createRouteMatcher(["/dashboard(.*)"]);

const clerk = clerkMiddleware(async (auth, req) => {
    if (!isProtectedRoute(req)) return;

    const { userId } = await auth();
    if (!userId) {
        // Send logged-out visitors to the landing page, which hosts the sign-in
        // modal and redirects back to /dashboard once authenticated.
        const url = new URL("/", req.url);
        return NextResponse.redirect(url);
    }
});

export default isPreview ? (_req: NextRequest) => NextResponse.next() : clerk;

export const config = {
    matcher: [
        // Run on everything except Next internals and static files…
        "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|png|gif|svg|ico|webp|woff2?|ttf|map)).*)",
        // …and always run on API/trpc routes.
        "/(api|trpc)(.*)",
    ],
};
