import { mutation, query } from "./_generated/server";
import { ConvexError, v } from "convex/values";

/**
 * Insert or update the user information from the client's session token.
 *
 * This is meant to be called on every page load to keep the user profile
 * in the database in sync with Clerk.
 *
 * Access is restricted to emails listed in the ALLOWED_EMAILS environment
 * variable (comma-separated). Existing users are always allowed through so
 * that a missing/misconfigured env var never locks out someone already in
 * the database.
 */
export const store = mutation({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Called storeUser without authentication present");
        }

        // Check if we've already stored this user.
        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) =>
                q.eq("tokenIdentifier", identity.tokenIdentifier)
            )
            .unique();

        if (user !== null) {
            // Existing user — always allowed through. Update profile if changed.
            if (
                user.name !== identity.name ||
                user.email !== identity.email ||
                user.image !== identity.pictureUrl
            ) {
                await ctx.db.patch(user._id, {
                    name: identity.name,
                    email: identity.email,
                    image: identity.pictureUrl,
                });
            }
            return user._id;
        }

        // New identity — check the allowlist before creating a record.
        const allowedEmails = process.env.ALLOWED_EMAILS;
        if (allowedEmails) {
            const list = allowedEmails.split(",").map((e) => e.trim().toLowerCase());
            if (!list.includes((identity.email ?? "").toLowerCase())) {
                throw new ConvexError("unauthorized");
            }
        }

        return await ctx.db.insert("users", {
            name: identity.name,
            email: identity.email,
            image: identity.pictureUrl,
            tokenIdentifier: identity.tokenIdentifier,
        });
    },
});

/**
 * Returns the logged-in user's information.
 */
export const currentUser = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return null;
        }

        return await ctx.db
            .query("users")
            .withIndex("by_token", (q) =>
                q.eq("tokenIdentifier", identity.tokenIdentifier)
            )
            .unique();
    },
});
