import type { Metadata } from "next";
import { ShopifyClonePage } from "@/components/ShopifyClonePage";

export const metadata: Metadata = {
  title: "OlivHairSupply Berlin — Echthaar Extensions & BiziLuxe Kollektion kaufen",
  description: "Berlins führende Luxus-Haarmarke. Echthaar Extensions, Clip-In Haarverlängerungen, Perücken & Zubehör aus der BiziLuxe Kollektion. Professionelle Saloninstallation in Berlin. Kostenloser EU-Versand ab 200 €.",
  keywords: ["Echthaar Extensions kaufen", "BiziLuxe Extensions kaufen", "Haarverlängerung Berlin kaufen", "Echthaar Extensions Deutschland", "Premium Haarverlängerung online kaufen"],
  openGraph: {
    title: "OlivHairSupply Berlin — Echthaar Extensions & BiziLuxe Kollektion",
    description: "Berlins führende Luxus-Haarmarke. BiziLuxe Echthaar Extensions kaufen. Kostenloser EU-Versand ab 200 €.",
    url: "https://olivhairsupply.de",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: "OlivHairSupply BiziLuxe Echthaar Extensions Berlin" }]
  },
  alternates: { canonical: "https://olivhairsupply.de" }
};

export default function HomePage() {
  return <ShopifyClonePage page="home" />;
}
