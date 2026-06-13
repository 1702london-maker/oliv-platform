import type { Metadata } from "next";
import { cookies } from "next/headers";
import { AffiliateTracker } from "@/components/affiliate/AffiliateTracker";
import { TranslationClient } from "@/components/TranslationClient";
import Script from "next/script";
import "./globals.css";
import "./shopify-clone.css";

export const metadata: Metadata = {
  title: "OlivHairSupply",
  description: "Luxuriöses Haar. Premium-Qualität. Für dich gemacht."
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
        <AffiliateTracker />
        <TranslationClient />
        {children}
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

        <a
          href="https://wa.me/4915786283439?text=Hello%20OlivHairSupply%2C%20I%27d%20like%20help%20from%20AI%20Reception"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat with OlivHairSupply AI Reception on WhatsApp"
          style={{
            position: "fixed",
            right: 20,
            bottom: 24,
            zIndex: 999,
            display: "flex",
            alignItems: "center",
            gap: 10,
            minHeight: 52,
            maxWidth: "calc(100vw - 40px)",
            background: "#0f0f0f",
            color: "#fff",
            border: "1px solid #C9A96E",
            padding: "0 18px 0 14px",
            boxShadow: "0 10px 32px rgba(0,0,0,0.28)",
            textDecoration: "none",
            fontFamily: "Montserrat, Arial, sans-serif",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.14em",
            textTransform: "uppercase"
          }}
        >
          <span
            aria-hidden="true"
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: "#C9A96E",
              color: "#0f0f0f",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
              fontWeight: 700,
              flex: "0 0 auto"
            }}
          >
            W
          </span>
          Chat with AI Reception
        </a>
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
