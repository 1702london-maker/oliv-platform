import fs from "node:fs";
import path from "node:path";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

type Article = {
  title: string;
  category: string;
  categoryLabel: string;
  date: string;
  readTime: string;
  excerpt: string;
  body: string;
};

const ARTICLES: Record<string, Article> = {
  "hair-care-salon-fresh": {
    title: "How to Keep Your Extensions Looking Salon Fresh",
    category: "hair-care",
    categoryLabel: "Hair Care",
    date: "12 May 2025",
    readTime: "6 min read",
    excerpt: "Learn the professional care routines that extend the life of your BiziLuxe extensions by months.",
    body: `
<p>The difference between extensions that look incredible at week one and those that still look incredible at week sixteen comes down to one thing: routine. A professional care routine, applied consistently, is the single greatest investment you can make after purchasing your BiziLuxe hair.</p>

<h2>Start With the Right Products</h2>
<p>Not all haircare products are formulated for extensions. Many high-street shampoos and conditioners contain sulphates, silicones and alcohol — all of which degrade the hair cuticle over time, leaving extensions dry, tangled and dull. Choose sulphate-free, extension-safe formulations. At OlivHairSupply, we recommend washing with lukewarm water only: hot water opens the cuticle and accelerates moisture loss.</p>

<h2>Brush Before You Wash</h2>
<p>Detangling before washing is non-negotiable. Starting at the ends and working upward with a wide-tooth comb or loop brush, gently remove any knots before your extensions get wet. Attempting to detangle wet extensions — especially with harsh brushing — creates friction that weakens the bonds and frays the strands.</p>

<h2>The 24-Hour Rule After Installation</h2>
<p>Regardless of your extension method, avoid washing for the first 24–48 hours after installation. This allows bonds, tapes or weft attachments to fully set and bond to your natural hair. For tape-ins, this window is especially critical — moisture can compromise the adhesive before it has fully cured.</p>

<h2>Weekly Deep Conditioning</h2>
<p>Unlike your natural hair, extensions receive no sebum from the scalp. They rely entirely on the products you apply for moisture. A weekly deep conditioning mask — applied from mid-lengths to ends, never at the roots — replenishes lost moisture and keeps the hair soft, shiny and manageable. Leave for a minimum of 15 minutes, or apply overnight under a silk wrap for intensive results.</p>

<h2>Protecting Your Investment at Night</h2>
<p>Cotton pillowcases are an extension's worst enemy. The friction created by cotton fibres while you sleep causes tangling, matting and cuticle damage over time. Switch to a silk or satin pillowcase, or secure your hair in a loose braid before bed. A satin-lined sleep cap adds an extra layer of protection for those with longer lengths.</p>

<h2>The Brush You Use Matters</h2>
<p>Use only extension-safe brushes — specifically loop brushes or padded extension brushes with soft, flexible bristles. Never brush from the root downward in a single stroke; always hold the hair above where you are brushing to prevent stress on the bonds. Brush gently, at least morning and evening, to keep the hair tangle-free.</p>

<h2>Schedule Regular Maintenance</h2>
<p>Maintenance appointments every 6–8 weeks are not optional — they are what separates extensions that last from extensions that fail. At these appointments, your stylist can check bond integrity, remove and reapply any loose pieces, and trim the ends to keep your extensions looking fresh and even. Book your next maintenance appointment at your Berlin OlivHairSupply boutique before you leave the salon.</p>
    `.trim(),
  },

  "hair-care-washing-right-way": {
    title: "Washing Your Hair Extensions the Right Way",
    category: "hair-care",
    categoryLabel: "Hair Care",
    date: "28 April 2025",
    readTime: "5 min read",
    excerpt: "The wrong wash routine can cut your extension lifespan in half. Here is what the professionals do.",
    body: `
<p>Washing extensions incorrectly is the most common reason clients see premature wear, tangling and bond failure. The good news: washing correctly takes no more time than washing incorrectly — it simply requires the right technique.</p>

<h2>How Often Should You Wash?</h2>
<p>For most extension types, washing every 2–3 days is ideal. Over-washing strips the hair of moisture, weakens bonds and accelerates shedding. Under-washing allows product buildup at the roots, which can compromise bond adhesion and cause scalp issues. Find your rhythm, and stick to it.</p>

<h2>The Pre-Wash Routine</h2>
<p>Before any water touches your hair, spend two minutes detangling with a loop brush, working from the ends up to the roots. Apply a small amount of extension-safe detangling spray if needed. This step alone can reduce breakage during washing by over 60%.</p>

<h2>Water Temperature</h2>
<p>Always wash in lukewarm — never hot — water. High temperatures open the hair cuticle, allowing moisture to escape. They also soften adhesive bonds (in tape-in extensions) and weaken keratin bonds, leading to slippage. Rinse in cool water to seal the cuticle and add shine.</p>

<h2>Applying Shampoo</h2>
<p>Dilute your shampoo slightly with water before applying. Work it gently into the scalp — focusing on the roots and bond area — using your fingertips, never your nails. Allow the suds to run down through the lengths as you rinse. Do not scrub the lengths aggressively: extensions need cleansing, not mechanical stress.</p>

<h2>Conditioning Correctly</h2>
<p>Conditioner should be applied from mid-length to ends only. Never apply conditioner directly to the roots or bond attachment points — this softens the adhesive or microrings and leads to slippage. Leave conditioner on for at least three minutes before rinsing thoroughly in cool water.</p>

<h2>Drying Extensions</h2>
<p>Gently squeeze excess water from the hair — never twist or wring. Pat dry with a microfibre towel. Allow extensions to air-dry where possible, or use a hairdryer on a low-heat setting. Never go to bed with wet extensions: sleeping on damp hair causes severe tangling and can lead to matting that is difficult to reverse.</p>

<h2>Frequency for Different Extension Methods</h2>
<p>Tape-ins and clip-ins benefit from slightly less frequent washing than bonded extensions. Wefts and sew-ins tolerate slightly more. Regardless of method, the principles remain the same: gentle, lukewarm, and moisture-focused. If you are unsure about your specific method, ask your stylist at your next OlivHairSupply appointment.</p>
    `.trim(),
  },

  "hair-care-heat-protection": {
    title: "Heat Protection: What Your Extensions Really Need",
    category: "hair-care",
    categoryLabel: "Hair Care",
    date: "15 April 2025",
    readTime: "5 min read",
    excerpt: "Before you pick up that curling iron, understand how to protect your investment from heat damage.",
    body: `
<p>Heat styling and extensions can coexist beautifully — when done correctly. The key is understanding that extensions, unlike your natural hair, have no capacity for self-repair. Once heat damage occurs, it cannot be reversed. The investment you protect today is the investment that rewards you for months to come.</p>

<h2>Why Extensions Are More Heat-Sensitive</h2>
<p>Natural hair receives continuous nourishment from the scalp: sebum, moisture from within, and the ongoing biological renewal of the follicle. Extensions receive none of this. They are reliant entirely on what you apply externally for their moisture content — which means they are more susceptible to heat damage and take longer to recover from it.</p>

<h2>Maximum Recommended Temperatures</h2>
<p>For BiziLuxe human hair extensions, keep heat tools at or below 180°C (356°F). Fine or lighter-coloured extensions — particularly platinum or honey blonde — should be kept at 160°C or below, as the lightening process has already removed some of the hair's natural protective structure. Never apply heat directly to bonds, tape attachments or microrings.</p>

<h2>Always Use a Heat Protectant</h2>
<p>Apply a heat protectant spray or cream before any heat styling — every single time. Look for products that offer protection up to at least 230°C and are formulated without alcohol, which dries the hair further. Distribute evenly from root to tip and allow to absorb for 30 seconds before applying heat.</p>

<h2>Techniques That Cause the Most Damage</h2>
<p>Repeated passes over the same section are the leading cause of extension heat damage. One smooth, confident pass at the correct temperature delivers the result you want. Multiple passes strip moisture with each contact. Similarly, clamping flat irons and curling wands too tightly compresses the cuticle unevenly — use a lighter grip and let the tool do the work.</p>

<h2>Alternatives to Heat</h2>
<p>Protective styles that require no heat — braids, twists, buns and roller sets — are among the best things you can do for extension longevity. A silk roller set overnight delivers salon-quality curls without a single degree of heat. Incorporate no-heat styles into your weekly routine, and your extensions will last significantly longer.</p>

<h2>Signs of Heat Damage</h2>
<p>Frizz that won't respond to conditioning, a rough or straw-like texture, or visible splitting at the ends are signs of heat damage. If you notice any of these, cease heat styling immediately and begin an intensive moisture recovery programme with weekly deep conditioning treatments. Visit your OlivHairSupply stylist if the damage is significant — they can advise on trimming and recovery options.</p>
    `.trim(),
  },

  "styling-tips-5-styles": {
    title: "5 Styles That Look Better With Extensions",
    category: "styling-tips",
    categoryLabel: "Styling Tips",
    date: "3 June 2025",
    readTime: "4 min read",
    excerpt: "From sleek ponytails to voluminous blowouts — discover styles that are made for added length and volume.",
    body: `
<p>Extensions don't just add length — they transform what becomes possible. Styles that fall flat with fine natural hair become genuinely show-stopping with the right amount of added volume and length. These five styles are proof of what BiziLuxe can do.</p>

<h2>1. The High Drama Ponytail</h2>
<p>Nothing epitomises effortless luxury quite like a sleek, high ponytail with length that falls below the shoulder blades. Extensions take this from a practical style into a statement. Use a small section of hair wrapped around the base to conceal the band, and finish with a shine serum for a glass-like effect that photographs beautifully. This style suits virtually every face shape and occasion — from daytime meetings to evening events.</p>

<h2>2. The Voluminous Blowout</h2>
<p>Extensions add exactly what a blowout needs: body through the lengths and weight that holds movement beautifully. Use a large round brush and a low-heat setting to work through sections, finishing with the nozzle pointing downward to seal the cuticle. The result — a full, bouncing blowout with genuine movement — is noticeably more impressive with volume added through extensions.</p>

<h2>3. Beachy Waves</h2>
<p>Beachy waves are defined by their relaxed imperfection, and extensions deliver this look with ease. Take random sections — varying the sizes for a natural effect — and wrap around a barrel curler, leaving the ends free. Separate with fingers once cool, apply a texturising spray, and finish with a light touch of sea salt mist. The weight of longer extensions allows the waves to settle beautifully and hold their shape throughout the day.</p>

<h2>4. The Sleek Low Bun</h2>
<p>A sleek low bun built with extensions carries a weight and elegance that short or fine hair alone cannot achieve. Pull back smoothly, secure with pins rather than elastics, and finish with a light-hold spray for a polished effect. This style is a wardrobe staple — equally appropriate for a formal occasion and a sophisticated everyday look.</p>

<h2>5. Half-Up, Half-Down</h2>
<p>The half-up half-down style benefits enormously from volume through the lengths below. With extensions, the down section has the fullness to balance the elevated top section, creating a proportionate, luxurious silhouette. Add a few soft waves to the down section for texture, or keep it straight for a cleaner, more editorial look. This style is one of the most universally flattering — and most photographed — in our salon portfolio.</p>
    `.trim(),
  },

  "styling-tips-blending": {
    title: "How to Blend Extensions With Your Natural Hair",
    category: "styling-tips",
    categoryLabel: "Styling Tips",
    date: "19 May 2025",
    readTime: "5 min read",
    excerpt: "The secret to undetectable extensions lies in the blend. Our master educators share their technique.",
    body: `
<p>Perfectly blended extensions are invisible extensions. When done correctly, nobody should be able to tell where your natural hair ends and your extensions begin. The technique is straightforward when you understand the principles behind it — and it begins before the extensions ever go in.</p>

<h2>Colour Matching: The Foundation</h2>
<p>No styling technique can overcome a poor colour match. Your extensions need to precisely match your natural hair colour — and for those with highlights, balayage or ombré, this means matching the overall tonal blend rather than just a single shade. At OlivHairSupply, every client receives a complimentary colour consultation. We hold the strand against multiple sections of natural hair in different lighting conditions before making a recommendation. Do not rush this step.</p>

<h2>Cutting and Layering</h2>
<p>Uncut extensions have a blunt edge that draws attention to itself. A skilled stylist will cut the extensions in with your natural hair after installation — adding layers that allow the two to move as one. This is standard at OlivHairSupply installations, and it makes a profound difference to how the finished look sits. If your extensions feel like a separate block of hair, layering is almost always the answer.</p>

<h2>The Curl Blend Technique</h2>
<p>One of the most effective blending techniques is to curl both your natural hair and extensions together after installation. Using a medium-barrel curler, take sections that cross the boundary between natural hair and extension, curling them as one. This physically blends the two textures and creates a uniform wave pattern throughout. Once brushed out, the result is indistinguishable.</p>

<h2>Managing Different Textures</h2>
<p>If your natural hair is wavy or curly and your extensions are straight (or vice versa), consistent styling is essential. Either straighten or wave everything together before blending. Attempting to blend two significantly different textures without uniform styling is the most common cause of visible extension lines. If you plan to wear your hair in its natural state, discuss this with your stylist before selecting your extension type — there are methods better suited to textured hair.</p>

<h2>Daily Touch-Ups</h2>
<p>For tape-in and clip-in wearers, a 60-second touch-up each morning keeps the blend seamless. A small amount of heat through the mid-lengths — just enough to marry the textures — followed by a brush through with a paddle brush keeps everything cohesive. Finish with a light shine spray to unify the overall appearance.</p>
    `.trim(),
  },

  "styling-tips-overnight": {
    title: "Overnight Styles That Protect Your Extensions",
    category: "styling-tips",
    categoryLabel: "Styling Tips",
    date: "6 May 2025",
    readTime: "4 min read",
    excerpt: "Rest without worry. These protective night routines keep your extensions smooth and tangle-free each morning.",
    body: `
<p>What you do with your extensions at night matters as much as your daytime styling. The hours spent sleeping are prime time for friction damage, tangling and matting — or, with the right preparation, a period of gentle protection that keeps your extensions in exceptional condition.</p>

<h2>Why Night Care Matters</h2>
<p>The average person moves 40–60 times during sleep. Each movement creates friction between your hair and pillowcase, building up over seven or eight hours into significant wear on the cuticle. For extensions, which cannot repair themselves, this accumulated damage leads to dryness, frizz and shortened lifespan. A five-minute pre-bed routine eliminates virtually all of this.</p>

<h2>The Loose Braid</h2>
<p>A single loose braid — from nape to tip — is the simplest and most effective protective sleep style. It keeps the hair contained, minimises tangling, and creates a natural wave pattern when released in the morning. Secure with a fabric-covered elastic (never a rubber band) and allow the braid to fall forward over one shoulder. The key word is loose: a tight braid creates tension at the attachment points and should be avoided.</p>

<h2>The Low Bun Variation</h2>
<p>For those who find braids uncomfortable, a very loose low bun secured with a silk scrunchie is equally effective. Avoid positioning the bun at the crown or nape — find the point that is most comfortable for your sleeping position and causes the least tension. A low side bun often works well for side-sleepers.</p>

<h2>Silk Pillowcases and Sleep Caps</h2>
<p>Even with the hair secured, the fabric of your pillowcase affects your extensions. Cotton creates friction and absorbs moisture — both damaging over time. A silk or satin pillowcase reduces friction significantly and maintains the moisture in your hair overnight. A silk-lined sleep cap offers the most comprehensive protection and is particularly recommended for those with sew-in wefts or who sleep in a variety of positions.</p>

<h2>The Overnight Conditioning Treatment</h2>
<p>Once or twice a week, apply a small amount of lightweight hair oil or leave-in conditioner to the mid-lengths and ends before braiding for bed. The overnight window allows the product to penetrate deeply, delivering superior moisture and softness compared to a five-minute in-shower mask. Rinse in the morning, or simply brush through for an intensely nourished finish.</p>

<h2>What to Avoid</h2>
<p>Never go to bed with wet or damp extensions. The combination of moisture and movement during sleep creates the ideal conditions for matting and tangling, particularly at the bonds. Allow extensions to dry completely — either air-dried or with a low-heat dryer — before your bedtime routine begins.</p>
    `.trim(),
  },

  "biziluxe-signature-clip-in": {
    title: "Introducing the BiziLuxe Signature Clip-In Set",
    category: "biziluxe-collections",
    categoryLabel: "BiziLuxe Collections",
    date: "20 June 2025",
    readTime: "4 min read",
    excerpt: "Our most requested launch yet — a complete clip-in collection engineered for luxury, longevity and effortless styling.",
    body: `
<p>After months of development, rigorous testing and refinement based on feedback from our salon team and clients, the BiziLuxe Signature Clip-In Set is here. This is not simply a clip-in extension — it is a complete hair transformation system designed to the same exacting standards as our permanent extension range.</p>

<h2>Why Clip-Ins?</h2>
<p>Clip-in extensions offer something that permanent methods cannot: total flexibility with zero commitment. Applied in minutes, removed in seconds, and ready to be styled and restyled as often as you choose. For clients who want the BiziLuxe look for a specific occasion, or those who want to experiment with length and volume before committing to a permanent installation, clip-ins are the ideal entry point.</p>

<h2>What Makes the Signature Set Different</h2>
<p>The BiziLuxe Signature Clip-In Set uses the same Remy human hair as our permanent extensions — sourced, cuticle-aligned and colour-matched to the same standards. We have engineered a new, wider clip design that distributes weight more evenly along the weft, eliminating the pressure points that make cheaper clip-ins uncomfortable after a few hours. Each clip is covered in a silicone grip that holds securely without damaging the natural hair beneath.</p>

<h2>What's in the Set</h2>
<p>The Signature Set includes seven wefts in varying widths — from the 1-inch side wefts to the 8-inch crown weft — designed to build natural-looking fullness across the entire head. The full set weighs 120g and can be mixed and matched for lighter, targeted volume or a complete transformation to full length. All colour options from our permanent extension range are available, ensuring perfect matching for existing OlivHairSupply clients.</p>

<h2>Styling the Signature Set</h2>
<p>The Signature Clip-In Set accepts heat styling up to 180°C and can be curled, waved, straightened and blowdried exactly as you would style your natural hair. Apply heat protectant before every session. Unlike many clip-in alternatives, the Signature Set holds curls exceptionally well — the weight and density of the weft provides the ballast that keeps styles in place throughout the day and into the evening.</p>

<h2>Available Now</h2>
<p>The BiziLuxe Signature Clip-In Set is available in-store at both Berlin boutiques and through our online shop. Book a complimentary fitting and colour consultation at either our Schöneberg or Kurfürstendamm location — our team will ensure your set is the perfect match before you take it home.</p>
    `.trim(),
  },

  "biziluxe-behind-collection": {
    title: "Behind the Collection: How BiziLuxe Hair is Sourced",
    category: "biziluxe-collections",
    categoryLabel: "BiziLuxe Collections",
    date: "8 June 2025",
    readTime: "6 min read",
    excerpt: "Quality begins at the source. We trace the journey of every BiziLuxe strand from origin to salon.",
    body: `
<p>Luxury is not a label you apply after the fact — it begins at the very origin of the raw material. Understanding where BiziLuxe hair comes from, and how it reaches you, is understanding why it looks, feels and behaves the way it does. Transparency is something we take seriously.</p>

<h2>What Remy Actually Means</h2>
<p>The term Remy is widely used and widely misunderstood. In its true definition, Remy hair is human hair where all strands are collected and kept aligned in the same direction — cuticle end to cuticle end. This alignment prevents the tangling that occurs when cuticles from opposite ends interlock. BiziLuxe uses exclusively single-drawn Remy hair, where all follicle directions are preserved from collection to finished weft. Non-Remy hair — even when labelled as human hair — will tangle, mat and fade because the cuticle alignment has been compromised.</p>

<h2>Our Sourcing Standards</h2>
<p>BiziLuxe hair is sourced from a small number of verified suppliers with whom we have developed long-term relationships. We do not work with anonymous intermediaries or mass-market hair factories. Every supplier we work with must meet our ethical sourcing standards — ensuring that donors are fairly compensated, that collection practices are transparent, and that supply chains are traceable. We audit our suppliers annually and make sourcing decisions based on quality and ethics, not cost alone.</p>

<h2>From Collection to Processing</h2>
<p>After collection, hair is sorted by length, thickness and texture before any chemical processing. Colour treatment — for non-natural-black shades — is applied using low-ammonia formulations that preserve cuticle integrity. Bleaching for lighter shades uses a progressive approach with conditioning treatments applied between each stage. The result is colour that is vibrant without the brittleness associated with aggressively processed hair.</p>

<h2>Quality Control at Every Stage</h2>
<p>Each weft undergoes inspection at three stages: after processing, after quality sorting, and upon arrival at OlivHairSupply before it enters our inventory. We test for cuticle integrity, colour consistency, strength and elasticity. Any weft that does not meet our standard is rejected — it does not become a BiziLuxe product, regardless of the cost involved.</p>

<h2>What This Means For You</h2>
<p>When you wear BiziLuxe, you are wearing hair that has passed through a sourcing and quality process that most extension brands do not apply. It is why the hair moves naturally, blends seamlessly and lasts far longer than alternatives at a similar price point. The investment is real — and it is justified every day you wear it.</p>
    `.trim(),
  },

  "biziluxe-new-arrivals": {
    title: "New Arrivals: Extended Lengths Now Available",
    category: "biziluxe-collections",
    categoryLabel: "BiziLuxe Collections",
    date: "25 May 2025",
    readTime: "3 min read",
    excerpt: "Longer, fuller, bolder. The BiziLuxe range now includes lengths up to 28 inches for maximum impact.",
    body: `
<p>We have expanded the BiziLuxe length range. Effective immediately, lengths up to 70cm (28 inches) are available across all three BiziLuxe hair types — Body Wave, Straight and Light Wave. This is the most comprehensive length expansion in the BiziLuxe collection's history.</p>

<h2>New Lengths Available</h2>
<p>The expanded range now includes 60cm, 65cm and 70cm options across all colours. These longer lengths are particularly suited to those building dramatic transformation looks, bridal styling, or editorial and commercial work. Each length maintains the same Remy quality and cuticle alignment standards as the core BiziLuxe range.</p>

<h2>Styling Extended Lengths</h2>
<p>Longer extensions require a slightly adjusted care routine. The weight of extended lengths means additional brushing — at minimum three times daily — to prevent tangling through the lower sections. Deep conditioning becomes more important, not less, as the lengths increase. We recommend a leave-in conditioning treatment for the mid-lengths and ends for any wear exceeding 60cm.</p>

<h2>Bundle Guidance for Extended Lengths</h2>
<p>At 60cm and above, most clients require between 6 and 8 bundles (300–400g) for a full head with satisfying density. Thinner or finer natural hair may sit at the lower end of this range; those wanting particularly dramatic volume should plan for 8 bundles. Our team can advise precisely at your consultation, based on your natural hair density and desired result.</p>

<h2>Available In-Store and Online</h2>
<p>All new lengths are available immediately at both Berlin boutiques and through our online shop. For extended lengths, we strongly recommend an in-store consultation before purchasing — our team can assess your natural hair, confirm the correct colour match and advise on the appropriate bundle quantity for your specific look. Book a consultation at Schöneberg or Kurfürstendamm.</p>
    `.trim(),
  },

  "training-academy-overview": {
    title: "What to Expect at the OlivHairSupply Academy",
    category: "training-education",
    categoryLabel: "Training & Education",
    date: "1 June 2025",
    readTime: "6 min read",
    excerpt: "A full breakdown of our professional certification programme — from beginner foundation to master level.",
    body: `
<p>The OlivHairSupply Academy was established with a clear purpose: to produce the most skilled and commercially prepared luxury hair extensionists in Germany. Every element of our programme — from the curriculum structure to the materials used — reflects that purpose.</p>

<h2>Programme Levels</h2>
<p>We offer three certification levels, each building on the previous: Foundation, Advanced Installation, and Business & Brand Mastery. Students may enrol at Foundation level regardless of prior experience. Those with existing installation experience can apply for direct enrolment at Advanced level after a brief skills assessment with one of our master educators.</p>

<h2>Foundation: The Essential First Step</h2>
<p>The Foundation programme is a full-day intensive delivered at our Berlin training studio. It covers all core extension methods — tape-in, clip-in, weft and bonding fundamentals — alongside client consultation principles, colour theory, product knowledge and the BiziLuxe system from installation to aftercare. Students work on live models throughout the day, building practical confidence under direct educator supervision. Certification is awarded upon satisfactory completion of a practical assessment at day's end.</p>

<h2>Advanced Installation</h2>
<p>The Advanced programme spans two full days and is reserved for those who have completed Foundation or can demonstrate equivalent experience. Day one focuses on complex bonding methods — U-Tip, I-Tip, K-Tip and Nano Ring techniques — with an emphasis on difficult hair types, scalp conditions and advanced colour integration. Day two covers weft refinement, advanced blending, photoshoot-ready styling and client retention strategy. Students leave with a portfolio of completed work and a Level 2 OlivHairSupply certification.</p>

<h2>Business & Brand Mastery</h2>
<p>Our flagship programme. Delivered across two to three days, Business & Brand Mastery addresses the commercial reality of building a luxury hair business. Topics include premium pricing strategy, client experience design, social media for high-end clientele, referral programme construction and financial planning for the first year. This programme is responsible for generating some of the most successful independent hair businesses in Berlin and across Germany.</p>

<h2>Training Environment and Materials</h2>
<p>All training takes place in our dedicated studio — a purpose-built space adjacent to our Schöneberg boutique. Students work with genuine BiziLuxe hair throughout, and all tools, products and materials are included in the programme fee. Maximum class sizes of six students ensure personalised attention from our educators. Refreshments, a printed reference manual and lifetime access to the OlivHairSupply Academy alumni community are included with every programme.</p>
    `.trim(),
  },

  "training-why-certification": {
    title: "Why Certification Changes Your Career",
    category: "training-education",
    categoryLabel: "Training & Education",
    date: "18 May 2025",
    readTime: "5 min read",
    excerpt: "Certified extensionists earn more, build faster and retain clients longer. Here is what the data shows.",
    body: `
<p>The luxury hair extension market is growing. What is also growing — and this matters for your business — is the discernment of the clients it serves. Consumers researching premium extension services are increasingly making certification a prerequisite for booking. The numbers behind this shift are compelling.</p>

<h2>What Certification Communicates</h2>
<p>A certificate from a recognised institution communicates three things simultaneously: skill, commitment and professionalism. It tells a prospective client that you have invested in formal training, that you have been assessed against a defined standard, and that you take your craft seriously enough to pursue external validation. In a market filled with self-taught practitioners of varying ability, certification is a credibility signal that converts into bookings.</p>

<h2>The Pricing Premium</h2>
<p>OlivHairSupply graduates consistently report the ability to charge a premium over non-certified peers within their local market. The mechanism is straightforward: certification allows you to position your services as professional, not amateur — and the clientele willing to pay for premium extensions is also willing to pay more for the person who installs them. The return on the cost of training is typically realised within the first month of practice.</p>

<h2>Client Retention</h2>
<p>Certified extensionists retain clients at higher rates. This is partly because their technical outcomes are better — less slippage, better blending, longer-lasting results — and partly because the consultation and aftercare advice they provide is more comprehensive. A client who leaves your chair with confidence in the care of their extensions is a client who returns. A client who leaves with unanswered questions seeks answers elsewhere — and often does not come back.</p>

<h2>Referral Rates</h2>
<p>The fastest-growing luxury hair businesses rely on referrals rather than paid advertising. Referrals require satisfied clients, who require excellent results, which require properly trained extensionists. Certification is the foundation of this virtuous cycle. OlivHairSupply Academy graduates report that referral-based bookings account for a majority of their revenue within six months of qualification.</p>

<h2>The Professional Community</h2>
<p>Beyond the certificate itself, formal training provides access to a professional community. The OlivHairSupply Academy alumni network is an active and supportive group of extensionists across Germany, Austria and Switzerland — sharing client referrals, technique updates, product recommendations and business advice. The network has genuine commercial value, and it is available exclusively to those who have completed our training.</p>
    `.trim(),
  },

  "training-master-educators": {
    title: "Meet Our Master Educators",
    category: "training-education",
    categoryLabel: "Training & Education",
    date: "5 May 2025",
    readTime: "4 min read",
    excerpt: "The team behind the training — experienced, passionate and dedicated to your professional development.",
    body: `
<p>The quality of any training programme is only as strong as the people who deliver it. The OlivHairSupply Academy is built on a team of master educators who have spent their careers at the intersection of technical excellence and professional education. They do not just teach extensions — they have built businesses with them.</p>

<h2>Amara — Lead Educator, Bonding Specialist</h2>
<p>Amara has been working with extension techniques for over twelve years, with particular expertise in keratin and microring bonding methods. She joined OlivHairSupply after a decade of building one of Berlin's most respected extension practices, and brings a practitioner's perspective to everything she teaches. Her Foundation and Advanced programmes are known for their depth of technical content and her ability to communicate complex technique simply. Students who have trained with Amara describe her as the most thorough educator they have encountered in the industry.</p>

<h2>Leonie — Business & Brand Educator</h2>
<p>Leonie's background is in luxury brand management, and she brings a commercial rigour to the Business & Brand Mastery programme that is unlike anything else in the hair education space. She spent five years working with premium salon groups across Germany before joining OlivHairSupply, and understands the specific challenges of positioning a hair business at the luxury end of the market. Her pricing strategy workshops alone have transformed the businesses of dozens of graduates.</p>

<h2>Miriam — Foundation Programme Lead</h2>
<p>Miriam leads the Foundation programme and is the first educator most new students encounter. Her warmth and patience make her an ideal guide for those entering the profession for the first time, and her depth of technical knowledge ensures that even experienced practitioners who attend her sessions leave with new insights. Miriam holds qualifications in trichology alongside her extension certifications, giving her a scientifically grounded perspective on hair health that informs every class she teaches.</p>

<h2>Ongoing Professional Development</h2>
<p>Our educators attend international training events, source new techniques from global practitioners and continuously update the Academy curriculum to reflect the current state of the profession. When you train with OlivHairSupply, you are receiving not just historical knowledge but the current standard of the industry, as delivered by those who are actively participating in it.</p>
    `.trim(),
  },

  "events-masterclass-advanced": {
    title: "Upcoming Masterclass: Advanced Extension Techniques",
    category: "events",
    categoryLabel: "Events",
    date: "10 June 2025",
    readTime: "3 min read",
    excerpt: "Limited seats for our intensive one-day masterclass covering the latest professional application methods.",
    body: `
<p>The OlivHairSupply Advanced Techniques Masterclass returns this summer with updated content, new bonding methods and a strictly limited cohort of six participants. If you have been waiting for the opportunity to advance your skills in a focused, professional environment, this is it.</p>

<h2>What the Masterclass Covers</h2>
<p>This single-day intensive is built around three primary areas: advanced microring application for textured and fine hair types; nano ring precision technique; and complex colour integration for clients with balayage, highlights and ombré. Each area is taught with live model work under direct supervision from Amara, our lead bonding specialist. There is no lecture-only content in this masterclass — you are on the floor from start to finish.</p>

<h2>Who Should Attend</h2>
<p>This masterclass is designed for qualified extensionists who hold at minimum a Foundation-level certification and have been practising for at least six months. It is not suitable for beginners. If you are new to extensions, the OlivHairSupply Foundation Programme is the right starting point.</p>

<h2>Dates and Registration</h2>
<p>The summer masterclass cohort opens in July. Given the six-person maximum, places are allocated on a first-come, first-served basis, with priority given to OlivHairSupply Academy alumni. Registration is via our training enquiry form, or in person at either Berlin boutique. A deposit is required to secure your place, with the balance due fourteen days before the event.</p>

<h2>What's Included</h2>
<p>All BiziLuxe hair and tools used during the masterclass are included in the fee. Students keep the work completed on models during the session. Lunch, refreshments, a printed technique reference guide, and a digital certificate of completion are all included. Alumni pricing is available for OlivHairSupply Academy graduates.</p>
    `.trim(),
  },

  "events-european-hair-show": {
    title: "OlivHairSupply at the European Hair Show 2025",
    category: "events",
    categoryLabel: "Events",
    date: "28 May 2025",
    readTime: "3 min read",
    excerpt: "We are exhibiting at Europe's largest professional hair event. Come find us at Stand 42B.",
    body: `
<p>For the first time, OlivHairSupply will be exhibiting at the European Hair Show — Europe's largest annual gathering of hair professionals, manufacturers and educators. We will be at Stand 42B, and we would love to see you there.</p>

<h2>What We Are Showcasing</h2>
<p>Our stand will feature the complete BiziLuxe extension range, including the newly expanded lengths up to 70cm, the Signature Clip-In Set, and our full accessory collection. Live demonstration appointments will run throughout both days — book in advance via our website to guarantee your slot, or walk up on the day if availability permits.</p>

<h2>The Academy at the Show</h2>
<p>The OlivHairSupply Academy team will be present throughout the event, delivering 30-minute technique workshops at the stand on both days. Topics include nano ring application on fine hair and clip-in blending for textured hair. Workshops are free to attend and require no prior booking — simply arrive at the stand at the advertised time.</p>

<h2>Exclusive Show Pricing</h2>
<p>Attendees who visit our stand will have access to exclusive show pricing on selected BiziLuxe products and Academy programme registration. Show-only pricing applies to purchases and bookings made at the stand during the event and is not available online or in-store. This is the best pricing of the year on our most popular products.</p>

<h2>Find Us</h2>
<p>Stand 42B is located in Hall 3, adjacent to the main stage. Our team will be identifiable by their OlivHairSupply gold lanyards. We will be operating a continuous demonstration throughout both days, so whether you stop by for five minutes or spend an afternoon with us, you are welcome. We look forward to meeting you in person.</p>
    `.trim(),
  },

  "events-client-evening": {
    title: "Exclusive Client Evening — By Invitation",
    category: "events",
    categoryLabel: "Events",
    date: "14 May 2025",
    readTime: "3 min read",
    excerpt: "An intimate evening of new collections, expert styling and private consultations. Reserve your place early.",
    body: `
<p>Twice a year, we close the doors of our Kurfürstendamm boutique to the public and open them exclusively to invited clients for an evening of new collections, private consultations and expert styling. Our next client evening takes place in late July, and places are now being reserved.</p>

<h2>What to Expect</h2>
<p>The evening runs from 7pm to 10pm in the Kurfürstendamm boutique. All BiziLuxe new arrivals — including the extended length range and Signature Clip-In Set — will be on display and available for private purchase at client evening pricing. Our entire styling team will be present, available for one-to-one colour consultations, fitting appointments and maintenance reviews.</p>

<h2>Private Consultations</h2>
<p>Each guest receives a 20-minute private consultation slot with one of our master stylists. This is the opportunity to discuss your current extensions, explore a new method, review your colour match, or begin planning a significant change for the autumn season. Consultation slots are allocated at registration and cannot be transferred.</p>

<h2>New Collection Previews</h2>
<p>Clients attending the evening will be among the first to see and handle the autumn/winter BiziLuxe additions before their general release. Orders placed at the evening receive priority fulfilment and, for certain limited pieces, carry a first-access guarantee. Product launches at the boutique routinely sell out within days — client evening priority is a meaningful advantage.</p>

<h2>How to Register</h2>
<p>The client evening is invitation-only, extended to all OlivHairSupply clients with an active appointment history. If you have received your invitation, registration is via the link in your email or at the boutique. If you believe you should have received an invitation and have not, please contact us directly — we will review your account and confirm eligibility. Spaces are strictly limited to 24 guests per evening.</p>
    `.trim(),
  },

  "transformations-sofia-story": {
    title: "From Fine to Full: Sofia's Story",
    category: "transformations",
    categoryLabel: "Transformations",
    date: "16 June 2025",
    readTime: "4 min read",
    excerpt: "After years of searching for volume, Sofia found her answer in BiziLuxe. See the remarkable transformation.",
    body: `
<p>Sofia came to our Schöneberg boutique in February with fine, naturally straight hair that she described as her lifelong source of frustration. She had tried volumising products, blow-dry techniques, and one previous set of extensions from another provider — an experience she described as disappointing. She was sceptical, but willing to try again. Seven months later, she is one of our most enthusiastic clients.</p>

<h2>The Consultation</h2>
<p>Sofia's consultation took 45 minutes. Fine hair presents specific challenges for extension placement: bonds need to be smaller, tape strips narrower, and placement points more strategic to avoid visible gaps. Our stylist Amara assessed the density, growth pattern and scalp condition in detail before making a recommendation. The decision was I-Tip microring extensions — a bonding method that places minimal stress on fine strands and allows individualised placement for maximum volume coverage.</p>

<h2>The Installation</h2>
<p>The installation took three and a half hours. We placed 120 I-Tip bonds throughout the head, concentrating on the sides and crown where Sofia's hair was at its finest. BiziLuxe Body Wave hair in a custom-matched blend of Natural Black and Dark Brown was selected to complement her natural colour and add dimension. On completion, the transformation was immediate and striking.</p>

<h2>Sofia's Response</h2>
<p>"I genuinely did not recognise myself at first," she told us at her six-week maintenance appointment. "I had spent years trying to make my hair look the way it does now. I cannot imagine going back." At her maintenance appointment, we assessed bond integrity — all 120 bonds remained secure — trimmed the ends slightly and re-applied four bonds that had experienced minor slippage. This is within normal parameters for the six-week mark.</p>

<h2>The Longer View</h2>
<p>Sofia is now at her seven-month mark and has booked her third maintenance appointment. The extensions have been in continuous wear throughout, with no significant issues. She has adopted the recommended care routine — sulphate-free washing every three days, a weekly deep conditioning mask, and a loose braid before bed. Her BiziLuxe hair, she tells us, looks better now than it did at installation day.</p>
    `.trim(),
  },

  "transformations-wedding": {
    title: "Wedding Ready: How Extensions Completed the Look",
    category: "transformations",
    categoryLabel: "Transformations",
    date: "2 June 2025",
    readTime: "4 min read",
    excerpt: "For her wedding day, nothing less than perfection would do. See how BiziLuxe delivered exactly that.",
    body: `
<p>Wedding hair has no margin for error. It needs to look exceptional from the ceremony through to the end of the evening, through hundreds of photographs, in outdoor and indoor lighting, and through whatever emotion the day brings. When Priya approached us eight weeks before her wedding, she had a precise vision and zero room for compromise.</p>

<h2>The Vision</h2>
<p>Priya wanted length that would fall to her lower back in the reception style — significant, given that her natural hair sat just below her shoulders. She wanted a specific colour: a dark brown with warm chestnut undertones that would photograph richly without looking artificial. And she wanted extensions she could wear through three months of wedding preparation appointments without disruption. The requirement: BiziLuxe tape-in extensions, installed eight weeks before the wedding, with a maintenance appointment scheduled two weeks out from the day itself.</p>

<h2>Colour Matching</h2>
<p>Priya's natural colour was a complex medium brown with subtle red undertones — difficult to match accurately. We brought three colour options into the consultation and assessed them in natural window light and under our salon lighting. The final selection was a blend of Medium Brown (4) and Chestnut Brown (8) tape-in wefts layered through the mid-lengths and ends. The blend added depth and dimension that read as entirely natural in every lighting condition we assessed.</p>

<h2>The Wedding Day Styling</h2>
<p>Two hours before the ceremony, Priya's stylist built the ceremony updo — a low, romantic chignon with loose face-framing tendrils. The extensions provided the volume and length that made the updo architectural rather than modest. For the reception, the style was released into a half-up, half-down arrangement with soft waves. The additional length fell to exactly the point Priya had envisioned, precisely as planned at the consultation eight weeks earlier.</p>

<h2>After the Wedding</h2>
<p>Priya kept the tape-in extensions in for a further six weeks after the wedding — they had become a part of her daily look that she was not ready to give up. She has since transitioned to a permanent I-Tip installation and remains one of our regular clients. "I had no idea how much I would love wearing extensions every day," she told us. "The wedding was the beginning."</p>
    `.trim(),
  },

  "transformations-before-after": {
    title: "Before and After: The Power of Clip-Ins",
    category: "transformations",
    categoryLabel: "Transformations",
    date: "22 May 2025",
    readTime: "3 min read",
    excerpt: "A 20-minute application. A complete transformation. This is what BiziLuxe clip-ins can do for you.",
    body: `
<p>The argument for clip-in extensions is made most powerfully by what they can achieve in 20 minutes. No appointment. No processing time. No commitment. Just a complete transformation that can be applied before you leave for an event and removed when you return. These are real results from real clients, achieved with the BiziLuxe Signature Clip-In Set.</p>

<h2>Fatima: Office to Evening</h2>
<p>Fatima's natural hair sits at collarbone length — professional and manageable for her working life, but not quite the look she wanted for a major evening event. She visited the boutique for a fitting and took her Signature Clip-In Set home that afternoon. At the event the following week, she wore a full voluminous blowout at mid-back length. Application time: 18 minutes. The set was colour-matched to her Natural Black shade at the consultation. "I have tried clip-in extensions before," she told us. "Nothing has come close to the quality of these. They look like my real hair."</p>

<h2>Karina: Fine Hair, Full Transformation</h2>
<p>Karina has very fine, thin hair — a hair type that often struggles with clip-in extensions because the weight of the clips can be visible, or the wefts can slip. The BiziLuxe Signature Set's wider clip design and lighter weft construction made the difference. She applies the seven-weft set in sections, working from nape to crown, and the result is a density that her natural hair has never achieved. "I wear them twice a week," she says. "Every time, I get asked what I did differently."</p>

<h2>Application Tips from Our Team</h2>
<p>Backcomb the root section slightly before clipping in each weft — this gives the clips a better grip and prevents slippage. Work in sections from the nape upward, and allow each weft to fully snap closed before moving to the next. Once all wefts are in, blend the top layer of your natural hair over the top row with a brush, and finish with a light mist of shine spray. The entire process becomes faster with practice — most of our clients report being under 15 minutes by the second week.</p>

<h2>Book a Fitting</h2>
<p>A clip-in fitting at OlivHairSupply takes 30 minutes, is complimentary, and includes a colour match and a demonstration from one of our team. You leave knowing exactly which set is right for you — and how to apply it perfectly every time. Book at either Berlin boutique or through our appointments page.</p>
    `.trim(),
  },
};

function getShell() {
  const html = fs.readFileSync(
    path.join(process.cwd(), "shopify-clone", "blogs-journal.html"),
    "utf8"
  );
  // Use the main content area as the injection point
  const startMarker = '<main id="MainContent"';
  const endMarker = "</main>";
  const startIdx = html.indexOf(startMarker);
  const endIdx = html.indexOf(endMarker, startIdx) + endMarker.length;

  const before = startIdx > -1 ? html.slice(0, startIdx) : html;
  const after = startIdx > -1 ? html.slice(endIdx) : "";

  // Normalize hrefs
  const norm = (s: string) =>
    s
      .replace(/href="\/collections\/all"/g, 'href="/shop"')
      .replace(/href="\/collections"/g, 'href="/shop"')
      .replace(/href="\/pages\/appointment"/g, 'href="/appointments"');

  return { before: norm(before), after: norm(after) };
}

type PageProps = {
  params: Promise<{ handle: string; slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = ARTICLES[slug];
  if (!article) return { title: "Journal — OlivHairSupply" };
  return {
    title: `${article.title} — OlivHairSupply Journal`,
    description: article.excerpt,
  };
}

export default async function BlogArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const article = ARTICLES[slug];

  if (!article) notFound();

  const { before, after } = getShell();

  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: before }} />

      <article id="ohs-article-page">
        <style>{`
          #ohs-article-page {
            background: #F5F0E8;
            font-family: 'Montserrat', sans-serif;
          }

          /* ── Hero ── */
          .ohs-art-hero {
            background: #2B2620;
            padding: 64px 24px 56px;
          }
          .ohs-art-hero-inner {
            max-width: 760px;
            margin: 0 auto;
          }
          .ohs-art-breadcrumb {
            font-size: 9px;
            font-weight: 700;
            letter-spacing: 0.26em;
            text-transform: uppercase;
            color: #8B7355;
            margin: 0 0 20px;
          }
          .ohs-art-breadcrumb a {
            color: #8B7355;
            text-decoration: none;
          }
          .ohs-art-breadcrumb a:hover { color: #B68A45; }
          .ohs-art-breadcrumb span { margin: 0 8px; }
          .ohs-art-cat {
            font-size: 9.5px;
            font-weight: 700;
            letter-spacing: 0.28em;
            text-transform: uppercase;
            color: #B68A45;
            margin: 0 0 16px;
          }
          .ohs-art-title {
            font-family: 'Cormorant Garamond', Georgia, serif;
            font-size: 52px;
            font-weight: 300;
            color: #fff;
            margin: 0 0 20px;
            line-height: 1.08;
          }
          .ohs-art-meta {
            font-size: 11px;
            color: #8B7355;
            display: flex;
            gap: 20px;
            flex-wrap: wrap;
          }

          /* ── Body ── */
          .ohs-art-body {
            max-width: 760px;
            margin: 0 auto;
            padding: 56px 24px 80px;
          }
          .ohs-art-lead {
            font-family: 'Cormorant Garamond', Georgia, serif;
            font-size: 22px;
            font-weight: 300;
            font-style: italic;
            color: #2B2620;
            margin: 0 0 40px;
            line-height: 1.5;
            border-left: 3px solid #B68A45;
            padding-left: 24px;
          }
          .ohs-art-content {
            font-size: 15px;
            line-height: 1.85;
            color: #3a302a;
          }
          .ohs-art-content p {
            margin: 0 0 22px;
          }
          .ohs-art-content h2 {
            font-family: 'Cormorant Garamond', Georgia, serif;
            font-size: 30px;
            font-weight: 400;
            color: #2B2620;
            margin: 44px 0 16px;
            line-height: 1.15;
          }
          .ohs-art-content h3 {
            font-family: 'Montserrat', sans-serif;
            font-size: 12px;
            font-weight: 700;
            letter-spacing: 0.18em;
            text-transform: uppercase;
            color: #B68A45;
            margin: 32px 0 12px;
          }

          /* ── Divider ── */
          .ohs-art-divider {
            border: none;
            border-top: 1px solid #E2D5C0;
            margin: 56px 0;
          }

          /* ── CTA strip ── */
          .ohs-art-cta {
            background: #2B2620;
            padding: 48px 24px;
          }
          .ohs-art-cta-inner {
            max-width: 760px;
            margin: 0 auto;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 24px;
            flex-wrap: wrap;
          }
          .ohs-art-cta-label {
            font-size: 9.5px;
            font-weight: 700;
            letter-spacing: 0.28em;
            text-transform: uppercase;
            color: #B68A45;
            margin: 0 0 10px;
          }
          .ohs-art-cta-title {
            font-family: 'Cormorant Garamond', Georgia, serif;
            font-size: 30px;
            font-weight: 300;
            color: #fff;
            margin: 0;
          }
          .ohs-art-cta-btns {
            display: flex;
            gap: 12px;
            flex-shrink: 0;
            flex-wrap: wrap;
          }
          .ohs-art-btn {
            display: inline-block;
            padding: 13px 28px;
            font-family: 'Montserrat', sans-serif;
            font-size: 9.5px;
            font-weight: 700;
            letter-spacing: 0.2em;
            text-transform: uppercase;
            text-decoration: none;
            transition: background 0.2s, color 0.2s;
            border: 1px solid transparent;
            cursor: pointer;
          }
          .ohs-art-btn--gold {
            background: #B68A45;
            color: #fff;
            border-color: #B68A45;
          }
          .ohs-art-btn--gold:hover { background: #9a7539; }
          .ohs-art-btn--outline {
            background: transparent;
            color: #fff;
            border-color: #fff;
          }
          .ohs-art-btn--outline:hover { background: #fff; color: #2B2620; }

          /* ── Back nav ── */
          .ohs-art-back {
            max-width: 760px;
            margin: 0 auto;
            padding: 32px 24px 0;
          }
          .ohs-art-back a {
            font-size: 9.5px;
            font-weight: 700;
            letter-spacing: 0.2em;
            text-transform: uppercase;
            color: #B68A45;
            text-decoration: none;
          }
          .ohs-art-back a:hover { color: #2B2620; }

          @media (max-width: 640px) {
            .ohs-art-title { font-size: 34px; }
            .ohs-art-cta-inner { flex-direction: column; align-items: flex-start; }
          }
        `}</style>

        {/* Back nav */}
        <div className="ohs-art-back">
          <a href="/blogs/journal">← Back to Journal</a>
        </div>

        {/* Hero */}
        <div className="ohs-art-hero">
          <div className="ohs-art-hero-inner">
            <p className="ohs-art-breadcrumb">
              <a href="/blogs/journal">Journal</a>
              <span>/</span>
              <a href={`/blogs/journal?category=${article.category}`}>{article.categoryLabel}</a>
            </p>
            <p className="ohs-art-cat">{article.categoryLabel}</p>
            <h1 className="ohs-art-title">{article.title}</h1>
            <div className="ohs-art-meta">
              <span>{article.date}</span>
              <span>{article.readTime}</span>
            </div>
          </div>
        </div>

        {/* Article body */}
        <div className="ohs-art-body">
          <p className="ohs-art-lead">{article.excerpt}</p>
          <div
            className="ohs-art-content"
            dangerouslySetInnerHTML={{ __html: article.body }}
          />
          <hr className="ohs-art-divider" />
        </div>

        {/* CTA */}
        <div className="ohs-art-cta">
          <div className="ohs-art-cta-inner">
            <div>
              <p className="ohs-art-cta-label">OlivHairSupply · Berlin</p>
              <p className="ohs-art-cta-title">Ready to experience BiziLuxe?</p>
            </div>
            <div className="ohs-art-cta-btns">
              <a href="/appointments" className="ohs-art-btn ohs-art-btn--gold">Book Appointment</a>
              <a href="/shop" className="ohs-art-btn ohs-art-btn--outline">Shop BiziLuxe</a>
            </div>
          </div>
        </div>
      </article>

      <div dangerouslySetInnerHTML={{ __html: after }} />
    </>
  );
}
