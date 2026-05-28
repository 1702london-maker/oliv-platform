import { ShopifyClonePage } from "@/components/ShopifyClonePage";

// Opens the affiliate page with the built-in Shopify login overlay pre-activated
const loginScript = `<script>
(function(){
  function boot(){
    // Open the overlay to the login panel
    var overlay = document.getElementById('oaff-dash-overlay');
    if(overlay){ overlay.classList.add('open'); document.body.style.overflow='hidden'; }
    var loginPanel = document.getElementById('oaff-login-panel');
    if(loginPanel) loginPanel.style.display='';

    // Wire the Access Dashboard button to our login API
    window.otryLogin = function(){
      var email = (document.getElementById('dash-email') || {}).value || '';
      var password = (document.getElementById('dash-code') || {}).value || '';
      var errEl = document.getElementById('oaff-login-error');
      if(errEl) errEl.classList.remove('visible');
      fetch('/api/affiliate/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password: password.trim() })
      }).then(function(r){
        if(r.ok){
          window.location.href = '/affiliate';
        } else {
          if(errEl) errEl.classList.add('visible');
        }
      }).catch(function(){
        if(errEl) errEl.classList.add('visible');
      });
    };
  }
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', boot);
  } else { boot(); }
})();
</script>`;

export default function AffiliateLoginPage() {
  return <ShopifyClonePage page="affiliate" injectBeforeClose={loginScript} />;
}
