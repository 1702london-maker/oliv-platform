"use client";
import { useState, useEffect } from "react";

const T = {
  en: { eyebrow: "Wholesale Programme", title: "Wholesale Login", footer: "Not yet a wholesale partner?", apply: "Apply here" },
  de: { eyebrow: "Großhandels­programm", title: "Großhandel Login", footer: "Noch kein Großhandelspartner?", apply: "Hier bewerben" },
};

function useLang(): "en" | "de" {
  const [lang, setLang] = useState<"en" | "de">("de");
  useEffect(() => {
    const read = () => { try { setLang(localStorage.getItem("ohs-lang") === "en" ? "en" : "de"); } catch { /**/ } };
    read();
    const obs = new MutationObserver(() => { const a = document.body.dataset.ohsLang; if (a) setLang(a === "en" ? "en" : "de"); });
    obs.observe(document.body, { attributes: true, attributeFilter: ["data-ohs-lang"] });
    return () => obs.disconnect();
  }, []);
  return lang;
}

export function WholesaleLoginHeader() {
  const t = T[useLang()];
  return (
    <>
      <p className="ohs-auth-eyebrow">{t.eyebrow}</p>
      <h1 className="ohs-auth-title">{t.title}</h1>
    </>
  );
}

export function WholesaleLoginFooter() {
  const t = T[useLang()];
  return <p className="ohs-auth-footer-text">{t.footer} <a href="/wholesale?apply=1">{t.apply}</a></p>;
}
