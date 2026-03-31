import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Every day at 06:00 UTC — mark pending invoices past their due date as overdue
crons.daily(
    "mark overdue invoices",
    { hourUTC: 6, minuteUTC: 0 },
    internal.invoices.markOverdueInvoices,
);

export default crons;
