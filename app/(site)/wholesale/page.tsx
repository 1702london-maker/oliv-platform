import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getWholesaleSession } from "@/lib/auth/wholesale-session";
import { ShopifyClonePage } from "@/components/ShopifyClonePage";

type WholesaleAccountRow = {
  business_name: string;
  status: string;
  tier: string | null;
  lifetime_spend_cents: number | null;
};

export default async function WholesalePage() {
  const session = await getWholesaleSession();

  if (session) {
    // Fetch live wholesale account data
    const admin = createSupabaseAdminClient();
    const { data } = await admin
      .from("wholesale_accounts")
      .select("business_name,status,tier,lifetime_spend_cents")
      .eq("id", session.id)
      .maybeSingle();

    const account = data as WholesaleAccountRow | null;
    const businessName = account?.business_name ?? session.business_name ?? "Wholesale Partner";
    const tier = account?.tier ?? "Verified";

    // Inject script — opens the Shopify dashboard overlay with real data.
    const script = `<script>
(function(){
  function boot(){
    var nameEl = document.getElementById('owhl-name-display');
    if(nameEl) nameEl.textContent = ${JSON.stringify(businessName)};

    // Open overlay directly — do NOT call owhlOpenLogin() as that redirects to login
    var overlay = document.getElementById('owhl-login-overlay');
    if(overlay){ overlay.classList.add('open'); document.body.style.overflow='hidden'; }
    var loginPanel = document.getElementById('owhl-login-panel');
    if(loginPanel) loginPanel.style.display='none';
    var panel = document.getElementById('owhl-dash-panel');
    if(panel) panel.classList.add('visible');

    // Override logout to clear wholesale session
    window.owhlLogout = function(){
      fetch('/api/wholesale/logout', { method: 'POST' })
        .then(function(){ window.location.href = '/wholesale'; });
    };
  }
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', boot);
  } else { boot(); }
})();
</script>`;

    return <ShopifyClonePage page="wholesale" injectBeforeClose={script} />;
  }

  // Not logged in — show public Shopify wholesale page.
  // Override owhlOpenLogin / owhlTryLogin to go to our dedicated login page.
  const loginScript = `<script>
(function(){
  window.owhlOpenLogin = function(){
    window.location.href = '/wholesale/login';
  };
  window.owhlTryLogin = function(){
    window.location.href = '/wholesale/login';
  };
})();
</script>`;

  return <ShopifyClonePage page="wholesale" injectBeforeClose={loginScript} />;
}
