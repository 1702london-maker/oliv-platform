import type { Metadata } from "next";
import fs from "node:fs";
import path from "node:path";
import { HairMatchProClient } from "@/components/hairmatch/HairMatchProClient";

export const metadata: Metadata = {
  title: "KI Haaranalyse — Finde deine perfekte Haarverlängerung | OlivHairSupply",
  description: "OlivHairSupply KI HairMatch Pro: Lade dein Foto hoch und finde die perfekten BiziLuxe Echthaar Extensions. Personalisierte KI-Haaranalyse für Länge, Textur & Farbe.",
  keywords: ["KI Haaranalyse", "Extensions Farbanalyse KI", "KI Haarmatch Berlin", "perfekte Haarverlängerung finden", "OHS AI Match", "Haar KI Tool online"],
  openGraph: { title: "KI Haaranalyse — Perfekte Haarverlängerung finden", description: "Lade dein Foto hoch und finde deine idealen BiziLuxe Extensions mit KI.", url: "https://olivhairsupply.de/ai-hairmatch-pro" },
  alternates: { canonical: "https://olivhairsupply.de/ai-hairmatch-pro" }
};



export default function AiHairmatchProPage() {
  const shell = fs.readFileSync(path.join(process.cwd(), "shopify-clone", "pages-services.html"), "utf8");
  const marker = '<main id="MainContent" class="content-for-layout focus-none" role="main" tabindex="-1">';
  const mainStart = shell.indexOf(marker);
  const footerStart = shell.indexOf("<!-- BEGIN sections: footer-group -->", mainStart);
  const before = normalizeShell(shell.slice(0, mainStart + marker.length));
  const after = normalizeShell(shell.slice(footerStart));

  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: before }} />
      <HairMatchProClient />
      <div dangerouslySetInnerHTML={{ __html: after }} />
    </>
  );
}

function normalizeShell(html: string) {
  let out = html
    .replaceAll('href="/collections"', 'href="/shop"')
    .replaceAll('href="/collections/all"', 'href="/shop"')
    .replaceAll('href="/pages/appointment"', 'href="/appointments"')
    .replaceAll('href="/pages/affiliate"', 'href="/affiliate"')
    .replaceAll('href="/pages/wholesale"', 'href="/wholesale"')
    .replaceAll('href="/customer_authentication/login"', 'href="/login"')
    .replace(/href="\/customer_authentication\/login[^"]*"/g, 'href="/login"');

  // Inject OHS AI Match dropdown under Services (same as ShopifyClonePage)
  out = out.replace(
    /<li>\s*<a class="ohs-nav-link [^"]*"\s*\n?\s*href="\/pages\/services">Services<\/a>\s*<\/li>/g,
    `<li class="ohs-ai-nav-item"><a class="ohs-nav-link ohs-ai-nav-link" href="/pages/services">Services</a><div class="ohs-ai-dropdown"><a href="/ai-hairmatch-pro" class="ohs-ai-dd-featured">✦ OHS AI Match</a></div></li>`
  );

  // Mobile nav
  out = out.replaceAll(
    '<li><a href="/pages/services">Services</a></li>',
    '<li><a href="/ai-hairmatch-pro">OHS AI Match</a></li><li><a href="/pages/services">Services</a></li>'
  );

  return out;
}