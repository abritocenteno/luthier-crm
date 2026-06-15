"use client";

import { useMemo, useRef, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import {
    Library as LibraryIcon, Music2, FileText, Image as ImageIcon, File as FileIcon,
    Upload, Download, Trash2, ExternalLink, Loader2, X, Cable, BookOpen, ClipboardList,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TUNINGS, SetupCategory } from "@/lib/setupSpecs";

const Card = ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={cn("bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden", className)}>{children}</div>
);

// ── Tunings reference ──────────────────────────────────────────────────────

const TUNING_FILTERS: { key: SetupCategory | "all"; label: string }[] = [
    { key: "all", label: "All" },
    { key: "guitar", label: "Guitar" },
    { key: "bass", label: "Bass" },
    { key: "ukulele", label: "Ukulele" },
];

/** Split a scientific-pitch note ("F#3") into letter + octave for display. */
function splitNote(note: string): { letter: string; octave: string } {
    const m = note.match(/^([A-G][#b]?)(-?\d+)$/);
    return m ? { letter: m[1], octave: m[2] } : { letter: note, octave: "" };
}

function TuningsTab() {
    const [filter, setFilter] = useState<SetupCategory | "all">("all");
    const tunings = useMemo(
        () => TUNINGS.filter((t) => filter === "all" || t.category === filter),
        [filter]
    );

    return (
        <div className="space-y-5">
            <div className="flex flex-wrap gap-2">
                {TUNING_FILTERS.map((f) => (
                    <button
                        key={f.key}
                        onClick={() => setFilter(f.key)}
                        className={cn(
                            "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all",
                            filter === f.key ? "bg-black text-white" : "bg-white border border-zinc-200 text-zinc-500 hover:text-black hover:border-zinc-300"
                        )}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tunings.map((t) => (
                    <Card key={t.name}>
                        <div className="p-5 space-y-4">
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center text-white shrink-0">
                                        <Music2 size={15} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-zinc-900 leading-tight">{t.name}</p>
                                        <p className="text-[11px] text-zinc-400 capitalize">{t.category}</p>
                                    </div>
                                </div>
                                <span className="text-[10px] font-bold text-zinc-500 bg-zinc-50 border border-zinc-200 rounded-lg px-2 py-1 whitespace-nowrap">
                                    {t.gaugeLabel}
                                </span>
                            </div>

                            <div className="flex flex-wrap gap-1.5">
                                {t.notes.map((n, i) => {
                                    const { letter, octave } = splitNote(n);
                                    return (
                                        <span key={i} className="inline-flex items-baseline gap-0.5 px-2.5 py-1.5 rounded-lg bg-zinc-50 border border-zinc-100">
                                            <span className="text-sm font-bold text-zinc-800">{letter}</span>
                                            <span className="text-[10px] text-zinc-400">{octave}</span>
                                        </span>
                                    );
                                })}
                            </div>
                            <p className="text-[10px] text-zinc-400 uppercase tracking-widest">Low → High</p>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}

// ── File library (assets) ──────────────────────────────────────────────────

const FILE_FILTERS: { key: string; label: string; icon: React.ReactNode }[] = [
    { key: "all", label: "All", icon: <LibraryIcon size={13} /> },
    { key: "wiring", label: "Wiring", icon: <Cable size={13} /> },
    { key: "reference", label: "Reference", icon: <BookOpen size={13} /> },
    { key: "checklist", label: "Checklists", icon: <ClipboardList size={13} /> },
    { key: "other", label: "Other", icon: <FileIcon size={13} /> },
];

const CATEGORY_LABELS: Record<string, string> = {
    wiring: "Wiring Diagram", reference: "Reference", checklist: "Checklist", other: "Other",
};

function fileIcon(fileType: string) {
    if (fileType.startsWith("image/")) return <ImageIcon size={18} className="text-violet-500" />;
    if (fileType === "application/pdf") return <FileText size={18} className="text-red-500" />;
    return <FileIcon size={18} className="text-zinc-400" />;
}

function formatBytes(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FilesTab() {
    const assets = useQuery(api.assets.list);
    const generateUploadUrl = useMutation(api.files.generateUploadUrl);
    const addAsset = useMutation(api.assets.add);
    const removeAsset = useMutation(api.assets.remove);

    const [filter, setFilter] = useState("all");
    const [showForm, setShowForm] = useState(false);
    const [draft, setDraft] = useState({ name: "", category: "wiring" });
    const [pendingFile, setPendingFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [downloadingId, setDownloadingId] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const filtered = useMemo(
        () => (assets ?? []).filter((a) => filter === "all" || a.category === filter),
        [assets, filter]
    );

    const handleUpload = async () => {
        if (!draft.name.trim() || !pendingFile) return;
        setUploading(true);
        try {
            const url = await generateUploadUrl();
            const res = await fetch(url, { method: "POST", headers: { "Content-Type": pendingFile.type }, body: pendingFile });
            const { storageId } = await res.json();
            await addAsset({
                name: draft.name.trim(),
                category: draft.category,
                storageId,
                fileName: pendingFile.name,
                fileType: pendingFile.type || "application/octet-stream",
                fileSize: pendingFile.size,
            });
            setShowForm(false);
            setPendingFile(null);
            setDraft({ name: "", category: "wiring" });
        } finally {
            setUploading(false);
        }
    };

    const handleDownload = async (url: string, fileName: string, id: string) => {
        setDownloadingId(id);
        try {
            const res = await fetch(url);
            const blob = await res.blob();
            const objectUrl = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = objectUrl;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(objectUrl);
        } finally {
            setDownloadingId(null);
        }
    };

    const handleDelete = async (id: Id<"assets">, name: string) => {
        if (!confirm(`Delete "${name}"? This can't be undone.`)) return;
        await removeAsset({ id });
    };

    return (
        <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                    {FILE_FILTERS.map((f) => (
                        <button
                            key={f.key}
                            onClick={() => setFilter(f.key)}
                            className={cn(
                                "flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all",
                                filter === f.key ? "bg-black text-white" : "bg-white border border-zinc-200 text-zinc-500 hover:text-black hover:border-zinc-300"
                            )}
                        >
                            {f.icon}{f.label}
                        </button>
                    ))}
                </div>
                <button
                    onClick={() => { setShowForm(true); setDraft({ name: "", category: filter === "all" ? "wiring" : filter }); setPendingFile(null); }}
                    className="flex items-center gap-1.5 px-4 py-2 bg-zinc-900 text-white rounded-xl text-xs font-bold hover:bg-black transition-all active:scale-95"
                >
                    <Upload size={14} /> Upload
                </button>
            </div>

            {showForm && (
                <Card>
                    <div className="p-5 space-y-3">
                        <div className="flex items-center justify-between">
                            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">New File</p>
                            <button onClick={() => { setShowForm(false); setPendingFile(null); }} className="text-zinc-400 hover:text-black"><X size={16} /></button>
                        </div>
                        <input
                            placeholder="Name (e.g. Strat HSS Wiring Diagram)"
                            value={draft.name}
                            onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))}
                            className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:border-black"
                        />
                        <div className="flex flex-wrap gap-3">
                            <select
                                value={draft.category}
                                onChange={(e) => setDraft((p) => ({ ...p, category: e.target.value }))}
                                className="px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:border-black"
                            >
                                <option value="wiring">Wiring Diagram</option>
                                <option value="reference">Reference</option>
                                <option value="checklist">Checklist</option>
                                <option value="other">Other</option>
                            </select>
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="flex items-center gap-2 px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm text-zinc-600 hover:border-black transition-all"
                            >
                                <Upload size={14} />
                                {pendingFile ? (
                                    <span className="font-semibold text-zinc-800">{pendingFile.name} <span className="font-normal text-zinc-400">({formatBytes(pendingFile.size)})</span></span>
                                ) : "Choose file"}
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                className="hidden"
                                onChange={(e) => { const f = e.target.files?.[0]; if (f) { setPendingFile(f); if (!draft.name) setDraft((p) => ({ ...p, name: f.name.replace(/\.[^.]+$/, "") })); } }}
                            />
                        </div>
                        <div className="flex justify-end gap-2 pt-1">
                            <button onClick={() => { setShowForm(false); setPendingFile(null); }} className="px-3 py-1.5 text-zinc-500 rounded-xl text-xs font-bold hover:bg-zinc-100">Cancel</button>
                            <button
                                onClick={handleUpload}
                                disabled={!draft.name.trim() || !pendingFile || uploading}
                                className="flex items-center gap-1.5 px-4 py-1.5 bg-zinc-900 text-white rounded-xl text-xs font-bold hover:bg-black transition-all active:scale-95 disabled:opacity-50"
                            >
                                {uploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                                {uploading ? "Uploading…" : "Upload"}
                            </button>
                        </div>
                    </div>
                </Card>
            )}

            {assets === undefined ? (
                <div className="flex justify-center py-16"><Loader2 className="animate-spin text-zinc-300" size={28} /></div>
            ) : filtered.length === 0 ? (
                <Card>
                    <div className="py-16 text-center space-y-2">
                        <div className="w-12 h-12 bg-zinc-50 rounded-xl flex items-center justify-center text-zinc-300 mx-auto"><LibraryIcon size={22} /></div>
                        <p className="font-bold text-zinc-700">No files here yet</p>
                        <p className="text-sm text-zinc-400">Upload wiring diagrams, reference docs or blank checklists to keep them at the bench.</p>
                    </div>
                </Card>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map((a) => (
                        <Card key={a._id}>
                            <div className="p-4 space-y-3">
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-zinc-50 border border-zinc-100 flex items-center justify-center shrink-0">
                                        {fileIcon(a.fileType)}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="font-bold text-sm text-zinc-900 truncate" title={a.name}>{a.name}</p>
                                        <p className="text-[11px] text-zinc-400 truncate">{a.fileName}</p>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-zinc-500 bg-zinc-50 border border-zinc-200 rounded-lg px-2 py-1">
                                        {CATEGORY_LABELS[a.category] ?? a.category}
                                    </span>
                                    <span className="text-[10px] text-zinc-400">{formatBytes(a.fileSize)}</span>
                                </div>
                                <div className="flex items-center gap-1.5 pt-1">
                                    {a.url && (
                                        <a
                                            href={a.url} target="_blank" rel="noopener noreferrer"
                                            className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-bold text-zinc-600 hover:border-black hover:text-black transition-all"
                                            title="Open in new tab"
                                        >
                                            <ExternalLink size={12} /> View
                                        </a>
                                    )}
                                    {a.url && (
                                        <button
                                            onClick={() => handleDownload(a.url!, a.fileName, a._id)}
                                            disabled={downloadingId === a._id}
                                            className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-bold text-zinc-600 hover:border-black hover:text-black transition-all disabled:opacity-50"
                                            title="Download"
                                        >
                                            {downloadingId === a._id ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />} Save
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleDelete(a._id, a.name)}
                                        className="px-2 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-400 hover:border-red-300 hover:text-red-500 transition-all"
                                        title="Delete"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}

// ── Page ────────────────────────────────────────────────────────────────────

export default function LibraryPage() {
    const [tab, setTab] = useState<"tunings" | "files">("tunings");

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center text-white">
                    <LibraryIcon size={20} />
                </div>
                <div>
                    <h1 className="text-2xl font-black tracking-tight text-zinc-900">Library</h1>
                    <p className="text-sm text-zinc-500">Tuning reference and your workshop files.</p>
                </div>
            </div>

            <div className="flex gap-1 bg-zinc-100 p-1 rounded-xl w-fit">
                <button
                    onClick={() => setTab("tunings")}
                    className={cn("flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition-all", tab === "tunings" ? "bg-white text-black shadow-sm" : "text-zinc-500 hover:text-black")}
                >
                    <Music2 size={15} /> Tunings
                </button>
                <button
                    onClick={() => setTab("files")}
                    className={cn("flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition-all", tab === "files" ? "bg-white text-black shadow-sm" : "text-zinc-500 hover:text-black")}
                >
                    <FileText size={15} /> Files
                </button>
            </div>

            {tab === "tunings" ? <TuningsTab /> : <FilesTab />}
        </div>
    );
}
