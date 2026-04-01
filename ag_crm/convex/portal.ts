import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// ── Owner: generate / revoke portal token ──────────────────────────────────

export const getPortalForClient = query({
    args: { clientId: v.id("clients") },
    handler: async (ctx, { clientId }) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return null;
        return ctx.db
            .query("clientPortals")
            .withIndex("by_client", (q) => q.eq("clientId", clientId))
            .first();
    },
});

export const generateToken = mutation({
    args: { clientId: v.id("clients") },
    handler: async (ctx, { clientId }) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        // Revoke any existing token first
        const existing = await ctx.db
            .query("clientPortals")
            .withIndex("by_client", (q) => q.eq("clientId", clientId))
            .first();
        if (existing) await ctx.db.delete(existing._id);

        // Generate a new random token
        const token = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");

        await ctx.db.insert("clientPortals", {
            clientId,
            userId: identity.tokenIdentifier,
            token,
        });

        return token;
    },
});

export const revokeToken = mutation({
    args: { clientId: v.id("clients") },
    handler: async (ctx, { clientId }) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const existing = await ctx.db
            .query("clientPortals")
            .withIndex("by_client", (q) => q.eq("clientId", clientId))
            .first();
        if (existing) await ctx.db.delete(existing._id);
    },
});

// ── Public: view portal by token ───────────────────────────────────────────

export const getByToken = query({
    args: { token: v.string() },
    handler: async (ctx, { token }) => {
        const portal = await ctx.db
            .query("clientPortals")
            .withIndex("by_token", (q) => q.eq("token", token))
            .first();
        if (!portal) return null;

        const client = await ctx.db.get(portal.clientId);
        if (!client) return null;

        const [jobs, invoices] = await Promise.all([
            ctx.db
                .query("jobs")
                .withIndex("by_client", (q) => q.eq("clientId", portal.clientId))
                .collect(),
            ctx.db
                .query("invoices")
                .withIndex("by_client", (q) => q.eq("clientId", portal.clientId))
                .collect(),
        ]);

        // Only expose what the client needs to see
        return {
            client: {
                name: client.name,
                email: client.email,
            },
            jobs: jobs
                .filter((j) => j.status !== "closed")
                .map((j) => ({
                    _id: j._id,
                    title: j.title,
                    status: j.status,
                    instrumentType: j.instrumentType,
                    instrumentBrand: j.instrumentBrand,
                    instrumentModel: j.instrumentModel,
                    intakeDate: j.intakeDate,
                    estimatedCompletionDate: j.estimatedCompletionDate,
                    workItems: j.workItems,
                    description: j.description,
                    sentQuoteAt: j.sentQuoteAt,
                })),
            invoices: invoices
                .filter((i) => i.status !== "paid")
                .map((i) => ({
                    _id: i._id,
                    invoiceNumber: i.invoiceNumber,
                    date: i.date,
                    amount: i.amount,
                    status: i.status,
                })),
        };
    },
});

// ── Public: accept a quoted job ────────────────────────────────────────────

export const acceptQuote = mutation({
    args: { token: v.string(), jobId: v.id("jobs") },
    handler: async (ctx, { token, jobId }) => {
        const portal = await ctx.db
            .query("clientPortals")
            .withIndex("by_token", (q) => q.eq("token", token))
            .first();
        if (!portal) throw new Error("Invalid portal link");

        const job = await ctx.db.get(jobId);
        if (!job || job.clientId !== portal.clientId) throw new Error("Job not found");
        if (job.status !== "quoted") throw new Error("Job is not in quoted status");

        await ctx.db.patch(jobId, { status: "intake" });
    },
});
