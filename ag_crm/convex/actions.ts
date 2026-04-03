import { action } from "./_generated/server";
import { v } from "convex/values";
import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Fetch Supplier Info Action
 *
 * Given a supplier website URL, fetches the page HTML, condenses it,
 * and uses Gemini to extract name, email, phone, street, city, postcode.
 */
/** Fetch a URL and return its HTML, or null on failure */
async function fetchHtml(url: string): Promise<string | null> {
    try {
        const res = await fetch(url, {
            headers: { "User-Agent": "Mozilla/5.0 (compatible; CRM-bot/1.0)" },
            signal: AbortSignal.timeout(8_000),
        });
        if (!res.ok) return null;
        return await res.text();
    } catch {
        return null;
    }
}

/** Pull JSON-LD blocks out of HTML before stripping scripts */
function extractJsonLd(html: string): string {
    const matches = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
    return matches.map(m => m[1].trim()).join("\n");
}

/** Strip HTML tags and collapse whitespace */
function stripHtml(html: string): string {
    return html
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .replace(/<style[\s\S]*?<\/style>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s{2,}/g, " ")
        .trim();
}

export const fetchSupplierInfo = action({
    args: { url: v.string() },
    handler: async (_ctx, { url }) => {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) throw new Error("GEMINI_API_KEY is not set");

        // 1. Fetch homepage, then also try /contact page for richer data
        const baseUrl = new URL(url).origin;
        const [homeHtml, contactHtml] = await Promise.all([
            fetchHtml(url),
            fetchHtml(`${baseUrl}/contact`),
        ]);

        if (!homeHtml) throw new Error(`Could not fetch ${url}`);

        // 2. Build condensed content: JSON-LD first (highest signal), then visible text
        const jsonLd = [extractJsonLd(homeHtml), contactHtml ? extractJsonLd(contactHtml) : ""]
            .filter(Boolean).join("\n").slice(0, 2000);

        const visibleText = [
            stripHtml(homeHtml).slice(0, 2000),
            contactHtml ? stripHtml(contactHtml).slice(0, 2000) : "",
        ].filter(Boolean).join("\n---\n");

        const content = [
            jsonLd ? `=== Structured Data (JSON-LD) ===\n${jsonLd}` : "",
            `=== Page Text ===\n${visibleText}`,
        ].filter(Boolean).join("\n\n");

        // 3. Ask Gemini to extract all contact fields
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

        const prompt = `
Extract supplier contact information from the following website content.
Return ONLY a raw JSON object (no markdown, no code fences) with exactly these keys:
{
  "name": "company or business name",
  "email": "primary contact email, or empty string",
  "phone": "primary phone number, or empty string",
  "street": "street address line, or empty string",
  "city": "city name, or empty string",
  "postcode": "postcode or zip code, or empty string"
}
Prefer data from the JSON-LD structured data section when available.
If a field cannot be determined, use an empty string. Never invent data.

${content}
        `.trim();

        const result = await model.generateContent(prompt);
        const raw = result.response.text().replace(/```json/g, "").replace(/```/g, "").trim();
        return JSON.parse(raw) as {
            name: string;
            email: string;
            phone: string;
            street: string;
            city: string;
            postcode: string;
        };
    },
});

/**
 * Helper to convert ArrayBuffer to base64 string
 */
function arrayBufferToBase64(buffer: ArrayBuffer) {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

/**
 * Smart Extraction Action
 * 
 * Uses Google Gemini 1.5 Flash to extract order details from uploaded files.
 */
export const smartExtract = action({
    args: { storageId: v.id("_storage") },
    handler: async (ctx, args) => {
        console.log("Starting smart extract for storageId:", args.storageId);
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error("GEMINI_API_KEY is missing");
            throw new Error("GEMINI_API_KEY is not set in environment variables");
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const modelName = "gemini-flash-latest";
        
        console.log(`Starting extraction with model: ${modelName}`);
        
        try {
            const model = genAI.getGenerativeModel({ model: modelName });

            // 1. Get the file from Convex storage
            const fileContent = await ctx.storage.get(args.storageId);
            if (!fileContent) throw new Error("File not found in storage");

            // 2. Prepare the file for Gemini
            const buffer = await fileContent.arrayBuffer();
            const base64Data = arrayBufferToBase64(buffer);
            
            let mimeType = fileContent.type;
            if (!mimeType || mimeType === "application/octet-stream") {
                mimeType = "application/pdf"; 
            }

            const prompt = `
                Analyze this invoice/receipt and extract the following details in a strict JSON format:
                {
                    "orderNumber": "string (order ID or invoice number)",
                    "date": number (timestamp in milliseconds),
                    "items": [
                        {
                            "name": "string (The item number, product ID, or short code - e.g. '432175' or '10')",
                            "description": "string (The full descriptive name of the item - e.g. 'Floyd Rose Original Arm Coupling Kit')",
                            "remark": "string (any extra notes or references found for this specific line item)",
                            "amount": number,
                            "unitPrice": number
                        }
                    ],
                    "totalAmount": number
                }
                
                IMPORTANT: 
                1. Distinguish between the short item ID/Number and the long descriptive name.
                2. Put the ID/Number in "name" and the full text in "description".
                3. Return ONLY the raw JSON object. Do not include markdown blocks.
            `;

            const result = await model.generateContent([
                prompt,
                {
                    inlineData: {
                        data: base64Data,
                        mimeType: mimeType
                    }
                }
            ]);

            const response = await result.response;
            const text = response.text();
            console.log(`Success with ${modelName}!`);

            const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
            return JSON.parse(cleanJson);
        } catch (error: any) {
            const errorMsg = error.message || String(error);
            console.error(`AI Extraction failed for ${modelName}:`, errorMsg);
            
            if (errorMsg.includes("429")) {
                throw new Error("Gemini API rate limit hit. Please wait 60 seconds and try again.");
            }
            if (errorMsg.includes("API_KEY_INVALID") || errorMsg.includes("403")) {
                throw new Error("Invalid API Key. Please check your Gemini API key permissions.");
            }
            throw new Error(`AI extraction failed: ${errorMsg}`);
        }
    },
});
