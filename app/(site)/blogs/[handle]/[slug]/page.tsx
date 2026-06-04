import { ShopifyClonePage } from "@/components/ShopifyClonePage";

type PageProps = {
  params: Promise<{ handle: string; slug: string }>;
};

export default async function BlogArticlePage({ params }: PageProps) {
  const { handle, slug } = await params;
  return <ShopifyClonePage page={`blogs-${handle}-article`} />;
}
