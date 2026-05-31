"use client";

import { useEffect, useRef } from "react";
import { GERMAN_COPY_PAIRS, translateAttributes } from "./germanCopy";

const SKIP: Record<string, boolean> = { SCRIPT: true, STYLE: true, NOSCRIPT: true, TEXTAREA: true, INPUT: true };

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

export function ShopifyClonePageClient({ html }: { html: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    // Execute <script> tags (React skips them in dangerouslySetInnerHTML)
    const scripts = Array.from(ref.current.querySelectorAll("script"));
    scripts.forEach((oldScript) => {
      const newScript = document.createElement("script");
      Array.from(oldScript.attributes).forEach((attr) =>
        newScript.setAttribute(attr.name, attr.value)
      );
      newScript.textContent = oldScript.textContent;
      oldScript.parentNode?.replaceChild(newScript, oldScript);
    });

    // Remove Spanish locale option
    ref.current.querySelectorAll('select[name="locale_code"] option[value="es"]').forEach(o => o.remove());

    // Remove onchange auto-submit from locale selects
    ref.current.querySelectorAll('select[name="locale_code"]').forEach(sel => {
      sel.removeAttribute('onchange');
    });

    // Apply saved language — TranslationClient (runs first) already translated the body,
    // so DE_PAIRS translation here is a safe no-op on German text (English keys won't match).
    const savedLang = (() => { try { return localStorage.getItem('ohs-lang') || 'de'; } catch { return 'de'; } })();
    if (savedLang === 'de') {
      translateNode(document.body, GERMAN_COPY_PAIRS);
      document.body.dataset.ohsLang = 'de';
      document.body.dataset.globalLang = 'de';
    } else {
      document.body.dataset.ohsLang = 'en';
    }

    // Always sync selector display to match actual language (HTML hardcodes EN as selected)
    document.querySelectorAll('select[name="locale_code"]').forEach(s => {
      (s as HTMLSelectElement).value = savedLang === 'de' ? 'de' : 'en';
    });

    // Bind language selector
    ref.current.querySelectorAll('select[name="locale_code"]').forEach(sel => {
      sel.addEventListener('change', () => {
        const lang = (sel as HTMLSelectElement).value === 'de' ? 'de' : 'en';
        document.querySelectorAll('select[name="locale_code"]').forEach(s => (s as HTMLSelectElement).value = lang);
        if (lang === 'de' && document.body.dataset.ohsLang !== 'de') {
          translateNode(document.body, GERMAN_COPY_PAIRS);
          document.body.dataset.ohsLang = 'de';
          document.body.dataset.globalLang = 'de';
        } else if (lang === 'en' && document.body.dataset.ohsLang === 'de') {
          translateNode(document.body, GERMAN_COPY_PAIRS.map(([a, b]) => [b, a] as [string, string]));
          document.body.dataset.ohsLang = 'en';
        }
        try { localStorage.setItem('ohs-lang', lang); } catch { /* */ }
      });
      sel.closest('form')?.addEventListener('submit', e => e.preventDefault());
    });

    // Currency switcher
    const CURR: Record<string, { s: string; r: number }> = {
      EUR: { s: '€', r: 1 }, GBP: { s: '£', r: 0.86 }, USD: { s: '$', r: 1.09 }
    };
    // Store EUR prices
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let n: Node | null;
    while ((n = walker.nextNode())) {
      const p = n.parentElement;
      if (!p || SKIP[p.tagName] || !n.nodeValue?.includes('€')) continue;
      if (!p.dataset.eurText) p.dataset.eurText = p.innerHTML;
    }
    const applyPrices = () => {
      const code = (() => { try { return localStorage.getItem('ohs-currency') || 'EUR'; } catch { return 'EUR'; } })();
      const cfg = CURR[code] || CURR.EUR;
      document.querySelectorAll('[data-eur-text]').forEach(el => {
        (el as HTMLElement).innerHTML = (el as HTMLElement).dataset.eurText!.replace(/€\s*([\d,]+(?:\.\d{1,2})?)/g, (_, n) => {
          const v = parseFloat(n.replace(/,/g, '')) * cfg.r;
          return cfg.s + (v % 1 === 0 ? v.toFixed(0) : v.toFixed(2));
        });
      });
      const sv = code === 'GBP' ? 'GB' : code === 'USD' ? 'US' : 'DE';
      document.querySelectorAll('select[name="country_code"]').forEach(s => (s as HTMLSelectElement).value = sv);
    };
    applyPrices();
    ref.current.querySelectorAll('select[name="country_code"]').forEach(sel => {
      sel.addEventListener('change', () => {
        const v = (sel as HTMLSelectElement).value;
        const code = v === 'GB' ? 'GBP' : v === 'US' ? 'USD' : 'EUR';
        try { localStorage.setItem('ohs-currency', code); } catch { /* */ }
        document.querySelectorAll('select[name="country_code"]').forEach(s => (s as HTMLSelectElement).value = v);
        applyPrices();
      });
      sel.closest('form')?.addEventListener('submit', e => e.preventDefault());
    });

  }, []);

  return (
    <div
      ref={ref}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
