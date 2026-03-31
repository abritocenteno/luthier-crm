import { v } from "convex/values";
import { action } from "./_generated/server";
import { Resend } from "resend";
import { api } from "./_generated/api";

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

        try {
            const data = await resend.emails.send({
                from: "AG CRM <billing@thedotguitars.com>",
                to: [args.clientEmail],
                replyTo: args.replyToEmail,
                subject: `Invoice ${args.invoiceNumber} — ${company}`,
                text: `Dear ${args.clientName},\n\nPlease find attached invoice ${args.invoiceNumber} from ${company}.\n\nThank you for your business!\n\nBest regards,\n${company}`,
                html: `
                    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; color: #18181b;">
                        <h2 style="font-size: 22px; font-weight: 900; margin: 0 0 4px;">Invoice ${args.invoiceNumber}</h2>
                        <p style="color: #71717a; margin: 0 0 32px; font-size: 14px;">From ${company}</p>

                        <p style="margin: 0 0 16px;">Dear <strong>${args.clientName}</strong>,</p>
                        <p style="margin: 0 0 24px; line-height: 1.6;">
                            Please find your invoice attached to this email. If you have any questions, feel free to reply directly to this message.
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

        const resend = new Resend(resendApiKey);

        const html = `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; color: #18181b;">
                <h2 style="font-size: 22px; font-weight: 900; margin: 0 0 4px;">Your instrument is ready! 🎸</h2>
                <p style="color: #71717a; margin: 0 0 32px; font-size: 14px;">Great news from ${companyName}</p>

                <p style="margin: 0 0 16px;">Dear <strong>${client.name}</strong>,</p>
                <p style="margin: 0 0 24px; line-height: 1.6;">
                    We're happy to let you know that your <strong>${instrumentLabel}</strong> is done and ready for pickup!
                    Come by whenever it suits you.
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
                from: "AG CRM <billing@thedotguitars.com>",
                to: [client.email],
                replyTo: contactEmail || undefined,
                subject: `Your ${instrumentLabel} is ready for pickup! 🎸`,
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
