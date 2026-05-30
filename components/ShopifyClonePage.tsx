import fs from "node:fs";
import path from "node:path";
import { ShopifyClonePageClient } from "./ShopifyClonePageClient";

type ShopifyClonePageProps = {
  page: string;
  injectBeforeClose?: string;
};

export function ShopifyClonePage({ page, injectBeforeClose }: ShopifyClonePageProps) {
  const filePath = path.join(process.cwd(), "shopify-clone", `${page}.html`);
  const rawHtml = fs.readFileSync(fs.existsSync(filePath) ? filePath : path.join(process.cwd(), "shopify-clone", "home.html"), "utf8");
  let html = normalizeShopifyHtml(rawHtml, page);

  if (injectBeforeClose) {
    html = html.includes("</body>")
      ? html.replace("</body>", injectBeforeClose + "</body>")
      : html + injectBeforeClose;
  }

  return <ShopifyClonePageClient html={html} />;
}

function normalizeShopifyHtml(rawHtml: string, page: string) {
  let html = rawHtml
    .replaceAll('href="/collections"', 'href="/shop"')
    .replaceAll('href="/collections/all"', 'href="/shop"')
    .replaceAll('action="/localization"', 'action="/localization"')
    .replaceAll("EUR â‚¬", "EUR &euro;")
    .replaceAll("âœ“", "✓")
    .replaceAll("â€”", "&mdash;")
    .replaceAll("â€˜", "&lsquo;")
    .replaceAll("â€™", "&rsquo;")
    .replaceAll("â€œ", "&ldquo;")
    .replaceAll("â€", "&rdquo;");

  html = html.replace(
    /<select([\s\S]*?name="country_code"[\s\S]*?)>[\s\S]*?<\/select>/g,
    '<select$1><option value="DE" selected>EUR &euro;</option><option value="GB">GBP &pound;</option><option value="US">USD $</option></select>'
  );

  // Remove Spanish from locale selector server-side
  html = html.replace(/<option[^>]*value="es"[^>]*>[\s\S]*?<\/option>/gi, '');

  // Remove onchange auto-submit from locale selects — our JS handles it client-side
  html = html.replace(/(<select[^>]*name="locale_code"[^>]*)onchange="this\.form\.submit\(\)"([^>]*>)/g, '$1$2');

  // Inline language + currency script (avoids external file loading issues)
  html = html + INLINE_I18N_SCRIPT;

  if (page === "affiliate") {
    html = html
      .replaceAll('action="/contact#contact_form"', 'action="/api/applications/affiliate"')
      .replaceAll("window.location.href = '/login?next=/affiliate'", "window.location.href = '/affiliate/login'");
  }

  if (page === "wholesale") {
    html = html
      .replaceAll('action="/contact#contact_form"', 'action="/api/applications/wholesale"')
      .replaceAll("window.location.href = '/login?next=/wholesale'", "window.location.href = '/wholesale/login'");
  }

  if (page === "pages-training") {
    html = html
      .replaceAll('action="/contact#contact_form"', 'action="/api/applications/training"')
      .replaceAll("window.location.href = '/login?next=/training'", "window.location.href = '/training/login'");
  }

  if (page === "appointments") {
    html = html.replaceAll('action="/contact#oappt-hidden-form"', 'action="/api/appointments"');
  }

  html = html.replace(/action="\/contact#[^"]*"/g, 'action="/api/contact"');

  // Strip floating WhatsApp / iMessage chat widget scraped from Shopify
  html = html.replace(/<style>\s*\.ohs-chat[\s\S]*?<\/style>\s*<div class="ohs-chat-wrap"[\s\S]*?<\/div>/g, '');

  return html;
}

// ── INLINE TRANSLATION + CURRENCY SCRIPT ─────────────────────────────────────
// Injected directly into every ShopifyClone page — no external file, no race.
const INLINE_I18N_SCRIPT = `<script>
(function(){
  var DE = {
    'Worldwide Shipping — Free Over €200':'Weltweiter Versand – Kostenlos ab 200 €',
    'Luxury Hair. Premium Quality. Designed for You.':'Luxuriöses Haar. Höchste Qualität. Für dich geschaffen.',
    'Luxury Hair. Premium Quality. Every Strand Designed Just For You.':'Luxuriöses Haar. Premium-Qualität. Jede Strähne für dich perfektioniert.',
    'Become an Affiliate →':'Affiliate-Partner werden →',
    'Home':'Startseite','About':'Über uns','Shop':'Shop',
    'Wholesale':'Großhandel','Training':'Schulungen',
    'Appointment':'Termin buchen','Services':'Services',
    'Affiliate':'Affiliate','Rentals':'Clips Verleih',
    'Affiliate Programme':'Affiliate Program',
    'More':'Mehr','MORE':'Mehr','Help':'Hilfe','HELP':'Hilfe',
    'About':'Über Uns','ABOUT':'Über Uns',
    'Stay Connected':'Bleib verbunden','STAY CONNECTED':'Bleib verbunden',
    'Our Story':'Unsere Geschichte','Careers':'Karriere','Press':'Presse',
    'Sustainability':'Nachhaltigkeit','Social Responsibility':'Soziale Verantwortung',
    'Journal':'Magazin','FAQ':'FAQ','Shipping':'Versand',
    'Returns':'Rücksendungen','Track Order':'Bestellung verfolgen',
    'Contact Us':'Kontakt',
    'Stay connected with OlivHairSupply Club.':'Bleib immer auf dem Laufenden mit dem OlivHairSupply Club.',
    'Stay connected with Olivhairsupply Club.':'Bleib immer auf dem Laufenden mit dem OlivHairSupply Club.',
    'Language & Currency':'Sprache & Währung'
  };
  var CURR = {EUR:{s:'€',r:1},GBP:{s:'£',r:0.86},USD:{s:'$',r:1.09}};
  var SKIP = {SCRIPT:1,STYLE:1,NOSCRIPT:1,TEXTAREA:1,INPUT:1};

  function tx(node,dict){
    if(node.nodeType===3){
      var v=node.nodeValue; if(!v||!v.trim())return;
      for(var k in dict)if(v.indexOf(k)!==-1)v=v.split(k).join(dict[k]);
      if(v!==node.nodeValue)node.nodeValue=v;
    }else if(node.nodeType===1&&!SKIP[node.tagName]){
      if(node.placeholder){for(var k in dict)if(node.placeholder.indexOf(k)!==-1)node.placeholder=node.placeholder.split(k).join(dict[k]);}
      for(var c=node.firstChild;c;c=c.nextSibling)tx(c,dict);
    }
  }

  function rev(d){var r={};for(var k in d)r[d[k]]=k;return r;}

  function setLang(lang){
    if(document.body.dataset.ohsLang===lang)return;
    if(lang==='de'){tx(document.body,DE);}
    else if(document.body.dataset.ohsLang==='de'){tx(document.body,rev(DE));}
    document.body.dataset.ohsLang=lang;
    document.querySelectorAll('select[name="locale_code"]').forEach(function(s){s.value=lang;});
    try{localStorage.setItem('ohs-lang',lang);}catch(e){}
  }

  function storePrices(){
    var w=document.createTreeWalker(document.body,4);var n;
    while((n=w.nextNode())){
      var p=n.parentElement;
      if(!p||SKIP[p.tagName]||!n.nodeValue||n.nodeValue.indexOf('€')===-1)continue;
      if(!p.dataset.eurText)p.dataset.eurText=p.innerHTML;
    }
  }

  function applyPrices(){
    var code;try{code=localStorage.getItem('ohs-currency')||'EUR';}catch(e){code='EUR';}
    var c=CURR[code]||CURR.EUR;
    document.querySelectorAll('[data-eur-text]').forEach(function(el){
      el.innerHTML=el.dataset.eurText.replace(/€\\s*([\\d,]+(?:\\.\\d{1,2})?)/g,function(_,n){
        var v=parseFloat(n.replace(/,/g,''))*c.r;
        return c.s+(v%1===0?v.toFixed(0):v.toFixed(2));
      });
    });
    var sv=code==='GBP'?'GB':code==='USD'?'US':'DE';
    document.querySelectorAll('select[name="country_code"]').forEach(function(s){s.value=sv;});
  }

  function init(){
    // Inject nav spacing fix for German (bypasses CSS bundle cache)
    var deStyle=document.getElementById('ohs-de-style');
    if(!deStyle){
      deStyle=document.createElement('style');
      deStyle.id='ohs-de-style';
      deStyle.textContent='body[data-ohs-lang="de"] .ohs-nav-left li a{letter-spacing:0.8px!important;padding-left:7px!important;padding-right:7px!important;}body[data-ohs-lang="de"] .ohs-nav-right li a.ohs-nav-link{letter-spacing:0.8px!important;padding-left:6px!important;padding-right:6px!important;}';
      document.head.appendChild(deStyle);
    }

    var lang;try{lang=localStorage.getItem('ohs-lang')||'en';}catch(e){lang='en';}
    if(lang==='de')setLang('de');
    else document.querySelectorAll('select[name="locale_code"]').forEach(function(s){s.value='en';});

    document.querySelectorAll('select[name="locale_code"]').forEach(function(sel){
      sel.addEventListener('change',function(){
        var l=sel.value==='de'?'de':'en';
        document.querySelectorAll('select[name="locale_code"]').forEach(function(s){s.value=l;});
        setLang(l);
      });
      if(sel.form)sel.form.addEventListener('submit',function(e){e.preventDefault();});
    });

    storePrices(); applyPrices();

    document.querySelectorAll('select[name="country_code"]').forEach(function(sel){
      sel.addEventListener('change',function(){
        var v=sel.value,code=v==='GB'?'GBP':v==='US'?'USD':'EUR';
        try{localStorage.setItem('ohs-currency',code);}catch(e){}
        document.querySelectorAll('select[name="country_code"]').forEach(function(s){s.value=v;});
        applyPrices();
      });
      if(sel.form)sel.form.addEventListener('submit',function(e){e.preventDefault();});
    });
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);
  else init();
})();
</script>`;
