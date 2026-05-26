import fs from "node:fs";
import path from "node:path";
import { CartView } from "@/components/cart/CartView";

export default function CartPage() {
  const shell = fs.readFileSync(path.join(process.cwd(), "shopify-clone", "shop.html"), "utf8");
  const marker = '<main id="MainContent" class="content-for-layout focus-none" role="main" tabindex="-1">';
  const mainStart = shell.indexOf(marker);
  const footerStart = shell.indexOf("<!-- BEGIN sections: footer-group -->", mainStart);
  const before = shell.slice(0, mainStart + marker.length);
  const after = shell.slice(footerStart);

  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: before }} />
      <CartView />
      <div dangerouslySetInnerHTML={{ __html: after }} />
    </>
  );
}
