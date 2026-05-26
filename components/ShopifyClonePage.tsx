import fs from "node:fs";
import path from "node:path";

type ShopifyClonePageProps = {
  page: string;
};

export function ShopifyClonePage({ page }: ShopifyClonePageProps) {
  const filePath = path.join(process.cwd(), "shopify-clone", `${page}.html`);
  const html = fs.readFileSync(fs.existsSync(filePath) ? filePath : path.join(process.cwd(), "shopify-clone", "home.html"), "utf8");

  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
