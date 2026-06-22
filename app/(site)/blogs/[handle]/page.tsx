import type { Metadata } from "next";
import { ShopifyClonePage } from "@/components/ShopifyClonePage";

type PageProps = {
  params: Promise<{ handle: string }>;
};

const handleMeta: Record<string, { title: string; description: string }> = {
  journal: {
    title: "BiziLuxe Magazin — Haarpflege, Trends & Tutorials | OlivHairSupply",
    description: "Das OlivHairSupply Magazin: Expertentipps zur Pflege von Echthaar Extensions, aktuelle Haartrends, Styling-Tutorials und Neuigkeiten aus der BiziLuxe Welt."
  }
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { handle } = await params;
  const meta = handleMeta[handle] ?? {
    title: `${handle} — OlivHairSupply Magazin`,
    description: "Haarpflege-Tipps, Trends und Tutorials rund um BiziLuxe Echthaar Extensions von OlivHairSupply Berlin."
  };
  return {
    title: meta.title,
    description: meta.description,
    keywords: ["Extensions Pflege Tipps", "Haarverlängerung Blog Deutschland", "BiziLuxe Magazin", "Echthaar Extensions Ratgeber", "Haartrends Berlin"],
    openGraph: { title: meta.title, description: meta.description, url: `https://olivhairsupply.de/blogs/${handle}` },
    alternates: { canonical: `https://olivhairsupply.de/blogs/${handle}` }
  };
}

export default async function BlogPage({ params }: PageProps) {
  const { handle } = await params;
  return <ShopifyClonePage page={`blogs-${handle}`} />;
}
