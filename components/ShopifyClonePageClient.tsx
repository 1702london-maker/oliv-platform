"use client";

import { useEffect, useRef } from "react";

// Ordered longest→shortest to prevent short keys consuming long matches
const DE_PAIRS: [string, string][] = [
  ["Luxury human hair extensions crafted for women who refuse compromise. Sourced from the world's finest suppliers, installed by Berlin's most trusted specialists.", "Luxuriöse Echthaar-Extensions für Frauen, die keine Kompromisse eingehen. Von den besten Lieferanten weltweit, installiert von Berlins renommiertesten Spezialisten."],
  ["Luxury extensions crafted for women who refuse compromise.", "Luxuriöse Haarverlängerungen für Frauen, die keine Kompromisse eingehen."],
  ["Luxury Hair. Premium Quality. Every Strand Designed Just For You.", "Luxuriöses Haar. Premium-Qualität. Jede Strähne für dich perfektioniert."],
  ["Luxury Hair. Premium Quality. Designed for You.", "Luxuriöses Haar. Höchste Qualität. Für dich geschaffen."],
  ["Stay connected with OlivHairSupply Club.", "Bleib immer auf dem Laufenden mit dem OlivHairSupply Club."],
  ["Stay connected with Olivhairsupply Club.", "Bleib immer auf dem Laufenden mit dem OlivHairSupply Club."],
  ["Worldwide Shipping — Free Over €200", "Weltweiter Versand – Kostenlos ab 200 €"],
  ["Free EU shipping on orders over €200", "Kostenloser EU-Versand ab 200 €"],
  ["Free EU Shipping Over €200", "Kostenloser EU-Versand ab 200 €"],
  ["FREE EU SHIPPING OVER €200", "KOSTENLOSER EU-VERSAND AB 200 €"],
  ["FREE EU SHIPPING", "KOSTENLOSER EU-VERSAND"],
  ["Free EU Shipping", "Kostenloser EU-Versand"],
  ["100% Human Hair", "100 % Echthaar"],
  ["100% HUMAN HAIR", "100 % ECHTHAAR"],
  ["Expert Colour Matching", "Professionelle Farbberatung"],
  ["EXPERT COLOUR MATCHING", "PROFESSIONELLE FARBBERATUNG"],
  ["Worldwide Delivery", "Weltweite Lieferung"],
  ["WORLDWIDE DELIVERY", "WELTWEITE LIEFERUNG"],
  ["Berlin In-Store Experience", "Berlin Salon-Erlebnis"],
  ["BERLIN IN-STORE EXPERIENCE", "BERLIN SALON-ERLEBNIS"],
  ["BiziLuxe Collection", "BiziLuxe Kollektion"],
  ["Shop BiziLuxe Hair", "BiziLuxe Hair entdecken"],
  ["SHOP BIZILUXE HAIR", "BIZILUXE HAIR ENTDECKEN"],
  ["SHOP BIZILUXE", "BIZILUXE ENTDECKEN"],
  ["Book an Appointment", "Termin buchen"],
  ["Book Appointment", "Termin buchen"],
  ["BOOK APPOINTMENT", "TERMIN BUCHEN"],
  ["Premium Hair.", "Premium Haar."],
  ["Confidence.", "Eleganz."],
  ["Effortless", "Zeitlose"],
  ["Become an Affiliate →", "Affiliate-Partner werden →"],
  ["Affiliate Programme", "Affiliate Program"],
  ["Social Responsibility", "Soziale Verantwortung"],
  ["Track Order", "Bestellung verfolgen"],
  ["Stay Connected", "Bleib verbunden"],
  ["STAY CONNECTED", "Bleib verbunden"],
  ["Contact Us", "Kontakt"],
  ["Our Story", "Unsere Geschichte"],
  ["Sustainability", "Nachhaltigkeit"],
  ["Wholesale", "Großhandel"],
  ["Training", "Schulungen"],
  ["Appointment", "Termin buchen"],
  ["Careers", "Karriere"],
  ["Journal", "Magazin"],
  ["Returns", "Rücksendungen"],
  ["Shipping", "Versand"],
  ["Rentals", "Clips Verleih"],
  ["Services", "Services"],
  ["Affiliate", "Affiliate"],
  ["About", "Über Uns"],
  ["ABOUT", "ÜBER UNS"],
  ["Press", "Presse"],
  ["More", "Mehr"],
  ["MORE", "MEHR"],
  ["Help", "Hilfe"],
  ["HELP", "HILFE"],
  ["Home", "Startseite"],
  ["Shop", "Shop"],
  ["FAQ", "FAQ"],
  ["Language & Currency", "Sprache & Währung"],
];

const SKIP: Record<string, boolean> = { SCRIPT: true, STYLE: true, NOSCRIPT: true, TEXTAREA: true, INPUT: true };

function translateNode(node: Node, pairs: [string, string][]) {
  if (node.nodeType === 3) {
    let v = (node as Text).nodeValue || "";
    if (!v.trim()) return;
    for (const [en, de] of pairs) {
      if (v.includes(en)) v = v.split(en).join(de);
    }
    if (v !== node.nodeValue) (node as Text).nodeValue = v;
  } else if (node.nodeType === 1 && !SKIP[(node as Element).tagName]) {
    for (let c = node.firstChild; c; c = c.nextSibling) translateNode(c, pairs);
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

    // Apply saved language
    const savedLang = (() => { try { return localStorage.getItem('ohs-lang') || 'en'; } catch { return 'en'; } })();
    if (savedLang === 'de') {
      translateNode(document.body, DE_PAIRS);
      document.body.dataset.ohsLang = 'de';
    }

    // Bind language selector
    ref.current.querySelectorAll('select[name="locale_code"]').forEach(sel => {
      sel.addEventListener('change', () => {
        const lang = (sel as HTMLSelectElement).value === 'de' ? 'de' : 'en';
        document.querySelectorAll('select[name="locale_code"]').forEach(s => (s as HTMLSelectElement).value = lang);
        if (lang === 'de' && document.body.dataset.ohsLang !== 'de') {
          translateNode(document.body, DE_PAIRS);
          document.body.dataset.ohsLang = 'de';
        } else if (lang === 'en' && document.body.dataset.ohsLang === 'de') {
          translateNode(document.body, DE_PAIRS.map(([a, b]) => [b, a] as [string, string]));
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
