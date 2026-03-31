import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];
        return ctx.db
            .query("parts")
            .withIndex("by_user", (q) => q.eq("userId", identity.tokenIdentifier))
            .collect();
    },
});

export const add = mutation({
    args: {
        name: v.string(),
        description: v.optional(v.string()),
        sku: v.optional(v.string()),
        category: v.optional(v.string()),
        quantity: v.number(),
        unitCost: v.optional(v.number()),
        reorderThreshold: v.optional(v.number()),
        supplier: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");
        return ctx.db.insert("parts", { ...args, userId: identity.tokenIdentifier });
    },
});

export const update = mutation({
    args: {
        id: v.id("parts"),
        name: v.string(),
        description: v.optional(v.string()),
        sku: v.optional(v.string()),
        category: v.optional(v.string()),
        quantity: v.number(),
        unitCost: v.optional(v.number()),
        reorderThreshold: v.optional(v.number()),
        supplier: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");
        const { id, ...data } = args;
        const existing = await ctx.db.get(id);
        if (!existing || existing.userId !== identity.tokenIdentifier) throw new Error("Not found");
        await ctx.db.patch(id, data);
    },
});

export const adjustQuantity = mutation({
    args: { id: v.id("parts"), delta: v.number() },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");
        const existing = await ctx.db.get(args.id);
        if (!existing || existing.userId !== identity.tokenIdentifier) throw new Error("Not found");
        const newQty = Math.max(0, existing.quantity + args.delta);
        await ctx.db.patch(args.id, { quantity: newQty });
    },
});

export const remove = mutation({
    args: { id: v.id("parts") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");
        const existing = await ctx.db.get(args.id);
        if (!existing || existing.userId !== identity.tokenIdentifier) throw new Error("Not found");
        await ctx.db.delete(args.id);
    },
});
