import type { Metadata } from "next";
import { cookies } from "next/headers";
import { AffiliateTracker } from "@/components/affiliate/AffiliateTracker";
import Script from "next/script";
import "./globals.css";
import "./shopify-clone.css";

export const metadata: Metadata = {
  title: "OlivHairSupply",
  description: "Luxury Hair. Premium Quality. Designed for You."
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = (await cookies()).get("ohs_locale")?.value || "en";
  return (
    <html lang={locale}>
      <body>
        <AffiliateTracker />
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
      </body>
    </html>
  );
}
