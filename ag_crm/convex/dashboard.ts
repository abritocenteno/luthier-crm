import { query } from "./_generated/server";

export const getStats = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return { stats: null, activeJobs: [], upcomingDeadlines: [], upcomingEvents: [], recentActivity: [] };

        const userId = identity.tokenIdentifier;

        const [clients, invoices, orders, jobs, events] = await Promise.all([
            ctx.db.query("clients").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
            ctx.db.query("invoices").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
            ctx.db.query("orders").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
            ctx.db.query("jobs").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
            ctx.db.query("events").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
        ]);

        // Job breakdown
        const openJobs = jobs.filter((j) => j.status !== "closed");
        const readyJobs = jobs.filter((j) => j.status === "ready");
        const inProgressJobs = jobs.filter((j) => j.status === "in_progress");
        const waitingPartsJobs = jobs.filter((j) => j.status === "waiting_parts");
        const intakeJobs = jobs.filter((j) => j.status === "intake");

        // Invoice stats
        const pendingAmount = invoices
            .filter((i) => i.status === "pending")
            .reduce((s, i) => s + i.amount, 0);
        const totalInvoiced = invoices
            .filter((i) => i.status === "paid")
            .reduce((s, i) => s + i.amount, 0);

        // Client lookup for jobs
        const clientMap = new Map(clients.map((c) => [c._id as string, c.name]));

        // Active jobs sorted by urgency: ready → in_progress → waiting_parts → intake
        const statusOrder: Record<string, number> = {
            ready: 0,
            in_progress: 1,
            waiting_parts: 2,
            intake: 3,
        };
        const activeJobs = [...openJobs]
            .sort((a, b) => (statusOrder[a.status] ?? 9) - (statusOrder[b.status] ?? 9))
            .slice(0, 8)
            .map((j) => ({
                id: j._id,
                title: j.title,
                clientName: clientMap.get(j.clientId as string) ?? "Unknown",
                status: j.status,
                instrumentType: j.instrumentType,
                instrumentBrand: j.instrumentBrand,
                instrumentModel: j.instrumentModel,
                intakeDate: j.intakeDate,
                estimatedCompletionDate: j.estimatedCompletionDate,
            }));

        // Upcoming deadlines: non-closed jobs with est. completion within 14 days
        const now = Date.now();
        const in14Days = now + 14 * 24 * 60 * 60 * 1000;
        const upcomingDeadlines = openJobs
            .filter((j) => j.estimatedCompletionDate && j.estimatedCompletionDate <= in14Days)
            .sort((a, b) => (a.estimatedCompletionDate ?? 0) - (b.estimatedCompletionDate ?? 0))
            .slice(0, 5)
            .map((j) => ({
                id: j._id,
                title: j.title,
                clientName: clientMap.get(j.clientId as string) ?? "Unknown",
                status: j.status,
                estimatedCompletionDate: j.estimatedCompletionDate!,
                isOverdue: (j.estimatedCompletionDate ?? 0) < now,
            }));

        // Upcoming calendar events in the next 14 days (future only)
        const upcomingEvents = events
            .filter((e) => e.start >= now && e.start <= in14Days)
            .sort((a, b) => a.start - b.start)
            .slice(0, 5)
            .map((e) => ({
                id: e._id,
                title: e.title,
                type: e.type,
                start: e.start,
            }));

        // Recent activity — mix of jobs, invoices, clients
        const recentJobs = [...jobs]
            .sort((a, b) => b._creationTime - a._creationTime)
            .slice(0, 3)
            .map((j) => ({
                id: j._id as string,
                title: j.title,
                subtitle: `${j.instrumentType}${j.instrumentBrand ? ` · ${j.instrumentBrand}` : ""} — ${clientMap.get(j.clientId as string) ?? "Unknown"}`,
                time: j._creationTime,
                type: "job" as const,
                href: `/dashboard/jobs/${j._id}`,
            }));

        const recentInvoices = [...invoices]
            .sort((a, b) => b._creationTime - a._creationTime)
            .slice(0, 3)
            .map((inv) => ({
                id: inv._id as string,
                title: `Invoice #${inv.invoiceNumber}`,
                subtitle: inv.status === "paid" ? "Marked as paid" : "Invoice created",
                time: inv._creationTime,
                type: "invoice" as const,
                href: `/dashboard/invoices/${inv._id}`,
            }));

        const recentClients = [...clients]
            .sort((a, b) => b._creationTime - a._creationTime)
            .slice(0, 2)
            .map((c) => ({
                id: c._id as string,
                title: c.name,
                subtitle: "New client added",
                time: c._creationTime,
                type: "client" as const,
                href: `/dashboard/clients/${c._id}`,
            }));

        const recentActivity = [...recentJobs, ...recentInvoices, ...recentClients]
            .sort((a, b) => b.time - a.time)
            .slice(0, 6);

        return {
            stats: {
                openJobs: openJobs.length,
                readyForPickup: readyJobs.length,
                pendingAmount,
                totalClients: clients.length,
                totalInvoiced,
                jobBreakdown: {
                    intake: intakeJobs.length,
                    in_progress: inProgressJobs.length,
                    waiting_parts: waitingPartsJobs.length,
                    ready: readyJobs.length,
                },
            },
            activeJobs,
            upcomingDeadlines,
            upcomingEvents,
            recentActivity,
        };
    },
});
