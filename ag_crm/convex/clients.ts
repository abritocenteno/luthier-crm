import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const clients = await ctx.db
            .query("clients")
            .withIndex("by_user", (q) => q.eq("userId", identity.tokenIdentifier))
            .collect();

        return Promise.all(
            clients.map(async (client) => ({
                ...client,
                imageUrl: client.imageStorageId
                    ? await ctx.storage.getUrl(client.imageStorageId)
                    : client.imageUrl,
            }))
        );
    },
});

export const generateUploadUrl = mutation({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");
        return await ctx.storage.generateUploadUrl();
    },
});

export const add = mutation({
    args: {
        name: v.string(),
        email: v.string(),
        type: v.string(),
        imageUrl: v.optional(v.string()),
        imageStorageId: v.optional(v.id("_storage")),
        phone: v.optional(v.string()),
        website: v.optional(v.string()),
        street: v.optional(v.string()),
        postcode: v.optional(v.string()),
        city: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        return await ctx.db.insert("clients", {
            ...args,
            userId: identity.tokenIdentifier,
        });
    },
});

export const update = mutation({
    args: {
        id: v.id("clients"),
        name: v.string(),
        email: v.string(),
        type: v.string(),
        imageUrl: v.optional(v.string()),
        imageStorageId: v.optional(v.id("_storage")),
        phone: v.optional(v.string()),
        website: v.optional(v.string()),
        street: v.optional(v.string()),
        postcode: v.optional(v.string()),
        city: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const { id, ...data } = args;
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const existing = await ctx.db.get(id);
        if (!existing || existing.userId !== identity.tokenIdentifier) {
            throw new Error("Client not found or unauthorized");
        }

        await ctx.db.patch(id, data);
    },
});

export const remove = mutation({
    args: { id: v.id("clients") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const existing = await ctx.db.get(args.id);
        if (!existing || existing.userId !== identity.tokenIdentifier) {
            throw new Error("Client not found or unauthorized");
        }

        await ctx.db.delete(args.id);
    },
});

export const get = query({
    args: { id: v.id("clients") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return null;

        const client = await ctx.db.get(args.id);
        if (!client || client.userId !== identity.tokenIdentifier) {
            return null;
        }

        return {
            ...client,
            imageUrl: client.imageStorageId
                ? await ctx.storage.getUrl(client.imageStorageId)
                : client.imageUrl,
        };
    },
});
