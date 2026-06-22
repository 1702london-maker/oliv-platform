import type { Metadata } from "next";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getAffiliateSession } from "@/lib/auth/affiliate-session";
import { ShopifyClonePage } from "@/components/ShopifyClonePage";

export const metadata: Metadata = {
  title: "Affiliate-Programm — Mit OlivHairSupply verdienen | BiziLuxe Partner",
  description: "Werde BiziLuxe Affiliate-Partner und verdiene Provision für jede Empfehlung. Attraktive Konditionen, Echtzeit-Tracking und exklusive Partnerrabatte. Jetzt bewerben.",
  keywords: ["Affiliate Programm Hair Extensions", "OlivHairSupply Affiliate", "BiziLuxe Partnerprogramm", "Beauty Affiliate Deutschland", "Geld verdienen Haarverlängerung empfehlen"],
  openGraph: { title: "OlivHairSupply Affiliate-Programm — BiziLuxe Partner werden", description: "Werde BiziLuxe Affiliate und verdiene Provision. Attraktive Konditionen & Echtzeit-Tracking.", url: "https://olivhairsupply.de/affiliate" },
  alternates: { canonical: "https://olivhairsupply.de/affiliate" }
};



type AffiliateRow = {
  code: string;
  display_name: string | null;
  tier: string | null;
  commission_rate: number | null;
  discount_rate: number | null;
  click_count: number | null;
  total_commission_cents: number | null;
  pending_payout_cents: number | null;
};

export default async function AffiliatePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const application = typeof params?.application === "string" ? params.application : "";

  const bannerScript = application === "submitted"
    ? `<script>(function(){function b(){var el=document.createElement('div');el.style.cssText='position:fixed;top:0;left:0;right:0;z-index:99999;background:#2B2620;color:#F6F1E8;font-family:Montserrat,sans-serif;font-size:12px;font-weight:600;letter-spacing:.08em;text-align:center;padding:14px 20px;';el.innerHTML='✓ Application received — we will review it and contact you within 3–5 business days. <button onclick="this.parentNode.remove()" style="margin-left:16px;background:none;border:1px solid rgba(255,255,255,.4);color:inherit;padding:4px 10px;cursor:pointer;font-size:10px;letter-spacing:.1em;">Dismiss<\/button>';document.body.prepend(el);}if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',b);}else{b();}})()\n<\/script>`
    : application === "missing" || application === "failed"
    ? `<script>(function(){function b(){var el=document.createElement('div');el.style.cssText='position:fixed;top:0;left:0;right:0;z-index:99999;background:#8B3535;color:#fff;font-family:Montserrat,sans-serif;font-size:12px;font-weight:600;text-align:center;padding:14px 20px;';el.textContent='${application === "missing" ? "Please fill in all required fields." : "Something went wrong. Please try again."}';document.body.prepend(el);setTimeout(function(){el.remove();},5000);}if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',b);}else{b();}})()\n<\/script>`
    : "";

  const session = await getAffiliateSession();

  if (session) {
    // Fetch live affiliate data including stats
    const admin = createSupabaseAdminClient();
    const [{ data }, { count: salesCount }] = await Promise.all([
      admin
        .from("affiliates")
        .select("code,display_name,tier,commission_rate,discount_rate,click_count,total_commission_cents,pending_payout_cents")
        .eq("id", session.id)
        .maybeSingle(),
      admin
        .from("affiliate_commissions")
        .select("id", { count: "exact", head: true })
        .eq("affiliate_id", session.id),
    ]);

    const affiliate = data as AffiliateRow | null;
    const code        = affiliate?.code ?? session.code;
    const displayName = affiliate?.display_name ?? session.email.split("@")[0];
    const tier        = affiliate?.tier ?? "Verified";

    // Stats
    const clicks          = affiliate?.click_count ?? 0;
    const totalEarnCents  = affiliate?.total_commission_cents ?? 0;
    const pendingCents    = affiliate?.pending_payout_cents ?? 0;
    const totalSales      = salesCount ?? 0;
    const conversionPct   = clicks > 0
      ? ((totalSales / clicks) * 100).toFixed(1) + "%"
      : "0%";

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
      "https://oliv-platform.vercel.app";

    const affiliateLink = `${siteUrl}/shop?ref=${code}`;

    const script = `<script>
(function(){
  function fmtEur(cents){
    return '€'+(cents/100).toFixed(2);
  }

  function boot(){
    var nameEl = document.getElementById('dash-name-display');
    if(nameEl) nameEl.textContent = ${JSON.stringify(displayName)};

    var linkEl = document.getElementById('dash-link-val');
    if(linkEl) linkEl.value = ${JSON.stringify(affiliateLink)};

    var codeEl = document.getElementById('dash-code-val');
    if(codeEl) codeEl.value = ${JSON.stringify(code)};

    /* ── live stats ── */
    var sv = document.querySelectorAll('.oaff-dash-stat-val');
    if(sv[0]) sv[0].textContent = ${JSON.stringify(String(totalSales))};
    if(sv[1]) sv[1].textContent = fmtEur(${totalEarnCents});
    if(sv[2]) sv[2].textContent = fmtEur(${pendingCents});
    if(sv[3]) sv[3].textContent = ${JSON.stringify(String(clicks))};
    if(sv[4]) sv[4].textContent = ${JSON.stringify(conversionPct)};
    if(sv[5]) sv[5].textContent = ${JSON.stringify(tier)};

    /* ── commission rate note ── */
    var commNote = document.getElementById('dash-commission-note');
    if(commNote){
      commNote.textContent = 'Your current commission rate is ${affiliate?.commission_rate ?? 10}%. Discount for customers: ${affiliate?.discount_rate ?? 10}%.';
    }

    // Open overlay directly
    var overlay = document.getElementById('oaff-dash-overlay');
    if(overlay){ overlay.classList.add('open'); document.body.style.overflow='hidden'; }
    var loginPanel = document.getElementById('oaff-login-panel');
    if(loginPanel) loginPanel.style.display='none';
    var panel = document.getElementById('oaff-dash-panel');
    if(panel) panel.classList.add('visible');

    // Logout
    window.ologout = function(){
      fetch('/api/affiliate/logout', { method: 'POST' })
        .then(function(){ window.location.href = '/affiliate'; });
    };
  }
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', boot);
  } else { boot(); }
})();
<\/script>`;

    return <ShopifyClonePage page="affiliate" injectBeforeClose={bannerScript + script} />;
  }

  // Not logged in — show public Shopify page.
  const loginScript = `<script>
(function(){
  window.openDash = function(){
    window.location.href = '/affiliate/login';
  };
})();
<\/script>`;

  return <ShopifyClonePage page="affiliate" injectBeforeClose={bannerScript + loginScript} />;
}