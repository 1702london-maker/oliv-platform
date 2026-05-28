import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getAffiliateSession } from "@/lib/auth/affiliate-session";
import { ShopifyClonePage } from "@/components/ShopifyClonePage";

type AffiliateRow = {
  code: string;
  display_name: string | null;
  tier: string | null;
  commission_rate: number | null;
  discount_rate: number | null;
};

export default async function AffiliatePage() {
  const session = await getAffiliateSession();

  if (session) {
    // Fetch live affiliate data
    const admin = createSupabaseAdminClient();
    const { data } = await admin
      .from("affiliates")
      .select("code,display_name,tier,commission_rate,discount_rate")
      .eq("id", session.id)
      .maybeSingle();

    const affiliate = data as AffiliateRow | null;
    const code = affiliate?.code ?? session.code;
    const displayName = affiliate?.display_name ?? session.email.split("@")[0];

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
      "https://oliv-platform.vercel.app";

    const affiliateLink = `${siteUrl}/shop?ref=${code}`;

    // Inject script — activates the Shopify dashboard panel with real data.
    // Also overrides otryLogin() (not needed when already logged in).
    const script = `<script>
(function(){
  function boot(){
    var nameEl = document.getElementById('dash-name-display');
    if(nameEl) nameEl.textContent = ${JSON.stringify(displayName)};

    var linkEl = document.getElementById('dash-link-val');
    if(linkEl) linkEl.value = ${JSON.stringify(affiliateLink)};

    var codeEl = document.getElementById('dash-code-val');
    if(codeEl) codeEl.value = ${JSON.stringify(code)};

    // Open overlay directly — do NOT call openDash() as that redirects to login
    var overlay = document.getElementById('oaff-dash-overlay');
    if(overlay){ overlay.classList.add('open'); document.body.style.overflow='hidden'; }
    var loginPanel = document.getElementById('oaff-login-panel');
    if(loginPanel) loginPanel.style.display='none';
    var panel = document.getElementById('oaff-dash-panel');
    if(panel) panel.classList.add('visible');

    // Logout wired to affiliate session clear
    window.ologout = function(){
      fetch('/api/affiliate/logout', { method: 'POST' })
        .then(function(){ window.location.href = '/affiliate'; });
    };
  }
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', boot);
  } else { boot(); }
})();
</script>`;

    return <ShopifyClonePage page="affiliate" injectBeforeClose={script} />;
  }

  // Not logged in — show public Shopify page.
  // Inject script that wires the login modal to our affiliate auth API.
  const loginScript = `<script>
(function(){
  window.openDash = function(){
    window.location.href = '/affiliate/login';
  };
})();
</script>`;

  return <ShopifyClonePage page="affiliate" injectBeforeClose={loginScript} />;
}
