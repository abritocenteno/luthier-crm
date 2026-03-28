import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const listBySupplier = query({
    args: { supplierId: v.id("suppliers") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        return await ctx.db
            .query("orders")
            .withIndex("by_supplier", (q) => q.eq("supplierId", args.supplierId))
            .filter((q) => q.eq(q.field("userId"), identity.tokenIdentifier))
            .collect();
    },
});

export const add = mutation({
    args: {
        supplierId: v.id("suppliers"),
        orderNumber: v.string(),
        date: v.number(),
        amount: v.number(),
        status: v.string(),
        items: v.optional(v.array(v.object({
            name: v.string(),
            description: v.string(),
            remark: v.string(),
            amount: v.number(),
            unitPrice: v.number(),
        }))),
        invoiceStorageId: v.optional(v.id("_storage")),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        return await ctx.db.insert("orders", {
            ...args,
            userId: identity.tokenIdentifier,
        });
    },
});

export const list = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const orders = await ctx.db
            .query("orders")
            .withIndex("by_user", (q) => q.eq("userId", identity.tokenIdentifier))
            .collect();

        return Promise.all(
            orders.map(async (order) => {
                const supplier = await ctx.db.get(order.supplierId);
                return {
                    ...order,
                    supplierName: supplier?.name || "Unknown Supplier",
                    supplierImageUrl: supplier?.imageStorageId
                        ? await ctx.storage.getUrl(supplier.imageStorageId)
                        : supplier?.imageUrl,
                };
            })
        );
    },
});

export const update = mutation({
    args: {
        id: v.id("orders"),
        supplierId: v.id("suppliers"),
        orderNumber: v.string(),
        date: v.number(),
        amount: v.number(),
        status: v.string(),
        items: v.optional(v.array(v.object({
            name: v.string(),
            description: v.string(),
            remark: v.string(),
            amount: v.number(),
            unitPrice: v.number(),
        }))),
        invoiceStorageId: v.optional(v.id("_storage")),
    },
    handler: async (ctx, args) => {
        const { id, ...data } = args;
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const existing = await ctx.db.get(id);
        if (!existing || existing.userId !== identity.tokenIdentifier) {
            throw new Error("Order not found or unauthorized");
        }

        if (existing.status === "paid") {
            throw new Error("Paid orders cannot be edited");
        }

        await ctx.db.patch(id, data);
    },
});

export const remove = mutation({
    args: { id: v.id("orders") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const existing = await ctx.db.get(args.id);
        if (!existing || existing.userId !== identity.tokenIdentifier) {
            throw new Error("Order not found or unauthorized");
        }

        await ctx.db.delete(args.id);
    },
});

export const get = query({
    args: { id: v.id("orders") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return null;

        const order = await ctx.db.get(args.id);
        if (!order || order.userId !== identity.tokenIdentifier) {
            return null;
        }

        const supplier = await ctx.db.get(order.supplierId);
        return {
            ...order,
            supplierName: supplier?.name || "Unknown Supplier",
            supplierImageUrl: supplier?.imageStorageId
                ? await ctx.storage.getUrl(supplier.imageStorageId)
                : supplier?.imageUrl,
            invoiceUrl: order.invoiceStorageId 
                ? await ctx.storage.getUrl(order.invoiceStorageId)
                : null,
            supplier: supplier,
        };
    },
});
