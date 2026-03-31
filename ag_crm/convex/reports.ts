import { query } from "./_generated/server";

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export const getData = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return null;
        const userId = identity.tokenIdentifier;

        const [invoices, jobs, clients] = await Promise.all([
            ctx.db.query("invoices").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
            ctx.db.query("jobs").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
            ctx.db.query("clients").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
        ]);

        const clientMap = new Map(clients.map((c) => [c._id as string, c.name]));

        // ── Invoice stats ──────────────────────────────────────────────────
        const paidInvoices = invoices.filter((i) => i.status === "paid");
        const pendingInvoices = invoices.filter((i) => i.status === "pending");
        const totalRevenue = paidInvoices.reduce((s, i) => s + i.amount, 0);
        const pendingRevenue = pendingInvoices.reduce((s, i) => s + i.amount, 0);
        const avgInvoiceValue = paidInvoices.length > 0 ? totalRevenue / paidInvoices.length : 0;

        // ── Job stats ──────────────────────────────────────────────────────
        const completedJobs = jobs.filter((j) => j.completionDate && j.intakeDate);
        const avgTurnaround = completedJobs.length > 0
            ? completedJobs.reduce((s, j) => s + (j.completionDate! - j.intakeDate) / 86_400_000, 0) / completedJobs.length
            : 0;

        // ── Last 12 months grid ────────────────────────────────────────────
        const now = new Date();
        const last12 = Array.from({ length: 12 }, (_, i) => {
            const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
            return { year: d.getFullYear(), month: d.getMonth(), label: MONTH_NAMES[d.getMonth()] };
        });

        const monthlyRevenue = last12.map(({ year, month, label }) => {
            const amount = paidInvoices
                .filter((inv) => {
                    const d = new Date((inv as any).paidAt ?? inv.date);
                    return d.getFullYear() === year && d.getMonth() === month;
                })
                .reduce((s, inv) => s + inv.amount, 0);
            return { label, year, month, amount };
        });

        const monthlyJobs = last12.map(({ year, month, label }) => {
            const count = jobs.filter((j) => {
                const d = new Date(j.intakeDate);
                return d.getFullYear() === year && d.getMonth() === month;
            }).length;
            return { label, year, month, count };
        });

        // ── Top services from work items ───────────────────────────────────
        const svcMap = new Map<string, { count: number; revenue: number }>();
        jobs.forEach((job) => {
            (job.workItems ?? []).forEach((wi) => {
                const total = wi.type === "hourly" ? wi.unitPrice * (wi.hours ?? 1) : wi.unitPrice;
                const prev = svcMap.get(wi.name) ?? { count: 0, revenue: 0 };
                svcMap.set(wi.name, { count: prev.count + 1, revenue: prev.revenue + total });
            });
        });
        const topServices = Array.from(svcMap.entries())
            .map(([name, d]) => ({ name, ...d }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 8);

        // ── Top clients by revenue ─────────────────────────────────────────
        const clientStats = new Map<string, { revenue: number; jobCount: number }>();
        paidInvoices.forEach((inv) => {
            const cid = inv.clientId as string;
            const prev = clientStats.get(cid) ?? { revenue: 0, jobCount: 0 };
            clientStats.set(cid, { revenue: prev.revenue + inv.amount, jobCount: prev.jobCount });
        });
        jobs.forEach((job) => {
            const cid = job.clientId as string;
            const prev = clientStats.get(cid) ?? { revenue: 0, jobCount: 0 };
            clientStats.set(cid, { ...prev, jobCount: prev.jobCount + 1 });
        });
        const topClients = Array.from(clientStats.entries())
            .map(([clientId, d]) => ({ clientId, name: clientMap.get(clientId) ?? "Unknown", ...d }))
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 6);

        // ── Status breakdown ───────────────────────────────────────────────
        const statusBreakdown: Record<string, number> = {};
        jobs.forEach((j) => {
            statusBreakdown[j.status] = (statusBreakdown[j.status] ?? 0) + 1;
        });

        // ── This month / last month revenue ────────────────────────────────
        const thisMonth = paidInvoices
            .filter((i) => {
                const d = new Date((i as any).paidAt ?? i.date);
                return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
            })
            .reduce((s, i) => s + i.amount, 0);

        const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonth = paidInvoices
            .filter((i) => {
                const d = new Date((i as any).paidAt ?? i.date);
                return d.getFullYear() === lastMonthDate.getFullYear() && d.getMonth() === lastMonthDate.getMonth();
            })
            .reduce((s, i) => s + i.amount, 0);

        return {
            summary: {
                totalRevenue,
                pendingRevenue,
                avgInvoiceValue,
                avgTurnaround,
                totalJobs: jobs.length,
                openJobs: jobs.filter((j) => j.status !== "closed").length,
                paidCount: paidInvoices.length,
                thisMonthRevenue: thisMonth,
                lastMonthRevenue: lastMonth,
            },
            monthlyRevenue,
            monthlyJobs,
            topServices,
            topClients,
            statusBreakdown,
        };
    },
});
