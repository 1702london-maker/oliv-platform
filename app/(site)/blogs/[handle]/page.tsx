import { ShopifyClonePage } from "@/components/ShopifyClonePage";

type PageProps = {
  params: Promise<{ handle: string }>;
};

export default async function BlogPage({ params }: PageProps) {
  const { handle } = await params;
  return <ShopifyClonePage page={`blogs-${handle}`} />;
}
