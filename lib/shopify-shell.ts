import fs from "node:fs";
import path from "node:path";

function normalizeShell(html: string): string {
  return html
    .replaceAll('href="/collections"', 'href="/shop"')
    .replaceAll('href="/collections/all"', 'href="/shop"')
    .replace(/href="\/collections\/[^"]+"/g, 'href="/shop"')
    .replaceAll('href="/pages/appointment"', 'href="/appointments"')
    .replaceAll('href="/pages/affiliate"', 'href="/affiliate"')
    .replaceAll('href="/pages/wholesale"', 'href="/wholesale"')
    .replaceAll('href="/search"', 'href="/shop"')
    .replace(/href="\/customer_authentication\/login[^"]*"/g, 'href="/login"')
    .replace(/action="\/contact#[^"]*"/g, 'action="/api/contact"')
    .replaceAll("EUR â‚¬", "EUR &euro;")
    .replaceAll('âœ"', '✓')
    .replaceAll('âœ¦', '✦')
    .replaceAll('â€"', '&mdash;')
    .replaceAll("â€˜", "&lsquo;")
    .replaceAll("â€™", "&rsquo;")
    .replaceAll("â€œ", "&ldquo;")
    .replaceAll("â€", "&rdquo;")
    .replace(/<option\b[^>]*\bvalue=(["'])es\1[^>]*>[\s\S]*?<\/option>/gi, '')
    .replace(/(<select[^>]*name="locale_code"[^>]*)onchange="this\.form\.submit\(\)"([^>]*>)/g, '$1$2')
    .replace(
      /<select([\s\S]*?name="country_code"[\s\S]*?)>[\s\S]*?<\/select>/g,
      '<select$1><option value="DE" selected>EUR &euro;</option><option value="GB">GBP &pound;</option><option value="US">USD $</option></select>'
    )
    .replace(/<style>\s*\.ohs-chat[\s\S]*?<\/style>\s*<div class="ohs-chat-wrap"[\s\S]*?<\/div>/g, '');
}

export function getAuthPageShell(): { before: string; after: string } {
  const raw = fs.readFileSync(path.join(process.cwd(), "shopify-clone", "shop.html"), "utf8");
  const html = normalizeShell(raw);
  const marker = '<div class="template-404 page-width page-margin center">';
  const start = html.indexOf(marker);
  const end = html.indexOf("</div>", start) + "</div>".length;
  return {
    before: start > -1 ? html.slice(0, start) : html,
    after: start > -1 ? html.slice(end) : "",
  };
}
