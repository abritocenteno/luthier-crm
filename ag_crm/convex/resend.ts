import { v } from "convex/values";
import { action } from "./_generated/server";
import { Resend } from "resend";
import { api } from "./_generated/api";
import { Id } from "./_generated/dataModel";

function replaceVars(template: string, vars: Record<string, string>): string {
    return Object.entries(vars).reduce((str, [k, v]) => str.replaceAll(`{{${k}}}`, v), template);
}

export const sendIntakeNotificationEmail = action({
    args: {
        ownerEmail: v.string(),
        companyName: v.string(),
        clientName: v.string(),
        clientEmail: v.string(),
        clientPhone: v.string(),
        instrumentType: v.string(),
        description: v.string(),
        jobId: v.id("jobs"),
    },
    handler: async (ctx, args) => {
        const resendApiKey = process.env.RESEND_API_KEY;
        if (!resendApiKey) throw new Error("RESEND_API_KEY not set");

        const resend = new Resend(resendApiKey);

        const settings = await ctx.runQuery(api.settings.get);
        const senderName = settings?.emailSenderName || args.companyName;

        const html = `
            <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px 24px;color:#18181b;">
                <h2 style="font-size:22px;font-weight:900;margin:0 0 4px;">New Service Request 🎸</h2>
                <p style="color:#71717a;margin:0 0 32px;font-size:14px;">${args.companyName} — via intake form</p>

                <div style="background:#f4f4f5;border-radius:12px;padding:20px 24px;margin-bottom:24px;">
                    <p style="margin:0 0 12px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#71717a;">Client</p>
                    <p style="margin:0 0 4px;font-weight:700;font-size:16px;">${args.clientName}</p>
                    <p style="margin:0 0 2px;font-size:14px;color:#52525b;">${args.clientEmail}</p>
                    ${args.clientPhone ? `<p style="margin:0;font-size:14px;color:#52525b;">${args.clientPhone}</p>` : ""}
                </div>

                <div style="background:#f4f4f5;border-radius:12px;padding:20px 24px;margin-bottom:24px;">
                    <p style="margin:0 0 12px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#71717a;">Request</p>
                    <p style="margin:0 0 4px;font-weight:700;font-size:16px;">${args.instrumentType}</p>
                    <p style="margin:0;font-size:14px;color:#52525b;line-height:1.6;">${args.description}</p>
                </div>

                <hr style="border:none;border-top:1px solid #e4e4e7;margin:32px 0;" />
                <p style="margin:0;font-size:12px;color:#a1a1aa;">© ${new Date().getFullYear()} ${args.companyName}</p>
            </div>`;

        await resend.emails.send({
            from: `${senderName} <billing@thedotguitars.com>`,
            to: [args.ownerEmail],
            subject: `New request: ${args.instrumentType} — ${args.clientName}`,
            html,
            text: `New service request from ${args.clientName} (${args.clientEmail}${args.clientPhone ? `, ${args.clientPhone}` : ""}).\n\nInstrument: ${args.instrumentType}\n\n${args.description}`,
        });

        return { success: true };
    },
});

export const sendInvoiceEmail = action({
    args: {
        invoiceNumber: v.string(),
        clientName: v.string(),
        clientEmail: v.string(),
        replyToEmail: v.string(),
        pdfBase64: v.string(),
        companyName: v.optional(v.string()),
        extraAttachments: v.optional(v.array(v.object({
            filename: v.string(),
            content: v.string(),
        }))),
    },
    handler: async (ctx, args) => {
        const resendApiKey = process.env.RESEND_API_KEY;
        if (!resendApiKey) {
            throw new Error("RESEND_API_KEY environment variable not set");
        }

        const resend = new Resend(resendApiKey);
        const company = args.companyName || "Your repair shop";

        const settings = await ctx.runQuery(api.settings.get);
        const senderName = settings?.emailSenderName || args.companyName || "Your repair shop";

        const invoiceIntro = replaceVars(
            settings?.invoiceEmailIntro || "Please find your invoice attached to this email. If you have any questions, feel free to reply directly to this message.",
            { clientName: args.clientName, companyName: args.companyName || "Your repair shop", invoiceNumber: args.invoiceNumber }
        );

        try {
            const data = await resend.emails.send({
                from: `${senderName} <billing@thedotguitars.com>`,
                to: [args.clientEmail],
                replyTo: args.replyToEmail,
                subject: replaceVars(
                    settings?.invoiceEmailSubject || "Invoice {{invoiceNumber}} — {{companyName}}",
                    { invoiceNumber: args.invoiceNumber, companyName: args.companyName || "Your repair shop", clientName: args.clientName }
                ),
                text: `Dear ${args.clientName},\n\nPlease find attached invoice ${args.invoiceNumber} from ${company}.\n\nThank you for your business!\n\nBest regards,\n${company}`,
                html: `
                    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; color: #18181b;">
                        <h2 style="font-size: 22px; font-weight: 900; margin: 0 0 4px;">Invoice ${args.invoiceNumber}</h2>
                        <p style="color: #71717a; margin: 0 0 32px; font-size: 14px;">From ${company}</p>

                        <p style="margin: 0 0 16px;">Dear <strong>${args.clientName}</strong>,</p>
                        <p style="margin: 0 0 24px; line-height: 1.6;">
                            ${invoiceIntro}
                        </p>

                        <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 32px 0;" />
                        <p style="margin: 0; font-size: 12px; color: #a1a1aa;">
                            Thank you for your business! — © ${new Date().getFullYear()} ${company}
                        </p>
                    </div>
                `,
                attachments: [
                    {
                        filename: `Invoice_${args.invoiceNumber}.pdf`,
                        content: args.pdfBase64,
                    },
                    ...(args.extraAttachments || [])
                ],
            });

            console.log("Email sent successfully via Resend:", data);
            return { success: true, data };
        } catch (error: any) {
            console.error("Failed to send email via Resend:", error);
            throw new Error(`Failed to send email: ${error.message || String(error)}`);
        }
    },
});

export const sendOverdueReminderEmail = action({
    args: { invoiceId: v.id("invoices") },
    handler: async (ctx, { invoiceId }) => {
        const resendApiKey = process.env.RESEND_API_KEY;
        if (!resendApiKey) throw new Error("RESEND_API_KEY not set");

        const invoice = await ctx.runQuery(api.invoices.get, { id: invoiceId });
        if (!invoice) throw new Error("Invoice not found");

        const client = (invoice as any).client;
        if (!client?.email) throw new Error("Client has no email address on file");

        const settings = await ctx.runQuery(api.settings.get);
        const companyName = settings?.companyName ?? "Your repair shop";
        const contactEmail = settings?.contactEmail ?? "";
        const phone = settings?.phone ?? "";
        const bankAccounts = settings?.bankAccounts ?? "";

        const currency = settings?.currency ?? "EUR";
        const formatAmt = (n: number) => new Intl.NumberFormat("nl-NL", { style: "currency", currency }).format(n);
        const dueDate = new Date((invoice as any).date + 14 * 24 * 60 * 60 * 1000).toLocaleDateString("en-NL", { day: "numeric", month: "long", year: "numeric" });

        const senderName = settings?.emailSenderName || companyName;

        const overdueIntro = replaceVars(
            settings?.overdueEmailIntro || "We'd like to remind you that invoice {{invoiceNumber}} was due on {{dueDate}} and is still outstanding.",
            { invoiceNumber: (invoice as any).invoiceNumber, dueDate, clientName: client.name, companyName }
        );

        const resend = new Resend(resendApiKey);

        const html = `
            <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px 24px;color:#18181b;">
                <h2 style="font-size:22px;font-weight:900;margin:0 0 4px;">Payment reminder</h2>
                <p style="color:#71717a;margin:0 0 32px;font-size:14px;">From ${companyName}</p>

                <p style="margin:0 0 16px;">Dear <strong>${client.name}</strong>,</p>
                <p style="margin:0 0 24px;line-height:1.6;">
                    ${overdueIntro}
                </p>

                <div style="background:#fef3c7;border:1px solid #fde68a;border-radius:12px;padding:20px 24px;margin-bottom:24px;">
                    <p style="margin:0 0 6px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#92400e;">Amount Due</p>
                    <p style="margin:0;font-size:28px;font-weight:900;color:#92400e;">${formatAmt((invoice as any).amount)}</p>
                    <p style="margin:4px 0 0;font-size:12px;color:#b45309;">Invoice ${(invoice as any).invoiceNumber} · Due ${dueDate}</p>
                </div>

                ${bankAccounts ? `<p style="margin:0 0 16px;font-size:14px;color:#52525b;line-height:1.6;">Please arrange payment using the details below:<br><pre style="font-family:sans-serif;color:#18181b;">${bankAccounts}</pre></p>` : ""}

                <p style="margin:0 0 4px;font-size:14px;color:#52525b;">Questions? Contact us:</p>
                ${contactEmail ? `<p style="margin:0 0 2px;font-size:14px;"><a href="mailto:${contactEmail}" style="color:#18181b;">${contactEmail}</a></p>` : ""}
                ${phone ? `<p style="margin:0;font-size:14px;">${phone}</p>` : ""}

                <hr style="border:none;border-top:1px solid #e4e4e7;margin:32px 0;" />
                <p style="margin:0;font-size:12px;color:#a1a1aa;">© ${new Date().getFullYear()} ${companyName}</p>
            </div>`;

        await resend.emails.send({
            from: `${senderName} <billing@thedotguitars.com>`,
            to: [client.email],
            replyTo: contactEmail || undefined,
            subject: replaceVars(
                settings?.overdueEmailSubject || "Payment reminder: Invoice {{invoiceNumber}} — {{companyName}}",
                { invoiceNumber: (invoice as any).invoiceNumber, companyName, clientName: client.name }
            ),
            html,
            text: `Dear ${client.name},\n\nThis is a reminder that invoice ${(invoice as any).invoiceNumber} (${formatAmt((invoice as any).amount)}) was due on ${dueDate} and is still outstanding.\n\n${bankAccounts ? `Payment details:\n${bankAccounts}\n\n` : ""}${contactEmail ? `Contact: ${contactEmail}\n` : ""}${phone}\n\n${companyName}`,
        });

        return { success: true };
    },
});

export const sendQuoteEmail = action({
    args: { jobId: v.id("jobs") },
    handler: async (ctx, { jobId }) => {
        const resendApiKey = process.env.RESEND_API_KEY;
        if (!resendApiKey) throw new Error("RESEND_API_KEY not set");

        const job = await ctx.runQuery(api.jobs.get, { id: jobId });
        if (!job) throw new Error("Job not found");

        const client = (job as any).client;
        if (!client?.email) throw new Error("Client has no email address on file");

        const settings = await ctx.runQuery(api.settings.get);
        const companyName = settings?.companyName ?? "Your repair shop";
        const contactEmail = settings?.contactEmail ?? "";
        const phone = settings?.phone ?? "";

        const instrumentLabel = [(job as any).instrumentBrand, (job as any).instrumentModel, job.instrumentType]
            .filter(Boolean).join(" ");

        const workItems = (job as any).workItems ?? [];
        const workTotal = workItems.reduce((sum: number, wi: any) =>
            sum + (wi.type === "hourly" ? wi.unitPrice * (wi.hours ?? 1) : wi.unitPrice), 0);

        const currency = settings?.currency ?? "EUR";
        const formatAmt = (n: number) => new Intl.NumberFormat("nl-NL", { style: "currency", currency }).format(n);

        const senderName = settings?.emailSenderName || companyName;

        const quoteIntro = replaceVars(
            settings?.quoteEmailIntro || "Thank you for bringing in your {{instrumentType}}. Here's a quote for the work we discussed:",
            { instrumentType: instrumentLabel, clientName: client.name, companyName }
        );

        const itemRows = workItems.map((wi: any) => {
            const total = wi.type === "hourly" ? wi.unitPrice * (wi.hours ?? 1) : wi.unitPrice;
            const detail = wi.type === "hourly" ? `${wi.hours}h × ${formatAmt(wi.unitPrice)}/h` : "Fixed price";
            return `
                <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #f4f4f5;">
                        <strong style="display:block;">${wi.name}</strong>
                        ${wi.description ? `<span style="color:#71717a;font-size:13px;">${wi.description}</span>` : ""}
                        <span style="color:#a1a1aa;font-size:11px;">${detail}</span>
                    </td>
                    <td style="padding: 10px 0; border-bottom: 1px solid #f4f4f5; text-align:right; font-weight:700; white-space:nowrap;">
                        ${formatAmt(total)}
                    </td>
                </tr>`;
        }).join("");

        const resend = new Resend(resendApiKey);

        const html = `
            <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px 24px;color:#18181b;">
                <h2 style="font-size:22px;font-weight:900;margin:0 0 4px;">Quote for your ${instrumentLabel}</h2>
                <p style="color:#71717a;margin:0 0 32px;font-size:14px;">From ${companyName}</p>

                <p style="margin:0 0 16px;">Dear <strong>${client.name}</strong>,</p>
                <p style="margin:0 0 24px;line-height:1.6;">
                    ${quoteIntro}
                </p>

                <div style="background:#f4f4f5;border-radius:12px;padding:20px 24px;margin-bottom:24px;">
                    <p style="margin:0 0 12px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#71717a;">
                        ${job.title}
                    </p>
                    <table style="width:100%;border-collapse:collapse;">
                        ${itemRows || `<tr><td style="color:#71717a;font-size:14px;padding:8px 0;">No work items specified yet.</td></tr>`}
                        <tr>
                            <td style="padding:14px 0 0;font-weight:900;font-size:15px;">Total Estimate</td>
                            <td style="padding:14px 0 0;text-align:right;font-weight:900;font-size:15px;">${formatAmt(workTotal)}</td>
                        </tr>
                    </table>
                </div>

                <p style="margin:0 0 24px;font-size:14px;color:#52525b;line-height:1.6;">
                    To accept this quote, simply reply to this email or contact us directly.
                    We'll confirm your slot and get started once you give the go-ahead.
                </p>

                <p style="margin:0 0 4px;font-size:14px;color:#52525b;">Questions? Reach us at:</p>
                ${contactEmail ? `<p style="margin:0 0 2px;font-size:14px;"><a href="mailto:${contactEmail}" style="color:#18181b;">${contactEmail}</a></p>` : ""}
                ${phone ? `<p style="margin:0;font-size:14px;">${phone}</p>` : ""}

                <hr style="border:none;border-top:1px solid #e4e4e7;margin:32px 0;" />
                <p style="margin:0;font-size:12px;color:#a1a1aa;">© ${new Date().getFullYear()} ${companyName}</p>
            </div>`;

        await resend.emails.send({
            from: `${senderName} <billing@thedotguitars.com>`,
            to: [client.email],
            replyTo: contactEmail || undefined,
            subject: replaceVars(
                settings?.quoteEmailSubject || "Quote for your {{instrumentType}} — {{companyName}}",
                { instrumentType: instrumentLabel, companyName, clientName: client.name }
            ),
            html,
            text: `Dear ${client.name},\n\nHere's a quote for your ${instrumentLabel}:\n\n${workItems.map((wi: any) => `- ${wi.name}: ${formatAmt(wi.type === "hourly" ? wi.unitPrice * (wi.hours ?? 1) : wi.unitPrice)}`).join("\n")}\n\nTotal: ${formatAmt(workTotal)}\n\nTo accept, just reply to this email.\n\n${contactEmail}\n${phone}\n\n${companyName}`,
        });

        return { success: true };
    },
});

export const sendJobReadyEmail = action({
    args: { jobId: v.id("jobs") },
    handler: async (ctx, { jobId }) => {
        const resendApiKey = process.env.RESEND_API_KEY;
        if (!resendApiKey) throw new Error("RESEND_API_KEY environment variable not set");

        // Fetch job (includes client + orders), and settings
        const job = await ctx.runQuery(api.jobs.get, { id: jobId });
        if (!job) throw new Error("Job not found");

        const client = (job as any).client;
        if (!client?.email) throw new Error("Client has no email address on file");

        const settings = await ctx.runQuery(api.settings.get);
        const companyName = settings?.companyName ?? "Your repair shop";
        const contactEmail = settings?.contactEmail ?? "";
        const phone = settings?.phone ?? "";

        const instrumentLabel = [
            (job as any).instrumentBrand,
            (job as any).instrumentModel,
            job.instrumentType,
        ].filter(Boolean).join(" ");

        const senderName = settings?.emailSenderName || companyName;

        const jobReadyIntro = replaceVars(
            settings?.jobReadyEmailIntro || "We're happy to let you know that your {{instrumentType}} is done and ready for pickup! Come by whenever it suits you.",
            { instrumentType: instrumentLabel, clientName: client.name, companyName }
        );

        const resend = new Resend(resendApiKey);

        const html = `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; color: #18181b;">
                <h2 style="font-size: 22px; font-weight: 900; margin: 0 0 4px;">Your instrument is ready! 🎸</h2>
                <p style="color: #71717a; margin: 0 0 32px; font-size: 14px;">Great news from ${companyName}</p>

                <p style="margin: 0 0 16px;">Dear <strong>${client.name}</strong>,</p>
                <p style="margin: 0 0 24px; line-height: 1.6;">
                    ${jobReadyIntro}
                </p>

                <div style="background: #f4f4f5; border-radius: 12px; padding: 20px 24px; margin-bottom: 32px;">
                    <p style="margin: 0 0 8px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #71717a;">Job Details</p>
                    <p style="margin: 0 0 4px; font-weight: 700;">${job.title}</p>
                    <p style="margin: 0; font-size: 14px; color: #52525b;">${instrumentLabel}</p>
                </div>

                <p style="margin: 0 0 4px; font-size: 14px; color: #52525b;">Questions? Feel free to reach out:</p>
                ${contactEmail ? `<p style="margin: 0 0 2px; font-size: 14px;"><a href="mailto:${contactEmail}" style="color: #18181b;">${contactEmail}</a></p>` : ""}
                ${phone ? `<p style="margin: 0; font-size: 14px;">${phone}</p>` : ""}

                <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 32px 0;" />
                <p style="margin: 0; font-size: 12px; color: #a1a1aa;">
                    © ${new Date().getFullYear()} ${companyName}
                </p>
            </div>
        `;

        try {
            await resend.emails.send({
                from: `${senderName} <billing@thedotguitars.com>`,
                to: [client.email],
                replyTo: contactEmail || undefined,
                subject: replaceVars(
                    settings?.jobReadyEmailSubject || "Your {{instrumentType}} is ready for pickup! 🎸",
                    { instrumentType: instrumentLabel, companyName, clientName: client.name }
                ),
                html,
                text: `Dear ${client.name},\n\nYour ${instrumentLabel} is ready for pickup at ${companyName}!\n\nJob: ${job.title}\n\n${contactEmail ? `Contact: ${contactEmail}\n` : ""}${phone ? `Phone: ${phone}\n` : ""}\nSee you soon!\n${companyName}`,
            });

            return { success: true };
        } catch (error: any) {
            console.error("Failed to send job ready email:", error);
            throw new Error(`Failed to send email: ${error.message || String(error)}`);
        }
    },
});
