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
  // Appointments page hero
  ["Book Your ", "Buche dein "],
  ["Book Your", "Buche dein"],
  ["Experience", "Erlebnis"],
  ["Become Affiliate", "Affiliate werden"],
  // Affiliate page hero
  // OlivHairSupply Affiliate eyebrow translated directly in affiliate.html
  ["Earn. Influence. ", "Verdienen. Inspirieren. "],
  ["Earn. Influence.", "Verdienen. Inspirieren."],
  ["Elevate.", "Wachsen."],
  ["Become an Affiliate", "Affiliate werden"],
  ["Log in to Dashboard", "Zum Dashboard anmelden"],
  // Rentals page hero
  ["BiziLuxe Clip-In Collection", "BiziLuxe Clip-In Kollektion"],
  ["Book Rental Consultation", "Beratung zur Anmietung buchen"],
  ["Speak to Our Team", "Unser Team kontaktieren"],
  ["Book Your Consultation", "Beratung buchen"],
  ["Luxury Hair ", "Luxuriöse Haarverlängerungen zum "],
  ["Luxury Hair", "Luxuriöse Haarverlängerungen"],
  ["Rentals.", "Mieten."],
  // Services page hero
  ["Our Services", "Unsere Services"],
  ["Tailored to You.", "für dein perfektes Haar."],
  ["Services ", "Individuelle Lösungen "],
  // Training page hero
  ["Book Training Consultation", "Beratungsgespräch buchen"],
  ["Become professionally ", "Werde professionell "],
  ["Become professionally", "Werde professionell"],
  ["Certified.", "zertifiziert."],
  ["Enroll Now", "Jetzt anmelden"],
  // About page — "Born from <em>a passion</em>" splits into two text nodes
  ["Berlin, Est. 2016", "Berlin, gegründet 2016"],
  ["Born from", "Aus Leidenschaft"],
  ["a passion", "entstanden"],
  // Shop page hero
  ["BiziLuxe by Olivhairsupply", "BiziLuxe by OlivHairSupply"],
  ["BiziLuxe by OlivHairSupply", "BiziLuxe by OlivHairSupply"],
  ["The BiziLuxe Edit", "Die BiziLuxe Kollektion"],
  ["The BiziLuxe", "Die BiziLuxe"],
  ["Edit", "Kollektion"],
  ["100 %Cuticle-Aligned Human Hair", "100 % Echthaar mit intakter Schuppenschicht"],
  ["100% Cuticle-Aligned Human Hair", "100 % Echthaar mit intakter Schuppenschicht"],
  ["Cuticle-Aligned Human Hair", "Echthaar mit intakter Schuppenschicht"],
  ["6Collections", "6 Kollektionen"],
  ["6 Collections", "6 Kollektionen"],
  ["Collections", "Kollektionen"],
  ["Collection", "Kollektion"],
  ["EUWorldwide Shipping", "Weltweiter Versand"],
  ["EU Worldwide Shipping", "Weltweiter Versand"],
  ["Free ShippingOn orders over €200", "Kostenloser Versand ab 200 €"],
  ["Free Shipping On orders over €200", "Kostenloser Versand ab 200 €"],
  ["On orders over €200", "Ab Bestellungen über 200 €"],
  ["14 Day ReturnsUnused sealed products", "14 Tage Rückgaberecht für unbenutzte und versiegelte Produkte"],
  ["14 Day Returns", "14 Tage Rückgaberecht"],
  ["Unused sealed products", "Für unbenutzte und versiegelte Produkte"],
  ["Expert GuidanceBook a free consultation", "Persönliche Beratung – Kostenlose Beratung buchen"],
  ["Expert Guidance", "Persönliche Beratung"],
  ["Book a free consultation", "Buche eine kostenlose Beratung"],
  ["EthicallySourcedQuality guaranteed", "Ethisch bezogen – Garantierte Qualität"],
  ["Ethically SourcedQuality guaranteed", "Ethisch bezogen – Garantierte Qualität"],
  ["Ethically Sourced", "Ethisch bezogen"],
  ["Quality guaranteed", "Garantierte Qualität"],
  // Wholesale page
  ["Partner With OlivHairSupply", "Partner von OlivHairSupply werden"],
  ["Partner With ", "Partner von "],
  ["Partner With", "Partner von"],
  ["Become a wholesaler", "Werde Großhandelspartner"],
  ["Become a Wholesaler", "Werde Großhandelspartner"],
  ["Log Into Wholesale Shop", "Zum Großhandelsshop anmelden"],
  ["Log into Wholesale Shop", "Zum Großhandelsshop anmelden"],
  // Common
  ["Book an Appointment", "Termin buchen"],
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
  ["Rentals", "Clip in Verleih"],
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

    // Apply saved language — TranslationClient (runs first) already translated the body,
    // so DE_PAIRS translation here is a safe no-op on German text (English keys won't match).
    const savedLang = (() => { try { return localStorage.getItem('ohs-lang') || 'en'; } catch { return 'en'; } })();
    if (savedLang === 'de') {
      translateNode(document.body, DE_PAIRS);
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
          translateNode(document.body, DE_PAIRS);
          document.body.dataset.ohsLang = 'de';
          document.body.dataset.globalLang = 'de';
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
