"use client";
import { useLanguage } from "@/contexts/LanguageContext";
import type { CSSProperties } from "react";

interface LanguageSwitcherProps {
  style?: CSSProperties;
  className?: string;
}

export function LanguageSwitcher({ style, className }: LanguageSwitcherProps) {
  const { lang, setLang } = useLanguage();

  const base: CSSProperties = {
    padding: "4px 10px",
    fontSize: "12px",
    fontWeight: 600,
    cursor: "pointer",
    border: "1px solid #ccc",
    transition: "background-color 0.2s, color 0.2s",
    lineHeight: 1,
  };

  const active: CSSProperties = {
    backgroundColor: "#2B2B2B",
    color: "#fff",
    borderColor: "#2B2B2B",
  };

  const inactive: CSSProperties = {
    backgroundColor: "#fff",
    color: "#555",
  };

  return (
    <div
      className={className}
      style={{ display: "inline-flex", alignItems: "center", ...style }}
    >
      <button
        onClick={() => setLang("en")}
        style={{
          ...base,
          ...(lang === "en" ? active : inactive),
          borderRadius: "4px 0 0 4px",
          borderRight: "none",
        }}
        aria-pressed={lang === "en"}
      >
        EN
      </button>
      <button
        onClick={() => setLang("fr")}
        style={{
          ...base,
          ...(lang === "fr" ? active : inactive),
          borderRadius: "0 4px 4px 0",
        }}
        aria-pressed={lang === "fr"}
      >
        FR
      </button>
    </div>
  );
}
