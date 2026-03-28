import { query } from "./_generated/server";
import { v } from "convex/values";

export const getStats = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return {
                stats: [],
                recentActivity: [],
            };
        }

        const userId = identity.tokenIdentifier;

        // 1. Fetch counts
        const clients = await ctx.db
            .query("clients")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .collect();

        const suppliers = await ctx.db
            .query("suppliers")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .collect();

        const invoices = await ctx.db
            .query("invoices")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .collect();

        const orders = await ctx.db
            .query("orders")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .collect();

        const events = await ctx.db
            .query("events")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .collect();

        // 2. Calculate totals
        const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.amount, 0);
        const pendingPayment = invoices
            .filter((inv) => inv.status === "pending")
            .reduce((sum, inv) => sum + inv.amount, 0);

        const totalOrders = orders.reduce((sum, order) => sum + order.amount, 0);

        // 3. Aggregate Recent Activity (last 5 items across all tables)
        const recentInvoices = invoices
            .sort((a, b) => b._creationTime - a._creationTime)
            .slice(0, 5)
            .map((inv) => ({
                id: inv._id,
                title: `Invoice #${inv.invoiceNumber}`,
                subtitle: inv.status === 'paid' ? 'Marked as paid' : 'New invoice created',
                time: inv._creationTime,
                type: "invoice",
            }));

        const recentOrders = orders
            .sort((a, b) => b._creationTime - a._creationTime)
            .slice(0, 5)
            .map((o) => ({
                id: o._id,
                title: `Order #${o.orderNumber}`,
                subtitle: `New supplier order placed`,
                time: o._creationTime,
                type: "order",
            }));

        const recentClients = clients
            .sort((a, b) => b._creationTime - a._creationTime)
            .slice(0, 5)
            .map((c) => ({
                id: c._id,
                title: c.name,
                subtitle: "New client registered",
                time: c._creationTime,
                type: "client",
            }));

        const recentEvents = events
            .sort((a, b) => b._creationTime - a._creationTime)
            .slice(0, 5)
            .map((e) => ({
                id: e._id,
                title: e.title,
                subtitle: e.type === "appointment" ? "Scheduled appointment" : "Supplier order expected",
                time: e._creationTime,
                type: "event",
            }));

        const combinedActivity = [
            ...recentInvoices,
            ...recentOrders,
            ...recentClients,
            ...recentEvents,
        ]
            .sort((a, b) => b.time - a.time)
            .slice(0, 5);

        return {
            stats: [
                { label: 'Total Clients', value: clients.length.toString(), type: 'clients', trend: null },
                { label: 'Suppliers', value: suppliers.length.toString(), type: 'suppliers', trend: null },
                { label: 'Total Invoiced', value: totalInvoiced, type: 'invoiced', trend: null },
                { label: 'Supplier Orders', value: totalOrders, type: 'orders', trend: null },
                { label: 'Pending Invoices', value: pendingPayment, type: 'pending' },
            ],
            recentActivity: combinedActivity,
        };
    },
});
