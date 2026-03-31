import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const listByClient = query({
    args: { clientId: v.id("clients") },
    handler: async (ctx, { clientId }) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];
        return ctx.db
            .query("communications")
            .withIndex("by_client", (q) => q.eq("clientId", clientId))
            .filter((q) => q.eq(q.field("userId"), identity.tokenIdentifier))
            .order("desc")
            .collect();
    },
});

export const add = mutation({
    args: {
        clientId: v.id("clients"),
        type: v.string(),
        notes: v.string(),
        date: v.number(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");
        return ctx.db.insert("communications", { ...args, userId: identity.tokenIdentifier });
    },
});

export const remove = mutation({
    args: { id: v.id("communications") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");
        const existing = await ctx.db.get(args.id);
        if (!existing || existing.userId !== identity.tokenIdentifier) throw new Error("Not found");
        await ctx.db.delete(args.id);
    },
});
