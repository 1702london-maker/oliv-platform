import type { Metadata } from "next";
import { ShopifyClonePage } from "@/components/ShopifyClonePage";

type PageProps = {
  params: Promise<{ slug: string }>;
};

const slugMeta: Record<string, { title: string; description: string; keywords: string[] }> = {
  about: {
    title: "Über uns — OlivHairSupply Berlin | BiziLuxe Luxushaarmarke",
    description: "Lerne OlivHairSupply kennen — Berlins führende Luxus-Haarmarke. Unsere Geschichte, unser Team und unsere Philosophie hinter der BiziLuxe Kollektion. Qualität ohne Kompromisse.",
    keywords: ["OlivHairSupply über uns", "BiziLuxe Berlin Haarmarke", "Echthaar Extensions Marke Deutschland", "Luxus Haarmarke Berlin"]
  },
  services: {
    title: "Haarservice Berlin — Extensions, Farbe & Luxury Home Service | OlivHairSupply",
    description: "Professionelle Haarservices in Berlin: Echthaar Extensions Installation, Haarverlängerung, Colorierung, Luxury Home Service & Schulungen. Termin online buchen.",
    keywords: ["Haarservice Berlin", "Extensions Installation Berlin", "Haarverlängerung Salon Berlin", "Colorierung Extensions Berlin", "Luxury Home Service Haare Berlin"]
  },
  faq: {
    title: "FAQ — Häufige Fragen zu Echthaar Extensions | OlivHairSupply",
    description: "Antworten auf alle Fragen rund um BiziLuxe Echthaar Extensions: Pflege, Haltbarkeit, Installation, Versand & mehr. Dein umfassender Extensions-Ratgeber.",
    keywords: ["Extensions FAQ", "Echthaar Extensions Fragen", "Haarverlängerung Pflege Tipps", "wie lange halten Extensions", "Extensions Pflege Anleitung"]
  },
  contact: {
    title: "Kontakt — OlivHairSupply Berlin | Fragen & Beratung",
    description: "Kontaktiere OlivHairSupply Berlin. Fragen zu BiziLuxe Extensions, Bestellungen, Terminen oder Großhandel? Unser Team hilft dir gerne weiter.",
    keywords: ["OlivHairSupply Kontakt", "Extensions Beratung Berlin", "Haarverlängerung Beratung", "OlivHairSupply Berlin Adresse"]
  },
  training: {
    title: "Extensions Schulung Berlin — BiziLuxe Training Academy | OlivHairSupply",
    description: "Professionelle Haarverlängerungs-Schulungen in Berlin. Foundation, Advanced & Master Business Programme. Werde zertifizierter BiziLuxe Stylist. Jetzt anmelden.",
    keywords: ["Extensions Schulung Berlin", "Haarverlängerung Kurs Berlin", "Friseur Weiterbildung Extensions", "BiziLuxe Training Academy", "Bonding Extensions Schulung Deutschland"]
  },
  careers: {
    title: "Stellenangebote Berlin — Karriere bei OlivHairSupply | BiziLuxe",
    description: "Starte deine Karriere bei OlivHairSupply Berlin. Offene Stellen für Stylisten, Verkauf & mehr. Werde Teil der BiziLuxe Luxus-Haarmarke.",
    keywords: ["Stellenangebote Friseur Berlin", "Karriere Haarverlängerung Berlin", "OlivHairSupply Jobs", "Stylist Stelle Berlin", "BiziLuxe Karriere"]
  },
  sustainability: {
    title: "Nachhaltigkeit — Verantwortungsvolle Haare | OlivHairSupply",
    description: "OlivHairSupply setzt auf nachhaltige Beschaffung, ethische Produktion und verantwortungsvolles Wirtschaften. Erfahre mehr über unser Engagement für Mensch und Umwelt.",
    keywords: ["nachhaltige Echthaar Extensions", "ethische Haarverlängerung", "OlivHairSupply Nachhaltigkeit", "faire Haarprodukte Deutschland"]
  },
  rentals: {
    title: "Clip-In Extensions mieten Berlin — BiziLuxe Verleih | OlivHairSupply",
    description: "Luxury Clip-In Extensions für Events, Fotoshootings & besondere Anlässe mieten. BiziLuxe Verleih in Berlin — premium Echthaar für jeden Anlass.",
    keywords: ["Extensions mieten Berlin", "Haarverlängerung mieten Event", "Clip In Extensions Verleih Berlin", "Echthaar mieten Fotoshooting", "BiziLuxe Verleih"]
  },
  returns: {
    title: "Rücksendung & Umtausch — OlivHairSupply Retouren",
    description: "Alles zu Rücksendungen und Umtausch bei OlivHairSupply. Einfacher Rückgabeprozess, klare Fristen und schnelle Erstattung für BiziLuxe Produkte.",
    keywords: ["OlivHairSupply Rücksendung", "Extensions zurückschicken", "Retoure Haarverlängerung", "OlivHairSupply Umtausch"]
  },
  shipping: {
    title: "Versand & Lieferung — Echthaar Extensions aus Berlin | OlivHairSupply",
    description: "Versandinformationen für OlivHairSupply: kostenloser EU-Versand ab 200 €, Deutschland, UK & internationale Lieferung. Lieferzeiten und Versandkosten im Überblick.",
    keywords: ["OlivHairSupply Versand", "Extensions Lieferung Deutschland", "kostenloser Versand Haarverlängerung", "EU Versand Extensions", "Lieferzeit Echthaar Extensions"]
  },
  press: {
    title: "Presse & Medien — OlivHairSupply Berlin | BiziLuxe Pressemappe",
    description: "Presse- und Medieninformationen zu OlivHairSupply und der BiziLuxe Kollektion. Pressemappe, Markenstatistiken & Kooperationsanfragen.",
    keywords: ["OlivHairSupply Presse", "BiziLuxe Pressemappe", "Luxus Haarmarke Berlin Medien", "OlivHairSupply Kooperation"]
  },
  vouchers: {
    title: "Geschenkgutscheine kaufen — OlivHairSupply | BiziLuxe Luxushaar",
    description: "Verschenke Luxus: BiziLuxe Geschenkgutscheine von OlivHairSupply. Erhältlich von 100 € bis 2.000 €. Das perfekte Geschenk für Haarliebhaberinnen.",
    keywords: ["Geschenkgutschein Haarverlängerung", "Extensions Gutschein kaufen", "OlivHairSupply Gutschein", "BiziLuxe Geschenkgutschein", "Luxus Haargutschein Berlin"]
  },
  "track-order": {
    title: "Bestellung verfolgen — OlivHairSupply Sendungsverfolgung",
    description: "Verfolge deine OlivHairSupply Bestellung in Echtzeit. Bestellnummer und E-Mail eingeben und deinen BiziLuxe Versandstatus sofort abrufen.",
    keywords: ["OlivHairSupply Bestellung verfolgen", "Sendungsverfolgung Extensions", "Paket verfolgen OlivHairSupply"]
  },
  "social-responsibility": {
    title: "Soziale Verantwortung — OlivHairSupply Engagement",
    description: "OlivHairSupply übernimmt Verantwortung: faire Lieferketten, ethische Beschaffung und gesellschaftliches Engagement für eine bessere Haarindustrie.",
    keywords: ["OlivHairSupply soziale Verantwortung", "ethische Haarprodukte", "faire Echthaar Lieferkette"]
  },
  "privacy-policy": {
    title: "Datenschutzerklärung — OlivHairSupply",
    description: "Datenschutzerklärung von OlivHairSupply gemäß DSGVO. Informationen zur Verarbeitung personenbezogener Daten, Cookies und deinen Rechten.",
    keywords: ["OlivHairSupply Datenschutz", "DSGVO Datenschutzerklärung"]
  },
  terms: {
    title: "AGB — Allgemeine Geschäftsbedingungen | OlivHairSupply",
    description: "Allgemeine Geschäftsbedingungen von OlivHairSupply. Informationen zu Bestellungen, Preisen, Lieferung, Widerruf und mehr.",
    keywords: ["OlivHairSupply AGB", "Geschäftsbedingungen Extensions Shop"]
  },
  impressum: {
    title: "Impressum — OlivHairSupply Berlin",
    description: "Impressum von OlivHairSupply Berlin. Angaben gemäß § 5 TMG.",
    keywords: ["OlivHairSupply Impressum", "OlivHairSupply Berlin Kontakt"]
  }
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const meta = slugMeta[slug];
  if (!meta) return {};
  return {
    title: meta.title,
    description: meta.description,
    keywords: meta.keywords,
    openGraph: {
      title: meta.title,
      description: meta.description,
      url: `https://olivhairsupply.de/pages/${slug}`
    },
    alternates: { canonical: `https://olivhairsupply.de/pages/${slug}` }
  };
}

export default async function ShopifyPage({ params }: PageProps) {
  const { slug } = await params;
  return <ShopifyClonePage page={`pages-${slug}`} />;
}
