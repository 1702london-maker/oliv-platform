import type { Metadata } from "next";
import { cookies } from "next/headers";
import { AffiliateTracker } from "@/components/affiliate/AffiliateTracker";
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
      </body>
    </html>
  );
}
