import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const userId = identity.tokenIdentifier;
        const now = Date.now();
        const threeDays = 3 * 24 * 60 * 60 * 1000;

        const [jobs, invoices, reads] = await Promise.all([
            ctx.db.query("jobs").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
            ctx.db.query("invoices").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
            ctx.db.query("notificationReads").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
        ]);

        const readKeys = new Set(reads.map((r) => r.key));

        const notifications: Array<{
            key: string;
            type: string;
            title: string;
            body: string;
            href: string;
            read: boolean;
            createdAt: number;
        }> = [];

        // Overdue invoices
        for (const inv of invoices) {
            if (inv.status === "overdue") {
                const key = `overdue_invoice_${inv._id}`;
                notifications.push({
                    key,
                    type: "overdue_invoice",
                    title: "Overdue Invoice",
                    body: `Invoice ${inv.invoiceNumber} is overdue.`,
                    href: `/dashboard/invoices/${inv._id}`,
                    read: readKeys.has(key),
                    createdAt: inv.date,
                });
            }
        }

        // Jobs ready for pickup
        for (const job of jobs) {
            if (job.status === "ready") {
                const key = `job_ready_${job._id}`;
                notifications.push({
                    key,
                    type: "job_ready",
                    title: "Ready for Pickup",
                    body: `"${job.title}" is ready for the client to collect.`,
                    href: `/dashboard/jobs/${job._id}`,
                    read: readKeys.has(key),
                    createdAt: job._creationTime,
                });
            }
        }

        // Jobs due soon (within 3 days, not yet done)
        for (const job of jobs) {
            if (
                job.estimatedCompletionDate &&
                job.estimatedCompletionDate > now &&
                job.estimatedCompletionDate <= now + threeDays &&
                job.status !== "closed" &&
                job.status !== "ready"
            ) {
                const daysLeft = Math.ceil((job.estimatedCompletionDate - now) / (1000 * 60 * 60 * 24));
                const key = `job_due_soon_${job._id}`;
                notifications.push({
                    key,
                    type: "job_due_soon",
                    title: "Due Soon",
                    body: `"${job.title}" is due in ${daysLeft} day${daysLeft === 1 ? "" : "s"}.`,
                    href: `/dashboard/jobs/${job._id}`,
                    read: readKeys.has(key),
                    createdAt: job.estimatedCompletionDate,
                });
            }
        }

        // Jobs overdue (past estimated completion, not closed/ready)
        for (const job of jobs) {
            if (
                job.estimatedCompletionDate &&
                job.estimatedCompletionDate < now &&
                job.status !== "closed" &&
                job.status !== "ready"
            ) {
                const key = `job_overdue_${job._id}`;
                notifications.push({
                    key,
                    type: "job_overdue",
                    title: "Job Overdue",
                    body: `"${job.title}" passed its estimated completion date.`,
                    href: `/dashboard/jobs/${job._id}`,
                    read: readKeys.has(key),
                    createdAt: job.estimatedCompletionDate,
                });
            }
        }

        return notifications.sort((a, b) => {
            // Unread first, then by recency
            if (a.read !== b.read) return a.read ? 1 : -1;
            return b.createdAt - a.createdAt;
        });
    },
});

export const markRead = mutation({
    args: { key: v.string() },
    handler: async (ctx, { key }) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");
        const userId = identity.tokenIdentifier;

        const existing = await ctx.db
            .query("notificationReads")
            .withIndex("by_user_key", (q) => q.eq("userId", userId).eq("key", key))
            .first();

        if (!existing) {
            await ctx.db.insert("notificationReads", { userId, key });
        }
    },
});

export const markAllRead = mutation({
    args: { keys: v.array(v.string()) },
    handler: async (ctx, { keys }) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");
        const userId = identity.tokenIdentifier;

        const existing = await ctx.db
            .query("notificationReads")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .collect();
        const existingKeys = new Set(existing.map((r) => r.key));

        await Promise.all(
            keys
                .filter((k) => !existingKeys.has(k))
                .map((key) => ctx.db.insert("notificationReads", { userId, key }))
        );
    },
});
