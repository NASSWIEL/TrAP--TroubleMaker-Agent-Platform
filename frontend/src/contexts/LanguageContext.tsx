"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { en, fr, type Lang } from "@/lib/i18n/translations";

interface LanguageContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string, replacements?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: "en",
  setLang: () => {},
  t: (key) => key,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // Default to "en" — safe on server; localStorage read happens in useEffect
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const stored = localStorage.getItem("trap-lang") as Lang | null;
    if (stored === "fr" || stored === "en") {
      setLangState(stored);
      document.documentElement.lang = stored;
    }
  }, []);

  const setLang = (newLang: Lang) => {
    setLangState(newLang);
    localStorage.setItem("trap-lang", newLang);
    document.documentElement.lang = newLang;
  };

  const t = (key: string, replacements?: Record<string, string | number>): string => {
    const dict = lang === "fr" ? fr : en;
    let str = (dict as Record<string, string>)[key] ?? key;
    if (replacements) {
      Object.entries(replacements).forEach(([k, v]) => {
        str = str.replace(`{${k}}`, String(v));
      });
    }
    return str;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
