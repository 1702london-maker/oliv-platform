import fs from "node:fs";
import path from "node:path";
import { WholesaleLoginForm } from "./WholesaleLoginForm";
import { WholesaleLoginHeader, WholesaleLoginFooter } from "./WholesaleLoginHeader";
import { LocaleInterceptor } from "@/components/auth/LocaleInterceptor";

function getShell() {
  const html = fs.readFileSync(path.join(process.cwd(), "shopify-clone", "shop.html"), "utf8");
  const marker = '<div class="template-404 page-width page-margin center">';
  const start = html.indexOf(marker);
  const end = html.indexOf("</div>", start) + "</div>".length;
  return {
    before: start > -1 ? html.slice(0, start) : html,
    after: start > -1 ? html.slice(end) : ""
  };
}

export default function WholesaleLoginPage() {
  const { before, after } = getShell();

  return (
    <>
      <div suppressHydrationWarning dangerouslySetInnerHTML={{ __html: before }} />

      <div id="ohs-auth-main">
        <style>{`
          #ohs-auth-main {
            background: #F8F5EF;
            min-height: 60vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 64px 24px;
          }
          .ohs-auth-card {
            background: #ffffff;
            border: 1px solid #e0d2bc;
            width: 100%;
            max-width: 460px;
            padding: 52px 48px;
          }
          .ohs-auth-eyebrow {
            font-family: 'Montserrat', sans-serif;
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 0.28em;
            text-transform: uppercase;
            color: #B68A45;
            margin: 0 0 14px;
          }
          .ohs-auth-title {
            font-family: 'Cormorant Garamond', Georgia, serif;
            font-size: 42px;
            font-weight: 300;
            color: #2B2620;
            margin: 0 0 36px;
            line-height: 1.1;
          }
          .ohs-auth-divider { border: none; border-top: 1px solid #e7d9c5; margin: 28px 0; }
          .ohs-auth-footer-text {
            font-family: 'Montserrat', sans-serif;
            font-size: 13px;
            color: #6b5c4e;
            margin: 0;
            text-align: center;
          }
          .ohs-auth-footer-text a {
            color: #2B2620;
            font-weight: 700;
            text-decoration: underline;
            text-underline-offset: 3px;
          }
          @media (max-width: 520px) {
            .ohs-auth-card { padding: 36px 24px; }
            .ohs-auth-title { font-size: 34px; }
          }
        `}</style>

        <div className="ohs-auth-card">
          <WholesaleLoginHeader />
          <WholesaleLoginForm />
          <hr className="ohs-auth-divider" />
          <WholesaleLoginFooter />
        </div>
      </div>

      <div suppressHydrationWarning dangerouslySetInnerHTML={{ __html: after }} />
      <LocaleInterceptor />
    </>
  );
}
