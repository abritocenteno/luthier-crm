import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    users: defineTable({
        name: v.optional(v.string()),
        email: v.optional(v.string()),
        image: v.optional(v.string()),
        tokenIdentifier: v.string(),
    }).index("by_token", ["tokenIdentifier"]),
    clients: defineTable({
        name: v.string(),
        email: v.string(),
        type: v.string(), // 'regular' | 'store'
        imageUrl: v.optional(v.string()),
        imageStorageId: v.optional(v.id("_storage")),
        phone: v.optional(v.string()),
        website: v.optional(v.string()),
        street: v.optional(v.string()),
        postcode: v.optional(v.string()),
        city: v.optional(v.string()),
        userId: v.string(), // tokenIdentifier of the owner
    }).index("by_user", ["userId"]),
    invoices: defineTable({
        clientId: v.id("clients"),
        invoiceNumber: v.string(),
        date: v.number(),
        amount: v.number(),
        status: v.string(), // 'paid' | 'pending' | 'overdue'
        paymentMethod: v.optional(v.string()), // 'Cash' | 'iDeal/Wero'
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
        paidAt: v.optional(v.number()),
        userId: v.string(),
    })
        .index("by_client", ["clientId"])
        .index("by_user", ["userId"]),
    suppliers: defineTable({
        name: v.string(),
        email: v.string(),
        type: v.string(), // 'regular' | 'distributor'
        imageUrl: v.optional(v.string()),
        imageStorageId: v.optional(v.id("_storage")),
        phone: v.optional(v.string()),
        website: v.optional(v.string()),
        street: v.optional(v.string()),
        postcode: v.optional(v.string()),
        city: v.optional(v.string()),
        userId: v.string(), // tokenIdentifier of the owner
    }).index("by_user", ["userId"]),
    settings: defineTable({
        userId: v.string(), // tokenIdentifier of the owner
        companyName: v.string(),
        addressLine1: v.string(),
        addressLine2: v.string(),
        contactEmail: v.string(),
        phone: v.optional(v.string()),
        website: v.optional(v.string()),
        kvkNumber: v.optional(v.string()),
        btwNumber: v.optional(v.string()),
        bankAccounts: v.optional(v.string()),
        logoStorageId: v.optional(v.id("_storage")),
        language: v.optional(v.string()),
        currency: v.optional(v.string()),
    }).index("by_user", ["userId"]),
    events: defineTable({
        title: v.string(),
        description: v.optional(v.string()),
        start: v.number(), // timestamp
        end: v.optional(v.number()), // timestamp
        type: v.string(), // 'appointment' | 'supplier_order'
        clientId: v.optional(v.id("clients")),
        supplierId: v.optional(v.id("suppliers")),
        userId: v.string(), // tokenIdentifier of the owner
    })
        .index("by_user", ["userId"])
        .index("by_client", ["clientId"])
        .index("by_supplier", ["supplierId"]),
    orders: defineTable({
        supplierId: v.id("suppliers"),
        orderNumber: v.string(),
        date: v.number(),
        amount: v.number(),
        status: v.string(), // 'pending' | 'paid' | 'cancelled'
        items: v.optional(v.array(v.object({
            name: v.string(),
            description: v.string(),
            remark: v.string(),
            amount: v.number(),
            unitPrice: v.number(),
        }))),
        invoiceStorageId: v.optional(v.id("_storage")),
        userId: v.string(),
    })
        .index("by_supplier", ["supplierId"])
        .index("by_user", ["userId"]),
    services: defineTable({
        userId: v.string(),
        name: v.string(),
        description: v.optional(v.string()),
        type: v.string(), // 'fixed' | 'hourly'
        defaultPrice: v.number(),
    }).index("by_user", ["userId"]),
    jobs: defineTable({
        userId: v.string(),
        clientId: v.id("clients"),
        title: v.string(),
        description: v.optional(v.string()),
        status: v.string(), // 'intake' | 'in_progress' | 'waiting_parts' | 'ready' | 'closed'
        // Instrument details
        instrumentType: v.string(),
        instrumentBrand: v.optional(v.string()),
        instrumentModel: v.optional(v.string()),
        instrumentSerial: v.optional(v.string()),
        instrumentColor: v.optional(v.string()),
        // Intake condition checklist
        intakeChecklist: v.optional(v.object({
            tuners: v.optional(v.string()),      // 'good' | 'fair' | 'poor'
            frets: v.optional(v.string()),
            nut: v.optional(v.string()),
            bridge: v.optional(v.string()),
            neck: v.optional(v.string()),
            body: v.optional(v.string()),
            electronics: v.optional(v.string()),
            notes: v.optional(v.string()),
        })),
        // Work items (services to be performed)
        workItems: v.optional(v.array(v.object({
            name: v.string(),
            description: v.optional(v.string()),
            type: v.string(), // 'fixed' | 'hourly'
            unitPrice: v.number(), // fixed price OR hourly rate
            hours: v.optional(v.number()), // for hourly items
        }))),
        // Dates
        intakeDate: v.number(),
        estimatedCompletionDate: v.optional(v.number()),
        completionDate: v.optional(v.number()),
        // Links
        orderIds: v.optional(v.array(v.id("orders"))),
        invoiceId: v.optional(v.id("invoices")),
        // Internal notes
        internalNotes: v.optional(v.string()),
        // Quote
        sentQuoteAt: v.optional(v.number()),
        // Photos (before/after)
        photoIds: v.optional(v.array(v.id("_storage"))),
    })
        .index("by_user", ["userId"])
        .index("by_client", ["clientId"]),
    contacts: defineTable({
        name: v.string(),
        email: v.optional(v.string()),
        phone: v.optional(v.string()),
        role: v.optional(v.string()),
        imageStorageId: v.optional(v.id("_storage")),
        clientId: v.optional(v.id("clients")),
        supplierId: v.optional(v.id("suppliers")),
        userId: v.string(),
    })
        .index("by_user", ["userId"])
        .index("by_client", ["clientId"])
        .index("by_supplier", ["supplierId"]),
});
