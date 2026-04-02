"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
    const [isDark, setIsDark] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        setIsDark(document.documentElement.classList.contains("dark"));
    }, []);

    const toggle = () => {
        const next = !isDark;
        setIsDark(next);
        document.documentElement.classList.toggle("dark", next);
        localStorage.setItem("theme", next ? "dark" : "light");
    };

    if (!mounted) return <div className="w-9 h-9" />;

    return (
        <button
            onClick={toggle}
            aria-label="Toggle dark mode"
            className={cn(
                "relative w-9 h-9 rounded-xl flex items-center justify-center transition-all",
                "text-zinc-500 hover:text-black hover:bg-zinc-100",
                "dark:text-zinc-400 dark:hover:text-zinc-50 dark:hover:bg-zinc-800"
            )}
        >
            <Sun
                size={18}
                className={cn(
                    "absolute transition-all duration-300",
                    isDark ? "opacity-100 rotate-0 scale-100" : "opacity-0 rotate-90 scale-50"
                )}
            />
            <Moon
                size={18}
                className={cn(
                    "absolute transition-all duration-300",
                    isDark ? "opacity-0 -rotate-90 scale-50" : "opacity-100 rotate-0 scale-100"
                )}
            />
        </button>
    );
}
