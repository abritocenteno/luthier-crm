import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const events = await ctx.db
            .query("events")
            .withIndex("by_user", (q) => q.eq("userId", identity.tokenIdentifier))
            .collect();

        return events.sort((a, b) => a.start - b.start);
    },
});

export const add = mutation({
    args: {
        title: v.string(),
        description: v.optional(v.string()),
        start: v.number(),
        end: v.optional(v.number()),
        type: v.string(),
        clientId: v.optional(v.id("clients")),
        supplierId: v.optional(v.id("suppliers")),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        return await ctx.db.insert("events", {
            ...args,
            userId: identity.tokenIdentifier,
        });
    },
});

export const update = mutation({
    args: {
        id: v.id("events"),
        title: v.string(),
        description: v.optional(v.string()),
        start: v.number(),
        end: v.optional(v.number()),
        type: v.string(),
        clientId: v.optional(v.id("clients")),
        supplierId: v.optional(v.id("suppliers")),
    },
    handler: async (ctx, args) => {
        const { id, ...data } = args;
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const existing = await ctx.db.get(id);
        if (!existing || existing.userId !== identity.tokenIdentifier) {
            throw new Error("Event not found or unauthorized");
        }

        await ctx.db.patch(id, data);
    },
});

export const remove = mutation({
    args: { id: v.id("events") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const existing = await ctx.db.get(args.id);
        if (!existing || existing.userId !== identity.tokenIdentifier) {
            throw new Error("Event not found or unauthorized");
        }

        await ctx.db.delete(args.id);
    },
});
