import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        return ctx.db
            .query("services")
            .withIndex("by_user", (q) => q.eq("userId", identity.tokenIdentifier))
            .order("asc")
            .collect();
    },
});

export const add = mutation({
    args: {
        name: v.string(),
        description: v.optional(v.string()),
        type: v.string(),
        defaultPrice: v.number(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        return ctx.db.insert("services", {
            ...args,
            userId: identity.tokenIdentifier,
        });
    },
});

export const update = mutation({
    args: {
        id: v.id("services"),
        name: v.string(),
        description: v.optional(v.string()),
        type: v.string(),
        defaultPrice: v.number(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const { id, ...data } = args;
        const existing = await ctx.db.get(id);
        if (!existing || existing.userId !== identity.tokenIdentifier) {
            throw new Error("Service not found or unauthorized");
        }

        return ctx.db.patch(id, data);
    },
});

export const remove = mutation({
    args: { id: v.id("services") },
    handler: async (ctx, { id }) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const existing = await ctx.db.get(id);
        if (!existing || existing.userId !== identity.tokenIdentifier) {
            throw new Error("Service not found or unauthorized");
        }

        return ctx.db.delete(id);
    },
});
