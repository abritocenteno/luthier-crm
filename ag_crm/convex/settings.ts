import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Get the settings for the currently authenticated user
export const get = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return null;

        const settings = await ctx.db
            .query("settings")
            .withIndex("by_user", (q) => q.eq("userId", identity.tokenIdentifier))
            .first();

        if (!settings) return null;

        return {
            ...settings,
            logoUrl: settings.logoStorageId
                ? await ctx.storage.getUrl(settings.logoStorageId)
                : undefined,
        };
    },
});

// Create or update settings for the authenticated user
export const upsert = mutation({
    args: {
        companyName: v.string(),
        addressLine1: v.string(),
        addressLine2: v.string(),
        contactEmail: v.string(),
        phone: v.optional(v.string()),
        website: v.optional(v.string()),
        kvkNumber: v.optional(v.string()),
        btwNumber: v.optional(v.string()),
        bankAccounts: v.optional(v.string()),
        logoStorageId: v.optional(v.id("_storage")),
        language: v.optional(v.string()),
        currency: v.optional(v.string()),
        emailSenderName: v.optional(v.string()),
        invoiceEmailSubject: v.optional(v.string()),
        invoiceEmailIntro: v.optional(v.string()),
        quoteEmailSubject: v.optional(v.string()),
        quoteEmailIntro: v.optional(v.string()),
        jobReadyEmailSubject: v.optional(v.string()),
        jobReadyEmailIntro: v.optional(v.string()),
        overdueEmailSubject: v.optional(v.string()),
        overdueEmailIntro: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const existingSettings = await ctx.db
            .query("settings")
            .withIndex("by_user", (q) => q.eq("userId", identity.tokenIdentifier))
            .first();

        if (existingSettings) {
            // Update existing settings
            return await ctx.db.patch(existingSettings._id, {
                ...args,
            });
        } else {
            // Insert new settings
            return await ctx.db.insert("settings", {
                ...args,
                userId: identity.tokenIdentifier,
            });
        }
    },
});
