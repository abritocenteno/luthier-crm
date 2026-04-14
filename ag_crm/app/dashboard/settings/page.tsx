"use client";

import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Save, Upload, Loader2, Building, Mail, MapPin, Phone, Globe, Hash, CreditCard, Languages, Coins, Wrench, Plus, Trash2, Pencil, Check, X, ChevronDown, Guitar, Link2, CheckCheck, Code2, FolderOpen, Download, FileText, Image, File, Zap } from "lucide-react";
import { ThemeSelector } from "@/components/ThemeSelector";
import { cn, formatCurrency, getCurrencySymbol } from "@/lib/utils";
import { Id } from "../../../convex/_generated/dataModel";

export default function SettingsPage() {
    const settings = useQuery(api.settings.get);
    const upsertSettings = useMutation(api.settings.upsert);
    const generateUploadUrl = useMutation(api.files.generateUploadUrl);

    // Service library
    const services = useQuery(api.services.list);

    // Job templates
    const templates = useQuery(api.jobTemplates.list);
    const addTemplate = useMutation(api.jobTemplates.add);
    const removeTemplate = useMutation(api.jobTemplates.remove);

    type TemplateDraft = { name: string; description: string; instrumentType: string };
    const emptyTemplate = (): TemplateDraft => ({ name: "", description: "", instrumentType: "" });
    const [newTemplate, setNewTemplate] = useState<TemplateDraft>(emptyTemplate());
    const [showTemplateForm, setShowTemplateForm] = useState(false);

    const INSTRUMENT_TYPES_LIST = ["Guitar", "Bass", "Ukulele", "Mandolin", "Banjo", "Violin", "Viola", "Cello", "Other"];
    const addService = useMutation(api.services.add);
    const addServiceBatch = useMutation(api.services.addBatch);
    const updateService = useMutation(api.services.update);
    const removeService = useMutation(api.services.remove);
    const [isImporting, setIsImporting] = useState(false);

    const PRICING_GUIDE_SERVICES = [
        // Setups
        { name: "Basic Setup", description: "Adjustment of neck, string height and intonation. Light clean.", type: "fixed", defaultPrice: 70 },
        { name: "Full Setup", description: "Full adjustment + fretboard clean, light fret polish and hardware check.", type: "fixed", defaultPrice: 85 },
        { name: "Premium Setup", description: "Full setup + deep clean, full fret polish and detailed finishing.", type: "fixed", defaultPrice: 110 },
        { name: "String Installation", description: "Labour only, strings not included.", type: "fixed", defaultPrice: 10 },
        { name: "Floyd Rose / Floating Trem Setup", description: "Additional charge on top of setup.", type: "fixed", defaultPrice: 20 },
        { name: "5/6-String Bass Surcharge", description: "Additional charge for 5 or 6 string bass setups.", type: "fixed", defaultPrice: 10 },
        { name: "12-String Surcharge", description: "Additional charge for 12-string setups.", type: "fixed", defaultPrice: 20 },
        // Nut & Saddle
        { name: "Nut Adjustment", description: "Adjustment of existing nut.", type: "fixed", defaultPrice: 30 },
        { name: "New Synthetic Nut", description: "Supply and fit new synthetic nut.", type: "fixed", defaultPrice: 70 },
        { name: "New Bone Nut", description: "Supply and fit new bone nut.", type: "fixed", defaultPrice: 100 },
        { name: "Saddle Adjustment", description: "Adjustment of existing saddle.", type: "fixed", defaultPrice: 30 },
        { name: "New Saddle (Acoustic)", description: "Supply and fit new acoustic saddle.", type: "fixed", defaultPrice: 75 },
        // Fretwork
        { name: "Fret Polish", description: "Full fret polish and cleaning.", type: "fixed", defaultPrice: 45 },
        { name: "Fret Level & Crown", description: "Full fret level, recrown and polish.", type: "fixed", defaultPrice: 130 },
        { name: "Partial Refret", description: "Partial refret (price varies by scope).", type: "fixed", defaultPrice: 90 },
        { name: "Full Refret", description: "Complete refret with fret level and setup.", type: "fixed", defaultPrice: 280 },
        // Electronics
        { name: "Pickup Installation", description: "Per pickup, labour only.", type: "fixed", defaultPrice: 40 },
        { name: "Complete Wiring", description: "Full wiring harness installation.", type: "fixed", defaultPrice: 90 },
        { name: "Output Jack Replacement", description: "Replace output jack.", type: "fixed", defaultPrice: 30 },
        { name: "Potmeter Replacement", description: "Replace volume or tone potmeter.", type: "fixed", defaultPrice: 35 },
        { name: "Shielding", description: "Cavity shielding to reduce noise.", type: "fixed", defaultPrice: 70 },
        // Repairs
        { name: "Crack Repair", description: "Structural crack repair (price varies by severity).", type: "fixed", defaultPrice: 80 },
        { name: "Headstock Repair", description: "Headstock break or crack repair.", type: "fixed", defaultPrice: 120 },
        { name: "Bridge Reglue (Acoustic)", description: "Reglue lifting acoustic bridge.", type: "fixed", defaultPrice: 120 },
        { name: "Hardware Installation", description: "Tuners, strap buttons, guards, etc.", type: "fixed", defaultPrice: 40 },
        // Advanced
        { name: "Neck Reset (Acoustic)", description: "Acoustic neck reset (price varies by instrument).", type: "fixed", defaultPrice: 300 },
        { name: "Restoration Work", description: "Instrument restoration, from quoted price.", type: "fixed", defaultPrice: 300 },
        { name: "Custom Modifications", description: "Custom mods and non-standard work.", type: "fixed", defaultPrice: 100 },
        // Hourly
        { name: "Hourly Rate", description: "For complex or undefined repairs.", type: "hourly", defaultPrice: 65 },
        // Bundles
        { name: "Bundle: Full Setup + Strings", description: "Full setup + string installation (strings excl.).", type: "fixed", defaultPrice: 95 },
        { name: "Bundle: Fret Polish + Setup", description: "Fret polish combined with full setup.", type: "fixed", defaultPrice: 110 },
        { name: "Bundle: Revive Package", description: "Full setup + fret polish + deep clean.", type: "fixed", defaultPrice: 125 },
        { name: "Bundle: Pickup Install (2x) + Setup", description: "Install 2 pickups plus full setup.", type: "fixed", defaultPrice: 150 },
    ] as const;

    const handleImportPricing = async () => {
        if (!confirm(`This will add ${PRICING_GUIDE_SERVICES.length} services from your pricing guide. Continue?`)) return;
        setIsImporting(true);
        try {
            await addServiceBatch({ services: PRICING_GUIDE_SERVICES.map(s => ({ ...s, type: s.type })) });
        } catch (err) {
            console.error(err);
        } finally {
            setIsImporting(false);
        }
    };

    type ServiceDraft = { name: string; description: string; type: "fixed" | "hourly"; defaultPrice: number; checklistItems: string[] };
    const emptyDraft = (): ServiceDraft => ({ name: "", description: "", type: "fixed", defaultPrice: 0, checklistItems: [] });
    const [newService, setNewService] = useState<ServiceDraft>(emptyDraft());
    const [editingId, setEditingId] = useState<Id<"services"> | null>(null);
    const [editDraft, setEditDraft] = useState<ServiceDraft>(emptyDraft());
    const [newChecklistItem, setNewChecklistItem] = useState("");

    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [copiedLink, setCopiedLink] = useState(false);
    const [showEmbedModal, setShowEmbedModal] = useState(false);
    const [copiedEmbed, setCopiedEmbed] = useState(false);

    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL ?? "";
    const embedCode = `<!-- Service Request Widget — AG CRM -->
<div id="agcrm-widget">
<style>
#agcrm-widget *{box-sizing:border-box;margin:0;padding:0}
#agcrm-widget{font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:480px;width:100%}
#agcrm-widget .aw-title{font-size:20px;font-weight:800;color:#18181b;margin-bottom:4px}
#agcrm-widget .aw-sub{font-size:13px;color:#71717a;margin-bottom:24px}
#agcrm-widget .aw-field{margin-bottom:16px}
#agcrm-widget .aw-label{display:block;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#71717a;margin-bottom:6px}
#agcrm-widget .aw-input,#agcrm-widget .aw-select,#agcrm-widget .aw-textarea{width:100%;padding:10px 14px;border:1px solid #e4e4e7;border-radius:10px;font-size:14px;color:#18181b;background:#fafafa;outline:none;transition:border-color .15s}
#agcrm-widget .aw-input:focus,#agcrm-widget .aw-select:focus,#agcrm-widget .aw-textarea:focus{border-color:#18181b;background:#fff}
#agcrm-widget .aw-textarea{resize:vertical;min-height:100px}
#agcrm-widget .aw-row{display:grid;grid-template-columns:1fr 1fr;gap:12px}
#agcrm-widget .aw-btn{width:100%;padding:12px 20px;background:#18181b;color:#fff;border:none;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer;transition:background .15s;margin-top:4px}
#agcrm-widget .aw-btn:hover{background:#3f3f46}
#agcrm-widget .aw-btn:disabled{opacity:.5;cursor:not-allowed}
#agcrm-widget .aw-success{text-align:center;padding:32px 16px}
#agcrm-widget .aw-success-icon{font-size:40px;margin-bottom:12px}
#agcrm-widget .aw-success-title{font-size:18px;font-weight:800;color:#18181b;margin-bottom:8px}
#agcrm-widget .aw-success-body{font-size:14px;color:#71717a}
#agcrm-widget .aw-error{font-size:13px;color:#dc2626;margin-top:12px;padding:10px 14px;background:#fef2f2;border-radius:8px}
</style>
<div id="agcrm-form-wrap">
  <p class="aw-title">Request a Service</p>
  <p class="aw-sub">Fill in the form and we\\'ll get back to you shortly.</p>
  <form id="agcrm-form" novalidate>
    <div class="aw-row">
      <div class="aw-field">
        <label class="aw-label" for="aw-name">Name *</label>
        <input class="aw-input" id="aw-name" type="text" placeholder="Your name" required />
      </div>
      <div class="aw-field">
        <label class="aw-label" for="aw-email">Email *</label>
        <input class="aw-input" id="aw-email" type="email" placeholder="you@example.com" required />
      </div>
    </div>
    <div class="aw-row">
      <div class="aw-field">
        <label class="aw-label" for="aw-phone">Phone</label>
        <input class="aw-input" id="aw-phone" type="tel" placeholder="+31 6 00 00 00 00" />
      </div>
      <div class="aw-field">
        <label class="aw-label" for="aw-instrument">Instrument *</label>
        <select class="aw-select" id="aw-instrument" required>
          <option value="">Select…</option>
          <option>Electric Guitar</option>
          <option>Acoustic Guitar</option>
          <option>Bass Guitar</option>
          <option>Classical Guitar</option>
          <option>Ukulele</option>
          <option>Mandolin</option>
          <option>Banjo</option>
          <option>Other</option>
        </select>
      </div>
    </div>
    <div class="aw-field">
      <label class="aw-label" for="aw-desc">Description *</label>
      <textarea class="aw-textarea" id="aw-desc" placeholder="Describe the issue or work needed…" required></textarea>
    </div>
    <div id="aw-err" class="aw-error" style="display:none"></div>
    <button class="aw-btn" type="submit" id="aw-submit">Send Request</button>
  </form>
</div>
<div id="agcrm-success" class="aw-success" style="display:none">
  <div class="aw-success-icon">🎸</div>
  <p class="aw-success-title">Request received!</p>
  <p class="aw-success-body">Thanks, we\\'ll be in touch soon.</p>
</div>
<script>
(function(){
  var CONVEX_URL="${convexUrl}";
  var form=document.getElementById("agcrm-form");
  var btn=document.getElementById("aw-submit");
  var err=document.getElementById("aw-err");
  var wrap=document.getElementById("agcrm-form-wrap");
  var succ=document.getElementById("agcrm-success");
  form.addEventListener("submit",async function(e){
    e.preventDefault();
    var name=document.getElementById("aw-name").value.trim();
    var email=document.getElementById("aw-email").value.trim();
    var phone=document.getElementById("aw-phone").value.trim();
    var inst=document.getElementById("aw-instrument").value;
    var desc=document.getElementById("aw-desc").value.trim();
    if(!name||!email||!inst||!desc){err.textContent="Please fill in all required fields.";err.style.display="block";return;}
    err.style.display="none";btn.disabled=true;btn.textContent="Sending…";
    try{
      var res=await fetch(CONVEX_URL+"/api/mutation",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({path:"intake:submitRequest",args:{name,email,phone:phone||undefined,instrumentType:inst,description:desc}})});
      var json=await res.json();
      if(json.status==="success"){wrap.style.display="none";succ.style.display="block";}
      else{throw new Error(json.errorMessage||"Something went wrong.");}
    }catch(ex){
      err.textContent=ex.message||"Failed to send. Please try again.";
      err.style.display="block";btn.disabled=false;btn.textContent="Send Request";
    }
  });
})();
</script>
</div>`;

    // Form state
    const [companyName, setCompanyName] = useState("");
    const [contactEmail, setContactEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [website, setWebsite] = useState("");
    const [kvkNumber, setKvkNumber] = useState("");
    const [btwNumber, setBtwNumber] = useState("");
    const [defaultTaxRate, setDefaultTaxRate] = useState<number | "">(21);
    const [bankAccounts, setBankAccounts] = useState("");
    const [addressLine1, setAddressLine1] = useState("");
    const [addressLine2, setAddressLine2] = useState("");
    const [logoStorageId, setLogoStorageId] = useState<string | null>(null);
    const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
    const [language, setLanguage] = useState("en-US");
    const [currency, setCurrency] = useState("USD");
    const [emailSenderName, setEmailSenderName] = useState("");
    const [invoiceEmailSubject, setInvoiceEmailSubject] = useState("");
    const [invoiceEmailIntro, setInvoiceEmailIntro] = useState("");
    const [quoteEmailSubject, setQuoteEmailSubject] = useState("");
    const [quoteEmailIntro, setQuoteEmailIntro] = useState("");
    const [jobReadyEmailSubject, setJobReadyEmailSubject] = useState("");
    const [jobReadyEmailIntro, setJobReadyEmailIntro] = useState("");
    const [overdueEmailSubject, setOverdueEmailSubject] = useState("");
    const [overdueEmailIntro, setOverdueEmailIntro] = useState("");

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Load initial settings
    useEffect(() => {
        if (settings) {
            setCompanyName(settings.companyName);
            setContactEmail(settings.contactEmail);
            setPhone(settings.phone || "");
            setWebsite(settings.website || "");
            setKvkNumber(settings.kvkNumber || "");
            setBtwNumber((settings as any).btwNumber || "");
            setDefaultTaxRate((settings as any).defaultTaxRate ?? 21);
            setBankAccounts(settings.bankAccounts || "");
            setAddressLine1(settings.addressLine1);
            setAddressLine2(settings.addressLine2);
            if (settings.logoStorageId) setLogoStorageId(settings.logoStorageId);
            if (settings.logoUrl) setLogoPreviewUrl(settings.logoUrl);
            if (settings.language) setLanguage(settings.language);
            if (settings.currency) setCurrency(settings.currency);
            if (settings.emailSenderName) setEmailSenderName(settings.emailSenderName);
            if (settings.invoiceEmailSubject) setInvoiceEmailSubject(settings.invoiceEmailSubject);
            if (settings.invoiceEmailIntro) setInvoiceEmailIntro(settings.invoiceEmailIntro);
            if (settings.quoteEmailSubject) setQuoteEmailSubject(settings.quoteEmailSubject);
            if (settings.quoteEmailIntro) setQuoteEmailIntro(settings.quoteEmailIntro);
            if (settings.jobReadyEmailSubject) setJobReadyEmailSubject(settings.jobReadyEmailSubject);
            if (settings.jobReadyEmailIntro) setJobReadyEmailIntro(settings.jobReadyEmailIntro);
            if (settings.overdueEmailSubject) setOverdueEmailSubject(settings.overdueEmailSubject);
            if (settings.overdueEmailIntro) setOverdueEmailIntro(settings.overdueEmailIntro);
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
                btwNumber,
                defaultTaxRate: defaultTaxRate === "" ? 0 : Number(defaultTaxRate),
                bankAccounts,
                addressLine1,
                addressLine2,
                logoStorageId: logoStorageId as any || undefined,
                language,
                currency,
                emailSenderName: emailSenderName || undefined,
                invoiceEmailSubject: invoiceEmailSubject || undefined,
                invoiceEmailIntro: invoiceEmailIntro || undefined,
                quoteEmailSubject: quoteEmailSubject || undefined,
                quoteEmailIntro: quoteEmailIntro || undefined,
                jobReadyEmailSubject: jobReadyEmailSubject || undefined,
                jobReadyEmailIntro: jobReadyEmailIntro || undefined,
                overdueEmailSubject: overdueEmailSubject || undefined,
                overdueEmailIntro: overdueEmailIntro || undefined,
            });
            alert("Settings saved successfully!");
        } catch (error) {
            console.error("Failed to save settings:", error);
            alert("Failed to save settings. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    const [activeTab, setActiveTab] = useState<"general" | "services" | "intake" | "appearance" | "email" | "assets">("general");

    // Assets
    const assets = useQuery(api.assets.list);
    const addAsset = useMutation(api.assets.add);
    const removeAsset = useMutation(api.assets.remove);
    const [assetCategory, setAssetCategory] = useState<string>("all");
    const [isUploadingAsset, setIsUploadingAsset] = useState(false);
    const [assetDraft, setAssetDraft] = useState({ name: "", category: "checklist" });
    const [showAssetForm, setShowAssetForm] = useState(false);
    const assetFileRef = useRef<HTMLInputElement>(null);
    const [pendingAssetFile, setPendingAssetFile] = useState<File | null>(null);

    if (settings === undefined) {
        return (
            <div className="flex h-full items-center justify-center min-h-[500px]">
                <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
            </div>
        );
    }

    return (
        <>
        <div className="max-w-4xl mx-auto space-y-6 pb-12">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                <p className="text-zinc-500 mt-1">Manage your workspace configuration.</p>
            </div>

            {/* Tab bar */}
            <div className="flex items-center gap-1 border-b border-zinc-200">
                {([
                    { id: "general",    label: "General" },
                    { id: "services",   label: "Services" },
                    { id: "intake",     label: "Intake" },
                    { id: "appearance", label: "Appearance" },
                    { id: "email",      label: "Email" },
                    { id: "assets",     label: "Assets" },
                ] as const).map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                            "px-4 py-2.5 text-sm font-semibold transition-all border-b-2 -mb-px",
                            activeTab === tab.id
                                ? "border-black text-black"
                                : "border-transparent text-zinc-400 hover:text-zinc-600"
                        )}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* ── General Tab ── */}
            {activeTab === "general" && (
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

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-zinc-700 flex items-center gap-2">
                                        <Hash className="h-4 w-4 text-zinc-400" />
                                        BTW-Nummer (VAT)
                                    </label>
                                    <input
                                        type="text"
                                        value={btwNumber}
                                        onChange={(e) => setBtwNumber(e.target.value)}
                                        className="w-full px-4 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                                        placeholder="e.g. NL123456789B01"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-zinc-700 flex items-center gap-2">
                                        <Hash className="h-4 w-4 text-zinc-400" />
                                        Default Tax Rate (%)
                                    </label>
                                    <input
                                        type="number"
                                        min={0}
                                        max={100}
                                        step={0.1}
                                        value={defaultTaxRate}
                                        onChange={(e) => setDefaultTaxRate(e.target.value === "" ? "" : parseFloat(e.target.value))}
                                        className="w-full px-4 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                                        placeholder="e.g. 21"
                                    />
                                    <p className="text-xs text-zinc-400">Pre-filled on new invoices. Can be overridden per invoice.</p>
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

                    {/* Save button */}
                    <div className="bg-zinc-50 p-6 sm:p-8 border-t border-zinc-200 flex justify-end">
                        <button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2 bg-black text-white px-6 py-2.5 rounded-lg font-medium hover:bg-zinc-800 transition-colors disabled:opacity-50">
                            {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                            {isSaving ? "Saving..." : "Save Settings"}
                        </button>
                    </div>
                </div>
            )}

            {/* ── Services Tab ── */}
            {activeTab === "services" && (
                <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
                    {/* ── Service Library ── */}
                    <div className="p-6 sm:p-8 space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                    <Wrench className="h-4 w-4 text-zinc-400" />
                                    Service Library
                                </h3>
                                <p className="text-sm text-zinc-500 mt-0.5">Predefined services you can add to jobs with one click.</p>
                            </div>
                            {services !== undefined && services.length === 0 && (
                                <button
                                    onClick={handleImportPricing}
                                    disabled={isImporting}
                                    className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-xl text-sm font-bold hover:bg-zinc-800 transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-black/10"
                                >
                                    {isImporting ? <Loader2 size={14} className="animate-spin" /> : <Guitar size={14} />}
                                    {isImporting ? "Importing…" : "Import Pricing Guide"}
                                </button>
                            )}
                        </div>

                        {/* Existing services */}
                        <div className="divide-y divide-zinc-100 border border-zinc-200 rounded-xl overflow-hidden">
                            {services === undefined ? (
                                <div className="p-6 text-center"><Loader2 className="animate-spin mx-auto text-zinc-300" size={20} /></div>
                            ) : services.length === 0 ? (
                                <div className="p-6 text-center text-sm text-zinc-400 italic">No services yet. Add one below.</div>
                            ) : services.map((svc) => (
                                editingId === svc._id ? (
                                    /* Inline edit row */
                                    <div key={svc._id} className="p-4 bg-zinc-50 space-y-3">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <input
                                                autoFocus
                                                value={editDraft.name}
                                                onChange={(e) => setEditDraft((p) => ({ ...p, name: e.target.value }))}
                                                placeholder="Service name"
                                                className="px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5"
                                            />
                                            <input
                                                value={editDraft.description}
                                                onChange={(e) => setEditDraft((p) => ({ ...p, description: e.target.value }))}
                                                placeholder="Description (optional)"
                                                className="px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5 text-zinc-500"
                                            />
                                        </div>
                                        <div className="flex items-center gap-3 flex-wrap">
                                            <div className="flex rounded-lg overflow-hidden border border-zinc-200 text-xs font-bold">
                                                {(["fixed", "hourly"] as const).map((t) => (
                                                    <button key={t} type="button"
                                                        onClick={() => setEditDraft((p) => ({ ...p, type: t }))}
                                                        className={cn("px-3 py-1.5 uppercase tracking-wider transition-all", editDraft.type === t ? "bg-black text-white" : "bg-white text-zinc-400 hover:bg-zinc-50")}>
                                                        {t === "fixed" ? "Fixed" : "Hourly"}
                                                    </button>
                                                ))}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <span className="text-xs text-zinc-400">{getCurrencySymbol(settings?.currency)}</span>
                                                <input type="number" step="0.01" min="0"
                                                    value={editDraft.defaultPrice || ""}
                                                    onChange={(e) => setEditDraft((p) => ({ ...p, defaultPrice: parseFloat(e.target.value) || 0 }))}
                                                    className="w-24 px-3 py-1.5 text-sm border border-zinc-200 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-black/5"
                                                    placeholder="0.00" />
                                                {editDraft.type === "hourly" && <span className="text-xs text-zinc-400">/hr</span>}
                                            </div>
                                            <div className="ml-auto flex gap-2">
                                                <button type="button"
                                                    onClick={async () => {
                                                        if (!editDraft.name) return;
                                                        await updateService({ id: svc._id, ...editDraft, checklistItems: editDraft.checklistItems.length ? editDraft.checklistItems : undefined });
                                                        setEditingId(null);
                                                    }}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-black text-white rounded-lg text-xs font-bold hover:bg-zinc-800 transition-all">
                                                    <Check size={12} /> Save
                                                </button>
                                                <button type="button" onClick={() => setEditingId(null)}
                                                    className="p-1.5 text-zinc-400 hover:text-black hover:bg-zinc-100 rounded-lg transition-all">
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        </div>
                                        {/* Completion checklist items */}
                                        <div className="pt-2 border-t border-zinc-200 space-y-2">
                                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                                                <CheckCheck size={11} /> Completion Checklist
                                            </p>
                                            {editDraft.checklistItems.length > 0 && (
                                                <ul className="space-y-1">
                                                    {editDraft.checklistItems.map((item, idx) => (
                                                        <li key={idx} className="flex items-center gap-2 text-sm text-zinc-700 bg-white border border-zinc-100 rounded-lg px-3 py-1.5">
                                                            <span className="flex-1">{item}</span>
                                                            <button type="button"
                                                                onClick={() => setEditDraft((p) => ({ ...p, checklistItems: p.checklistItems.filter((_, i) => i !== idx) }))}
                                                                className="text-zinc-300 hover:text-red-500 transition-colors">
                                                                <X size={12} />
                                                            </button>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                            <div className="flex gap-2">
                                                <input
                                                    value={newChecklistItem}
                                                    onChange={(e) => setNewChecklistItem(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Enter" && newChecklistItem.trim()) {
                                                            e.preventDefault();
                                                            setEditDraft((p) => ({ ...p, checklistItems: [...p.checklistItems, newChecklistItem.trim()] }));
                                                            setNewChecklistItem("");
                                                        }
                                                    }}
                                                    placeholder="Add checklist item…"
                                                    className="flex-1 px-3 py-1.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5"
                                                />
                                                <button type="button"
                                                    disabled={!newChecklistItem.trim()}
                                                    onClick={() => {
                                                        if (!newChecklistItem.trim()) return;
                                                        setEditDraft((p) => ({ ...p, checklistItems: [...p.checklistItems, newChecklistItem.trim()] }));
                                                        setNewChecklistItem("");
                                                    }}
                                                    className="px-3 py-1.5 bg-zinc-900 text-white rounded-lg text-xs font-bold hover:bg-black transition-all disabled:opacity-40">
                                                    <Plus size={12} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    /* Display row */
                                    <div key={svc._id} className="flex items-center justify-between px-4 py-3 group hover:bg-zinc-50/50 transition-colors">
                                        <div className="min-w-0 flex-1 space-y-0.5">
                                            <p className="text-sm font-bold text-zinc-900">{svc.name}</p>
                                            {svc.description && <p className="text-xs text-zinc-400">{svc.description}</p>}
                                        </div>
                                        <div className="flex items-center gap-3 ml-4 shrink-0">
                                            <span className={cn("text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg border",
                                                svc.type === "hourly" ? "bg-blue-50 text-blue-600 border-blue-100" : "bg-zinc-50 text-zinc-500 border-zinc-100")}>
                                                {svc.type === "hourly" ? "Hourly" : "Fixed"}
                                            </span>
                                            <span className="text-sm font-black text-zinc-900 w-20 text-right">
                                                {formatCurrency(svc.defaultPrice, settings?.currency)}{svc.type === "hourly" ? "/hr" : ""}
                                            </span>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button type="button"
                                                    onClick={() => { setEditingId(svc._id); setNewChecklistItem(""); setEditDraft({ name: svc.name, description: svc.description ?? "", type: svc.type as "fixed" | "hourly", defaultPrice: svc.defaultPrice, checklistItems: svc.checklistItems ?? [] }); }}
                                                    className="p-1.5 text-zinc-400 hover:text-black hover:bg-zinc-100 rounded-lg transition-all">
                                                    <Pencil size={13} />
                                                </button>
                                                <button type="button"
                                                    onClick={() => removeService({ id: svc._id })}
                                                    className="p-1.5 text-zinc-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                                                    <Trash2 size={13} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )
                            ))}

                            {/* Add new service row */}
                            <div className="p-4 bg-zinc-50/50 space-y-3">
                                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Add New Service</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <input
                                        value={newService.name}
                                        onChange={(e) => setNewService((p) => ({ ...p, name: e.target.value }))}
                                        placeholder="Service name (e.g. Full Setup)"
                                        className="px-3 py-2 text-sm border border-zinc-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-black/5"
                                    />
                                    <input
                                        value={newService.description}
                                        onChange={(e) => setNewService((p) => ({ ...p, description: e.target.value }))}
                                        placeholder="Description (optional)"
                                        className="px-3 py-2 text-sm border border-zinc-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-black/5 text-zinc-500"
                                    />
                                </div>
                                <div className="flex items-center gap-3 flex-wrap">
                                    <div className="flex rounded-lg overflow-hidden border border-zinc-200 text-xs font-bold">
                                        {(["fixed", "hourly"] as const).map((t) => (
                                            <button key={t} type="button"
                                                onClick={() => setNewService((p) => ({ ...p, type: t }))}
                                                className={cn("px-3 py-1.5 uppercase tracking-wider transition-all", newService.type === t ? "bg-black text-white" : "bg-white text-zinc-400 hover:bg-zinc-50")}>
                                                {t === "fixed" ? "Fixed" : "Hourly"}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <span className="text-xs text-zinc-400">{getCurrencySymbol(settings?.currency)}</span>
                                        <input type="number" step="0.01" min="0"
                                            value={newService.defaultPrice || ""}
                                            onChange={(e) => setNewService((p) => ({ ...p, defaultPrice: parseFloat(e.target.value) || 0 }))}
                                            className="w-24 px-3 py-1.5 text-sm border border-zinc-200 rounded-lg bg-white text-right focus:outline-none focus:ring-2 focus:ring-black/5"
                                            placeholder="0.00" />
                                        {newService.type === "hourly" && <span className="text-xs text-zinc-400">/hr</span>}
                                    </div>
                                    <button type="button"
                                        disabled={!newService.name}
                                        onClick={async () => {
                                            if (!newService.name) return;
                                            await addService(newService);
                                            setNewService(emptyDraft());
                                        }}
                                        className="ml-auto flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg text-xs font-bold hover:bg-zinc-800 transition-all active:scale-95 disabled:opacity-40">
                                        <Plus size={13} /> Add Service
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Job Templates ── */}
                    <div className="p-6 sm:p-8 border-t border-zinc-200 space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-base font-black tracking-tight flex items-center gap-2">
                                    <Guitar size={16} className="text-zinc-400" /> Job Templates
                                </h3>
                                <p className="text-xs text-zinc-500 mt-0.5">Preset job types for one-click creation of common repairs.</p>
                            </div>
                            <button type="button" onClick={() => setShowTemplateForm((v) => !v)}
                                className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-xl text-xs font-bold hover:bg-black transition-all active:scale-95">
                                <Plus size={13} /> New Template
                            </button>
                        </div>

                        {/* Existing templates */}
                        {templates && templates.length > 0 && (
                            <div className="divide-y divide-zinc-100 border border-zinc-100 rounded-xl overflow-hidden">
                                {templates.map((tpl) => (
                                    <div key={tpl._id} className="flex items-center justify-between px-4 py-3 bg-white hover:bg-zinc-50 group transition-colors">
                                        <div className="min-w-0">
                                            <p className="text-sm font-bold text-zinc-900 truncate">{tpl.name}</p>
                                            <p className="text-xs text-zinc-400 truncate">
                                                {tpl.instrumentType || "Any instrument"}
                                                {tpl.description ? ` · ${tpl.description}` : ""}
                                            </p>
                                        </div>
                                        <button type="button" onClick={() => removeTemplate({ id: tpl._id })}
                                            className="p-1.5 text-zinc-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100 shrink-0 ml-2">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Add template form */}
                        {showTemplateForm && (
                            <div className="border border-zinc-200 rounded-xl p-4 space-y-3 bg-zinc-50/50">
                                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">New Template</p>
                                <input
                                    placeholder="Template name (e.g. Standard Guitar Setup)"
                                    value={newTemplate.name}
                                    onChange={(e) => setNewTemplate((p) => ({ ...p, name: e.target.value }))}
                                    className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-black/5"
                                />
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="relative">
                                        <select
                                            value={newTemplate.instrumentType}
                                            onChange={(e) => setNewTemplate((p) => ({ ...p, instrumentType: e.target.value }))}
                                            className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-black/5 text-zinc-500">
                                            <option value="">Any instrument type</option>
                                            {INSTRUMENT_TYPES_LIST.map((t) => <option key={t}>{t}</option>)}
                                        </select>
                                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                                    </div>
                                    <input
                                        placeholder="Short description (optional)"
                                        value={newTemplate.description}
                                        onChange={(e) => setNewTemplate((p) => ({ ...p, description: e.target.value }))}
                                        className="px-3 py-2 text-sm border border-zinc-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-black/5 text-zinc-500"
                                    />
                                </div>
                                <div className="flex items-center gap-2 justify-end">
                                    <button type="button" onClick={() => { setShowTemplateForm(false); setNewTemplate(emptyTemplate()); }}
                                        className="px-3 py-1.5 text-xs font-bold text-zinc-500 hover:text-black transition-colors">Cancel</button>
                                    <button type="button" disabled={!newTemplate.name}
                                        onClick={async () => {
                                            if (!newTemplate.name) return;
                                            await addTemplate({
                                                name: newTemplate.name,
                                                description: newTemplate.description || undefined,
                                                instrumentType: newTemplate.instrumentType || undefined,
                                            });
                                            setNewTemplate(emptyTemplate());
                                            setShowTemplateForm(false);
                                        }}
                                        className="flex items-center gap-2 px-4 py-1.5 bg-black text-white rounded-lg text-xs font-bold hover:bg-zinc-800 transition-all active:scale-95 disabled:opacity-40">
                                        <Check size={13} /> Save Template
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── Intake Tab ── */}
            {activeTab === "intake" && (
                <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
                    <div className="p-6 sm:p-8 space-y-6">
                        <div>
                            <h3 className="text-base font-black tracking-tight flex items-center gap-2">
                                <Link2 size={16} className="text-zinc-400" /> Intake Form
                            </h3>
                            <p className="text-xs text-zinc-500 mt-0.5">Share this link with clients so they can submit a service request online.</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex-1 min-w-0 px-3 py-2.5 border border-zinc-200 rounded-xl bg-zinc-50 text-sm text-zinc-500 truncate select-all">
                                {typeof window !== "undefined" ? window.location.origin + "/request" : "/request"}
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    const url = window.location.origin + "/request";
                                    navigator.clipboard.writeText(url).then(() => {
                                        setCopiedLink(true);
                                        setTimeout(() => setCopiedLink(false), 2000);
                                    });
                                }}
                                className="flex items-center gap-2 px-4 py-2.5 bg-zinc-900 text-white rounded-xl text-xs font-bold hover:bg-black transition-all active:scale-95 shrink-0"
                            >
                                {copiedLink ? <><CheckCheck size={13} /> Copied!</> : <><Link2 size={13} /> Copy Link</>}
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowEmbedModal(true)}
                                className="flex items-center gap-2 px-4 py-2.5 border border-zinc-200 bg-white text-zinc-700 rounded-xl text-xs font-bold hover:bg-zinc-50 transition-all active:scale-95 shrink-0"
                            >
                                <Code2 size={13} /> Embed
                            </button>
                        </div>
                        <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-100">
                            <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">Embed Widget</p>
                            <p className="text-sm text-zinc-600">Add the intake form directly to your website. Click <strong>Embed</strong> to get a self-contained HTML snippet — no dependencies required.</p>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Appearance Tab ── */}
            {activeTab === "appearance" && (
                <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
                    <div className="p-6 sm:p-8 space-y-6">
                        <h3 className="text-base font-black tracking-tight">Appearance</h3>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-zinc-500">Accent Colour</span>
                            <ThemeSelector />
                        </div>
                    </div>
                </div>
            )}

            {/* ── Email Tab ── */}
            {activeTab === "email" && (
                <div className="space-y-6">

                    {/* Sender */}
                    <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6 sm:p-8 space-y-4">
                        <div>
                            <h3 className="text-lg font-semibold">Sender Identity</h3>
                            <p className="text-sm text-zinc-500 mt-1">The name that appears in the "From" field of every email you send.</p>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Sender Name</label>
                            <input
                                type="text"
                                value={emailSenderName}
                                onChange={(e) => setEmailSenderName(e.target.value)}
                                placeholder={companyName || "Your Shop Name"}
                                className="w-full max-w-sm bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-black/5 outline-none transition-all"
                            />
                            <p className="text-xs text-zinc-400">Leave blank to use your company name. The email address itself is set in your Resend account.</p>
                        </div>
                    </div>

                    {/* Per-email templates */}
                    {([
                        {
                            key: "invoice",
                            label: "Invoice Email",
                            description: "Sent to the client when you email an invoice.",
                            subjectState: invoiceEmailSubject,
                            setSubject: setInvoiceEmailSubject,
                            introState: invoiceEmailIntro,
                            setIntro: setInvoiceEmailIntro,
                            defaultSubject: "Invoice {{invoiceNumber}} — {{companyName}}",
                            defaultIntro: "Please find your invoice attached to this email. If you have any questions, feel free to reply directly to this message.",
                            vars: ["{{invoiceNumber}}", "{{companyName}}", "{{clientName}}"],
                        },
                        {
                            key: "quote",
                            label: "Quote Email",
                            description: "Sent to the client when you send a quote for approval.",
                            subjectState: quoteEmailSubject,
                            setSubject: setQuoteEmailSubject,
                            introState: quoteEmailIntro,
                            setIntro: setQuoteEmailIntro,
                            defaultSubject: "Quote for your {{instrumentType}} — {{companyName}}",
                            defaultIntro: "Thank you for bringing in your {{instrumentType}}. Here's a quote for the work we discussed:",
                            vars: ["{{instrumentType}}", "{{companyName}}", "{{clientName}}"],
                        },
                        {
                            key: "jobReady",
                            label: "Job Ready Email",
                            description: "Sent to the client when their instrument is ready for pickup.",
                            subjectState: jobReadyEmailSubject,
                            setSubject: setJobReadyEmailSubject,
                            introState: jobReadyEmailIntro,
                            setIntro: setJobReadyEmailIntro,
                            defaultSubject: "Your {{instrumentType}} is ready for pickup! 🎸",
                            defaultIntro: "We're happy to let you know that your {{instrumentType}} is done and ready for pickup! Come by whenever it suits you.",
                            vars: ["{{instrumentType}}", "{{companyName}}", "{{clientName}}"],
                        },
                        {
                            key: "overdue",
                            label: "Overdue Reminder",
                            description: "Sent to the client when an invoice is overdue.",
                            subjectState: overdueEmailSubject,
                            setSubject: setOverdueEmailSubject,
                            introState: overdueEmailIntro,
                            setIntro: setOverdueEmailIntro,
                            defaultSubject: "Payment reminder: Invoice {{invoiceNumber}} — {{companyName}}",
                            defaultIntro: "We'd like to remind you that invoice {{invoiceNumber}} was due on {{dueDate}} and is still outstanding.",
                            vars: ["{{invoiceNumber}}", "{{companyName}}", "{{clientName}}", "{{dueDate}}"],
                        },
                    ]).map((tpl) => (
                        <div key={tpl.key} className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6 sm:p-8 space-y-5">
                            <div>
                                <h3 className="text-base font-semibold">{tpl.label}</h3>
                                <p className="text-sm text-zinc-500 mt-0.5">{tpl.description}</p>
                            </div>

                            {/* Variables */}
                            <div className="flex flex-wrap gap-1.5">
                                {tpl.vars.map((v) => (
                                    <code key={v} className="text-[11px] font-mono bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-lg border border-zinc-200">{v}</code>
                                ))}
                                <span className="text-[11px] text-zinc-400 self-center ml-1">— available variables</span>
                            </div>

                            {/* Subject */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Subject Line</label>
                                <input
                                    type="text"
                                    value={tpl.subjectState}
                                    onChange={(e) => tpl.setSubject(e.target.value)}
                                    placeholder={tpl.defaultSubject}
                                    className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-black/5 outline-none transition-all"
                                />
                            </div>

                            {/* Intro */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Opening Paragraph</label>
                                <textarea
                                    rows={3}
                                    value={tpl.introState}
                                    onChange={(e) => tpl.setIntro(e.target.value)}
                                    placeholder={tpl.defaultIntro}
                                    className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-black/5 outline-none transition-all resize-none"
                                />
                                <p className="text-xs text-zinc-400">Leave blank to use the default text shown as placeholder.</p>
                            </div>
                        </div>
                    ))}

                    {/* Save */}
                    <div className="flex justify-end">
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="flex items-center gap-2 bg-black text-white px-6 py-3 rounded-2xl text-sm font-bold hover:bg-zinc-800 transition-all active:scale-95 disabled:opacity-50"
                        >
                            {isSaving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : <><Save className="h-4 w-4" /> Save Changes</>}
                        </button>
                    </div>
                </div>
            )}
            {/* ── Assets Tab ── */}
            {activeTab === "assets" && (
                <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
                    <div className="p-6 sm:p-8 space-y-6">

                        {/* Header */}
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                    <FolderOpen className="h-4 w-4 text-zinc-400" />
                                    Asset Library
                                </h3>
                                <p className="text-sm text-zinc-500 mt-0.5">Store reference documents, blank checklists, wiring diagrams and other files.</p>
                            </div>
                            <button
                                onClick={() => { setShowAssetForm(true); setAssetDraft({ name: "", category: "checklist" }); setPendingAssetFile(null); }}
                                className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-xl text-sm font-bold hover:bg-zinc-800 transition-all active:scale-95 shadow-lg shadow-black/10"
                            >
                                <Upload size={14} /> Upload Asset
                            </button>
                        </div>

                        {/* Upload form */}
                        {showAssetForm && (
                            <div className="border border-zinc-200 rounded-xl p-4 space-y-4 bg-zinc-50/50">
                                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">New Asset</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <input
                                        autoFocus
                                        placeholder="Asset name (e.g. Strat Wiring Diagram)"
                                        value={assetDraft.name}
                                        onChange={(e) => setAssetDraft((p) => ({ ...p, name: e.target.value }))}
                                        className="px-3 py-2 text-sm border border-zinc-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-black/5"
                                    />
                                    <div className="relative">
                                        <select
                                            value={assetDraft.category}
                                            onChange={(e) => setAssetDraft((p) => ({ ...p, category: e.target.value }))}
                                            className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-black/5"
                                        >
                                            <option value="checklist">Checklist</option>
                                            <option value="wiring">Wiring Diagram</option>
                                            <option value="reference">Reference</option>
                                            <option value="other">Other</option>
                                        </select>
                                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                                    </div>
                                </div>

                                {/* File picker */}
                                <div
                                    onClick={() => assetFileRef.current?.click()}
                                    className="border-2 border-dashed border-zinc-200 rounded-xl p-6 text-center cursor-pointer hover:border-zinc-400 hover:bg-zinc-50 transition-all"
                                >
                                    {pendingAssetFile ? (
                                        <div className="flex items-center justify-center gap-2 text-sm font-bold text-zinc-700">
                                            <FileText size={16} className="text-zinc-400" />
                                            {pendingAssetFile.name}
                                            <span className="font-normal text-zinc-400">({(pendingAssetFile.size / 1024).toFixed(0)} KB)</span>
                                        </div>
                                    ) : (
                                        <div className="text-sm text-zinc-400 space-y-1">
                                            <Upload size={20} className="mx-auto text-zinc-300" />
                                            <p>Click to select a file</p>
                                            <p className="text-xs">PDF, PNG, JPG, SVG — up to 20 MB</p>
                                        </div>
                                    )}
                                </div>
                                <input
                                    ref={assetFileRef}
                                    type="file"
                                    accept=".pdf,.png,.jpg,.jpeg,.svg,.gif,.webp"
                                    className="hidden"
                                    onChange={(e) => { const f = e.target.files?.[0]; if (f) { setPendingAssetFile(f); if (!assetDraft.name) setAssetDraft((p) => ({ ...p, name: f.name.replace(/\.[^.]+$/, "") })); } }}
                                />

                                <div className="flex items-center gap-2 justify-end">
                                    <button type="button" onClick={() => { setShowAssetForm(false); setPendingAssetFile(null); }}
                                        className="px-3 py-1.5 text-xs font-bold text-zinc-500 hover:text-black transition-colors">Cancel</button>
                                    <button
                                        type="button"
                                        disabled={!assetDraft.name || !pendingAssetFile || isUploadingAsset}
                                        onClick={async () => {
                                            if (!assetDraft.name || !pendingAssetFile) return;
                                            setIsUploadingAsset(true);
                                            try {
                                                const uploadUrl = await generateUploadUrl();
                                                const res = await fetch(uploadUrl, {
                                                    method: "POST",
                                                    headers: { "Content-Type": pendingAssetFile.type },
                                                    body: pendingAssetFile,
                                                });
                                                const { storageId } = await res.json();
                                                await addAsset({
                                                    name: assetDraft.name,
                                                    category: assetDraft.category,
                                                    storageId,
                                                    fileName: pendingAssetFile.name,
                                                    fileType: pendingAssetFile.type,
                                                    fileSize: pendingAssetFile.size,
                                                });
                                                setShowAssetForm(false);
                                                setPendingAssetFile(null);
                                                setAssetDraft({ name: "", category: "checklist" });
                                            } catch (err) {
                                                console.error(err);
                                            } finally {
                                                setIsUploadingAsset(false);
                                            }
                                        }}
                                        className="flex items-center gap-2 px-4 py-1.5 bg-black text-white rounded-lg text-xs font-bold hover:bg-zinc-800 transition-all active:scale-95 disabled:opacity-40"
                                    >
                                        {isUploadingAsset ? <><Loader2 size={12} className="animate-spin" /> Uploading…</> : <><Check size={12} /> Save Asset</>}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Category filter */}
                        {assets && assets.length > 0 && (
                            <div className="flex items-center gap-2 flex-wrap">
                                {(["all", "checklist", "wiring", "reference", "other"] as const).map((cat) => {
                                    const count = cat === "all" ? assets.length : assets.filter((a) => a.category === cat).length;
                                    if (count === 0 && cat !== "all") return null;
                                    return (
                                        <button key={cat} type="button"
                                            onClick={() => setAssetCategory(cat)}
                                            className={cn(
                                                "px-3 py-1 text-xs font-bold rounded-full border transition-all",
                                                assetCategory === cat
                                                    ? "bg-black text-white border-black"
                                                    : "bg-white text-zinc-500 border-zinc-200 hover:border-zinc-400"
                                            )}>
                                            {cat === "all" ? "All" : cat === "wiring" ? "Wiring Diagrams" : cat.charAt(0).toUpperCase() + cat.slice(1) + "s"}
                                            <span className={cn("ml-1.5 text-[10px]", assetCategory === cat ? "text-zinc-300" : "text-zinc-400")}>{count}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {/* Asset list */}
                        {assets === undefined ? (
                            <div className="py-10 text-center"><Loader2 className="animate-spin mx-auto text-zinc-300" size={20} /></div>
                        ) : assets.length === 0 ? (
                            <div className="py-12 text-center space-y-2">
                                <FolderOpen size={32} className="mx-auto text-zinc-200" />
                                <p className="text-sm text-zinc-400 italic">No assets yet. Upload your first file above.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-zinc-100 border border-zinc-200 rounded-xl overflow-hidden">
                                {assets
                                    .filter((a) => assetCategory === "all" || a.category === assetCategory)
                                    .map((asset) => {
                                        const isImage = asset.fileType.startsWith("image/");
                                        const isPdf = asset.fileType === "application/pdf";
                                        const catMeta: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
                                            checklist: { label: "Checklist",      cls: "bg-emerald-50 text-emerald-700 border-emerald-100", icon: <CheckCheck size={11} /> },
                                            wiring:    { label: "Wiring Diagram", cls: "bg-blue-50 text-blue-700 border-blue-100",           icon: <Zap size={11} /> },
                                            reference: { label: "Reference",      cls: "bg-amber-50 text-amber-700 border-amber-100",         icon: <FileText size={11} /> },
                                            other:     { label: "Other",          cls: "bg-zinc-50 text-zinc-500 border-zinc-200",            icon: <File size={11} /> },
                                        };
                                        const meta = catMeta[asset.category] ?? catMeta.other;
                                        return (
                                            <div key={asset._id} className="flex items-center gap-4 px-4 py-3 hover:bg-zinc-50/50 transition-colors group">
                                                {/* File icon / thumbnail */}
                                                <div className="w-10 h-10 rounded-lg bg-zinc-100 border border-zinc-200 flex items-center justify-center shrink-0 overflow-hidden">
                                                    {isImage && asset.url ? (
                                                        <img src={asset.url} alt={asset.name} className="w-full h-full object-cover" />
                                                    ) : isPdf ? (
                                                        <FileText size={18} className="text-red-400" />
                                                    ) : (
                                                        <File size={18} className="text-zinc-400" />
                                                    )}
                                                </div>

                                                {/* Info */}
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-bold text-zinc-900 truncate">{asset.name}</p>
                                                    <p className="text-xs text-zinc-400 truncate">{asset.fileName} · {(asset.fileSize / 1024).toFixed(0)} KB</p>
                                                </div>

                                                {/* Category badge */}
                                                <span className={cn("hidden sm:flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg border shrink-0", meta.cls)}>
                                                    {meta.icon} {meta.label}
                                                </span>

                                                {/* Actions */}
                                                <div className="flex items-center gap-1 shrink-0">
                                                    {asset.url && (
                                                        <a href={asset.url} target="_blank" rel="noopener noreferrer" download={asset.fileName}
                                                            className="p-1.5 text-zinc-400 hover:text-black hover:bg-zinc-100 rounded-lg transition-all"
                                                            title="Download">
                                                            <Download size={14} />
                                                        </a>
                                                    )}
                                                    <button type="button"
                                                        onClick={async () => {
                                                            if (!confirm(`Delete "${asset.name}"?`)) return;
                                                            await removeAsset({ id: asset._id });
                                                        }}
                                                        className="p-1.5 text-zinc-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                                        title="Delete">
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>

        {/* Embed Code Modal */}
        {showEmbedModal && (
            <div className="modal-overlay flex items-center justify-center p-4">
                <div className="absolute inset-0 modal-backdrop" onClick={() => setShowEmbedModal(false)} />
                <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
                    <div className="p-5 border-b border-zinc-100 flex items-center justify-between">
                        <div>
                            <h3 className="text-base font-black tracking-tight">Embed Widget</h3>
                            <p className="text-xs text-zinc-500 mt-0.5">Paste this into your website's HTML where you want the form to appear.</p>
                        </div>
                        <button onClick={() => setShowEmbedModal(false)} className="p-1.5 hover:bg-zinc-100 rounded-xl text-zinc-400 hover:text-black transition-colors">
                            <X size={18} />
                        </button>
                    </div>
                    <div className="flex-1 overflow-auto p-4">
                        <pre className="text-[11px] leading-relaxed bg-zinc-950 text-zinc-300 rounded-xl p-4 overflow-auto whitespace-pre-wrap break-all select-all">{embedCode}</pre>
                    </div>
                    <div className="p-4 border-t border-zinc-100 flex justify-end">
                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(embedCode).then(() => {
                                    setCopiedEmbed(true);
                                    setTimeout(() => setCopiedEmbed(false), 2000);
                                });
                            }}
                            className="flex items-center gap-2 px-5 py-2.5 bg-zinc-900 text-white rounded-xl text-sm font-bold hover:bg-black transition-all active:scale-95"
                        >
                            {copiedEmbed ? <><CheckCheck size={14} /> Copied!</> : <><Code2 size={14} /> Copy Code</>}
                        </button>
                    </div>
                </div>
            </div>
        )}
        </>
    );
}
