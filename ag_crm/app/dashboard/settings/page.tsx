"use client";

import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Save, Upload, Loader2, Building, Mail, MapPin, Phone, Globe, Hash, CreditCard, Languages, Coins } from "lucide-react";

export default function SettingsPage() {
    const settings = useQuery(api.settings.get);
    const upsertSettings = useMutation(api.settings.upsert);
    const generateUploadUrl = useMutation(api.files.generateUploadUrl);

    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    // Form state
    const [companyName, setCompanyName] = useState("");
    const [contactEmail, setContactEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [website, setWebsite] = useState("");
    const [kvkNumber, setKvkNumber] = useState("");
    const [bankAccounts, setBankAccounts] = useState("");
    const [addressLine1, setAddressLine1] = useState("");
    const [addressLine2, setAddressLine2] = useState("");
    const [logoStorageId, setLogoStorageId] = useState<string | null>(null);
    const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
    const [language, setLanguage] = useState("en-US");
    const [currency, setCurrency] = useState("USD");

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Load initial settings
    useEffect(() => {
        if (settings) {
            setCompanyName(settings.companyName);
            setContactEmail(settings.contactEmail);
            setPhone(settings.phone || "");
            setWebsite(settings.website || "");
            setKvkNumber(settings.kvkNumber || "");
            setBankAccounts(settings.bankAccounts || "");
            setAddressLine1(settings.addressLine1);
            setAddressLine2(settings.addressLine2);
            if (settings.logoStorageId) setLogoStorageId(settings.logoStorageId);
            if (settings.logoUrl) setLogoPreviewUrl(settings.logoUrl);
            if (settings.language) setLanguage(settings.language);
            if (settings.currency) setCurrency(settings.currency);
        }
    }, [settings]);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setIsUploading(true);
            const previewUrl = URL.createObjectURL(file);
            setLogoPreviewUrl(previewUrl);

            const postUrl = await generateUploadUrl();
            const result = await fetch(postUrl, {
                method: "POST",
                headers: { "Content-Type": file.type },
                body: file,
            });
            const { storageId } = await result.json();

            setLogoStorageId(storageId);
        } catch (error) {
            console.error("Failed to upload image:", error);
            alert("Failed to upload image. Please try again.");
        } finally {
            setIsUploading(false);
        }
    };

    const handleSave = async () => {
        if (!companyName || !contactEmail || !addressLine1) {
            alert("Company Name, Email, and Address Line 1 are required.");
            return;
        }

        setIsSaving(true);
        try {
            await upsertSettings({
                companyName,
                contactEmail,
                phone,
                website,
                kvkNumber,
                bankAccounts,
                addressLine1,
                addressLine2,
                logoStorageId: logoStorageId as any || undefined,
                language,
                currency,
            });
            alert("Settings saved successfully!");
        } catch (error) {
            console.error("Failed to save settings:", error);
            alert("Failed to save settings. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    if (settings === undefined) {
        return (
            <div className="flex h-full items-center justify-center min-h-[500px]">
                <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-12">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Organization Settings</h1>
                <p className="text-zinc-500 mt-2">
                    Manage your company details. These will appear on your generated invoices and communications.
                </p>
            </div>

            <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
                <div className="p-6 sm:p-8 space-y-8">

                    {/* Logo Section */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4">Company Logo</h3>
                        <div className="flex items-start gap-6">
                            <div className="h-24 w-24 rounded-xl border border-dashed border-zinc-300 bg-zinc-50 flex items-center justify-center overflow-hidden flex-shrink-0 relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                {logoPreviewUrl ? (
                                    <img src={logoPreviewUrl} alt="Company Logo" className="h-full w-full object-contain p-2" />
                                ) : (
                                    <div className="flex flex-col items-center text-zinc-400">
                                        <Building className="h-8 w-8 mb-1" />
                                        <span className="text-[10px] font-medium">Add Logo</span>
                                    </div>
                                )}

                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    {isUploading ? <Loader2 className="h-5 w-5 text-white animate-spin" /> : <Upload className="h-5 w-5 text-white" />}
                                </div>
                            </div>

                            <div className="flex-1 space-y-2 pt-2">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleImageUpload}
                                    accept="image/*"
                                    className="hidden"
                                />
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isUploading}
                                    className="px-4 py-2 bg-white border border-zinc-200 text-sm font-medium rounded-lg hover:bg-zinc-50 transition-colors disabled:opacity-50"
                                >
                                    {isUploading ? "Uploading..." : "Upload Logo"}
                                </button>
                                <p className="text-xs text-zinc-500">
                                    Recommended format: PNG with transparent background, at least 400x400px.
                                </p>
                            </div>
                        </div>
                    </div>

                    <hr className="border-zinc-100" />

                    {/* Company Details */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4">Company Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-sm font-medium text-zinc-700 flex items-center gap-2">
                                    <Building className="h-4 w-4 text-zinc-400" />
                                    Company or Trading Name *
                                </label>
                                <input
                                    type="text"
                                    value={companyName}
                                    onChange={(e) => setCompanyName(e.target.value)}
                                    className="w-full px-4 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                                    placeholder="e.g. Acme Corp Ltd."
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-700 flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-zinc-400" />
                                    Billing Contact Email *
                                </label>
                                <input
                                    type="email"
                                    value={contactEmail}
                                    onChange={(e) => setContactEmail(e.target.value)}
                                    className="w-full px-4 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                                    placeholder="e.g. billing@acme.com"
                                />
                                <p className="text-[10px] text-zinc-500">Clients will see this email and use it when replying to invoices.</p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-700 flex items-center gap-2">
                                    <Phone className="h-4 w-4 text-zinc-400" />
                                    Phone Number
                                </label>
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    className="w-full px-4 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                                    placeholder="e.g. +31 6 12345678"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-700 flex items-center gap-2">
                                    <Globe className="h-4 w-4 text-zinc-400" />
                                    Website
                                </label>
                                <input
                                    type="url"
                                    value={website}
                                    onChange={(e) => setWebsite(e.target.value)}
                                    className="w-full px-4 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                                    placeholder="e.g. https://www.acme.com"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-700 flex items-center gap-2">
                                    <Hash className="h-4 w-4 text-zinc-400" />
                                    KvK-Nummer
                                </label>
                                <input
                                    type="text"
                                    value={kvkNumber}
                                    onChange={(e) => setKvkNumber(e.target.value)}
                                    className="w-full px-4 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                                    placeholder="e.g. 12345678"
                                />
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <hr className="border-zinc-100 my-2" />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-700 flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-zinc-400" />
                                    Address Line 1 *
                                </label>
                                <input
                                    type="text"
                                    value={addressLine1}
                                    onChange={(e) => setAddressLine1(e.target.value)}
                                    className="w-full px-4 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                                    placeholder="e.g. 123 Business Avenue"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-700 flex items-center gap-2">
                                    <MapPin className="h-4 w-4 opacity-0" />
                                    Address Line 2
                                </label>
                                <input
                                    type="text"
                                    value={addressLine2}
                                    onChange={(e) => setAddressLine2(e.target.value)}
                                    className="w-full px-4 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                                    placeholder="e.g. London, UK, E1 6AN"
                                />
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <hr className="border-zinc-100 my-2" />
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <label className="text-sm font-medium text-zinc-700 flex items-center gap-2">
                                    <CreditCard className="h-4 w-4 text-zinc-400" />
                                    Bank Information
                                </label>
                                <textarea
                                    value={bankAccounts}
                                    onChange={(e) => setBankAccounts(e.target.value)}
                                    rows={3}
                                    className="w-full px-4 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent resize-y"
                                    placeholder="e.g. IBAN: NL99 BANK 0123 4567 89&#10;BIC: BANKNL2A"
                                />
                                <p className="text-[10px] text-zinc-500">Provide payment coordinates. These will be appended to the bottom of the invoice.</p>
                            </div>
                        </div>
                    </div>

                    <hr className="border-zinc-100" />

                    {/* Regional Settings */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Regional Settings</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-700 flex items-center gap-2">
                                    <Languages className="h-4 w-4 text-zinc-400" />
                                    Preferred Language
                                </label>
                                <select
                                    value={language}
                                    onChange={(e) => setLanguage(e.target.value)}
                                    className="w-full px-4 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent bg-white shadow-sm"
                                >
                                    <option value="en-US">English (United States)</option>
                                    <option value="en-GB">English (United Kingdom)</option>
                                    <option value="nl-NL">Nederlands (Netherlands)</option>
                                    <option value="es-ES">Español (Spain)</option>
                                    <option value="de-DE">Deutsch (Germany)</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-700 flex items-center gap-2">
                                    <Coins className="h-4 w-4 text-zinc-400" />
                                    Default Currency
                                </label>
                                <select
                                    value={currency}
                                    onChange={(e) => setCurrency(e.target.value)}
                                    className="w-full px-4 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent bg-white shadow-sm"
                                >
                                    <option value="USD">USD ($)</option>
                                    <option value="EUR">EUR (€)</option>
                                    <option value="GBP">GBP (£)</option>
                                    <option value="JPY">JPY (¥)</option>
                                    <option value="BRL">BRL (R$)</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-zinc-50 p-6 sm:p-8 border-t border-zinc-200 flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center gap-2 bg-black text-white px-6 py-2.5 rounded-lg font-medium hover:bg-zinc-800 transition-colors disabled:opacity-50"
                    >
                        {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                        {isSaving ? "Saving..." : "Save Settings"}
                    </button>
                </div>
            </div>
        </div>
    );
}
