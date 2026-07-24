"use client";

import { useEffect } from "react";

export function LocaleInterceptor() {
  useEffect(() => {
    function applyLang(lang: string) {
      const isDE = lang === "de";
      try { localStorage.setItem("ohs-lang", lang); } catch { /* */ }
      document.body.dataset.ohsLang = lang;

      // Keep all locale selects in sync
      document.querySelectorAll<HTMLSelectElement>('select[name="locale_code"]').forEach(s => {
        s.value = lang;
      });
    }

    function bind(sel: HTMLSelectElement) {
      // Kill the native onchange that submits the form and navigates
      sel.removeAttribute("onchange");
      sel.onchange = null;

      // Prevent the parent form from submitting
      sel.closest("form")?.addEventListener("submit", e => e.preventDefault());

      sel.addEventListener("change", () => {
        const lang = sel.value === "de" ? "de" : "en";
        applyLang(lang);
      });
    }

    // Bind existing selects
    document.querySelectorAll<HTMLSelectElement>('select[name="locale_code"]').forEach(bind);

    // Also catch any selects injected late (mobile drawer etc.)
    const obs = new MutationObserver(() => {
      document.querySelectorAll<HTMLSelectElement>('select[name="locale_code"]').forEach(sel => {
        if (!sel.dataset.ohsIntercepted) {
          sel.dataset.ohsIntercepted = "1";
          bind(sel);
        }
      });
    });
    obs.observe(document.body, { childList: true, subtree: true });

    // Sync to saved language on mount
    try {
      const saved = localStorage.getItem("ohs-lang") || "de";
      applyLang(saved);
    } catch { /* */ }

    return () => obs.disconnect();
  }, []);

  return null;
}
