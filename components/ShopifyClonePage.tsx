import fs from "node:fs";
import path from "node:path";
import { ShopifyClonePageClient } from "./ShopifyClonePageClient";

type ShopifyClonePageProps = {
  page: string;
  injectBeforeClose?: string;
};

export function ShopifyClonePage({ page, injectBeforeClose }: ShopifyClonePageProps) {
  const filePath = path.join(process.cwd(), "shopify-clone", `${page}.html`);
  const rawHtml = fs.readFileSync(fs.existsSync(filePath) ? filePath : path.join(process.cwd(), "shopify-clone", "home.html"), "utf8");
  let html = normalizeShopifyHtml(rawHtml, page);

  if (injectBeforeClose) {
    html = html.includes("</body>")
      ? html.replace("</body>", injectBeforeClose + "</body>")
      : html + injectBeforeClose;
  }

  return <ShopifyClonePageClient html={html} />;
}

function normalizeShopifyHtml(rawHtml: string, page: string) {
  let html = rawHtml
    .replaceAll('href="/collections"', 'href="/shop"')
    .replaceAll('href="/collections/all"', 'href="/shop"')
    .replaceAll('action="/localization"', 'action="/localization"')
    .replaceAll("EUR â‚¬", "EUR &euro;")
    .replaceAll("âœ“", "✓")
    .replaceAll("â€”", "&mdash;")
    .replaceAll("â€˜", "&lsquo;")
    .replaceAll("â€™", "&rsquo;")
    .replaceAll("â€œ", "&ldquo;")
    .replaceAll("â€", "&rdquo;");

  html = html.replace(
    /<select([\s\S]*?name="country_code"[\s\S]*?)>[\s\S]*?<\/select>/g,
    '<select$1><option value="DE" selected>EUR &euro;</option><option value="GB">GBP &pound;</option><option value="US">USD $</option></select>'
  );

  if (page === "affiliate") {
    html = html
      .replaceAll('action="/contact#contact_form"', 'action="/api/applications/affiliate"')
      .replaceAll("window.location.href = '/login?next=/affiliate'", "window.location.href = '/affiliate/login'");
  }

  if (page === "wholesale") {
    html = html
      .replaceAll('action="/contact#contact_form"', 'action="/api/applications/wholesale"')
      .replaceAll("window.location.href = '/login?next=/wholesale'", "window.location.href = '/wholesale/login'");
  }

  if (page === "pages-training") {
    html = html
      .replaceAll('action="/contact#contact_form"', 'action="/api/applications/training"')
      .replaceAll("window.location.href = '/login?next=/training'", "window.location.href = '/training/login'");
  }

  if (page === "appointments") {
    html = html.replaceAll('action="/contact#oappt-hidden-form"', 'action="/api/appointments"');
  }

  html = html.replace(/action="\/contact#[^"]*"/g, 'action="/api/contact"');

  // Strip floating WhatsApp / iMessage chat widget scraped from Shopify
  html = html.replace(/<style>\s*\.ohs-chat[\s\S]*?<\/style>\s*<div class="ohs-chat-wrap"[\s\S]*?<\/div>/g, '');

  // German translation (server-side, exact HTML string replacements)
  html = translateToGerman(html);

  // Inject currency-switcher only (translation is now server-side)
  const i18nScript = `<script src="/js/ohs-i18n.js"></script>`;
  html = html.includes("</body>")
    ? html.replace("</body>", i18nScript + "</body>")
    : html + i18nScript;

  return html;
}

// ── GERMAN TRANSLATIONS ────────────────────────────────────────────────────────
// Applied server-side to the raw HTML string — handles <em>, <strong> etc.
// Ordered longest-first to avoid partial matches.
function translateToGerman(html: string): string {
  const T: [string, string][] = [
    // ── NAV / TOPBAR ──
    ['Worldwide Shipping — Free Over €200', 'Weltweiter Versand — Kostenlos ab €200'],
    ['Luxury Hair. Premium Quality. Designed for You.', 'Luxushaar. Premium-Qualität. Für Sie kreiert.'],
    ['Luxury Hair. Premium Quality. Every Strand Designed Just For You.', 'Luxushaar. Premium-Qualität. Jeder Strand für Sie kreiert.'],
    ['Become an Affiliate →', 'Partner werden →'],
    ['Affiliate Programme', 'Partnerprogramm'],
    ['Language &amp; Currency', 'Sprache &amp; Währung'],
    ['Language', 'Sprache'],
    ['English', 'Englisch'],
    ['Currency', 'Währung'],
    ['Stay Connected', 'Bleib verbunden'],

    // ── HOME HERO ──
    ['Premium Hair. <em>Effortless</em> Confidence.', 'Premium Haar. <em>Mühelos.</em> Selbstbewusst.'],
    ['Luxury extensions crafted for women who refuse compromise.', 'Luxuriöse Extensions für Frauen, die keine Kompromisse eingehen.'],
    ['Shop BiziLuxe Hair', 'BiziLuxe Hair kaufen'],
    ['Book Appointment', 'Termin buchen'],
    ['Book an Appointment', 'Termin buchen'],

    // ── TRUST STRIP ──
    ['Free EU Shipping Over &euro;200', 'Kostenloser EU-Versand ab €200'],
    ['Free EU Shipping Over €200', 'Kostenloser EU-Versand ab €200'],
    ['100% Human Hair', '100% Echthaar'],
    ['Expert Colour Matching', 'Professionelle Farbberatung'],
    ['Worldwide Delivery', 'Weltweiter Versand'],

    // ── HOME SHOP BY CATEGORY ──
    ['BiziLuxe Collection', 'BiziLuxe Kollektion'],
    ['Shop by <em>Category</em>', 'Nach <em>Kategorie</em> einkaufen'],
    ['BiziLuxe Accessories', 'BiziLuxe Zubehör'],
    ['View All Products', 'Alle Produkte ansehen'],
    ['New Arrivals', 'Neuheiten'],
    ['Featured', 'Ausgewählt'],
    ['Shop Now', 'Jetzt kaufen'],
    ['Explore', 'Entdecken'],

    // ── HOME PHILOSOPHY ──
    ['Our Philosophy', 'Unsere Philosophie'],
    ['Hair that <em>speaks</em> for itself.', 'Haare, die <em>für sich</em> sprechen.'],
    ['BiziLuxe hair is crafted for women who understand that quality is not a luxury — it is a standard. Every strand is selected, every texture is considered, and every product is designed to move, feel and perform exactly as premium hair should.', 'BiziLuxe Haar ist für Frauen geschaffen, die wissen, dass Qualität kein Luxus ist — sie ist ein Standard. Jeder Strang wird sorgfältig ausgewählt, jede Textur bedacht und jedes Produkt so gestaltet, dass es sich genau so bewegt, anfühlt und verhält, wie Premium-Haar es soll.'],
    ['At OlivHairSupply, we do not compromise. From our Berlin salons to international delivery, the standard remains the same.', 'Bei OlivHairSupply gehen wir keine Kompromisse ein. Von unseren Berliner Salons bis zur internationalen Lieferung bleibt der Standard derselbe.'],
    ['Our Story', 'Unsere Geschichte'],

    // ── HOME TRAINING ──
    ['OlivHairSupply Academy', 'OlivHairSupply Akademie'],
    ['Become a Certified <em>Specialist.</em>', 'Werden Sie zertifizierter <em>Spezialist.</em>'],
    ['Become a Certified', 'Werden Sie zertifizierter'],
    ['Specialist.', 'Spezialist.'],
    ['Learn premium installation techniques, master the BiziLuxe system, and build a career at the luxury end of the hair industry. Our training programmes are designed for ambition.', 'Erlernen Sie professionelle Installationstechniken, meistern Sie das BiziLuxe-System und bauen Sie eine Karriere im Luxussegment der Haarbranche auf. Unsere Trainingsprogramme sind für Ehrgeizige konzipiert.'],
    ['Three programmes available — Foundation, Advanced and Master Business.', 'Drei Programme verfügbar — Foundation, Advanced und Master Business.'],
    ['Explore Training', 'Training entdecken'],
    ['Book With Us', 'Bei uns buchen'],

    // ── HOME APPOINTMENTS ──
    ['Your Luxury <em>Experience Awaits.</em>', 'Ihr luxuriöses <em>Erlebnis wartet.</em>'],
    ['Your Luxury', 'Ihr luxuriöses'],
    ['Experience Awaits.', 'Erlebnis wartet.'],
    ['Visit one of our Berlin salons for a premium hair experience. Expert stylists, luxury products and a result that speaks for itself. Book your appointment today.', 'Besuchen Sie einen unserer Berliner Salons für ein erstklassiges Haarpflege-Erlebnis. Erfahrene Stylisten, Luxusprodukte und ein Ergebnis, das für sich spricht. Buchen Sie Ihren Termin noch heute.'],
    ['View Services', 'Leistungen ansehen'],

    // ── HOME RENTALS ──
    ['Hair Rentals', 'Haarvermietung'],
    ['Luxury Hair for <em>Every Occasion.</em>', 'Luxushaar für <em>jeden Anlass.</em>'],
    ['Luxury Hair for', 'Luxushaar für'],
    ['Every Occasion.', 'Jeden Anlass.'],
    ['Not ready to commit? Our luxury hair rental service gives you access to premium BiziLuxe pieces for events, shoots or special occasions — at a fraction of the cost.', 'Noch nicht bereit? Unser Luxus-Haarverleih-Service bietet Ihnen Zugang zu hochwertigen BiziLuxe-Stücken für Events, Shootings oder besondere Anlässe — zu einem Bruchteil des Kaufpreises.'],
    ['Available to clients in Berlin and selected locations. Contact us to check availability for your event.', 'Verfügbar für Kunden in Berlin und ausgewählten Standorten. Kontaktieren Sie uns, um die Verfügbarkeit für Ihr Event zu prüfen.'],
    ['Explore Rentals', 'Vermietung entdecken'],

    // ── HOME REVIEWS ──
    ['Client Stories', 'Kundenmeinungen'],
    ['What Our <em>Clients Say</em>', 'Was unsere <em>Kunden sagen</em>'],
    ['What Our', 'Was unsere'],
    ['Clients Say', 'Kunden sagen'],
    ['The quality of BiziLuxe hair is unlike anything I have experienced before. It blends perfectly and lasts so much longer than anything I have tried.', 'Die Qualität des BiziLuxe Haares ist unvergleichlich. Es fügt sich perfekt ein und hält so viel länger als alles, was ich bisher ausprobiert habe.'],
    ['Berlin, Germany', 'Berlin, Deutschland'],
    ['I booked my appointment and the experience was completely luxurious from start to finish. The team at OlivHairSupply truly understand premium service.', 'Ich buchte meinen Termin und das Erlebnis war von Anfang bis Ende absolut luxuriös. Das Team von OlivHairSupply versteht wirklich, was Premium-Service bedeutet.'],
    ['I completed the Advanced Training programme and it completely transformed my career. I now serve a premium clientele and charge what my work is worth.', 'Ich habe das Advanced-Trainingsprogramm abgeschlossen und es hat meine Karriere völlig verändert. Jetzt betreue ich eine Premium-Kundschaft und verlange, was meine Arbeit wert ist.'],

    // ── HOME INSTAGRAM / NEWSLETTER ──
    ['Follow the Journey', 'Folgt der Reise'],
    ['Follow on Instagram', 'Auf Instagram folgen'],
    ['The OlivHairSupply Edit', 'Das OlivHairSupply Edit'],
    ['Join the OlivHairSupply <em>Edit</em>', 'Werde Teil des OlivHairSupply <em>Edits</em>'],
    ['Join the OlivHairSupply', 'Werde Teil des OlivHairSupply'],
    ['Exclusive drops, expert hair tips, and luxury updates — straight to your inbox.', 'Exklusive Neuheiten, professionelle Haartipps und Luxus-Updates — direkt in Ihr Postfach.'],
    ['Subscribe &rarr;', 'Abonnieren →'],
    ['Subscribe →', 'Abonnieren →'],
    ['No spam. Unsubscribe at any time.', 'Kein Spam. Jederzeit abmelden.'],

    // ── FOOTER ──
    ['Stay connected with Olivhairsupply Club.', 'Bleib in Kontakt mit dem Olivhairsupply Club.'],
    ['&copy; 2026 OlivHairSupply. All rights reserved.', '© 2026 OlivHairSupply. Alle Rechte vorbehalten.'],
    ['© 2026 OlivHairSupply. All rights reserved.', '© 2026 OlivHairSupply. Alle Rechte vorbehalten.'],
    ['Privacy Policy', 'Datenschutzrichtlinie'],
    ['Terms and Conditions', 'AGB'],
    ['Social Responsibility', 'Soziale Verantwortung'],
    ['Sustainability', 'Nachhaltigkeit'],
    ['Track Order', 'Bestellung verfolgen'],
    ['Contact Us', 'Kontakt'],
    ['Careers', 'Karriere'],
    ['Shipping', 'Versand'],
    ['Returns', 'Retouren'],
    ['Press', 'Presse'],
    ['About', 'Über uns'],

    // ── NAV LINKS ──
    ['Wholesale', 'Großhandel'],
    ['Services', 'Leistungen'],
    ['Rentals', 'Vermietung'],
    ['Appointment', 'Termin'],

    // ── FORMS / PLACEHOLDERS ──
    ['First name', 'Vorname'],
    ['Email address', 'E-Mail-Adresse'],
    ['Subscribe', 'Abonnieren'],

    // ── COMMON BUTTONS ──
    ['Become a Wholesaler', 'Großhändler werden'],
    ['Log Into Wholesale Shop', 'Großhandel-Anmeldung'],
    ['Become an Affiliate', 'Partner werden'],
    ['Apply Now', 'Jetzt bewerben'],
    ['Learn More', 'Mehr erfahren'],
    ['Read More', 'Mehr lesen'],
    ['View Collection', 'Kollektion ansehen'],
    ['Return Home', 'Zur Startseite'],
    ['Add to Cart', 'In den Warenkorb'],

    // ── WHOLESALE PAGE ──
    ['Partner With <em>OlivHairSupply</em>', 'Partnerschaft mit <em>OlivHairSupply</em>'],
    ['Apply to Wholesale Programme', 'Für Großhandelsprogramm bewerben'],

    // ── SERVICES PAGE ──
    ['Services <em>Tailored to You.</em>', 'Leistungen <em>für Sie.</em>'],
    ['Our Services', 'Unsere Leistungen'],
    ['Book Appointment', 'Termin buchen'],

    // ── APPOINTMENTS PAGE ──
    ['Book Your <em>Experience</em>', 'Ihr <em>Erlebnis</em> buchen'],
    ['Become Affiliate', 'Partner werden'],

    // ── PLACEHOLDER ATTRIBUTES (in HTML attr values) ──
    ['placeholder="First name"', 'placeholder="Vorname"'],
    ['placeholder="Email address"', 'placeholder="E-Mail-Adresse"'],
    ['placeholder="your@email.com"', 'placeholder="ihre@email.de"'],
    ['placeholder="Your full name"', 'placeholder="Vollständiger Name"'],
    ['placeholder="+49 000 000 0000"', 'placeholder="+49 000 000 0000"'],
    ['placeholder="Allergies, special requests or anything we should know..."', 'placeholder="Allergien, besondere Wünsche oder was wir wissen sollten..."'],
  ];

  for (const [en, de] of T) {
    html = html.split(en).join(de);
  }
  return html;
}
