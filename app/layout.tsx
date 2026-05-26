import type { Metadata } from "next";
import "./globals.css";
import "./shopify-clone.css";

export const metadata: Metadata = {
  title: "OlivHairSupply",
  description: "Luxury Hair. Premium Quality. Designed for You."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
