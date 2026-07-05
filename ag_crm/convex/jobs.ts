import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const workItemSchema = v.object({
    name: v.string(),
    description: v.optional(v.string()),
    type: v.string(), // 'fixed' | 'hourly'
    unitPrice: v.number(),
    hours: v.optional(v.number()),
});

const intakeChecklistSchema = v.object({
    tuners: v.optional(v.string()),
    frets: v.optional(v.string()),
    nut: v.optional(v.string()),
    bridge: v.optional(v.string()),
    neck: v.optional(v.string()),
    body: v.optional(v.string()),
    electronics: v.optional(v.string()),
    notes: v.optional(v.string()),
});

const measurementSchema = v.object({
    target: v.optional(v.number()),
    actual: v.optional(v.number()),
});

const setupSpecSchema = v.object({
    tuning: v.optional(v.string()),
    gaugeSet: v.optional(v.string()),
    scaleLength: v.optional(v.number()),
    measurements: v.optional(v.object({
        actionTreble: v.optional(measurementSchema),
        actionBass: v.optional(measurementSchema),
        relief: v.optional(measurementSchema),
        nutTreble: v.optional(measurementSchema),
        nutBass: v.optional(measurementSchema),
        pickupTreble: v.optional(measurementSchema),
        pickupBass: v.optional(measurementSchema),
    })),
    notes: v.optional(v.string()),
});

// List all jobs for the current user, with client name joined
export const list = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const jobs = await ctx.db
            .query("jobs")
            .withIndex("by_user", (q) => q.eq("userId", identity.tokenIdentifier))
            .order("desc")
            .collect();

        return Promise.all(
            jobs.map(async (job) => {
                const client = await ctx.db.get(job.clientId);
                return { ...job, clientName: client?.name ?? "Unknown Client" };
            })
        );
    },
});

// List jobs for a specific client
export const listByClient = query({
    args: { clientId: v.id("clients") },
    handler: async (ctx, { clientId }) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        return ctx.db
            .query("jobs")
            .withIndex("by_client", (q) => q.eq("clientId", clientId))
            .order("desc")
            .collect();
    },
});

// Get a single job with full related data
export const get = query({
    args: { id: v.id("jobs") },
    handler: async (ctx, { id }) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return null;

        const job = await ctx.db.get(id);
        if (!job || job.userId !== identity.tokenIdentifier) return null;

        const client = await ctx.db.get(job.clientId);

        const orders = job.orderIds
            ? await Promise.all(
                job.orderIds.map(async (orderId) => {
                    const order = await ctx.db.get(orderId);
                    if (!order) return null;
                    const supplier = await ctx.db.get(order.supplierId);
                    const invoiceUrl = order.invoiceStorageId
                        ? await ctx.storage.getUrl(order.invoiceStorageId)
                        : null;
                    return { ...order, supplierName: supplier?.name ?? "Unknown", invoiceUrl };
                })
            ).then((r) => r.filter(Boolean))
            : [];

        const invoice = job.invoiceId ? await ctx.db.get(job.invoiceId) : null;

        const photoUrls = job.photoIds
            ? await Promise.all(job.photoIds.map((pid) => ctx.storage.getUrl(pid)))
            : [];

        return { ...job, client, orders, invoice, photoUrls };
    },
});

export const getByInvoiceId = query({
    args: { invoiceId: v.id("invoices") },
    handler: async (ctx, { invoiceId }) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return null;
        const jobs = await ctx.db
            .query("jobs")
            .withIndex("by_user", (q) => q.eq("userId", identity.tokenIdentifier))
            .collect();
        return jobs.find((j) => j.invoiceId === invoiceId) ?? null;
    },
});

// Create a new job
export const add = mutation({
    args: {
        clientId: v.id("clients"),
        title: v.string(),
        description: v.optional(v.string()),
        status: v.string(),
        source: v.optional(v.string()),
        instrumentType: v.string(),
        instrumentBrand: v.optional(v.string()),
        instrumentModel: v.optional(v.string()),
        instrumentSerial: v.optional(v.string()),
        instrumentColor: v.optional(v.string()),
        intakeChecklist: v.optional(intakeChecklistSchema),
        setupSpec: v.optional(setupSpecSchema),
        workItems: v.optional(v.array(workItemSchema)),
        intakeDate: v.number(),
        estimatedCompletionDate: v.optional(v.number()),
        orderIds: v.optional(v.array(v.id("orders"))),
        internalNotes: v.optional(v.string()),
        sentQuoteAt: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        return ctx.db.insert("jobs", {
            ...args,
            userId: identity.tokenIdentifier,
        });
    },
});

// Update an existing job
export const update = mutation({
    args: {
        id: v.id("jobs"),
        clientId: v.id("clients"),
        title: v.string(),
        description: v.optional(v.string()),
        status: v.string(),
        source: v.optional(v.string()),
        instrumentType: v.string(),
        instrumentBrand: v.optional(v.string()),
        instrumentModel: v.optional(v.string()),
        instrumentSerial: v.optional(v.string()),
        instrumentColor: v.optional(v.string()),
        intakeChecklist: v.optional(intakeChecklistSchema),
        setupSpec: v.optional(setupSpecSchema),
        workItems: v.optional(v.array(workItemSchema)),
        intakeDate: v.number(),
        estimatedCompletionDate: v.optional(v.number()),
        completionDate: v.optional(v.number()),
        orderIds: v.optional(v.array(v.id("orders"))),
        internalNotes: v.optional(v.string()),
        sentQuoteAt: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const { id, ...data } = args;
        const existing = await ctx.db.get(id);
        if (!existing || existing.userId !== identity.tokenIdentifier) {
            throw new Error("Job not found or unauthorized");
        }

        return ctx.db.patch(id, data);
    },
});

// Update just the status of a job
export const updateStatus = mutation({
    args: {
        id: v.id("jobs"),
        status: v.string(),
        completionDate: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const existing = await ctx.db.get(args.id);
        if (!existing || existing.userId !== identity.tokenIdentifier) {
            throw new Error("Job not found or unauthorized");
        }
        if (existing.status === "closed") {
            throw new Error("Closed jobs cannot be edited.");
        }

        const patch: Record<string, any> = { status: args.status };
        if (args.completionDate !== undefined) patch.completionDate = args.completionDate;

        return ctx.db.patch(args.id, patch);
    },
});

// Generate an invoice from a job's work items + linked orders
export const generateInvoice = mutation({
    args: { id: v.id("jobs") },
    handler: async (ctx, { id }) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const job = await ctx.db.get(id);
        if (!job || job.userId !== identity.tokenIdentifier) throw new Error("Job not found");
        if (job.invoiceId) throw new Error("Invoice already generated for this job");

        // Map work items → invoice line items (tagged so a later re-sync can rebuild them)
        const items = (job.workItems ?? []).map((wi) => ({
            name: wi.name,
            description: wi.description ?? "",
            remark: wi.type === "hourly" ? `${wi.hours ?? 0}h × ${wi.unitPrice}/h` : "",
            amount: wi.type === "hourly" ? (wi.hours ?? 1) : 1,
            unitPrice: wi.unitPrice,
            fromJob: true,
        }));

        // Sum work items
        const workTotal = items.reduce((acc, i) => acc + i.amount * i.unitPrice, 0);

        // Sum linked orders (materials billed to client)
        let orderTotal = 0;
        if (job.orderIds && job.orderIds.length > 0) {
            const orders = await Promise.all(job.orderIds.map((oid) => ctx.db.get(oid)));
            orderTotal = orders.reduce((acc, o) => acc + (o?.amount ?? 0), 0);
        }

        const invoiceNumber = `INV-${Math.floor(1000 + Math.random() * 9000)}`;

        // Default the VAT rate to the user's configured default (falling back to 21%),
        // so job-generated invoices show BTW just like manually created ones.
        const settings = await ctx.db
            .query("settings")
            .withIndex("by_user", (q) => q.eq("userId", identity.tokenIdentifier))
            .first();
        const taxRate = settings?.defaultTaxRate ?? 21;

        const invoiceId = await ctx.db.insert("invoices", {
            clientId: job.clientId,
            invoiceNumber,
            date: Date.now(),
            amount: workTotal + orderTotal,
            status: "pending",
            items,
            orderIds: job.orderIds ?? [],
            taxRate,
            userId: identity.tokenIdentifier,
        });

        // Link invoice back to job
        await ctx.db.patch(id, { invoiceId });

        return invoiceId;
    },
});

// Re-sync an already-generated invoice with the job's current work items + linked
// orders. The job-derived line items are rebuilt to match the job, while any line
// items added manually on the invoice itself — plus credits and tax rate — are kept.
export const syncInvoice = mutation({
    args: { id: v.id("jobs") },
    handler: async (ctx, { id }) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const job = await ctx.db.get(id);
        if (!job || job.userId !== identity.tokenIdentifier) throw new Error("Job not found");
        if (!job.invoiceId) throw new Error("No invoice has been generated for this job yet");

        const invoice = await ctx.db.get(job.invoiceId);
        if (!invoice) throw new Error("Linked invoice not found");
        if (invoice.status === "paid") {
            throw new Error("This invoice is already paid and can't be changed. Create a new invoice instead.");
        }

        // Keep everything that wasn't derived from the job's work items:
        //  - items explicitly marked manual (fromJob === false)
        //  - order line items (they carry fromOrderId)
        // Legacy job items (no fromJob, no fromOrderId) are treated as job-derived and rebuilt.
        const existing = invoice.items ?? [];
        const manualItems = existing.filter((it) => it.fromJob === false || !!it.fromOrderId);

        // Rebuild the job-derived line items from the job's current work items.
        const jobItems = (job.workItems ?? []).map((wi) => ({
            name: wi.name,
            description: wi.description ?? "",
            remark: wi.type === "hourly" ? `${wi.hours ?? 0}h × ${wi.unitPrice}/h` : "",
            amount: wi.type === "hourly" ? (wi.hours ?? 1) : 1,
            unitPrice: wi.unitPrice,
            fromJob: true,
        }));

        const mergedItems = [...jobItems, ...manualItems];
        const itemsSubtotal = mergedItems.reduce((acc, i) => acc + i.amount * i.unitPrice, 0);

        // Add linked-order totals, skipping any order already present as a manual line item
        // (so it isn't counted twice).
        const billedOrderIds = new Set(
            manualItems.map((it) => it.fromOrderId).filter(Boolean) as string[]
        );
        let orderTotal = 0;
        if (job.orderIds && job.orderIds.length > 0) {
            const orders = await Promise.all(job.orderIds.map((oid) => ctx.db.get(oid)));
            orderTotal = orders.reduce(
                (acc, o) => acc + (o && !billedOrderIds.has(o._id) ? o.amount : 0),
                0
            );
        }

        // Preserve any manual credits already applied to the invoice.
        const credits = (invoice as { credits?: { description: string; amount: number }[] }).credits;
        const creditsTotal = credits?.reduce((acc, c) => acc + c.amount, 0) ?? 0;

        await ctx.db.patch(job.invoiceId, {
            items: mergedItems,
            orderIds: job.orderIds ?? [],
            amount: itemsSubtotal + orderTotal - creditsTotal,
        });

        return job.invoiceId;
    },
});

// Generate a short-lived upload URL for a photo
export const generateUploadUrl = mutation({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");
        return ctx.storage.generateUploadUrl();
    },
});

// Attach a photo storageId to a job
export const addJobPhoto = mutation({
    args: { id: v.id("jobs"), storageId: v.id("_storage") },
    handler: async (ctx, { id, storageId }) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");
        const job = await ctx.db.get(id);
        if (!job || job.userId !== identity.tokenIdentifier) throw new Error("Not found");
        const existing = job.photoIds ?? [];
        await ctx.db.patch(id, { photoIds: [...existing, storageId] });
    },
});

// Remove a photo from a job
export const removeJobPhoto = mutation({
    args: { id: v.id("jobs"), storageId: v.id("_storage") },
    handler: async (ctx, { id, storageId }) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");
        const job = await ctx.db.get(id);
        if (!job || job.userId !== identity.tokenIdentifier) throw new Error("Not found");
        await ctx.db.patch(id, { photoIds: (job.photoIds ?? []).filter((p) => p !== storageId) });
        await ctx.storage.delete(storageId);
    },
});

// Delete a job
export const remove = mutation({
    args: { id: v.id("jobs") },
    handler: async (ctx, { id }) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const job = await ctx.db.get(id);
        if (!job || job.userId !== identity.tokenIdentifier) {
            throw new Error("Job not found or unauthorized");
        }

        return ctx.db.delete(id);
    },
});

// Mark quote as sent
export const markQuoteSent = mutation({
    args: { id: v.id("jobs") },
    handler: async (ctx, { id }) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");
        const job = await ctx.db.get(id);
        if (!job || job.userId !== identity.tokenIdentifier) throw new Error("Not found");
        await ctx.db.patch(id, { sentQuoteAt: Date.now() });
    },
});

// Save the Setup Sheet (tuning, gauge, measurements) inline from the job page
export const updateSetupSpec = mutation({
    args: { id: v.id("jobs"), setupSpec: setupSpecSchema },
    handler: async (ctx, { id, setupSpec }) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");
        const job = await ctx.db.get(id);
        if (!job || job.userId !== identity.tokenIdentifier) throw new Error("Not found");
        if (job.status === "closed") throw new Error("Closed jobs cannot be edited.");
        await ctx.db.patch(id, { setupSpec });
    },
});
