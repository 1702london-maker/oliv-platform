import { redirect } from "next/navigation";

type Props = {
  params: Promise<{ handle: string }>;
};

export default async function TaggedBlogPage({ params }: Props) {
  const { handle } = await params;
  redirect(`/blogs/${handle}`);
}
