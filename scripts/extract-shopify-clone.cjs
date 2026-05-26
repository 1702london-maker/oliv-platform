const fs = require("fs");
const path = require("path");

const outDir = "shopify-clone";
const pages = {
  home: "shopify-home.html",
  shop: "shopify-shop.html",
  appointments: "shopify-appointment.html",
  wholesale: "shopify-wholesale.html",
  affiliate: "shopify-affiliate.html",
  collections: "shopify-collections.html",
  "pages-about": "shopify-page-about.html",
  "pages-training": "shopify-page-training.html",
  "pages-services": "shopify-page-services.html",
  "pages-rentals": "shopify-page-rentals.html"
};

fs.mkdirSync(outDir, { recursive: true });

function between(source, start, end) {
  const startIndex = source.indexOf(start);
  const endIndex = source.indexOf(end, startIndex);
  if (startIndex < 0 || endIndex < 0) return "";
  return source.slice(startIndex, endIndex + end.length);
}

function main(source) {
  const startIndex = source.indexOf('<main id="MainContent"');
  const endIndex = source.indexOf("<!-- BEGIN sections: footer-group -->", startIndex);
  if (startIndex < 0 || endIndex < 0) return "";
  return source.slice(startIndex, endIndex);
}

function clean(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/src="\/\//g, 'src="https://')
    .replace(/href="\/\//g, 'href="https://')
    .replace(/href="\/collections\/biziluxe-hair"/g, 'href="/shop"')
    .replace(/href="\/pages\/appointment"/g, 'href="/appointments"')
    .replace(/href="\/pages\/wholesale"/g, 'href="/wholesale"')
    .replace(/href="\/pages\/affiliate"/g, 'href="/affiliate"')
    .replace(/href="\/pages\/about"/g, 'href="/pages/about"')
    .replace(/href="\/pages\/training"/g, 'href="/pages/training"')
    .replace(/href="\/pages\/services"/g, 'href="/pages/services"')
    .replace(/href="\/pages\/rentals"/g, 'href="/pages/rentals"')
    .replace(/href="\/collections"/g, 'href="/collections"')
    .replace(/href="\/account"/g, 'href="/login"')
    .replace(/href="\/customer_authentication\/login[^"]*"/g, 'href="/login"')
    .replace(/href="\/search"/g, 'href="/shop"')
    .replace(/href="\/cart"/g, 'href="/shop"');
}

let css = "";

for (const [name, file] of Object.entries(pages)) {
  const source = fs.readFileSync(file, "utf8");
  for (const match of source.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)) {
    css += `\n/* ${file} */\n${match[1]}\n`;
  }

  const header = between(
    source,
    "<!-- BEGIN sections: header-group -->",
    "<!-- END sections: header-group -->"
  );
  const footer = between(
    source,
    "<!-- BEGIN sections: footer-group -->",
    "<!-- END sections: footer-group -->"
  );

  fs.writeFileSync(path.join(outDir, `${name}.html`), clean(`${header}${main(source)}${footer}`));
}

fs.writeFileSync(
  "app/shopify-clone.css",
  css
    .replace(/url\(\/\//g, "url(https://")
    .replace(/url\("\/\/?/g, 'url("https://')
    .replace(/url\('\/\/?/g, "url('https://")
    .replace(/color:\s+color:/g, "color:")
);
