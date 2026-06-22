import type { Metadata } from "next";
import { cookies } from "next/headers";
import { AffiliateTracker } from "@/components/affiliate/AffiliateTracker";
import { TranslationClient } from "@/components/TranslationClient";
import { FloatingChatWidget } from "@/components/FloatingChatWidget";
import Script from "next/script";
import "./globals.css";
import "./shopify-clone.css";

const siteUrl = "https://olivhairsupply.de";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "OlivHairSupply Berlin — Echthaar Extensions & BiziLuxe Kollektion",
    template: "%s | OlivHairSupply Berlin"
  },
  description: "Premium Echthaar Extensions aus Berlin. Entdecke die BiziLuxe Kollektion — Remy Haarverlängerungen, Clip-In Extensions, Perücken & Zubehör. Kostenloser EU-Versand ab 200 €. Professionelle Saloninstallation verfügbar.",
  keywords: [
    "Echthaar Extensions kaufen", "Haarverlängerung Berlin", "BiziLuxe Extensions",
    "Remy Hair Extensions kaufen", "Echthaar Extensions Berlin", "Bonding Extensions Echthaar Berlin",
    "Clip In Extensions Echthaar kaufen", "Tape Extensions Berlin kaufen",
    "Premium Echthaar Extensions Deutschland", "Haarverdichtung Extensions",
    "OlivHairSupply", "BiziLuxe Kollektion", "Extensions Zubehör kaufen",
    "luxury hair extensions Berlin", "human hair extensions Germany"
  ],
  authors: [{ name: "OlivHairSupply", url: siteUrl }],
  creator: "OlivHairSupply",
  publisher: "OlivHairSupply",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 }
  },
  openGraph: {
    type: "website",
    locale: "de_DE",
    alternateLocale: "en_GB",
    url: siteUrl,
    siteName: "OlivHairSupply",
    title: "OlivHairSupply Berlin — Echthaar Extensions & BiziLuxe Kollektion",
    description: "Premium Echthaar Extensions aus Berlin. BiziLuxe Kollektion — Remy Haarverlängerungen, Clip-In Extensions & Zubehör. Kostenloser EU-Versand ab 200 €.",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: "OlivHairSupply — BiziLuxe Echthaar Extensions Berlin" }]
  },
  twitter: {
    card: "summary_large_image",
    title: "OlivHairSupply Berlin — Echthaar Extensions & BiziLuxe Kollektion",
    description: "Premium Echthaar Extensions aus Berlin. BiziLuxe Kollektion — Remy Haarverlängerungen, Clip-In Extensions & Zubehör.",
    images: ["/og-image.jpg"],
    creator: "@olivhairsupply"
  },
  alternates: {
    canonical: siteUrl,
    languages: { "de-DE": siteUrl, "en-GB": `${siteUrl}/en` }
  },
  category: "beauty"
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = (await cookies()).get("ohs_locale")?.value || "de";
  return (
    <html lang={locale === "de" ? "de" : "en"}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Montserrat:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": ["Organization", "LocalBusiness"],
                "@id": "https://olivhairsupply.de/#organization",
                name: "OlivHairSupply",
                url: "https://olivhairsupply.de",
                logo: { "@type": "ImageObject", url: "https://olivhairsupply.de/logo.svg" },
                description: "Premium luxury human hair extensions and BiziLuxe collection. Berlin-based hair salon and online store serving Germany, UK and Europe.",
                address: { "@type": "PostalAddress", addressLocality: "Berlin", addressCountry: "DE" },
                areaServed: ["DE", "GB", "EU"],
                priceRange: "€€€",
                contactPoint: { "@type": "ContactPoint", contactType: "customer service", availableLanguage: ["German", "English"] },
                sameAs: [
                  "https://instagram.com/olivhairsupply",
                  "https://tiktok.com/@olivhairsupply",
                  "https://facebook.com/olivhairsupply"
                ]
              },
              {
                "@type": "WebSite",
                "@id": "https://olivhairsupply.de/#website",
                url: "https://olivhairsupply.de",
                name: "OlivHairSupply",
                publisher: { "@id": "https://olivhairsupply.de/#organization" },
                potentialAction: {
                  "@type": "SearchAction",
                  target: { "@type": "EntryPoint", urlTemplate: "https://olivhairsupply.de/shop?q={search_term_string}" },
                  "query-input": "required name=search_term_string"
                }
              }
            ]
          })}}
        />
        <AffiliateTracker />
        <TranslationClient />
        {children}
        <FloatingChatWidget />
        <Script id="mobile-nav" strategy="afterInteractive">{`
          (function() {
            function initMobileNav() {
              var ham = document.getElementById('ohs-ham');
              var drawer = document.getElementById('ohs-drawer');
              var overlay = document.getElementById('ohs-overlay');
              var closeBtn = document.getElementById('ohs-drawer-x');
              if (!ham || !drawer || !overlay) return;
              function openDrawer() {
                drawer.classList.add('is-open');
                overlay.classList.add('is-open');
                ham.setAttribute('aria-expanded', 'true');
                drawer.setAttribute('aria-hidden', 'false');
                overlay.setAttribute('aria-hidden', 'false');
                document.body.style.overflow = 'hidden';
              }
              function closeDrawer() {
                drawer.classList.remove('is-open');
                overlay.classList.remove('is-open');
                ham.setAttribute('aria-expanded', 'false');
                drawer.setAttribute('aria-hidden', 'true');
                overlay.setAttribute('aria-hidden', 'true');
                document.body.style.overflow = '';
              }
              ham.addEventListener('click', openDrawer);
              overlay.addEventListener('click', closeDrawer);
              if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
            }
            if (document.readyState === 'loading') {
              document.addEventListener('DOMContentLoaded', initMobileNav);
            } else {
              initMobileNav();
            }
          })();
        `}</Script>

        <Script id="cart-init" strategy="afterInteractive">{`
  (function() {
    function initCart() {
      // Fix cart href + inject badge on every page
      document.querySelectorAll('a[aria-label^="Cart"]').forEach(function(el) {
        el.setAttribute('href', '/cart');
        if (!el.querySelector('.ohs-cart-badge')) {
          var badge = document.createElement('span');
          badge.className = 'ohs-cart-badge';
          el.style.position = 'relative';
          el.appendChild(badge);
        }
      });
      updateCartCount();
    }

    function updateCartCount() {
      try {
        var cart = JSON.parse(localStorage.getItem('ohs-cart') || '[]');
        var count = cart.reduce(function(sum, item) {
          return sum + (item.quantity || 1);
        }, 0);
        document.querySelectorAll('.ohs-cart-badge').forEach(function(el) {
          el.textContent = count > 0 ? String(count) : '';
          el.style.display = count > 0 ? 'flex' : 'none';
        });
      } catch(e) {}
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initCart);
    } else {
      initCart();
    }

    window.addEventListener('ohs-cart-updated', updateCartCount);
    window.addEventListener('storage', function(e) {
      if (e.key === 'ohs-cart') updateCartCount();
    });
  })();
`}</Script>
      </body>
    </html>
  );
}
