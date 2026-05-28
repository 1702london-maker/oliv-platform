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

    // Open the overlay and show the dashboard panel
    var overlay = document.getElementById('oaff-dash-overlay');
    if(overlay){ overlay.classList.add('open'); document.body.style.overflow='hidden'; }
    var panel = document.getElementById('oaff-dash-panel');
    if(panel) panel.classList.add('visible');
    // Hide login panel — already authenticated
    var loginPanel = document.getElementById('oaff-login-panel');
    if(loginPanel) loginPanel.style.display='none';

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
  window.otryLogin = function(){
    var email = (document.getElementById('dash-email') || {}).value || '';
    var password = (document.getElementById('dash-code') || {}).value || '';
    var errEl = document.getElementById('oaff-login-error');

    fetch('/api/affiliate/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), password: password.trim() })
    }).then(function(r){
      if(r.ok){
        window.location.reload();
      } else {
        if(errEl) errEl.classList.add('visible');
      }
    }).catch(function(){
      if(errEl) errEl.classList.add('visible');
    });
  };
})();
</script>`;

  return <ShopifyClonePage page="affiliate" injectBeforeClose={loginScript} />;
}
