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

export default function CheckoutSuccessPage() {
  const { before, after } = getShell();

  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: before }} />

      <div id="ohs-success-page">
        <style>{`
          #ohs-success-page {
            background: #F5F0E8;
            font-family: 'Montserrat', sans-serif;
            min-height: 60vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 72px 20px;
          }
          .ohs-success-card {
            max-width: 600px;
            width: 100%;
            background: #fff;
            border: 1px solid #E2D5C0;
          }
          .ohs-success-header {
            background: #2B2620;
            padding: 36px 44px;
          }
          .ohs-success-brand {
            font-size: 9.5px;
            font-weight: 700;
            letter-spacing: 0.3em;
            text-transform: uppercase;
            color: #B68A45;
            margin: 0 0 10px;
          }
          .ohs-success-title {
            font-family: 'Cormorant Garamond', Georgia, serif;
            font-size: 36px;
            font-weight: 300;
            color: #fff;
            margin: 0;
            line-height: 1.1;
          }
          .ohs-success-body {
            padding: 40px 44px;
          }
          .ohs-success-icon {
            width: 52px;
            height: 52px;
            background: #EAF4EC;
            border: 1px solid #B8D9BC;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 24px;
            font-size: 22px;
          }
          .ohs-success-lead {
            font-size: 15px;
            font-weight: 500;
            color: #2B2620;
            margin: 0 0 10px;
            line-height: 1.5;
          }
          .ohs-success-sub {
            font-size: 12px;
            color: #6B5C4E;
            margin: 0 0 32px;
            line-height: 1.7;
          }
          .ohs-success-divider {
            border: none;
            border-top: 1px solid #E2D5C0;
            margin: 0 0 28px;
          }
          .ohs-success-next-label {
            font-size: 8.5px;
            font-weight: 700;
            letter-spacing: 0.28em;
            text-transform: uppercase;
            color: #B68A45;
            margin: 0 0 16px;
          }
          .ohs-success-actions {
            display: flex;
            gap: 12px;
            flex-wrap: wrap;
          }
          .ohs-success-btn {
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
          .ohs-success-btn--dark {
            background: #2B2620;
            color: #fff;
            border-color: #2B2620;
          }
          .ohs-success-btn--dark:hover { background: #3d3530; }
          .ohs-success-btn--outline {
            background: transparent;
            color: #2B2620;
            border-color: #2B2620;
          }
          .ohs-success-btn--outline:hover { background: #2B2620; color: #fff; }
          .ohs-success-btn--gold {
            background: #B68A45;
            color: #fff;
            border-color: #B68A45;
          }
          .ohs-success-btn--gold:hover { background: #9a7539; }
          @media (max-width: 600px) {
            .ohs-success-header, .ohs-success-body { padding-left: 28px; padding-right: 28px; }
            .ohs-success-title { font-size: 28px; }
          }
        `}</style>

        <div className="ohs-success-card">
          <div className="ohs-success-header">
            <p className="ohs-success-brand">OlivHairSupply</p>
            <h1 className="ohs-success-title">Order Confirmed</h1>
          </div>
          <div className="ohs-success-body">
            <div className="ohs-success-icon">✓</div>
            <p className="ohs-success-lead">Thank you — your order has been received.</p>
            <p className="ohs-success-sub">
              We&apos;re preparing your BiziLuxe hair with care. You&apos;ll receive a confirmation
              email shortly. Orders are typically dispatched within 1–3 business days.
            </p>

            <hr className="ohs-success-divider" />

            <p className="ohs-success-next-label">What&apos;s Next</p>
            <div className="ohs-success-actions">
              <Link href="/shop" className="ohs-success-btn ohs-success-btn--dark">
                Continue Shopping
              </Link>
              <Link href="/appointments" className="ohs-success-btn ohs-success-btn--gold">
                Book Appointment
              </Link>
              <Link href="/account" className="ohs-success-btn ohs-success-btn--outline">
                My Account
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div dangerouslySetInnerHTML={{ __html: after }} />
    </>
  );
}
