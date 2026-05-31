"use client";

import { useEffect, useRef } from "react";
import { GERMAN_COPY_PAIRS, applyManualPageOverrides, translateAttributes } from "./germanCopy";

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

function removeSpanishLocaleOptions(root: ParentNode) {
  root.querySelectorAll('select[name="locale_code"] option').forEach(option => {
    const value = (option as HTMLOptionElement).value.trim().toLowerCase();
    const label = (option.textContent || "").trim().toLowerCase();
    if (value === "es" || label === "es" || label.includes("español") || label.includes("espanol")) {
      option.remove();
    }
  });
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

    // Remove Spanish locale option from desktop and mobile selectors.
    removeSpanishLocaleOptions(ref.current);

    // Remove onchange auto-submit from locale selects
    ref.current.querySelectorAll('select[name="locale_code"]').forEach(sel => {
      sel.removeAttribute('onchange');
    });

    // German nav labels are longer, so keep the language/currency controls visible
    // and use the mobile drawer earlier on tablet widths.
    if (!document.getElementById('ohs-de-header-fit')) {
      const style = document.createElement('style');
      style.id = 'ohs-de-header-fit';
      style.textContent = `
        body[data-ohs-lang="de"] .ohs-desktop {
          max-width: min(1440px, 100vw);
          padding-left: 14px;
          padding-right: 14px;
        }
        body[data-ohs-lang="de"] .ohs-logo-wrap {
          padding-left: 10px;
          padding-right: 10px;
        }
        body[data-ohs-lang="de"] .ohs-logo-wrap img {
          width: 160px;
        }
        body[data-ohs-lang="de"] .ohs-nav-left li a,
        body[data-ohs-lang="de"] .ohs-nav-right li a.ohs-nav-link {
          font-size: 8.5px !important;
          letter-spacing: 0.7px !important;
          padding-left: 6px !important;
          padding-right: 6px !important;
        }
        body[data-ohs-lang="de"] .ohs-nav-left li:first-child a {
          padding-left: 0 !important;
        }
        body[data-ohs-lang="de"] .ohs-nav-right .ohs-divider {
          margin-left: 6px;
          margin-right: 6px;
        }
        body[data-ohs-lang="de"] .ohs-locale-form,
        body[data-ohs-lang="de"] .ohs-sel-wrap,
        body[data-ohs-lang="de"] .ohs-locale-sel {
          flex-shrink: 0;
        }
        @media (max-width: 1180px) {
          body[data-ohs-lang="de"] .ohs-desktop { display: none !important; }
          body[data-ohs-lang="de"] .ohs-mobile { display: flex !important; }
          body[data-ohs-lang="de"] .ohs-drawer,
          body[data-ohs-lang="de"] .ohs-overlay { display: flex; }
        }
        @media (min-width: 1181px) {
          body[data-ohs-lang="de"] .ohs-mobile { display: none !important; }
          body[data-ohs-lang="de"] .ohs-desktop { display: flex; }
        }
      `;
      document.head.appendChild(style);
    }

    // Apply saved language — TranslationClient (runs first) already translated the body,
    // so DE_PAIRS translation here is a safe no-op on German text (English keys won't match).
    const savedLang = (() => { try { return localStorage.getItem('ohs-lang') || 'de'; } catch { return 'de'; } })();
    if (savedLang === 'de') {
      applyManualPageOverrides(document.body, 'en');
      translateNode(document.body, GERMAN_COPY_PAIRS);
      applyManualPageOverrides(document.body, 'de');
      document.body.dataset.ohsLang = 'de';
      document.body.dataset.globalLang = 'de';
    } else {
      applyManualPageOverrides(document.body, 'en');
      document.body.dataset.ohsLang = 'en';
    }

    // Always sync selector display to match actual language (HTML hardcodes EN as selected)
    document.querySelectorAll('select[name="locale_code"]').forEach(s => {
      (s as HTMLSelectElement).value = savedLang === 'de' ? 'de' : 'en';
    });

    const localeObserver = new MutationObserver(() => removeSpanishLocaleOptions(document.body));
    localeObserver.observe(ref.current, { childList: true, subtree: true });
    removeSpanishLocaleOptions(ref.current);

    // Bind language selector
    ref.current.querySelectorAll('select[name="locale_code"]').forEach(sel => {
      sel.addEventListener('change', () => {
        const lang = (sel as HTMLSelectElement).value === 'de' ? 'de' : 'en';
        document.querySelectorAll('select[name="locale_code"]').forEach(s => (s as HTMLSelectElement).value = lang);
        if (lang === 'de' && document.body.dataset.ohsLang !== 'de') {
          applyManualPageOverrides(document.body, 'en');
          translateNode(document.body, GERMAN_COPY_PAIRS);
          applyManualPageOverrides(document.body, 'de');
          document.body.dataset.ohsLang = 'de';
          document.body.dataset.globalLang = 'de';
        } else if (lang === 'en' && document.body.dataset.ohsLang === 'de') {
          translateNode(document.body, GERMAN_COPY_PAIRS.map(([a, b]) => [b, a] as [string, string]));
          applyManualPageOverrides(document.body, 'en');
          document.body.dataset.ohsLang = 'en';
        } else {
          applyManualPageOverrides(document.body, lang);
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

    return () => localeObserver.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
