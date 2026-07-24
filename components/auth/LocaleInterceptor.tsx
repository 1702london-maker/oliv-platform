"use client";

import { useEffect } from "react";

export function LocaleInterceptor() {
  useEffect(() => {
    function applyLang(lang: string) {
      try { localStorage.setItem("ohs-lang", lang); } catch { /* */ }
      document.body.dataset.ohsLang = lang;
      document.querySelectorAll<HTMLSelectElement>('select[name="locale_code"]').forEach(s => {
        s.value = lang;
      });
    }

    function killForm(form: HTMLFormElement) {
      // Override submit method so it can never fire navigation
      (form as HTMLFormElement & { submit: () => void }).submit = () => {};
      // Capture phase — fires before any bubbling handler
      form.addEventListener("submit", e => { e.preventDefault(); e.stopImmediatePropagation(); }, true);
    }

    function bind(sel: HTMLSelectElement) {
      sel.removeAttribute("onchange");
      sel.onchange = () => {};  // no-op instead of null so nothing re-attaches

      const form = sel.closest("form");
      if (form) killForm(form as HTMLFormElement);

      sel.addEventListener("change", () => {
        applyLang(sel.value === "de" ? "de" : "en");
      });
    }

    document.querySelectorAll<HTMLSelectElement>('select[name="locale_code"]').forEach(sel => {
      sel.dataset.ohsIntercepted = "1";
      bind(sel);
    });

    const obs = new MutationObserver(() => {
      document.querySelectorAll<HTMLSelectElement>('select[name="locale_code"]').forEach(sel => {
        if (!sel.dataset.ohsIntercepted) {
          sel.dataset.ohsIntercepted = "1";
          bind(sel);
        }
      });
    });
    obs.observe(document.body, { childList: true, subtree: true });

    try {
      applyLang(localStorage.getItem("ohs-lang") || "de");
    } catch { /* */ }

    return () => obs.disconnect();
  }, []);

  return null;
}
