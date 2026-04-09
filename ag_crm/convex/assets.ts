import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const assets = await ctx.db
            .query("assets")
            .withIndex("by_user", (q) => q.eq("userId", identity.tokenIdentifier))
            .order("desc")
            .collect();

        return Promise.all(
            assets.map(async (asset) => ({
                ...asset,
                url: await ctx.storage.getUrl(asset.storageId),
            }))
        );
    },
});

export const add = mutation({
    args: {
        name: v.string(),
        category: v.string(),
        storageId: v.id("_storage"),
        fileName: v.string(),
        fileType: v.string(),
        fileSize: v.number(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        return ctx.db.insert("assets", {
            ...args,
            userId: identity.tokenIdentifier,
        });
    },
});

export const remove = mutation({
    args: { id: v.id("assets") },
    handler: async (ctx, { id }) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const asset = await ctx.db.get(id);
        if (!asset || asset.userId !== identity.tokenIdentifier) {
            throw new Error("Asset not found or unauthorized");
        }

        await ctx.storage.delete(asset.storageId);
        await ctx.db.delete(id);
    },
});
