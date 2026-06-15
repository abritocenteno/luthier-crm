"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useRouter } from "next/navigation";
import {
    Building, Mail, MapPin, Phone, Globe, Hash, CreditCard, Coins,
    Upload, Loader2, Check, ArrowRight, ArrowLeft, Guitar, Wrench, Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PRICING_GUIDE_SERVICES } from "@/lib/pricingGuide";

const STEPS = ["Business profile", "Tax & registration", "Branding", "Price list"] as const;

const CURRENCIES = [
    { code: "EUR", label: "Euro (€)" },
    { code: "USD", label: "US Dollar ($)" },
    { code: "GBP", label: "British Pound (£)" },
];

const Field = ({ icon: Icon, label, required, children }: { icon: any; label: string; required?: boolean; children: React.ReactNode }) => (
    <label className="block space-y-1.5">
        <span className="flex items-center gap-1.5 text-xs font-bold text-zinc-500 uppercase tracking-wider">
            <Icon size={13} /> {label} {required && <span className="text-red-500">*</span>}
        </span>
        {children}
    </label>
);

const inputCls = "w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5 transition-all";

function Wizard() {
    const router = useRouter();
    const settings = useQuery(api.settings.get);
    const currentUser = useQuery(api.users.currentUser);
    const upsertSettings = useMutation(api.settings.upsert);
    const generateUploadUrl = useMutation(api.files.generateUploadUrl);
    const addServiceBatch = useMutation(api.services.addBatch);

    const [step, setStep] = useState(0);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);

    const [form, setForm] = useState({
        companyName: "",
        addressLine1: "",
        addressLine2: "",
        contactEmail: "",
        phone: "",
        website: "",
        kvkNumber: "",
        btwNumber: "",
        defaultTaxRate: "21",
        currency: "EUR",
        bankAccounts: "",
    });
    const [logoStorageId, setLogoStorageId] = useState<string | null>(null);
    const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
    const [seedServices, setSeedServices] = useState(true);

    const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
        setForm((f) => ({ ...f, [k]: e.target.value }));

    // Already onboarded → don't let them back into the wizard.
    useEffect(() => {
        if (settings) router.replace("/dashboard");
    }, [settings, router]);

    // Prefill the contact email from the signed-in account.
    useEffect(() => {
        if (currentUser?.email) setForm((f) => (f.contactEmail ? f : { ...f, contactEmail: currentUser.email! }));
    }, [currentUser]);

    const step1Valid = form.companyName.trim() && form.addressLine1.trim() && form.contactEmail.trim();

    const handleLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            setUploading(true);
            setLogoPreviewUrl(URL.createObjectURL(file));
            const postUrl = await generateUploadUrl();
            const res = await fetch(postUrl, { method: "POST", headers: { "Content-Type": file.type }, body: file });
            const { storageId } = await res.json();
            setLogoStorageId(storageId);
        } catch (err) {
            console.error(err);
            alert("Failed to upload logo. You can add it later in Settings.");
            setLogoPreviewUrl(null);
        } finally {
            setUploading(false);
        }
    };

    const handleFinish = async () => {
        if (!step1Valid) { setStep(0); return; }
        setSaving(true);
        try {
            await upsertSettings({
                companyName: form.companyName.trim(),
                addressLine1: form.addressLine1.trim(),
                addressLine2: form.addressLine2.trim(),
                contactEmail: form.contactEmail.trim(),
                phone: form.phone.trim() || undefined,
                website: form.website.trim() || undefined,
                kvkNumber: form.kvkNumber.trim() || undefined,
                btwNumber: form.btwNumber.trim() || undefined,
                defaultTaxRate: form.defaultTaxRate ? Number(form.defaultTaxRate) : undefined,
                currency: form.currency,
                language: "en",
                bankAccounts: form.bankAccounts.trim() || undefined,
                logoStorageId: (logoStorageId as any) || undefined,
            });
            if (seedServices) {
                await addServiceBatch({ services: PRICING_GUIDE_SERVICES.map((s) => ({ ...s })) });
            }
            router.replace("/dashboard");
        } catch (err) {
            console.error(err);
            alert("Something went wrong saving your details. Please try again.");
            setSaving(false);
        }
    };

    const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
    const back = () => setStep((s) => Math.max(s - 1, 0));

    // While we don't yet know whether settings exist (or are redirecting), hold.
    if (settings === undefined || settings) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="animate-spin text-zinc-300" size={28} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-50 flex flex-col items-center px-4 py-10">
            <div className="w-full max-w-xl">
                {/* Brand */}
                <div className="flex items-center gap-2 mb-8 justify-center">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "#402A1B" }}>
                        <span className="font-bold text-lg" style={{ color: "#C9914C", fontFamily: "var(--font-domine)" }}>F</span>
                    </div>
                    <span className="font-bold text-2xl tracking-tight" style={{ fontFamily: "var(--font-domine)" }}>Fret<span style={{ color: "#C9914C" }}>Ops</span></span>
                </div>

                {/* Progress */}
                <div className="flex items-center gap-2 mb-8">
                    {STEPS.map((label, i) => (
                        <div key={label} className="flex-1">
                            <div className={cn("h-1.5 rounded-full transition-colors", i <= step ? "bg-black" : "bg-zinc-200")} />
                            <p className={cn("mt-2 text-[10px] font-bold uppercase tracking-wider text-center transition-colors", i === step ? "text-black" : "text-zinc-400")}>
                                {label}
                            </p>
                        </div>
                    ))}
                </div>

                <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm p-8 space-y-6">
                    {step === 0 && (
                        <div className="space-y-5 animate-in fade-in slide-in-from-right-2 duration-300">
                            <header className="space-y-1">
                                <h1 className="text-2xl font-bold tracking-tight">Welcome to FretOps 👋</h1>
                                <p className="text-zinc-500 text-sm">Let&apos;s set up your workshop. These details appear on your invoices and client emails.</p>
                            </header>
                            <Field icon={Building} label="Workshop / company name" required>
                                <input className={inputCls} value={form.companyName} onChange={set("companyName")} placeholder="e.g. De Luthier Werkplaats" autoFocus />
                            </Field>
                            <Field icon={MapPin} label="Address line 1" required>
                                <input className={inputCls} value={form.addressLine1} onChange={set("addressLine1")} placeholder="Street and number" />
                            </Field>
                            <Field icon={MapPin} label="Address line 2">
                                <input className={inputCls} value={form.addressLine2} onChange={set("addressLine2")} placeholder="Postcode and city" />
                            </Field>
                            <Field icon={Mail} label="Contact email" required>
                                <input className={inputCls} type="email" value={form.contactEmail} onChange={set("contactEmail")} placeholder="shop@example.com" />
                            </Field>
                            <div className="grid grid-cols-2 gap-4">
                                <Field icon={Phone} label="Phone">
                                    <input className={inputCls} value={form.phone} onChange={set("phone")} placeholder="+31 ..." />
                                </Field>
                                <Field icon={Globe} label="Website">
                                    <input className={inputCls} value={form.website} onChange={set("website")} placeholder="example.com" />
                                </Field>
                            </div>
                        </div>
                    )}

                    {step === 1 && (
                        <div className="space-y-5 animate-in fade-in slide-in-from-right-2 duration-300">
                            <header className="space-y-1">
                                <h1 className="text-2xl font-bold tracking-tight">Tax & registration</h1>
                                <p className="text-zinc-500 text-sm">Used to pre-fill VAT on invoices and show your registration details. All optional — you can change these later.</p>
                            </header>
                            <div className="grid grid-cols-2 gap-4">
                                <Field icon={Coins} label="Default VAT %">
                                    <input className={inputCls} type="number" inputMode="decimal" value={form.defaultTaxRate} onChange={set("defaultTaxRate")} placeholder="21" />
                                </Field>
                                <Field icon={Coins} label="Currency">
                                    <select className={inputCls} value={form.currency} onChange={set("currency")}>
                                        {CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
                                    </select>
                                </Field>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <Field icon={Hash} label="KvK number">
                                    <input className={inputCls} value={form.kvkNumber} onChange={set("kvkNumber")} placeholder="Chamber of Commerce" />
                                </Field>
                                <Field icon={Hash} label="BTW / VAT number">
                                    <input className={inputCls} value={form.btwNumber} onChange={set("btwNumber")} placeholder="NL..." />
                                </Field>
                            </div>
                            <Field icon={CreditCard} label="Bank account details">
                                <input className={inputCls} value={form.bankAccounts} onChange={set("bankAccounts")} placeholder="IBAN — shown on invoices for payment" />
                            </Field>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-5 animate-in fade-in slide-in-from-right-2 duration-300">
                            <header className="space-y-1">
                                <h1 className="text-2xl font-bold tracking-tight">Add your logo</h1>
                                <p className="text-zinc-500 text-sm">Appears on invoices and quotes. Optional — skip and add it later in Settings.</p>
                            </header>
                            <div className="flex items-center gap-5">
                                <div className="w-24 h-24 rounded-2xl bg-zinc-100 border border-zinc-200 flex items-center justify-center overflow-hidden shrink-0">
                                    {logoPreviewUrl ? (
                                        <img src={logoPreviewUrl} alt="Logo preview" className="w-full h-full object-contain" />
                                    ) : (
                                        <Guitar size={28} className="text-zinc-300" />
                                    )}
                                </div>
                                <label className={cn("flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold cursor-pointer transition-all", uploading ? "bg-zinc-100 text-zinc-400" : "bg-black text-white hover:bg-zinc-800")}>
                                    {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                                    {logoStorageId ? "Replace logo" : "Upload logo"}
                                    <input type="file" accept="image/*" className="hidden" onChange={handleLogo} disabled={uploading} />
                                </label>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-5 animate-in fade-in slide-in-from-right-2 duration-300">
                            <header className="space-y-1">
                                <h1 className="text-2xl font-bold tracking-tight">Start with a price list</h1>
                                <p className="text-zinc-500 text-sm">We can pre-load a ready-made luthier service catalogue so you can quote and invoice from day one. Edit or remove anything later in Settings.</p>
                            </header>
                            <button
                                type="button"
                                onClick={() => setSeedServices((v) => !v)}
                                className={cn("w-full flex items-start gap-3 p-4 rounded-xl border text-left transition-all", seedServices ? "border-black bg-zinc-50" : "border-zinc-200 hover:bg-zinc-50")}
                            >
                                <div className={cn("w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-colors", seedServices ? "bg-black border-black text-white" : "border-zinc-300")}>
                                    {seedServices && <Check size={13} />}
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-sm font-bold flex items-center gap-1.5"><Wrench size={14} /> Load the standard price list</p>
                                    <p className="text-xs text-zinc-500">Adds {PRICING_GUIDE_SERVICES.length} common services (setups, fretwork, electronics, nuts & more).</p>
                                </div>
                            </button>
                            <div className="rounded-xl bg-zinc-50 border border-zinc-100 p-4 flex items-center gap-2 text-xs text-zinc-500">
                                <Sparkles size={14} className="text-amber-500 shrink-0" />
                                You&apos;re all set — finishing will take you to your dashboard.
                            </div>
                        </div>
                    )}

                    {/* Nav */}
                    <div className="flex items-center justify-between pt-2">
                        {step > 0 ? (
                            <button onClick={back} disabled={saving} className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-bold text-zinc-500 hover:text-black transition-colors disabled:opacity-50">
                                <ArrowLeft size={16} /> Back
                            </button>
                        ) : <span />}

                        {step < STEPS.length - 1 ? (
                            <button
                                onClick={next}
                                disabled={step === 0 && !step1Valid}
                                className="flex items-center gap-2 px-6 py-2.5 bg-black text-white rounded-xl text-sm font-bold hover:bg-zinc-800 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
                            >
                                Continue <ArrowRight size={16} />
                            </button>
                        ) : (
                            <button
                                onClick={handleFinish}
                                disabled={saving}
                                className="flex items-center gap-2 px-6 py-2.5 bg-black text-white rounded-xl text-sm font-bold hover:bg-zinc-800 transition-all active:scale-95 disabled:opacity-60"
                            >
                                {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                                {saving ? "Setting up…" : "Finish & open dashboard"}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function RedirectToSignIn() {
    useEffect(() => { window.location.href = "/?signin=1"; }, []);
    return null;
}

export default function OnboardingPage() {
    return (
        <>
            <Authenticated><Wizard /></Authenticated>
            <Unauthenticated><RedirectToSignIn /></Unauthenticated>
            <AuthLoading>
                <div className="min-h-screen flex items-center justify-center">
                    <Loader2 className="animate-spin text-zinc-300" size={28} />
                </div>
            </AuthLoading>
        </>
    );
}
