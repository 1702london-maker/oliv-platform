export default function AffiliateLoginPage() {
  return (
    <main className="min-h-screen bg-linen flex items-center justify-center px-4">
      <div className="w-full max-w-md border border-[#e3d6c5] bg-white">
        <div className="bg-[#2b2620] px-10 py-8">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-gold">OlivHairSupply</p>
          <h1 className="mt-2 font-serif text-3xl font-light text-white">Affiliate Login</h1>
        </div>
        <div className="px-10 py-8">
          <p className="mb-6 text-sm text-cocoa">
            Enter the email and access code from your approval email.
          </p>
          <div id="aff-error" className="mb-4 hidden rounded border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
            Incorrect email or access code. Please try again.
          </div>
          <div className="mb-4">
            <label className="mb-1 block text-xs font-bold uppercase tracking-[0.18em] text-cocoa">
              Email Address
            </label>
            <input
              id="aff-email"
              type="email"
              className="w-full border border-[#d6c9b6] bg-white px-4 py-3 text-sm focus:border-[#2b2620] focus:outline-none"
              placeholder="your@email.com"
            />
          </div>
          <div className="mb-6">
            <label className="mb-1 block text-xs font-bold uppercase tracking-[0.18em] text-cocoa">
              Access Code
            </label>
            <input
              id="aff-code"
              type="text"
              className="w-full border border-[#d6c9b6] bg-white px-4 py-3 text-sm focus:border-[#2b2620] focus:outline-none"
              placeholder="Xxxx-Xxxx-Xxxx"
            />
          </div>
          <button
            id="aff-submit"
            className="w-full bg-[#2b2620] px-6 py-3 text-xs font-bold uppercase tracking-[0.22em] text-white hover:bg-[#3d352d]"
          >
            Access Dashboard
          </button>
          <p className="mt-6 text-center text-xs text-cocoa">
            Not yet an affiliate?{" "}
            <a href="/affiliate" className="underline hover:text-[#2b2620]">
              Apply here
            </a>
          </p>
        </div>
      </div>
      <script
        dangerouslySetInnerHTML={{
          __html: `
(function(){
  document.getElementById('aff-submit').addEventListener('click', function(){
    var email = document.getElementById('aff-email').value.trim();
    var code = document.getElementById('aff-code').value.trim();
    var errEl = document.getElementById('aff-error');
    errEl.classList.add('hidden');
    if(!email || !code) { errEl.classList.remove('hidden'); return; }
    fetch('/api/affiliate/login', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ email: email, password: code })
    }).then(function(r){
      if(r.ok){
        window.location.href = '/affiliate';
      } else {
        r.json().then(function(d){ console.log('login error:', d); });
        errEl.classList.remove('hidden');
      }
    }).catch(function(){
      errEl.classList.remove('hidden');
    });
  });
  document.getElementById('aff-code').addEventListener('keydown', function(e){
    if(e.key === 'Enter') document.getElementById('aff-submit').click();
  });
})();
          `
        }}
      />
    </main>
  );
}
