import { v } from "convex/values";
import { action } from "./_generated/server";
import { Resend } from "resend";

export const sendInvoiceEmail = action({
    args: {
        invoiceNumber: v.string(),
        clientName: v.string(),
        clientEmail: v.string(),
        replyToEmail: v.string(),
        pdfBase64: v.string(),
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

        try {
            const data = await resend.emails.send({
                from: "AG CRM <billing@thedotguitars.com>",
                to: [args.clientEmail],
                replyTo: args.replyToEmail,
                subject: `Invoice ${args.invoiceNumber} from AG CRM`,
                text: `Dear ${args.clientName},\n\nPlease find attached the invoice ${args.invoiceNumber}.\n\nThank you for your business!\n\nBest regards,\nAG CRM`,
                html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <p>Dear ${args.clientName},</p>
            <p>Please find attached the invoice <strong>${args.invoiceNumber}</strong>.</p>
            <p>Thank you for your business!</p>
            <p>Best regards,<br>AG CRM</p>
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
