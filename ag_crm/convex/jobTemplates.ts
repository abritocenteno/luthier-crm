import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const workItemSchema = v.object({
    name: v.string(),
    description: v.optional(v.string()),
    type: v.string(),
    unitPrice: v.number(),
    hours: v.optional(v.number()),
});

export const list = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];
        return ctx.db
            .query("jobTemplates")
            .withIndex("by_user", (q) => q.eq("userId", identity.tokenIdentifier))
            .collect();
    },
});

export const add = mutation({
    args: {
        name: v.string(),
        description: v.optional(v.string()),
        instrumentType: v.optional(v.string()),
        workItems: v.optional(v.array(workItemSchema)),
        internalNotes: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");
        return ctx.db.insert("jobTemplates", { ...args, userId: identity.tokenIdentifier });
    },
});

export const update = mutation({
    args: {
        id: v.id("jobTemplates"),
        name: v.string(),
        description: v.optional(v.string()),
        instrumentType: v.optional(v.string()),
        workItems: v.optional(v.array(workItemSchema)),
        internalNotes: v.optional(v.string()),
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

export const remove = mutation({
    args: { id: v.id("jobTemplates") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");
        const existing = await ctx.db.get(args.id);
        if (!existing || existing.userId !== identity.tokenIdentifier) throw new Error("Not found");
        await ctx.db.delete(args.id);
    },
});
