import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

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
        email: v.optional(v.string()),
        phone: v.optional(v.string()),
        role: v.optional(v.string()),
        imageStorageId: v.optional(v.id("_storage")),
        clientId: v.optional(v.id("clients")),
        supplierId: v.optional(v.id("suppliers")),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        return await ctx.db.insert("contacts", {
            ...args,
            userId: identity.tokenIdentifier,
        });
    },
});

export const listByClient = query({
    args: { clientId: v.id("clients") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const contacts = await ctx.db
            .query("contacts")
            .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
            .filter((q) => q.eq(q.field("userId"), identity.tokenIdentifier))
            .collect();

        return Promise.all(
            contacts.map(async (contact) => ({
                ...contact,
                imageUrl: contact.imageStorageId
                    ? await ctx.storage.getUrl(contact.imageStorageId)
                    : null,
            }))
        );
    },
});

export const listBySupplier = query({
    args: { supplierId: v.id("suppliers") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const contacts = await ctx.db
            .query("contacts")
            .withIndex("by_supplier", (q) => q.eq("supplierId", args.supplierId))
            .filter((q) => q.eq(q.field("userId"), identity.tokenIdentifier))
            .collect();

        return Promise.all(
            contacts.map(async (contact) => ({
                ...contact,
                imageUrl: contact.imageStorageId
                    ? await ctx.storage.getUrl(contact.imageStorageId)
                    : null,
            }))
        );
    },
});

export const remove = mutation({
    args: { id: v.id("contacts") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const existing = await ctx.db.get(args.id);
        if (!existing || existing.userId !== identity.tokenIdentifier) {
            throw new Error("Contact not found or unauthorized");
        }

        await ctx.db.delete(args.id);
    },
});
