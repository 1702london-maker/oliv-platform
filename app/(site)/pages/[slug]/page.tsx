import { ShopifyClonePage } from "@/components/ShopifyClonePage";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function ShopifyPage({ params }: PageProps) {
  const { slug } = await params;
  return <ShopifyClonePage page={`pages-${slug}`} />;
}
