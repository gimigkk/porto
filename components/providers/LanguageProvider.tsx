"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type Language = "en" | "id";

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>("en");

  useEffect(() => {
    const savedLang = localStorage.getItem("portfolio-lang") as Language | null;
    if (savedLang === "en" || savedLang === "id") {
      setLangState(savedLang);
    }
  }, []);

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem("portfolio-lang", newLang);
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}

export function Trans({ en, id, children, lang }: { en?: React.ReactNode; id?: React.ReactNode; children?: React.ReactNode; lang?: Language }) {
  const { lang: currentLang } = useLanguage();
  
  // If the user uses <Trans lang="en">...</Trans>
  if (lang) {
    return currentLang === lang ? <>{children}</> : null;
  }
  
  // If the user uses <Trans en="..." id="..." /> (inline strings)
  if (currentLang === "en" && en) return <>{en}</>;
  if (currentLang === "id" && id) return <>{id}</>;
  
  return null;
}
