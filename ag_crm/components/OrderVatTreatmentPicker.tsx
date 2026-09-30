"use client";

import { cn } from "@/lib/utils";
import { VAT_TREATMENT_LABELS, type SupplierVatTreatment } from "@/lib/vat";

const SHORT: Record<SupplierVatTreatment, string> = {
    nl: "NL BTW",
    eu_reverse: "EU reverse",
    foreign: "Foreign VAT",
};

/**
 * Per-order VAT treatment. "" follows the supplier's setting; pick another for a one-off,
 * e.g. an order a reverse-charge supplier billed with VAT before they had your BTW number.
 */
export function OrderVatTreatmentPicker({
    value,
    supplierDefault,
    onChange,
}: {
    value: string;
    supplierDefault: SupplierVatTreatment;
    onChange: (value: string) => void;
}) {
    const options: { value: string; label: string }[] = [
        { value: "", label: `Supplier default · ${SHORT[supplierDefault]}` },
        ...(Object.keys(SHORT) as SupplierVatTreatment[]).map((t) => ({ value: t, label: VAT_TREATMENT_LABELS[t] })),
    ];

    return (
        <div className="space-y-4 pt-4 border-t border-zinc-100">
            <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">VAT Treatment</label>
                <p className="text-[10px] text-zinc-400 font-medium mt-1">Decides where this order lands in your BTW aangifte. Override only when this invoice differs from the supplier&apos;s usual one.</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
                {options.map((opt) => (
                    <button
                        key={opt.value || "default"}
                        type="button"
                        onClick={() => onChange(opt.value)}
                        className={cn(
                            "py-3 px-2 rounded-xl text-[11px] font-bold transition-all border",
                            value === opt.value
                                ? "bg-black text-white border-black shadow-lg shadow-black/10 scale-[1.02]"
                                : "bg-white text-zinc-400 border-zinc-200 hover:border-zinc-300"
                        )}
                    >
                        {opt.label}
                    </button>
                ))}
            </div>
        </div>
    );
}
