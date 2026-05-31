"use client";

import { useEffect } from "react";
import { GERMAN_COPY_PAIRS, applyManualPageOverrides, translateAttributes } from "./germanCopy";

const SKIP: Record<string, boolean> = {
  SCRIPT: true, STYLE: true, NOSCRIPT: true, TEXTAREA: true, INPUT: true
};

function removeSpanishLocaleOptions(root: ParentNode) {
  root.querySelectorAll('select[name="locale_code"] option[value="es"]').forEach(option => option.remove());
}

function translateNode(node: Node, pairs: [string, string][]) {
  if (node.nodeType === 3) {
    let v = (node as Text).nodeValue || "";
    if (!v.trim()) return;
    for (const [en, de] of pairs) {
      if (v.includes(en)) v = v.split(en).join(de);
    }
    if (v !== node.nodeValue) (node as Text).nodeValue = v;
  } else if (node.nodeType === 1) {
    const element = node as Element;
    translateAttributes(element, pairs);
    if (!SKIP[element.tagName]) {
      for (let c = node.firstChild; c; c = c.nextSibling) translateNode(c, pairs);
    }
  }
}

export function TranslationClient() {
  useEffect(() => {
    removeSpanishLocaleOptions(document);

    const savedLang = (() => {
      try { return localStorage.getItem("ohs-lang") || "de"; } catch { return "de"; }
    })();

    // Always translate — removing the alreadyTranslated guard that caused
    // client-side navigation to skip translation (body.dataset persists across pages)
    if (savedLang === "de") {
      applyManualPageOverrides(document.body, "en");
      translateNode(document.body, GERMAN_COPY_PAIRS);
      applyManualPageOverrides(document.body, "de");
      document.body.dataset.globalLang = "de";
    } else {
      applyManualPageOverrides(document.body, "en");
      document.body.dataset.globalLang = "en";
    }

    // Always sync selector display to match actual language (HTML hardcodes EN as selected)
    document.querySelectorAll('select[name="locale_code"]').forEach(s => {
      (s as HTMLSelectElement).value = savedLang === "de" ? "de" : "en";
    });

    // Language selector binding (for non-ShopifyClone pages)
    document.querySelectorAll('select[name="locale_code"]').forEach(sel => {
      if ((sel as HTMLElement).dataset.bound) return;
      (sel as HTMLElement).dataset.bound = "1";
      sel.addEventListener("change", () => {
        const lang = (sel as HTMLSelectElement).value === "de" ? "de" : "en";
        document.querySelectorAll('select[name="locale_code"]').forEach(s =>
          (s as HTMLSelectElement).value = lang
        );
        if (lang === "de" && document.body.dataset.globalLang !== "de") {
          applyManualPageOverrides(document.body, "en");
          translateNode(document.body, GERMAN_COPY_PAIRS);
          applyManualPageOverrides(document.body, "de");
          document.body.dataset.globalLang = "de";
        } else if (lang === "en" && document.body.dataset.globalLang === "de") {
          translateNode(document.body, GERMAN_COPY_PAIRS.map(([a, b]) => [b, a] as [string, string]));
          applyManualPageOverrides(document.body, "en");
          document.body.dataset.globalLang = "en";
        } else {
          applyManualPageOverrides(document.body, lang);
        }
        try { localStorage.setItem("ohs-lang", lang); } catch { /* */ }
      });
      sel.closest("form")?.addEventListener("submit", e => e.preventDefault());
    });
  }, []);

  return null;
}
