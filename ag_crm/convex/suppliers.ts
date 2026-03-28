import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const suppliers = await ctx.db
            .query("suppliers")
            .withIndex("by_user", (q) => q.eq("userId", identity.tokenIdentifier))
            .collect();

        return Promise.all(
            suppliers.map(async (supplier) => ({
                ...supplier,
                imageUrl: supplier.imageStorageId
                    ? await ctx.storage.getUrl(supplier.imageStorageId)
                    : supplier.imageUrl,
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

        return await ctx.db.insert("suppliers", {
            ...args,
            userId: identity.tokenIdentifier,
        });
    },
});

export const update = mutation({
    args: {
        id: v.id("suppliers"),
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
            throw new Error("Supplier not found or unauthorized");
        }

        await ctx.db.patch(id, data);
    },
});

export const remove = mutation({
    args: { id: v.id("suppliers") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const existing = await ctx.db.get(args.id);
        if (!existing || existing.userId !== identity.tokenIdentifier) {
            throw new Error("Supplier not found or unauthorized");
        }

        await ctx.db.delete(args.id);
    },
});

export const get = query({
    args: { id: v.id("suppliers") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return null;

        const supplier = await ctx.db.get(args.id);
        if (!supplier || supplier.userId !== identity.tokenIdentifier) {
            return null;
        }

        return {
            ...supplier,
            imageUrl: supplier.imageStorageId
                ? await ctx.storage.getUrl(supplier.imageStorageId)
                : supplier.imageUrl,
        };
    },
});
