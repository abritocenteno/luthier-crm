"use client";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const THEMES = [
  { key: "zinc",    label: "Zinc",    color: "#000000" },
  { key: "blue",    label: "Blue",    color: "#2563eb" },
  { key: "emerald", label: "Emerald", color: "#059669" },
  { key: "amber",   label: "Amber",   color: "#d97706" },
  { key: "rose",    label: "Rose",    color: "#e11d48" },
] as const;

type ThemeKey = typeof THEMES[number]["key"];

export function ThemeSelector() {
    const [active, setActive] = useState<ThemeKey>("zinc");
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const saved = (localStorage.getItem("accent-theme") ?? "zinc") as ThemeKey;
        setActive(saved);
        applyTheme(saved);
    }, []);

    function applyTheme(key: ThemeKey) {
        const el = document.documentElement;
        THEMES.forEach((t) => el.classList.remove(`theme-${t.key}`));
        if (key !== "zinc") el.classList.add(`theme-${key}`);
        localStorage.setItem("accent-theme", key);
    }

    function pick(key: ThemeKey) {
        setActive(key);
        applyTheme(key);
    }

    if (!mounted) return <div className="flex gap-2 h-8" />;

    return (
        <div className="flex items-center gap-2">
            {THEMES.map((t) => (
                <button
                    key={t.key}
                    title={t.label}
                    onClick={() => pick(t.key)}
                    className={cn(
                        "w-7 h-7 rounded-full border-2 transition-all",
                        active === t.key ? "border-zinc-400 scale-110" : "border-transparent hover:scale-105"
                    )}
                    style={{ backgroundColor: t.color }}
                />
            ))}
        </div>
    );
}
