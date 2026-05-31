"use client";
import { useLanguage } from "@/contexts/LanguageContext";
import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

interface LanguageSwitcherProps {
  style?: CSSProperties;
  className?: string;
}

export function LanguageSwitcher({ style, className }: LanguageSwitcherProps) {
  const { lang, setLang } = useLanguage();

  return (
    <div
      className={cn("inline-flex items-center rounded-lg border border-stone-200 bg-white overflow-hidden shadow-sm", className)}
      style={style}
    >
      <button
        onClick={() => setLang("en")}
        aria-pressed={lang === "en"}
        className={cn(
          "px-3 py-1.5 text-xs font-semibold transition-colors border-r border-stone-200",
          lang === "en"
            ? "bg-navy-700 text-white"
            : "text-stone-600 hover:bg-stone-50"
        )}
      >
        EN
      </button>
      <button
        onClick={() => setLang("fr")}
        aria-pressed={lang === "fr"}
        className={cn(
          "px-3 py-1.5 text-xs font-semibold transition-colors",
          lang === "fr"
            ? "bg-navy-700 text-white"
            : "text-stone-600 hover:bg-stone-50"
        )}
      >
        FR
      </button>
    </div>
  );
}
