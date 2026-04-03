import { mutation } from "./_generated/server";
import { v } from "convex/values";

// Public mutation — no auth required. Creates a draft job from the intake form.
export const submitRequest = mutation({
    args: {
        name: v.string(),
        email: v.string(),
        phone: v.optional(v.string()),
        instrumentType: v.string(),
        description: v.string(),
    },
    handler: async (ctx, args) => {
        const { name, email, phone, instrumentType, description } = args;

        // Find the shop owner via the single settings record
        const settings = await ctx.db.query("settings").first();
        if (!settings) throw new Error("Shop not configured yet.");

        const userId = settings.userId;

        // Check for existing client with same email under this owner
        const allClients = await ctx.db
            .query("clients")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .collect();

        let client = allClients.find((c) => c.email.toLowerCase() === email.toLowerCase()) ?? null;

        if (!client) {
            const clientId = await ctx.db.insert("clients", {
                userId,
                name,
                email,
                phone: phone ?? undefined,
                type: "individual",
            });
            client = await ctx.db.get(clientId);
        }

        if (!client) throw new Error("Failed to create client.");

        await ctx.db.insert("jobs", {
            userId,
            clientId: client._id,
            title: `Intake request – ${instrumentType}`,
            description,
            status: "quoted",
            instrumentType,
            intakeDate: Date.now(),
        });

        return { success: true };
    },
});
