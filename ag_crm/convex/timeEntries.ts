import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const listByJob = query({
    args: { jobId: v.id("jobs") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];
        return ctx.db
            .query("timeEntries")
            .withIndex("by_job", (q) => q.eq("jobId", args.jobId))
            .order("desc")
            .collect();
    },
});

export const listByWeek = query({
    args: { weekStart: v.number(), weekEnd: v.number() },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];
        const entries = await ctx.db
            .query("timeEntries")
            .withIndex("by_user", (q) => q.eq("userId", identity.tokenIdentifier))
            .collect();
        return entries.filter((e) => e.date >= args.weekStart && e.date <= args.weekEnd);
    },
});

export const listUnbilledByJob = query({
    args: { jobId: v.id("jobs") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];
        const entries = await ctx.db
            .query("timeEntries")
            .withIndex("by_job", (q) => q.eq("jobId", args.jobId))
            .collect();
        return entries.filter((e) => e.billable && !e.invoiced);
    },
});

export const add = mutation({
    args: {
        jobId: v.id("jobs"),
        date: v.number(),
        durationMinutes: v.number(),
        description: v.optional(v.string()),
        billable: v.boolean(),
        hourlyRate: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");
        return ctx.db.insert("timeEntries", { ...args, userId: identity.tokenIdentifier, invoiced: false });
    },
});

export const update = mutation({
    args: {
        id: v.id("timeEntries"),
        date: v.number(),
        durationMinutes: v.number(),
        description: v.optional(v.string()),
        billable: v.boolean(),
        hourlyRate: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");
        const existing = await ctx.db.get(args.id);
        if (!existing || existing.userId !== identity.tokenIdentifier) throw new Error("Not found");
        const { id, ...data } = args;
        await ctx.db.patch(id, data);
    },
});

export const remove = mutation({
    args: { id: v.id("timeEntries") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");
        const existing = await ctx.db.get(args.id);
        if (!existing || existing.userId !== identity.tokenIdentifier) throw new Error("Not found");
        await ctx.db.delete(args.id);
    },
});

export const importToInvoice = mutation({
    args: { invoiceId: v.id("invoices"), entryIds: v.array(v.id("timeEntries")) },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const invoice = await ctx.db.get(args.invoiceId);
        if (!invoice || invoice.userId !== identity.tokenIdentifier) throw new Error("Invoice not found");

        const newItems: Array<{ name: string; description: string; remark: string; amount: number; unitPrice: number }> = [];

        for (const entryId of args.entryIds) {
            const entry = await ctx.db.get(entryId);
            if (!entry || entry.userId !== identity.tokenIdentifier) continue;
            if (entry.invoiced) continue;

            const hours = entry.durationMinutes / 60;
            const rate = entry.hourlyRate ?? 0;
            newItems.push({
                name: entry.description ?? "Labour",
                description: "",
                remark: `${Math.floor(entry.durationMinutes / 60)}h ${entry.durationMinutes % 60}m @ €${rate}/hr`,
                amount: hours,
                unitPrice: rate,
            });

            await ctx.db.patch(entryId, { invoiced: true });
        }

        if (newItems.length === 0) return;

        const existingItems = invoice.items ?? [];
        const allItems = [...existingItems, ...newItems];
        const newTotal = allItems.reduce((sum, i) => sum + i.amount * i.unitPrice, 0);

        await ctx.db.patch(args.invoiceId, { items: allItems, amount: newTotal });
    },
});

export const markAsInvoiced = mutation({
    args: { ids: v.array(v.id("timeEntries")) },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");
        for (const id of args.ids) {
            const existing = await ctx.db.get(id);
            if (!existing || existing.userId !== identity.tokenIdentifier) continue;
            await ctx.db.patch(id, { invoiced: true });
        }
    },
});
