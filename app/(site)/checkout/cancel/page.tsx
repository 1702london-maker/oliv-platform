import fs from "node:fs";
import path from "node:path";
import Link from "next/link";

function getShell() {
  const html = fs.readFileSync(path.join(process.cwd(), "shopify-clone", "shop.html"), "utf8");
  const marker = '<div class="template-404 page-width page-margin center">';
  const start = html.indexOf(marker);
  const end = html.indexOf("</div>", start) + "</div>".length;
  return {
    before: start > -1 ? html.slice(0, start) : html,
    after: start > -1 ? html.slice(end) : "",
  };
}

export default function CheckoutCancelPage() {
  const { before, after } = getShell();

  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: before }} />

      <div id="ohs-cancel-page">
        <style>{`
          #ohs-cancel-page {
            background: #F5F0E8;
            font-family: 'Montserrat', sans-serif;
            min-height: 60vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 72px 20px;
          }
          .ohs-cancel-card {
            max-width: 600px;
            width: 100%;
            background: #fff;
            border: 1px solid #E2D5C0;
          }
          .ohs-cancel-header {
            background: #2B2620;
            padding: 36px 44px;
          }
          .ohs-cancel-brand {
            font-size: 9.5px;
            font-weight: 700;
            letter-spacing: 0.3em;
            text-transform: uppercase;
            color: #B68A45;
            margin: 0 0 10px;
          }
          .ohs-cancel-title {
            font-family: 'Cormorant Garamond', Georgia, serif;
            font-size: 36px;
            font-weight: 300;
            color: #fff;
            margin: 0;
            line-height: 1.1;
          }
          .ohs-cancel-body {
            padding: 40px 44px;
          }
          .ohs-cancel-icon {
            width: 52px;
            height: 52px;
            background: #FBF7F0;
            border: 1px solid #E2D5C0;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 24px;
            font-size: 22px;
          }
          .ohs-cancel-lead {
            font-size: 15px;
            font-weight: 500;
            color: #2B2620;
            margin: 0 0 10px;
            line-height: 1.5;
          }
          .ohs-cancel-sub {
            font-size: 12px;
            color: #6B5C4E;
            margin: 0 0 32px;
            line-height: 1.7;
          }
          .ohs-cancel-divider {
            border: none;
            border-top: 1px solid #E2D5C0;
            margin: 0 0 28px;
          }
          .ohs-cancel-next-label {
            font-size: 8.5px;
            font-weight: 700;
            letter-spacing: 0.28em;
            text-transform: uppercase;
            color: #B68A45;
            margin: 0 0 16px;
          }
          .ohs-cancel-actions {
            display: flex;
            gap: 12px;
            flex-wrap: wrap;
          }
          .ohs-cancel-btn {
            display: inline-block;
            padding: 13px 24px;
            font-family: 'Montserrat', sans-serif;
            font-size: 9.5px;
            font-weight: 700;
            letter-spacing: 0.2em;
            text-transform: uppercase;
            text-decoration: none;
            transition: background 0.2s, color 0.2s;
            cursor: pointer;
            border: 1px solid transparent;
          }
          .ohs-cancel-btn--dark {
            background: #2B2620;
            color: #fff;
            border-color: #2B2620;
          }
          .ohs-cancel-btn--dark:hover { background: #3d3530; }
          .ohs-cancel-btn--outline {
            background: transparent;
            color: #2B2620;
            border-color: #2B2620;
          }
          .ohs-cancel-btn--outline:hover { background: #2B2620; color: #fff; }
          .ohs-cancel-note {
            margin-top: 20px;
            font-size: 11px;
            color: #9B8878;
          }
          .ohs-cancel-note a {
            color: #B68A45;
            font-weight: 700;
            text-decoration: none;
          }
          @media (max-width: 600px) {
            .ohs-cancel-header, .ohs-cancel-body { padding-left: 28px; padding-right: 28px; }
            .ohs-cancel-title { font-size: 28px; }
          }
        `}</style>

        <div className="ohs-cancel-card">
          <div className="ohs-cancel-header">
            <p className="ohs-cancel-brand">OlivHairSupply</p>
            <h1 className="ohs-cancel-title">Checkout Cancelled</h1>
          </div>
          <div className="ohs-cancel-body">
            <div className="ohs-cancel-icon">←</div>
            <p className="ohs-cancel-lead">No problem — your cart is still saved.</p>
            <p className="ohs-cancel-sub">
              You can return to your cart at any time to complete your purchase.
              Your selected items will be waiting for you.
            </p>

            <hr className="ohs-cancel-divider" />

            <p className="ohs-cancel-next-label">Continue</p>
            <div className="ohs-cancel-actions">
              <Link href="/cart" className="ohs-cancel-btn ohs-cancel-btn--dark">
                Return to Cart
              </Link>
              <Link href="/shop" className="ohs-cancel-btn ohs-cancel-btn--outline">
                Keep Shopping
              </Link>
            </div>

            <p className="ohs-cancel-note">
              Need help with your order?{" "}
              <a href="https://wa.me/4915786283439" target="_blank" rel="noopener noreferrer">
                Message us on WhatsApp
              </a>
            </p>
          </div>
        </div>
      </div>

      <div dangerouslySetInnerHTML={{ __html: after }} />
    </>
  );
}
