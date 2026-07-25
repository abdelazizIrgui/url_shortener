import { createContext, useContext, useEffect, useState } from "react";
import { translations } from "../i18n.js";

const LangContext = createContext(null);

const STORAGE_KEY = "linkblick_lang";

export function LangProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem(STORAGE_KEY) || "en");
  const t = translations[lang];

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = t.dir;
    localStorage.setItem(STORAGE_KEY, lang);
  }, [lang, t.dir]);

  return <LangContext.Provider value={{ lang, setLang, t }}>{children}</LangContext.Provider>;
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang must be used within LangProvider");
  return ctx;
}
