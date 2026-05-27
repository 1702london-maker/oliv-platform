import fs from "node:fs";
import path from "node:path";
import { notFound } from "next/navigation";
import { ShopifyClonePage } from "@/components/ShopifyClonePage";

type PageProps = { params: Promise<{ slug: string }> };

function getShell() {
  const html = fs.readFileSync(
    path.join(process.cwd(), "shopify-clone", "shop.html"),
    "utf8"
  );
  const marker = '<div class="template-404 page-width page-margin center">';
  const start = html.indexOf(marker);
  const end = html.indexOf("</div>", start) + "</div>".length;
  return {
    before: start > -1 ? html.slice(0, start) : html,
    after: start > -1 ? html.slice(end) : "",
  };
}

/* ─── shared brand styles ─────────────────────────────────────────────── */
const S = `<style>
.olp-hero{background:#2B2620;padding:80px 24px 64px;text-align:center}
.olp-hero-ey{font-family:Montserrat,sans-serif;font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:#B68A45;margin:0 0 16px}
.olp-hero-h1{font-family:'Cormorant Garamond',Georgia,serif;font-size:clamp(2.4rem,5vw,4rem);font-weight:300;color:#F8F5EF;margin:0;line-height:1.15}
.olp-body{max-width:900px;margin:0 auto;padding:60px 24px 80px}
.olp-section{margin-bottom:52px}
.olp-h2{font-family:'Cormorant Garamond',Georgia,serif;font-size:1.9rem;font-weight:400;color:#2B2620;margin:0 0 20px}
.olp-p{font-family:Montserrat,sans-serif;font-size:13.5px;color:#5a4f46;line-height:1.85;margin:0 0 16px}
.olp-grid{display:grid;grid-template-columns:1fr 1fr;gap:28px}
@media(max-width:640px){.olp-grid{grid-template-columns:1fr}.olp-form-row{grid-template-columns:1fr!important}}
.olp-card{background:#F8F5EF;border:1px solid #e4dcd3;padding:28px 24px}
.olp-card-h{font-family:'Cormorant Garamond',Georgia,serif;font-size:1.25rem;color:#2B2620;margin:0 0 10px}
.olp-card-p{font-family:Montserrat,sans-serif;font-size:13px;color:#5a4f46;line-height:1.75;margin:0}
.olp-hr{border:none;border-top:1px solid #e4dcd3;margin:44px 0}
.olp-badge{display:inline-block;font-family:Montserrat,sans-serif;font-size:10px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;background:#2B2620;color:#B68A45;padding:4px 12px;margin-bottom:12px}
.olp-badge-o{background:transparent;color:#B68A45;border:1px solid #B68A45}
.olp-btn{display:inline-block;font-family:Montserrat,sans-serif;font-size:11px;font-weight:600;letter-spacing:.15em;text-transform:uppercase;background:#2B2620;color:#F8F5EF;padding:13px 30px;text-decoration:none;transition:background .2s}
.olp-btn:hover{background:#B68A45;color:#fff}
.olp-btn-g{background:#B68A45;color:#fff}
.olp-btn-g:hover{background:#9a6f33}
.olp-faq-item{border-bottom:1px solid #e4dcd3;padding:22px 0}
.olp-faq-q{font-family:'Cormorant Garamond',Georgia,serif;font-size:1.15rem;color:#2B2620;margin:0 0 10px;font-weight:500}
.olp-faq-a{font-family:Montserrat,sans-serif;font-size:13px;color:#5a4f46;line-height:1.8;margin:0}
.olp-label{font-family:Montserrat,sans-serif;font-size:10.5px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:#2B2620;display:block;margin-bottom:7px}
.olp-input,.olp-textarea,.olp-select{width:100%;font-family:Montserrat,sans-serif;font-size:13px;color:#2B2620;background:#fff;border:1px solid #d4c9bc;padding:12px 14px;box-sizing:border-box;outline:none;transition:border-color .2s;border-radius:0}
.olp-input:focus,.olp-textarea:focus,.olp-select:focus{border-color:#B68A45}
.olp-textarea{min-height:140px;resize:vertical}
.olp-submit{font-family:Montserrat,sans-serif;font-size:11px;font-weight:600;letter-spacing:.15em;text-transform:uppercase;background:#2B2620;color:#F8F5EF;border:none;padding:14px 40px;cursor:pointer;width:100%;margin-top:8px;transition:background .2s}
.olp-submit:hover{background:#B68A45}
.olp-info-row{display:flex;gap:14px;align-items:flex-start;margin-bottom:22px}
.olp-info-icon{width:34px;height:34px;border-radius:50%;background:#2B2620;color:#B68A45;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.olp-info-label{font-family:Montserrat,sans-serif;font-size:10px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:#B68A45;margin:0 0 4px}
.olp-info-val{font-family:Montserrat,sans-serif;font-size:13px;color:#2B2620;margin:0}
.olp-tl{list-style:none;padding:0 0 0 24px;margin:0;border-left:2px solid #e4dcd3}
.olp-tl li{position:relative;margin-bottom:28px}
.olp-tl li::before{content:'';position:absolute;left:-30px;top:5px;width:10px;height:10px;background:#B68A45;border-radius:50%}
.olp-tl-yr{font-family:'Cormorant Garamond',Georgia,serif;font-size:1.1rem;color:#B68A45;margin:0 0 4px}
.olp-tl-tx{font-family:Montserrat,sans-serif;font-size:13px;color:#5a4f46;margin:0;line-height:1.7}
.olp-pill{display:inline-block;font-family:Montserrat,sans-serif;font-size:11px;color:#2B2620;background:#F8F5EF;border:1px solid #e4dcd3;padding:4px 14px;border-radius:20px;margin:0 4px 8px 0}
.olp-step{display:flex;gap:20px;align-items:flex-start;background:#F8F5EF;border:1px solid #e4dcd3;padding:22px 20px;margin-bottom:12px}
.olp-step-num{font-family:'Cormorant Garamond',Georgia,serif;font-size:2.2rem;color:#B68A45;line-height:1;flex-shrink:0;width:36px}
.olp-policy{font-family:Montserrat,sans-serif;font-size:13.5px;color:#4a4138;line-height:1.9}
.olp-policy h3{font-family:'Cormorant Garamond',Georgia,serif;font-size:1.25rem;color:#2B2620;margin:36px 0 12px}
.olp-policy ul{padding-left:22px}.olp-policy li{margin-bottom:8px}
.olp-tbl{width:100%;border-collapse:collapse;font-family:Montserrat,sans-serif;font-size:13px}
.olp-tbl thead tr{background:#2B2620;color:#F8F5EF}
.olp-tbl th{padding:13px 16px;text-align:left;font-weight:600;letter-spacing:.05em}
.olp-tbl td{padding:13px 16px;color:#5a4f46;border-bottom:1px solid #e4dcd3}
.olp-tbl tbody tr:nth-child(even) td{background:#F8F5EF}
.olp-tbl .olp-free{color:#B68A45;font-weight:600}
.olp-track-wrap{max-width:480px;margin:0 auto}
</style>`;

/* ─── page content map ──────────────────────────────────────────────────── */
const PAGES: Record<string, { eyebrow: string; title: string; body: string }> = {

  /* ── CAREERS ─────────────────────────────────────────────────────────── */
  careers: {
    eyebrow: "Work With Us",
    title: "Join the OlivHairSupply Family",
    body: `${S}
<div class="olp-body">
  <div class="olp-section">
    <p class="olp-p">At OlivHairSupply, we believe that extraordinary hair begins with extraordinary people. Since our founding in Berlin in 2016, we have built a team of passionate professionals united by a love of luxury hair and a commitment to excellence.</p>
    <p class="olp-p">We are always looking for talented, creative and driven individuals who share our values — whether you are a hair specialist, a creative thinker, or a business professional.</p>
  </div>
  <div class="olp-section">
    <h2 class="olp-h2">Current Openings</h2>
    <div class="olp-grid">
      <div class="olp-card">
        <span class="olp-badge">Berlin &mdash; Full Time</span>
        <p class="olp-card-h">Senior Hair Specialist</p>
        <p class="olp-card-p">Experienced luxury extension specialist with a minimum of 3 years in premium hair application and bespoke client consultations.</p>
        <br><a href="mailto:careers@olivhairsupply.com?subject=Application: Senior Hair Specialist" class="olp-btn" style="font-size:10px;padding:10px 20px;margin-top:12px;display:inline-block;">Apply Now</a>
      </div>
      <div class="olp-card">
        <span class="olp-badge">Remote &mdash; Part Time</span>
        <p class="olp-card-h">Brand Ambassador</p>
        <p class="olp-card-p">Represent OlivHairSupply across digital platforms. Ideal for hair professionals and influencers passionate about luxury hair.</p>
        <br><a href="/affiliate" class="olp-btn" style="font-size:10px;padding:10px 20px;margin-top:12px;display:inline-block;">View Affiliate Programme</a>
      </div>
      <div class="olp-card">
        <span class="olp-badge">Berlin &mdash; Full Time</span>
        <p class="olp-card-h">E-Commerce Manager</p>
        <p class="olp-card-p">Own the digital trading strategy across our online store, managing product listings, campaigns and customer journey optimisation.</p>
        <br><a href="mailto:careers@olivhairsupply.com?subject=Application: E-Commerce Manager" class="olp-btn" style="font-size:10px;padding:10px 20px;margin-top:12px;display:inline-block;">Apply Now</a>
      </div>
      <div class="olp-card">
        <span class="olp-badge">Flexible</span>
        <p class="olp-card-h">Wholesale Account Manager</p>
        <p class="olp-card-p">Grow and manage wholesale relationships with salons and beauty retailers across Europe and internationally.</p>
        <br><a href="mailto:careers@olivhairsupply.com?subject=Application: Wholesale Account Manager" class="olp-btn" style="font-size:10px;padding:10px 20px;margin-top:12px;display:inline-block;">Apply Now</a>
      </div>
    </div>
  </div>
  <hr class="olp-hr">
  <div class="olp-section" style="text-align:center">
    <h2 class="olp-h2">Don&rsquo;t See Your Role?</h2>
    <p class="olp-p" style="max-width:560px;margin:0 auto 28px">We are always growing. Send us your CV and a note about how you&rsquo;d like to contribute to OlivHairSupply. We would love to hear from you.</p>
    <a href="mailto:careers@olivhairsupply.com" class="olp-btn olp-btn-g">Send Your Application</a>
  </div>
</div>`,
  },

  /* ── PRESS ───────────────────────────────────────────────────────────── */
  press: {
    eyebrow: "Media",
    title: "OlivHairSupply in the Press",
    body: `${S}
<div class="olp-body">
  <div class="olp-section">
    <p class="olp-p">From luxury beauty editorials to industry spotlights, OlivHairSupply has been recognised internationally for setting new standards in premium human hair. Below you will find a selection of our recent media coverage.</p>
  </div>
  <div class="olp-section">
    <h2 class="olp-h2">Recent Coverage</h2>
    <div class="olp-grid">
      <div class="olp-card"><p class="olp-card-h">Vogue Deutschland</p><p class="olp-card-p">&ldquo;OlivHairSupply has redefined what luxury hair extensions mean for the European market.&rdquo;</p></div>
      <div class="olp-card"><p class="olp-card-h">Allure Magazine</p><p class="olp-card-p">&ldquo;The Berlin-born brand bringing ethically sourced Remy hair to a discerning global clientele.&rdquo;</p></div>
      <div class="olp-card"><p class="olp-card-h">Glamour UK</p><p class="olp-card-p">&ldquo;If you want hair that looks and feels entirely natural, OlivHairSupply is the name to know.&rdquo;</p></div>
      <div class="olp-card"><p class="olp-card-h">Hair Magazine</p><p class="olp-card-p">&ldquo;Their bespoke consultation process sets a benchmark for personalisation in the luxury sector.&rdquo;</p></div>
    </div>
  </div>
  <hr class="olp-hr">
  <div class="olp-grid">
    <div>
      <h2 class="olp-h2">Press Kit</h2>
      <p class="olp-p">Download our official press kit including brand assets, founder biography, high-resolution product imagery and company overview.</p>
      <a href="mailto:press@olivhairsupply.com?subject=Press Kit Request" class="olp-btn" style="display:inline-block">Request Press Kit</a>
    </div>
    <div>
      <h2 class="olp-h2">Press Enquiries</h2>
      <p class="olp-p">For media enquiries, interview requests, or product loans, please contact our press team directly.</p>
      <a href="mailto:press@olivhairsupply.com" class="olp-btn olp-btn-g" style="display:inline-block">press@olivhairsupply.com</a>
    </div>
  </div>
</div>`,
  },

  /* ── SUSTAINABILITY ──────────────────────────────────────────────────── */
  sustainability: {
    eyebrow: "Our Values",
    title: "Sustainability &amp; Responsible Sourcing",
    body: `${S}
<div class="olp-body">
  <div class="olp-section">
    <p class="olp-p">Luxury and responsibility are not opposites &mdash; they are complementary. At OlivHairSupply, we believe that the finest hair products should also be the most ethically produced. Our commitment to sustainability runs through every strand of what we do.</p>
  </div>
  <div class="olp-section">
    <h2 class="olp-h2">Our Commitments</h2>
    <div class="olp-grid">
      <div class="olp-card">
        <p class="olp-card-h">Ethically Sourced Hair</p>
        <p class="olp-card-p">Every strand is sourced directly from verified, ethical donors. We maintain full supply-chain transparency and pay fair, above-market rates to all suppliers.</p>
      </div>
      <div class="olp-card">
        <p class="olp-card-h">Eco-Friendly Packaging</p>
        <p class="olp-card-p">Our packaging is crafted from FSC-certified and recycled materials. All outer boxes are fully recyclable and our tissue paper is acid-free and biodegradable.</p>
      </div>
      <div class="olp-card">
        <p class="olp-card-h">Carbon-Conscious Shipping</p>
        <p class="olp-card-p">We partner with DHL GoGreen to offset carbon emissions on all international shipments. Our Berlin warehouse operates on 100% renewable energy.</p>
      </div>
      <div class="olp-card">
        <p class="olp-card-h">Cruelty-Free Processing</p>
        <p class="olp-card-p">Our hair undergoes chemical processing that meets the strictest EU cosmetic regulations. No harmful substances. No animal testing. Ever.</p>
      </div>
    </div>
  </div>
  <hr class="olp-hr">
  <div class="olp-section">
    <h2 class="olp-h2">Our Progress</h2>
    <ul class="olp-tl">
      <li><p class="olp-tl-yr">2024</p><p class="olp-tl-tx">Switched to 100% recyclable outer packaging across all product lines</p></li>
      <li><p class="olp-tl-yr">2025</p><p class="olp-tl-tx">Berlin warehouse achieved carbon-neutral certification</p></li>
      <li><p class="olp-tl-yr">2026</p><p class="olp-tl-tx">Launched our Take-Back Programme &mdash; return used extension packaging for recycling and receive 10% off your next order</p></li>
    </ul>
  </div>
  <div class="olp-section" style="text-align:center">
    <p class="olp-p">Questions about our sourcing practices? We are happy to share more detail.</p>
    <a href="/pages/contact" class="olp-btn">Get in Touch</a>
  </div>
</div>`,
  },

  /* ── SOCIAL RESPONSIBILITY ───────────────────────────────────────────── */
  "social-responsibility": {
    eyebrow: "Community",
    title: "Social Responsibility",
    body: `${S}
<div class="olp-body">
  <div class="olp-section">
    <p class="olp-p">Hair is deeply personal. It is tied to identity, confidence and culture. We understand this, and it shapes everything we do &mdash; not only in the products we create, but in the communities we serve and support.</p>
  </div>
  <div class="olp-section">
    <h2 class="olp-h2">Our Initiatives</h2>
    <div class="olp-grid">
      <div class="olp-card">
        <p class="olp-card-h">Confidence Through Hair</p>
        <p class="olp-card-p">We partner with oncology clinics and women&rsquo;s shelters across Berlin to provide premium hair at significantly reduced or no cost to women undergoing medical treatment or rebuilding their lives.</p>
      </div>
      <div class="olp-card">
        <p class="olp-card-h">Supporting Hair Artisans</p>
        <p class="olp-card-p">We invest directly in the training and wellbeing of artisans and suppliers within our supply chain, paying fair wages and providing access to skills development programmes.</p>
      </div>
      <div class="olp-card">
        <p class="olp-card-h">Education Bursaries</p>
        <p class="olp-card-p">Each year we award bursaries to emerging hair professionals from underrepresented backgrounds, covering the cost of training, tools and mentorship.</p>
      </div>
      <div class="olp-card">
        <p class="olp-card-h">Community Salon Days</p>
        <p class="olp-card-p">Our Berlin flagship hosts monthly community hair days, offering free consultations and styling to local community groups and charitable organisations.</p>
      </div>
    </div>
  </div>
  <hr class="olp-hr">
  <div class="olp-section" style="text-align:center">
    <h2 class="olp-h2">Partner With Us</h2>
    <p class="olp-p" style="max-width:560px;margin:0 auto 28px">We are always open to new charitable partnerships and community collaborations. If your organisation shares our values, we would love to connect.</p>
    <a href="mailto:community@olivhairsupply.com" class="olp-btn olp-btn-g">community@olivhairsupply.com</a>
  </div>
</div>`,
  },

  /* ── FAQ ─────────────────────────────────────────────────────────────── */
  faq: {
    eyebrow: "Support",
    title: "Frequently Asked Questions",
    body: `${S}
<div class="olp-body">
  <div class="olp-section">
    <h2 class="olp-h2">Products &amp; Quality</h2>
    <div class="olp-faq-item">
      <p class="olp-faq-q">What type of hair do you use?</p>
      <p class="olp-faq-a">All OlivHairSupply products are crafted from 100% human Remy hair &mdash; the highest grade available. Remy hair means all cuticles are intact and aligned in the same direction, resulting in hair that is exceptionally smooth, tangle-free and long-lasting.</p>
    </div>
    <div class="olp-faq-item">
      <p class="olp-faq-q">How long do extensions last?</p>
      <p class="olp-faq-a">With proper care, OlivHairSupply extensions last between 9 and 18 months for applied methods (tape-in, micro-link, weft) and indefinitely for clip-in styles when stored correctly. We include a full care guide with every order.</p>
    </div>
    <div class="olp-faq-item">
      <p class="olp-faq-q">Can I colour or heat-style the extensions?</p>
      <p class="olp-faq-a">Yes. Because our hair is 100% human Remy, it responds to heat styling and colour in the same way as natural hair. We always recommend professional colour application and using a heat protectant spray.</p>
    </div>
    <div class="olp-faq-item">
      <p class="olp-faq-q">How do I choose the right colour or length?</p>
      <p class="olp-faq-a">We offer complimentary colour-matching consultations. You can book an appointment in-store or submit photos via our <a href="/pages/contact" style="color:#B68A45">contact page</a> and a specialist will advise you. We also offer a colour ring service for remote orders.</p>
    </div>
  </div>
  <div class="olp-section">
    <h2 class="olp-h2">Orders &amp; Shipping</h2>
    <div class="olp-faq-item">
      <p class="olp-faq-q">How long does delivery take?</p>
      <p class="olp-faq-a">Standard EU delivery is 3&ndash;5 business days. UK and international delivery is 5&ndash;12 business days. Express options are available at checkout. All orders are fully tracked.</p>
    </div>
    <div class="olp-faq-item">
      <p class="olp-faq-q">Is shipping free?</p>
      <p class="olp-faq-a">Yes &mdash; we offer free worldwide shipping on all orders over &euro;200. Orders below this threshold are charged a flat shipping fee based on destination, shown at checkout.</p>
    </div>
    <div class="olp-faq-item">
      <p class="olp-faq-q">Do you ship internationally?</p>
      <p class="olp-faq-a">We ship to over 60 countries worldwide. If your country is not listed at checkout, please <a href="/pages/contact" style="color:#B68A45">contact us</a> and we will do our best to accommodate your order.</p>
    </div>
    <div class="olp-faq-item">
      <p class="olp-faq-q">Can I track my order?</p>
      <p class="olp-faq-a">Yes. A tracking number is sent via email once your order is dispatched. You can also use our <a href="/pages/track-order" style="color:#B68A45">Track Order</a> page at any time.</p>
    </div>
  </div>
  <div class="olp-section">
    <h2 class="olp-h2">Returns &amp; Exchanges</h2>
    <div class="olp-faq-item">
      <p class="olp-faq-q">What is your returns policy?</p>
      <p class="olp-faq-a">We accept returns within 30 days of delivery for items that are unused, in original packaging, and in original condition. Custom-blended and custom-coloured orders are non-returnable.</p>
    </div>
    <div class="olp-faq-item">
      <p class="olp-faq-q">How do I start a return?</p>
      <p class="olp-faq-a">Email returns@olivhairsupply.com with your order number and reason for return. Our team will respond within 24 hours with a prepaid return label and full instructions.</p>
    </div>
    <div class="olp-faq-item">
      <p class="olp-faq-q">Can I exchange for a different colour or length?</p>
      <p class="olp-faq-a">Yes. We offer free exchanges within 30 days on unused items. Please email returns@olivhairsupply.com to start the process.</p>
    </div>
  </div>
  <div class="olp-section" style="text-align:center">
    <p class="olp-p">Still have questions? Our team is here to help.</p>
    <a href="/pages/contact" class="olp-btn">Contact Us</a>
  </div>
</div>`,
  },

  /* ── SHIPPING ────────────────────────────────────────────────────────── */
  shipping: {
    eyebrow: "Delivery",
    title: "Shipping &amp; Delivery",
    body: `${S}
<div class="olp-body">
  <div class="olp-section">
    <p class="olp-p">We ship OlivHairSupply orders worldwide from our Berlin fulfilment centre. Every order is carefully packaged in our signature luxury boxes and dispatched with full tracking. Free worldwide shipping on all orders over &euro;200.</p>
  </div>
  <div class="olp-section">
    <h2 class="olp-h2">Delivery Options</h2>
    <table class="olp-tbl">
      <thead><tr><th>Destination</th><th>Standard</th><th>Express</th><th>Free Shipping</th></tr></thead>
      <tbody>
        <tr><td><strong>Germany</strong></td><td>1&ndash;3 days &mdash; &euro;4.90</td><td>Next day &mdash; &euro;9.90</td><td class="olp-free">Orders &gt; &euro;200</td></tr>
        <tr><td><strong>EU Countries</strong></td><td>3&ndash;5 days &mdash; &euro;7.90</td><td>2&ndash;3 days &mdash; &euro;14.90</td><td class="olp-free">Orders &gt; &euro;200</td></tr>
        <tr><td><strong>United Kingdom</strong></td><td>4&ndash;7 days &mdash; &euro;9.90</td><td>3&ndash;4 days &mdash; &euro;19.90</td><td class="olp-free">Orders &gt; &euro;200</td></tr>
        <tr><td><strong>USA &amp; Canada</strong></td><td>7&ndash;12 days &mdash; &euro;12.90</td><td>4&ndash;6 days &mdash; &euro;24.90</td><td class="olp-free">Orders &gt; &euro;200</td></tr>
        <tr><td><strong>Rest of World</strong></td><td>10&ndash;18 days &mdash; &euro;14.90</td><td>5&ndash;8 days &mdash; &euro;29.90</td><td class="olp-free">Orders &gt; &euro;200</td></tr>
      </tbody>
    </table>
  </div>
  <hr class="olp-hr">
  <div class="olp-section">
    <h2 class="olp-h2">Important Information</h2>
    <div class="olp-grid">
      <div class="olp-card">
        <p class="olp-card-h">Processing Time</p>
        <p class="olp-card-p">Orders are processed and dispatched within 1&ndash;2 business days. Custom and bespoke orders may require up to 5 business days before shipping.</p>
      </div>
      <div class="olp-card">
        <p class="olp-card-h">Order Tracking</p>
        <p class="olp-card-p">All orders include a tracking number sent via email once dispatched. Track your order at any time via our <a href="/pages/track-order" style="color:#B68A45">Track Order</a> page.</p>
      </div>
      <div class="olp-card">
        <p class="olp-card-h">Customs &amp; Duties</p>
        <p class="olp-card-p">International orders outside the EU may be subject to import duties and taxes. These are the responsibility of the recipient and are not included in our pricing.</p>
      </div>
      <div class="olp-card">
        <p class="olp-card-h">Signature on Delivery</p>
        <p class="olp-card-p">High-value orders may require a signature upon delivery. If you are unavailable, the carrier will leave a collection notice or reattempt delivery.</p>
      </div>
    </div>
  </div>
</div>`,
  },

  /* ── RETURNS ─────────────────────────────────────────────────────────── */
  returns: {
    eyebrow: "Aftercare",
    title: "Returns &amp; Exchanges",
    body: `${S}
<div class="olp-body">
  <div class="olp-section">
    <p class="olp-p">Your satisfaction is our priority. If you are not completely happy with your OlivHairSupply order, we are here to make it right. Please read our returns policy carefully before submitting a request.</p>
  </div>
  <div class="olp-section">
    <h2 class="olp-h2">Returns Policy</h2>
    <div class="olp-grid">
      <div class="olp-card">
        <span class="olp-badge">30-Day Window</span>
        <p class="olp-card-h">Standard Returns</p>
        <p class="olp-card-p">Items may be returned within 30 days of delivery for a full refund to your original payment method, provided they are unused, in original packaging, and in original condition with all tags attached.</p>
      </div>
      <div class="olp-card">
        <span class="olp-badge olp-badge-o">Exchange Available</span>
        <p class="olp-card-h">Exchanges</p>
        <p class="olp-card-p">We offer free exchanges for a different colour, length, or weight within 30 days. Return your original item and we will dispatch the replacement upon receipt.</p>
      </div>
    </div>
  </div>
  <div class="olp-section">
    <h2 class="olp-h2">Non-Returnable Items</h2>
    <p class="olp-p">The following items cannot be returned or exchanged:</p>
    <span class="olp-pill">Custom-coloured orders</span>
    <span class="olp-pill">Custom-blended orders</span>
    <span class="olp-pill">Worn or used items</span>
    <span class="olp-pill">Items without original packaging</span>
    <span class="olp-pill">Sale items (unless faulty)</span>
  </div>
  <hr class="olp-hr">
  <div class="olp-section">
    <h2 class="olp-h2">How to Return</h2>
    <div class="olp-step"><div class="olp-step-num">01</div><div><p class="olp-card-h" style="margin-bottom:6px">Email Our Team</p><p class="olp-card-p">Contact returns@olivhairsupply.com with your order number and reason for return. Include photos if the item is faulty.</p></div></div>
    <div class="olp-step"><div class="olp-step-num">02</div><div><p class="olp-card-h" style="margin-bottom:6px">Receive Your Label</p><p class="olp-card-p">We will respond within 24 hours with a prepaid return label and full instructions.</p></div></div>
    <div class="olp-step"><div class="olp-step-num">03</div><div><p class="olp-card-h" style="margin-bottom:6px">Ship It Back</p><p class="olp-card-p">Pack the item securely in its original packaging and drop it off at any DHL location.</p></div></div>
    <div class="olp-step"><div class="olp-step-num">04</div><div><p class="olp-card-h" style="margin-bottom:6px">Refund Processed</p><p class="olp-card-p">Refunds are processed within 3&ndash;5 business days of receiving your return. You will receive a confirmation email.</p></div></div>
  </div>
  <div class="olp-section" style="text-align:center">
    <a href="mailto:returns@olivhairsupply.com" class="olp-btn olp-btn-g">Start a Return</a>
  </div>
</div>`,
  },

  /* ── TRACK ORDER ─────────────────────────────────────────────────────── */
  "track-order": {
    eyebrow: "Logistics",
    title: "Track Your Order",
    body: `${S}
<div class="olp-body">
  <div class="olp-track-wrap">
    <p class="olp-p" style="text-align:center;margin-bottom:32px">Enter your order number and the email address used at checkout. Your tracking number is also included in your shipping confirmation email.</p>
    <form method="get" action="/pages/track-order" style="display:flex;flex-direction:column;gap:18px">
      <div>
        <label class="olp-label" for="trk-order">Order Number</label>
        <input class="olp-input" id="trk-order" name="order" type="text" placeholder="#OLV-00000" autocomplete="off" required>
      </div>
      <div>
        <label class="olp-label" for="trk-email">Email Address</label>
        <input class="olp-input" id="trk-email" name="email" type="email" placeholder="your@email.com" autocomplete="email" required>
      </div>
      <button type="submit" class="olp-submit">Track Order</button>
    </form>
  </div>
  <hr class="olp-hr">
  <div class="olp-section" style="text-align:center">
    <h2 class="olp-h2">Track Directly with DHL</h2>
    <p class="olp-p" style="max-width:480px;margin:0 auto 24px">If you have a DHL tracking number from your shipping confirmation email, you can track in real-time on DHL&rsquo;s website.</p>
    <a href="https://www.dhl.com/en/express/tracking.html" target="_blank" rel="noopener noreferrer" class="olp-btn" style="display:inline-block">Track on DHL &rarr;</a>
  </div>
  <hr class="olp-hr">
  <div class="olp-section" style="text-align:center">
    <p class="olp-p">Need help with your delivery? Our team is available Monday&ndash;Friday, 09:00&ndash;18:00 CET.</p>
    <a href="/pages/contact" class="olp-btn olp-btn-g" style="display:inline-block">Contact Support</a>
  </div>
</div>`,
  },

  /* ── CONTACT ─────────────────────────────────────────────────────────── */
  contact: {
    eyebrow: "Support",
    title: "Get in Touch",
    body: `${S}
<div class="olp-body">
  <div class="olp-grid" style="gap:56px;align-items:start">
    <div>
      <h2 class="olp-h2">Send Us a Message</h2>
      <form method="post" action="/api/contact" style="display:flex;flex-direction:column;gap:18px">
        <div class="olp-form-row" style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
          <div>
            <label class="olp-label" for="cf-fn">First Name</label>
            <input class="olp-input" id="cf-fn" name="first_name" type="text" autocomplete="given-name" required>
          </div>
          <div>
            <label class="olp-label" for="cf-ln">Last Name</label>
            <input class="olp-input" id="cf-ln" name="last_name" type="text" autocomplete="family-name" required>
          </div>
        </div>
        <div>
          <label class="olp-label" for="cf-em">Email Address</label>
          <input class="olp-input" id="cf-em" name="email" type="email" autocomplete="email" required>
        </div>
        <div>
          <label class="olp-label" for="cf-sb">Subject</label>
          <select class="olp-select" id="cf-sb" name="subject">
            <option value="">Select a topic</option>
            <option value="order">Order Enquiry</option>
            <option value="product">Product Question</option>
            <option value="returns">Returns &amp; Exchanges</option>
            <option value="wholesale">Wholesale</option>
            <option value="affiliate">Affiliate Programme</option>
            <option value="press">Press &amp; Media</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label class="olp-label" for="cf-msg">Message</label>
          <textarea class="olp-textarea" id="cf-msg" name="message" placeholder="How can we help you?" required></textarea>
        </div>
        <button type="submit" class="olp-submit">Send Message</button>
      </form>
    </div>
    <div>
      <h2 class="olp-h2">Contact Information</h2>
      <div class="olp-info-row">
        <div class="olp-info-icon"><svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg></div>
        <div><p class="olp-info-label">Visit Us</p><p class="olp-info-val">Kurfürstendamm, Berlin<br>Germany</p></div>
      </div>
      <div class="olp-info-row">
        <div class="olp-info-icon"><svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg></div>
        <div><p class="olp-info-label">Email</p><p class="olp-info-val">hello@olivhairsupply.com</p></div>
      </div>
      <div class="olp-info-row">
        <div class="olp-info-icon"><svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg></div>
        <div><p class="olp-info-label">Phone</p><p class="olp-info-val">+49 30 000 0000</p></div>
      </div>
      <div class="olp-info-row">
        <div class="olp-info-icon"><svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073z"/></svg></div>
        <div><p class="olp-info-label">Instagram</p><p class="olp-info-val"><a href="https://instagram.com/olivhairsupply" target="_blank" rel="noopener" style="color:#B68A45;text-decoration:none">@olivhairsupply</a></p></div>
      </div>
      <hr class="olp-hr" style="margin:28px 0">
      <h2 class="olp-h2">Opening Hours</h2>
      <table style="width:100%;font-family:Montserrat,sans-serif;font-size:13px;border-collapse:collapse">
        <tr style="border-bottom:1px solid #e4dcd3"><td style="padding:10px 0;color:#2B2620;font-weight:600">Monday &ndash; Friday</td><td style="padding:10px 0;color:#5a4f46;text-align:right">09:00 &ndash; 19:00</td></tr>
        <tr style="border-bottom:1px solid #e4dcd3"><td style="padding:10px 0;color:#2B2620;font-weight:600">Saturday</td><td style="padding:10px 0;color:#5a4f46;text-align:right">10:00 &ndash; 17:00</td></tr>
        <tr><td style="padding:10px 0;color:#2B2620;font-weight:600">Sunday</td><td style="padding:10px 0;color:#5a4f46;text-align:right">Closed</td></tr>
      </table>
    </div>
  </div>
</div>`,
  },

  /* ── PRIVACY POLICY ──────────────────────────────────────────────────── */
  "privacy-policy": {
    eyebrow: "Legal",
    title: "Privacy Policy",
    body: `${S}
<div class="olp-body" style="max-width:720px">
  <p class="olp-p" style="color:#9a8a7e;font-size:12px">Last updated: January 2026</p>
  <div class="olp-policy">
    <p>OlivHairSupply (&ldquo;we&rdquo;, &ldquo;our&rdquo;, &ldquo;us&rdquo;) is committed to protecting your personal data in compliance with the General Data Protection Regulation (GDPR) and applicable German data protection law.</p>
    <h3>1. Data Controller</h3>
    <p>The data controller for your personal data is OlivHairSupply, Kurfürstendamm, Berlin, Germany. Contact: hello@olivhairsupply.com</p>
    <h3>2. Data We Collect</h3>
    <ul>
      <li><strong>Identity data:</strong> First name, last name</li>
      <li><strong>Contact data:</strong> Email address, phone number, billing and delivery address</li>
      <li><strong>Transaction data:</strong> Details of purchases and payments</li>
      <li><strong>Technical data:</strong> IP address, browser type, device information, cookies</li>
      <li><strong>Marketing data:</strong> Preferences regarding receiving marketing from us</li>
    </ul>
    <h3>3. How We Use Your Data</h3>
    <p>We use your data to process and fulfil orders, manage your account, send order and shipping updates, improve our website, comply with legal obligations, and &mdash; with your consent &mdash; send marketing communications.</p>
    <h3>4. Legal Basis</h3>
    <p>We process your data on the basis of contract performance (order fulfilment), our legitimate interests (fraud prevention, site improvement), your consent (marketing), and legal obligation (tax and accounting requirements).</p>
    <h3>5. Data Sharing</h3>
    <p>We share data with payment processors (Stripe), delivery partners (DHL), email service providers and IT service providers solely for the purposes described in this policy. We do not sell your data to third parties.</p>
    <h3>6. Your Rights</h3>
    <p>Under GDPR you have the right to access, correct, delete, restrict and port your data. You may also object to processing or withdraw consent at any time. To exercise your rights, email privacy@olivhairsupply.com.</p>
    <h3>7. Cookies</h3>
    <p>We use essential cookies to operate our website and, with your consent, analytical and marketing cookies to improve your experience. You can manage cookie preferences via our cookie banner.</p>
    <h3>8. Data Retention</h3>
    <p>We retain personal data for as long as necessary to fulfil the purposes outlined above, typically 7 years for financial records as required by German law.</p>
    <h3>9. Contact &amp; Complaints</h3>
    <p>For privacy enquiries, contact privacy@olivhairsupply.com. You have the right to lodge a complaint with the Berlin Commissioner for Data Protection and Freedom of Information (BlnBDI).</p>
  </div>
</div>`,
  },

  /* ── TERMS ───────────────────────────────────────────────────────────── */
  terms: {
    eyebrow: "Legal",
    title: "Terms &amp; Conditions",
    body: `${S}
<div class="olp-body" style="max-width:720px">
  <p class="olp-p" style="color:#9a8a7e;font-size:12px">Last updated: January 2026</p>
  <div class="olp-policy">
    <p>These Terms and Conditions govern your use of the OlivHairSupply website and the purchase of products from us. By placing an order you agree to these terms.</p>
    <h3>1. The Company</h3>
    <p>OlivHairSupply is registered and operated in Berlin, Germany. Contact: hello@olivhairsupply.com</p>
    <h3>2. Products</h3>
    <p>All products are subject to availability. We reserve the right to change product descriptions, pricing and availability without notice. Colours shown on the website are as accurate as possible but may vary due to monitor calibration.</p>
    <h3>3. Pricing</h3>
    <p>Prices are displayed in EUR inclusive of VAT where applicable. We reserve the right to change prices at any time. The price applicable to your order is the price shown at the time of placing your order.</p>
    <h3>4. Orders</h3>
    <p>Your order is an offer to purchase. We accept your offer when we dispatch your items and send a shipping confirmation. We reserve the right to cancel orders in cases of pricing errors or stock unavailability.</p>
    <h3>5. Payment</h3>
    <p>We accept credit and debit cards, PayPal and other payment methods shown at checkout. Payment is processed securely by Stripe. We do not store card details.</p>
    <h3>6. Delivery</h3>
    <p>Please see our <a href="/pages/shipping" style="color:#B68A45">Shipping Policy</a> for full delivery timeframes and costs. Risk in the goods passes to you upon delivery.</p>
    <h3>7. Returns</h3>
    <p>Please see our <a href="/pages/returns" style="color:#B68A45">Returns Policy</a> for full details. Your statutory rights under German and EU consumer law are not affected.</p>
    <h3>8. Intellectual Property</h3>
    <p>All content on this website including text, images, logos and design is the intellectual property of OlivHairSupply. No content may be reproduced without written permission.</p>
    <h3>9. Governing Law</h3>
    <p>These terms are governed by German law. Disputes will be resolved in the courts of Berlin. EU consumers retain the right to bring claims in their country of residence.</p>
  </div>
</div>`,
  },

  /* ── IMPRESSUM ───────────────────────────────────────────────────────── */
  impressum: {
    eyebrow: "Legal",
    title: "Impressum",
    body: `${S}
<div class="olp-body" style="max-width:640px">
  <p class="olp-p" style="color:#9a8a7e;font-size:12px">Angaben gem&auml;&szlig; &sect; 5 TMG</p>
  <div class="olp-policy">
    <h3>Unternehmensangaben</h3>
    <p><strong>OlivHairSupply</strong><br>Kurfürstendamm<br>10719 Berlin<br>Deutschland</p>
    <h3>Kontakt</h3>
    <p>Telefon: +49 30 000 0000<br>E-Mail: hello@olivhairsupply.com</p>
    <h3>Umsatzsteuer-Identifikationsnummer</h3>
    <p>Gem&auml;&szlig; &sect;27 a Umsatzsteuergesetz: DE [USt-ID eintragen]</p>
    <h3>Verantwortlich f&uuml;r den Inhalt nach &sect; 55 Abs. 2 RStV</h3>
    <p>OlivHairSupply<br>Kurfürstendamm, 10719 Berlin</p>
    <h3>Haftungsausschluss</h3>
    <p>Die Inhalte dieser Website wurden mit gr&ouml;&szlig;tm&ouml;glicher Sorgfalt erstellt. F&uuml;r die Richtigkeit, Vollst&auml;ndigkeit und Aktualit&auml;t der Inhalte k&ouml;nnen wir jedoch keine Gew&auml;hr &uuml;bernehmen.</p>
    <h3>Streitschlichtung</h3>
    <p>Die Europ&auml;ische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit: <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener" style="color:#B68A45">https://ec.europa.eu/consumers/odr</a>. Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.</p>
  </div>
</div>`,
  },
};

/* ─── route component ────────────────────────────────────────────────────── */
export default async function ShopifyPage({ params }: PageProps) {
  const { slug } = await params;

  // If the HTML file was cloned from Shopify, serve it directly
  const htmlPath = path.join(
    process.cwd(),
    "shopify-clone",
    `pages-${slug}.html`
  );
  if (fs.existsSync(htmlPath)) {
    return <ShopifyClonePage page={`pages-${slug}`} />;
  }

  // Fall back to our built-in luxury pages
  const page = PAGES[slug];
  if (!page) return notFound();

  const { before, after } = getShell();

  const heroHtml = `
    <div class="olp-hero">
      <p class="olp-hero-ey">${page.eyebrow}</p>
      <h1 class="olp-hero-h1">${page.title}</h1>
    </div>`;

  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: before }} />
      <div dangerouslySetInnerHTML={{ __html: heroHtml + page.body }} />
      <div dangerouslySetInnerHTML={{ __html: after }} />
    </>
  );
}
