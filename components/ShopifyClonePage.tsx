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

  // Inject global German translation + currency engine (runs on every page)
  const i18nScript = `<script src="/js/ohs-i18n.js"></script>`;
  html = html.includes("</body>")
    ? html.replace("</body>", i18nScript + "</body>")
    : html + i18nScript;

  return html;
}
