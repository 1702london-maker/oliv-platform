import fs from "node:fs";
import path from "node:path";

type ShopifyClonePageProps = {
  page: string;
};

export function ShopifyClonePage({ page }: ShopifyClonePageProps) {
  const filePath = path.join(process.cwd(), "shopify-clone", `${page}.html`);
  const rawHtml = fs.readFileSync(fs.existsSync(filePath) ? filePath : path.join(process.cwd(), "shopify-clone", "home.html"), "utf8");
  const html = normalizeShopifyHtml(rawHtml, page);

  return <div dangerouslySetInnerHTML={{ __html: html }} />;
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
      .replaceAll('onclick="openDash()"', 'onclick="window.location.href=\'/login?next=/affiliate\'"')
      .replaceAll("Log in to Dashboard", "Log in to Affiliate Portal");
  }

  if (page === "wholesale") {
    html = html
      .replaceAll('action="/contact#contact_form"', 'action="/api/applications/wholesale"')
      .replaceAll('onclick="owhlOpenLogin()"', 'onclick="window.location.href=\'/login?next=/wholesale\'"')
      .replaceAll('onclick="owhlTryLogin()"', 'onclick="window.location.href=\'/login?next=/wholesale\'"')
      .replaceAll("Access Wholesale Shop", "Log in to Wholesale Portal");
  }

  if (page === "appointments") {
    html = html.replaceAll('action="/contact#oappt-hidden-form"', 'action="/api/appointments"');
  }

  html = html.replace(/action="\/contact#[^"]*"/g, 'action="/api/contact"');

  return html;
}
