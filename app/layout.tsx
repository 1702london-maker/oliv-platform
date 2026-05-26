import type { Metadata } from "next";
import { AffiliateTracker } from "@/components/affiliate/AffiliateTracker";
import "./globals.css";
import "./shopify-clone.css";

export const metadata: Metadata = {
  title: "OlivHairSupply",
  description: "Luxury Hair. Premium Quality. Designed for You."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AffiliateTracker />
        {children}
      </body>
    </html>
  );
}
