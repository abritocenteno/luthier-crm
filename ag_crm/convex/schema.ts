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
        invoiceStorageId: v.optional(v.id("_storage")),
        orderIds: v.optional(v.array(v.id("orders"))),
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
