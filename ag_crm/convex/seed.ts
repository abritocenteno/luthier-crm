import { mutation } from "./_generated/server";

// Run with: npx convex run seed:populate
// Clear with: npx convex run seed:clear

export const populate = mutation({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");
        const userId = identity.tokenIdentifier;

        const now = Date.now();
        const day = 86400000;

        // ── Clients ──────────────────────────────────────────────────────────
        const jamesId = await ctx.db.insert("clients", {
            userId,
            name: "James Morrison",
            email: "james.morrison@gmail.com",
            phone: "+31 6 12 34 56 78",
            type: "regular",
        });

        const lisaId = await ctx.db.insert("clients", {
            userId,
            name: "Lisa van den Berg",
            email: "lisa.vdberg@hotmail.com",
            phone: "+31 6 98 76 54 32",
            type: "regular",
        });

        const thomasId = await ctx.db.insert("clients", {
            userId,
            name: "Thomas Bakker",
            email: "t.bakker@outlook.com",
            phone: "+31 6 55 44 33 22",
            type: "regular",
        });

        const muziekhoekId = await ctx.db.insert("clients", {
            userId,
            name: "De Muziekhoek",
            email: "info@demuziekhoek.nl",
            phone: "+31 20 123 45 67",
            type: "store",
            website: "www.demuziekhoek.nl",
        });

        // ── Suppliers ─────────────────────────────────────────────────────────
        const stewmacId = await ctx.db.insert("suppliers", {
            userId,
            name: "StewMac",
            email: "orders@stewmac.com",
            type: "distributor",
            website: "www.stewmac.com",
        });

        const göldobId = await ctx.db.insert("suppliers", {
            userId,
            name: "Göldo Music",
            email: "info@goeldo.de",
            type: "distributor",
            website: "www.goeldo.de",
        });

        // ── Supplier Orders ───────────────────────────────────────────────────
        const orderStewmac = await ctx.db.insert("orders", {
            userId,
            supplierId: stewmacId,
            orderNumber: "SM-2024-0341",
            date: now - 14 * day,
            amount: 87.50,
            status: "paid",
            items: [
                { name: "Fretwire 6150 Stainless (18\" pkg)", description: "Narrow jumbo SS fretwire", remark: "", amount: 2, unitPrice: 28.50 },
                { name: "Nut Blank — Bone (Guitar)", description: "Pre-slotted bone nut", remark: "", amount: 3, unitPrice: 10.17 },
            ],
        });

        const orderGoldo = await ctx.db.insert("orders", {
            userId,
            supplierId: göldobId,
            orderNumber: "GD-88773036",
            date: now - 7 * day,
            amount: 54.20,
            status: "pending",
            items: [
                { name: "Pickup — Humbucker Alnico II Bridge", description: "Warm vintage-voiced bridge humbucker", remark: "", amount: 1, unitPrice: 38.50 },
                { name: "Göldo Screws for Bass Pickups SC 4er Pack", description: "Screw for Bass Pickups Size 2,5x35mm, Finish Nickel, 4 pcs", remark: "", amount: 2, unitPrice: 2.90 },
                { name: "MusicNomad Tri-Beam Straight Edge", description: "3 in 1 precision straight edge", remark: "", amount: 1, unitPrice: 9.90 },
            ],
        });

        // ── Jobs ──────────────────────────────────────────────────────────────

        // 1. Closed — Gibson ES-335 Setup (James) — with invoice
        const job1Id = await ctx.db.insert("jobs", {
            userId,
            clientId: jamesId,
            title: "Gibson ES-335 Full Setup",
            status: "closed",
            instrumentType: "Guitar",
            instrumentBrand: "Gibson",
            instrumentModel: "ES-335",
            instrumentColor: "Cherry",
            intakeDate: now - 21 * day,
            completionDate: now - 14 * day,
            intakeChecklist: { tuners: "fair", frets: "good", nut: "fair", bridge: "good", neck: "good", body: "good", electronics: "good", notes: "Tuners a bit stiff, nut slots slightly shallow." },
            workItems: [
                { name: "Full Setup", description: "Truss rod, action, intonation", type: "fixed", unitPrice: 85 },
                { name: "New Bone Nut", description: "Supply and fit bone nut", type: "fixed", unitPrice: 100 },
                { name: "String Installation", description: "D'Addario EXL110 — labour only", type: "fixed", unitPrice: 10 },
            ],
            orderIds: [orderStewmac],
        });

        const inv1Id = await ctx.db.insert("invoices", {
            userId,
            clientId: jamesId,
            invoiceNumber: "INV-2024-0089",
            date: now - 14 * day,
            amount: 195,
            status: "paid",
            paidAt: now - 13 * day,
            paymentMethod: "iDeal/Wero",
            items: [
                { name: "Full Setup", description: "Truss rod, action, intonation", remark: "", amount: 1, unitPrice: 85 },
                { name: "New Bone Nut", description: "Supply and fit bone nut", remark: "", amount: 1, unitPrice: 100 },
                { name: "String Installation", description: "Labour only", remark: "", amount: 1, unitPrice: 10 },
            ],
            orderIds: [orderStewmac],
        });

        await ctx.db.patch(job1Id, { invoiceId: inv1Id });

        // 2. Ready for pickup — Fender Stratocaster Refret (Lisa)
        await ctx.db.insert("jobs", {
            userId,
            clientId: lisaId,
            title: "Fender Strat Refret",
            status: "ready",
            instrumentType: "Guitar",
            instrumentBrand: "Fender",
            instrumentModel: "Stratocaster",
            instrumentColor: "Sunburst",
            intakeDate: now - 10 * day,
            estimatedCompletionDate: now - 2 * day,
            completionDate: now - 2 * day,
            intakeChecklist: { tuners: "good", frets: "poor", nut: "fair", bridge: "good", neck: "good", body: "good", electronics: "good", notes: "Frets heavily worn on first 5 positions." },
            workItems: [
                { name: "Full Refret", description: "Complete refret with 6150 SS fretwire, fret level and setup", type: "fixed", unitPrice: 280 },
                { name: "Fret Polish", description: "Final polish after refret", type: "fixed", unitPrice: 45 },
            ],
            orderIds: [orderStewmac],
        });

        // 3. In Progress — Telecaster Wiring (Thomas)
        await ctx.db.insert("jobs", {
            userId,
            clientId: thomasId,
            title: "Telecaster Pickup & Wiring",
            status: "in_progress",
            instrumentType: "Guitar",
            instrumentBrand: "Fender",
            instrumentModel: "Telecaster",
            instrumentColor: "Butterscotch Blonde",
            intakeDate: now - 5 * day,
            estimatedCompletionDate: now + 3 * day,
            intakeChecklist: { tuners: "good", frets: "good", nut: "good", bridge: "good", neck: "good", body: "fair", electronics: "poor", notes: "Neck pickup cutting out intermittently. Crackling on volume pot." },
            workItems: [
                { name: "Pickup Installation", description: "Install Göldo humbucker bridge pickup", type: "fixed", unitPrice: 40 },
                { name: "Potmeter Replacement", description: "Replace volume pot", type: "fixed", unitPrice: 35 },
                { name: "Complete Wiring", description: "Full rewire while open", type: "fixed", unitPrice: 90 },
            ],
            orderIds: [orderGoldo],
        });

        // 4. Waiting for parts — Acoustic Crack Repair (De Muziekhoek)
        await ctx.db.insert("jobs", {
            userId,
            clientId: muziekhoekId,
            title: "Martin D-28 Crack Repair",
            status: "waiting_parts",
            instrumentType: "Guitar",
            instrumentBrand: "Martin",
            instrumentModel: "D-28",
            intakeDate: now - 8 * day,
            estimatedCompletionDate: now + 7 * day,
            intakeChecklist: { tuners: "good", frets: "good", nut: "good", bridge: "fair", neck: "good", body: "poor", electronics: "good", notes: "Hairline crack on lower bout, top seam lifting near endblock." },
            workItems: [
                { name: "Crack Repair", description: "Structural crack repair + finish touch-up", type: "fixed", unitPrice: 120 },
                { name: "Bridge Reglue (Acoustic)", description: "Reglue lifting bridge", type: "fixed", unitPrice: 120 },
            ],
            internalNotes: "Waiting on Titebond and mahogany binding strip from StewMac.",
        });

        // 5. Intake — Bass Setup (Lisa)
        await ctx.db.insert("jobs", {
            userId,
            clientId: lisaId,
            title: "Jazz Bass Setup",
            status: "intake",
            instrumentType: "Bass",
            instrumentBrand: "Fender",
            instrumentModel: "Jazz Bass",
            instrumentColor: "Olympic White",
            intakeDate: now,
            estimatedCompletionDate: now + 5 * day,
            intakeChecklist: { tuners: "good", frets: "fair", nut: "good", bridge: "good", neck: "fair", body: "good", electronics: "fair", notes: "Neck relief needs adjustment, slight buzz on G string above 12th fret." },
            workItems: [
                { name: "Full Setup", description: "Truss rod, action, intonation", type: "fixed", unitPrice: 85 },
                { name: "5/6-String Bass Surcharge", description: "N/A — 4 string", type: "fixed", unitPrice: 0 },
                { name: "String Installation", description: "Labour only", type: "fixed", unitPrice: 10 },
            ],
        });

        // 6. Quoted — Acoustic neck reset (De Muziekhoek)
        await ctx.db.insert("jobs", {
            userId,
            clientId: muziekhoekId,
            title: "Taylor 814ce Neck Reset",
            status: "quoted",
            instrumentType: "Guitar",
            instrumentBrand: "Taylor",
            instrumentModel: "814ce",
            intakeDate: now - 2 * day,
            intakeChecklist: { tuners: "good", frets: "good", nut: "good", bridge: "poor", neck: "poor", body: "good", electronics: "good", notes: "Action very high at 12th fret. Bridge saddle fully lowered. Classic neck reset candidate." },
            workItems: [
                { name: "Neck Reset (Acoustic)", description: "Full acoustic neck reset", type: "fixed", unitPrice: 300 },
                { name: "Full Setup", description: "Setup after reset", type: "fixed", unitPrice: 85 },
            ],
        });

        // ── Pending invoice — Strat Refret (Lisa) ────────────────────────────
        await ctx.db.insert("invoices", {
            userId,
            clientId: lisaId,
            invoiceNumber: "INV-2024-0090",
            date: now - 2 * day,
            amount: 325,
            status: "pending",
            items: [
                { name: "Full Refret", description: "Complete refret with 6150 SS fretwire", remark: "", amount: 1, unitPrice: 280 },
                { name: "Fret Polish", description: "Final polish", remark: "", amount: 1, unitPrice: 45 },
            ],
            orderIds: [orderStewmac],
        });

        // ── Parts inventory ───────────────────────────────────────────────────
        await ctx.db.insert("parts", { userId, name: "Fretwire 6150 Stainless (18\")", category: "Fretwork", quantity: 8, unitCost: 14.25, reorderThreshold: 4, supplier: "StewMac" });
        await ctx.db.insert("parts", { userId, name: "Bone Nut Blank — Guitar", category: "Nut & Saddle", quantity: 5, unitCost: 10.17, reorderThreshold: 3, supplier: "StewMac" });
        await ctx.db.insert("parts", { userId, name: "Bone Nut Blank — Bass", category: "Nut & Saddle", quantity: 2, unitCost: 12.50, reorderThreshold: 3, supplier: "StewMac" });
        await ctx.db.insert("parts", { userId, name: "Humbucker — Alnico II Bridge", category: "Electronics", quantity: 1, unitCost: 38.50, reorderThreshold: 1, supplier: "Göldo Music" });
        await ctx.db.insert("parts", { userId, name: "CTS 500K Volume Pot", category: "Electronics", quantity: 6, unitCost: 4.20, reorderThreshold: 4, supplier: "Göldo Music" });
        await ctx.db.insert("parts", { userId, name: "Switchcraft Output Jack", category: "Electronics", quantity: 4, unitCost: 3.80, reorderThreshold: 3, supplier: "Göldo Music" });
        await ctx.db.insert("parts", { userId, name: "D'Addario EXL110 (.010–.046)", category: "Strings", quantity: 12, unitCost: 6.50, reorderThreshold: 6, supplier: "StewMac" });
        await ctx.db.insert("parts", { userId, name: "D'Addario EXL160 Bass (.050–.105)", category: "Strings", quantity: 3, unitCost: 9.80, reorderThreshold: 4, supplier: "StewMac" });
        await ctx.db.insert("parts", { userId, name: "Titebond Original Wood Glue (8oz)", category: "Consumables", quantity: 2, unitCost: 7.90, reorderThreshold: 2, supplier: "StewMac" });
        await ctx.db.insert("parts", { userId, name: "Strap Button Screws (pack of 12)", category: "Hardware", quantity: 3, unitCost: 2.10, reorderThreshold: 2, supplier: "Göldo Music" });

        return "✅ Demo data populated successfully!";
    },
});

// Clears ALL data for the current user — use to clean up after the demo
export const clear = mutation({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");
        const userId = identity.tokenIdentifier;

        const tables = ["jobs", "invoices", "orders", "clients", "suppliers", "parts"] as const;
        for (const table of tables) {
            const rows = await ctx.db.query(table as any).withIndex("by_user", (q: any) => q.eq("userId", userId)).collect();
            for (const row of rows) await ctx.db.delete(row._id);
        }

        return "🗑️ Demo data cleared.";
    },
});
