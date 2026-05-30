"use client";

import { useEffect } from "react";

// Ordered longest→shortest — prevents short keys breaking long matches
const DE_PAIRS: [string, string][] = [
  ["Luxury human hair extensions crafted for women who refuse compromise. Sourced from the world's finest suppliers, installed by Berlin's most trusted specialists.", "Luxuriöse Echthaar-Extensions für Frauen, die keine Kompromisse eingehen. Von den besten Lieferanten weltweit, installiert von Berlins renommiertesten Spezialisten."],
  ["Luxury extensions crafted for women who refuse compromise.", "Luxuriöse Haarverlängerungen für Frauen, die keine Kompromisse eingehen."],
  ["Luxury Hair. Premium Quality. Every Strand Designed Just For You.", "Luxuriöses Haar. Premium-Qualität. Jede Strähne für dich perfektioniert."],
  ["Luxury Hair. Premium Quality. Designed for You.", "Luxuriöses Haar. Höchste Qualität. Für dich geschaffen."],
  ["Stay connected with OlivHairSupply Club.", "Bleib immer auf dem Laufenden mit dem OlivHairSupply Club."],
  ["Stay connected with Olivhairsupply Club.", "Bleib immer auf dem Laufenden mit dem OlivHairSupply Club."],
  ["Worldwide Shipping — Free Over €200", "Weltweiter Versand – Kostenlos ab 200 €"],
  // Shop page
  ["BiziLuxe by Olivhairsupply", "BiziLuxe by OlivHairSupply"],
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
  // Rentals page hero — "Luxury Hair <em>Rentals.</em>" splits text nodes
  ["BiziLuxe Clip-In Collection", "BiziLuxe Clip-In Kollektion"],
  ["Book Rental Consultation", "Beratung zur Anmietung buchen"],
  ["Speak to Our Team", "Unser Team kontaktieren"],
  ["Book Your Consultation", "Beratung buchen"],
  ["Luxury Hair ", "Luxuriöse Haarverlängerungen zum "],
  ["Luxury Hair", "Luxuriöse Haarverlängerungen"],
  ["Rentals.", "Mieten."],   // em content — must come BEFORE plain "Rentals"
  // Services page hero — "Services <em>Tailored to You.</em>" splits text nodes
  ["Our Services", "Unsere Services"],
  ["Tailored to You.", "für dein perfektes Haar."],
  ["Services ", "Individuelle Lösungen "],
  // Training page hero
  ["Book Training Consultation", "Beratungsgespräch buchen"],
  ["Become professionally ", "Werde professionell "],
  ["Become professionally", "Werde professionell"],
  ["Certified.", "zertifiziert."],
  ["Enroll Now", "Jetzt anmelden"],
  // About page
  ["Berlin, Est. 2016", "Berlin, gegründet 2016"],
  ["Born from", "Aus Leidenschaft"],
  ["a passion", "entstanden"],
  // Trust strip
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
  // Home hero
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
  // Topbar
  ["Become an Affiliate →", "Affiliate-Partner werden →"],
  // Nav
  ["Affiliate Programme", "Affiliate Program"],
  ["Social Responsibility", "Soziale Verantwortung"],
  ["Track Order", "Bestellung verfolgen"],
  ["Stay Connected", "Bleib verbunden"],
  ["STAY CONNECTED", "Bleib verbunden"],
  ["Contact Us", "Kontakt"],
  ["Our Story", "Unsere Geschichte"],
  ["Sustainability", "Nachhaltigkeit"],
  // Wholesale
  ["Partner With OlivHairSupply", "Partner von OlivHairSupply werden"],
  ["Partner With ", "Partner von "],
  ["Partner With", "Partner von"],
  ["Become a wholesaler", "Werde Großhandelspartner"],
  ["Become a Wholesaler", "Werde Großhandelspartner"],
  ["Log Into Wholesale Shop", "Zum Großhandelsshop anmelden"],
  ["Log into Wholesale Shop", "Zum Großhandelsshop anmelden"],
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

const SKIP: Record<string, boolean> = {
  SCRIPT: true, STYLE: true, NOSCRIPT: true, TEXTAREA: true, INPUT: true
};

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

export function TranslationClient() {
  useEffect(() => {
    const savedLang = (() => {
      try { return localStorage.getItem("ohs-lang") || "en"; } catch { return "en"; }
    })();

    if (savedLang === "de" && document.body.dataset.globalLang !== "de") {
      translateNode(document.body, DE_PAIRS);
      document.body.dataset.globalLang = "de";
    }

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
          translateNode(document.body, DE_PAIRS);
          document.body.dataset.globalLang = "de";
        } else if (lang === "en" && document.body.dataset.globalLang === "de") {
          translateNode(document.body, DE_PAIRS.map(([a, b]) => [b, a] as [string, string]));
          document.body.dataset.globalLang = "en";
        }
        try { localStorage.setItem("ohs-lang", lang); } catch { /* */ }
      });
      sel.closest("form")?.addEventListener("submit", e => e.preventDefault());
    });
  }, []);

  return null;
}
