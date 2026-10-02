import Link from "next/link";
import { Compass } from "lucide-react";

export default function DashboardNotFound() {
    return (
        <div className="text-center py-20 space-y-6">
            <div className="w-16 h-16 mx-auto bg-zinc-100 rounded-2xl flex items-center justify-center text-zinc-400">
                <Compass size={32} />
            </div>
            <div className="space-y-2">
                <h2 className="text-2xl font-bold text-zinc-900">Page not found</h2>
                <p className="text-zinc-500 max-w-md mx-auto">There&apos;s no page at this address.</p>
            </div>
            <Link href="/dashboard" className="inline-block text-sm font-bold text-black underline underline-offset-4">
                Back to Dashboard
            </Link>
        </div>
    );
}
