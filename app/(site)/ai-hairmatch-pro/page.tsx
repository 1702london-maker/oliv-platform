import fs from "node:fs";
import path from "node:path";
import { HairMatchProClient } from "@/components/hairmatch/HairMatchProClient";

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
    `<li class="ohs-ai-nav-item"><a class="ohs-nav-link ohs-ai-nav-link" href="/pages/services">Services</a><div class="ohs-ai-dropdown"><a href="/ai-hairmatch-pro" class="ohs-ai-dd-featured">✦ OHS AI Match</a><a href="/pages/services">Services</a></div></li>`
  );

  // Mobile nav
  out = out.replaceAll(
    '<li><a href="/pages/services">Services</a></li>',
    '<li><a href="/ai-hairmatch-pro">OHS AI Match</a></li><li><a href="/pages/services">Services</a></li>'
  );

  return out;
}
