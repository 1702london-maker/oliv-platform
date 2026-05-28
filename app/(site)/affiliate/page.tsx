import { getCurrentProfile } from "@/lib/auth/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ShopifyClonePage } from "@/components/ShopifyClonePage";

type AffiliateRow = {
  code: string;
  display_name: string | null;
  status: string;
  tier: string | null;
  commission_rate: number | null;
  discount_rate: number | null;
};

export default async function AffiliatePage() {
  const profile = await getCurrentProfile();

  if (profile) {
    const admin = createSupabaseAdminClient();
    const { data } = await admin
      .from("affiliates")
      .select("code,display_name,status,tier,commission_rate,discount_rate")
      .eq("profile_id", profile.id)
      .maybeSingle();

    const affiliate = data as AffiliateRow | null;

    if (affiliate?.status === "approved") {
      const displayName =
        affiliate.display_name ||
        (profile.first_name
          ? `${profile.first_name}${profile.last_name ? " " + profile.last_name : ""}`
          : profile.email.split("@")[0]);

      const siteUrl =
        process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
        "https://oliv-platform.vercel.app";

      const affiliateLink = `${siteUrl}/shop?ref=${affiliate.code}`;

      // Inject a script that activates the existing Shopify dashboard overlay
      // and populates it with the affiliate's real data — no redesign.
      const script = `<script>
(function(){
  function boot(){
    var nameEl = document.getElementById('dash-name-display');
    if(nameEl) nameEl.textContent = ${JSON.stringify(displayName)};

    var linkEl = document.getElementById('dash-link-val');
    if(linkEl) linkEl.value = ${JSON.stringify(affiliateLink)};

    var codeEl = document.getElementById('dash-code-val');
    if(codeEl) codeEl.value = ${JSON.stringify(affiliate.code)};

    var overlay = document.getElementById('oaff-dash-overlay');
    if(overlay){ overlay.classList.add('open'); document.body.style.overflow='hidden'; }

    var panel = document.getElementById('oaff-dash-panel');
    if(panel) panel.classList.add('visible');

    // Wire logout to the server-side logout route
    window.ologout = function(){
      window.location.href = '/api/auth/logout';
    };
  }
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
</script>`;

      return <ShopifyClonePage page="affiliate" injectBeforeClose={script} />;
    }
  }

  // Not logged in or not yet approved — show the public Shopify page as-is.
  return <ShopifyClonePage page="affiliate" />;
}
