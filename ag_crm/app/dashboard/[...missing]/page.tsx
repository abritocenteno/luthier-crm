import { notFound } from "next/navigation";

// Unknown /dashboard/* URLs would otherwise fall through to the root 404, outside
// the dashboard layout. Routing them here renders not-found.tsx with the sidebar.
export default function MissingDashboardPage() {
    notFound();
}
