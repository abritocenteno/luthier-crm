import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";

export const listByClient = query({
    args: { clientId: v.id("clients") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        return await ctx.db
            .query("invoices")
            .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
            .filter((q) => q.eq(q.field("userId"), identity.tokenIdentifier))
            .collect();
    },
});

export const add = mutation({
    args: {
        clientId: v.id("clients"),
        invoiceNumber: v.string(),
        date: v.number(),
        amount: v.number(),
        status: v.string(),
        paymentMethod: v.optional(v.string()),
        items: v.optional(v.array(v.object({
            name: v.string(),
            description: v.string(),
            remark: v.string(),
            amount: v.number(),
            unitPrice: v.number(),
            fromOrderId: v.optional(v.id("orders")),
        }))),
        credits: v.optional(v.array(v.object({
            description: v.string(),
            amount: v.number(),
        }))),
        invoiceStorageId: v.optional(v.id("_storage")),
        orderIds: v.optional(v.array(v.id("orders"))),
        taxRate: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        return await ctx.db.insert("invoices", {
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

        const invoices = await ctx.db
            .query("invoices")
            .withIndex("by_user", (q) => q.eq("userId", identity.tokenIdentifier))
            .collect();

        return Promise.all(
            invoices.map(async (invoice) => {
                const client = await ctx.db.get(invoice.clientId);
                return {
                    ...invoice,
                    clientName: client?.name || "Unknown Client",
                    clientImageUrl: client?.imageStorageId
                        ? await ctx.storage.getUrl(client.imageStorageId)
                        : client?.imageUrl,
                };
            })
        );
    },
});

export const update = mutation({
    args: {
        id: v.id("invoices"),
        clientId: v.id("clients"),
        invoiceNumber: v.string(),
        date: v.number(),
        amount: v.number(),
        status: v.string(),
        paymentMethod: v.optional(v.string()),
        items: v.optional(v.array(v.object({
            name: v.string(),
            description: v.string(),
            remark: v.string(),
            amount: v.number(),
            unitPrice: v.number(),
            fromOrderId: v.optional(v.id("orders")),
        }))),
        credits: v.optional(v.array(v.object({
            description: v.string(),
            amount: v.number(),
        }))),
        orderIds: v.optional(v.array(v.id("orders"))),
        taxRate: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const { id, ...data } = args;
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const existing = await ctx.db.get(id);
        if (!existing || existing.userId !== identity.tokenIdentifier) {
            throw new Error("Invoice not found or unauthorized");
        }

        if (existing.status === "paid") {
            throw new Error("Paid invoices cannot be edited");
        }

        await ctx.db.patch(id, data);
    },
});

// Called by the daily cron — marks pending invoices past their 14-day due date as overdue
export const markOverdueInvoices = internalMutation({
    args: {},
    handler: async (ctx) => {
        const cutoff = Date.now() - 14 * 24 * 60 * 60 * 1000;
        const pending = await ctx.db
            .query("invoices")
            .filter((q) => q.eq(q.field("status"), "pending"))
            .collect();
        let count = 0;
        for (const inv of pending) {
            if (inv.date < cutoff) {
                await ctx.db.patch(inv._id, { status: "overdue" });
                count++;
            }
        }
        console.log(`Marked ${count} invoice(s) as overdue.`);
    },
});

export const markAsPaid = mutation({
    args: {
        id: v.id("invoices"),
        paymentMethod: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const existing = await ctx.db.get(args.id);
        if (!existing || existing.userId !== identity.tokenIdentifier) {
            throw new Error("Invoice not found or unauthorized");
        }

        await ctx.db.patch(args.id, {
            status: "paid",
            paymentMethod: args.paymentMethod,
            paidAt: Date.now(),
        });
    },
});

export const markAsUnpaid = mutation({
    args: { id: v.id("invoices") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const existing = await ctx.db.get(args.id);
        if (!existing || existing.userId !== identity.tokenIdentifier) {
            throw new Error("Invoice not found or unauthorized");
        }

        await ctx.db.patch(args.id, {
            status: "pending",
            paidAt: undefined,
        });
    },
});

export const remove = mutation({
    args: { id: v.id("invoices") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const existing = await ctx.db.get(args.id);
        if (!existing || existing.userId !== identity.tokenIdentifier) {
            throw new Error("Invoice not found or unauthorized");
        }

        await ctx.db.delete(args.id);
    },
});

export const get = query({
    args: { id: v.id("invoices") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return null;

        const invoice = await ctx.db.get(args.id);
        if (!invoice || invoice.userId !== identity.tokenIdentifier) {
            return null;
        }

        const client = await ctx.db.get(invoice.clientId);
        return {
            ...invoice,
            clientName: client?.name || "Unknown Client",
            clientImageUrl: client?.imageStorageId
                ? await ctx.storage.getUrl(client.imageStorageId)
                : client?.imageUrl,
            client: client, // Include the full client object for email sending
            orders: invoice.orderIds 
                ? await Promise.all(
                    invoice.orderIds.map(async (id) => {
                        const order = await ctx.db.get(id);
                        if (!order) return null;
                        const supplier = await ctx.db.get(order.supplierId);
                        return {
                            ...order,
                            supplierName: supplier?.name || "Unknown Supplier",
                            invoiceUrl: order.invoiceStorageId 
                                ? await ctx.storage.getUrl(order.invoiceStorageId)
                                : null,
                        };
                    })
                ).then(orders => orders.filter(o => o !== null))
                : [],
        };
    },
});
