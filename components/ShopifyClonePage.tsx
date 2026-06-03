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
    .replaceAll('href="/pages/appointment"', 'href="/appointments"')
    .replaceAll('href="/pages/affiliate"', 'href="/affiliate"')
    .replaceAll('href="/pages/wholesale"', 'href="/wholesale"')
    .replaceAll('href="/search"', 'href="/shop"')
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

  // Remove Spanish + form auto-submit server-side (client handles language switching)
  html = html.replace(/<option\b[^>]*\bvalue=(["'])es\1[^>]*>[\s\S]*?<\/option>/gi, '');
  html = html.replace(/(<select[^>]*name="locale_code"[^>]*)onchange="this\.form\.submit\(\)"([^>]*>)/g, '$1$2');
  html = html.replace(/href="\/customer_authentication\/login[^"]*"/g, 'href="/login"');

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
  // ARRAY (not object) — guarantees order. Longest keys first to prevent
  // short keys (e.g. 'Shipping') from corrupting longer matches.
  var DE_PAIRS = [
    // Long sentences first
    ["Luxury human hair extensions crafted for women who refuse compromise. Sourced from the world’s finest suppliers, installed by Berlin’s most trusted specialists.","Luxuriöse Echthaar-Extensions für Frauen, die keine Kompromisse eingehen. Von den besten Lieferanten weltweit, installiert von Berlins renommiertesten Spezialisten."],
    ['Luxury extensions crafted for women who refuse compromise.','Luxuriöse Haarverlängerungen für Frauen, die keine Kompromisse eingehen.'],
    ['Luxury Hair. Premium Quality. Every Strand Designed Just For You.','Luxuriöses Haar. Premium-Qualität. Jede Strähne für dich perfektioniert.'],
    ['Luxury Hair. Premium Quality. Designed for You.','Luxuriöses Haar. Höchste Qualität. Für dich geschaffen.'],
    ['Stay connected with OlivHairSupply Club.','Bleib immer auf dem Laufenden mit dem OlivHairSupply Club.'],
    ['Stay connected with Olivhairsupply Club.','Bleib immer auf dem Laufenden mit dem OlivHairSupply Club.'],
    ['Worldwide Shipping — Free Over €200','Weltweiter Versand – Kostenlos ab 200 €'],
    // Trust strip (long before short)
    ['Free EU shipping on orders over €200','Kostenloser EU-Versand ab 200 €'],
    ['Free EU Shipping Over €200','Kostenloser EU-Versand ab 200 €'],
    ['FREE EU SHIPPING OVER €200','KOSTENLOSER EU-VERSAND AB 200 €'],
    ['FREE EU SHIPPING','KOSTENLOSER EU-VERSAND'],
    ['Free EU Shipping','Kostenloser EU-Versand'],
    ['100% Human Hair','100 % Echthaar'],
    ['100% HUMAN HAIR','100 % ECHTHAAR'],
    ['Expert Colour Matching','Professionelle Farbberatung'],
    ['EXPERT COLOUR MATCHING','PROFESSIONELLE FARBBERATUNG'],
    ['Worldwide Delivery','Weltweite Lieferung'],
    ['WORLDWIDE DELIVERY','WELTWEITE LIEFERUNG'],
    ['Berlin In-Store Experience','Berlin Salon-Erlebnis'],
    ['BERLIN IN-STORE EXPERIENCE','BERLIN SALON-ERLEBNIS'],
    // Hero
    ['BiziLuxe Collection','BiziLuxe Kollektion'],
    ['Shop BiziLuxe Hair','BiziLuxe Hair entdecken'],
    ['SHOP BIZILUXE HAIR','BIZILUXE HAIR ENTDECKEN'],
    ['SHOP BIZILUXE','BIZILUXE ENTDECKEN'],
    ['Book an Appointment','Termin buchen'],
    ['Book Appointment','Termin buchen'],
    ['BOOK APPOINTMENT','TERMIN BUCHEN'],
    ['Premium Hair.','Premium Haar.'],
    ['Confidence.','Eleganz.'],
    ['Effortless','Zeitlose'],
    // Topbar
    ['Become an Affiliate →','Affiliate-Partner werden →'],
    // Nav (long before short)
    ['Affiliate Programme','Affiliate Program'],
    ['Social Responsibility','Soziale Verantwortung'],
    ['Track Order','Bestellung verfolgen'],
    ['Stay Connected','Bleib verbunden'],
    ['STAY CONNECTED','Bleib verbunden'],
    ['Contact Us','Kontakt'],
    ['Our Story','Unsere Geschichte'],
    ['Sustainability','Nachhaltigkeit'],
    ['Wholesale','Großhandel'],
    ['Training','Schulungen'],
    ['Appointment','Termin buchen'],
    ['Careers','Karriere'],
    ['Journal','Magazin'],
    ['Returns','Rücksendungen'],
    ['Shipping','Versand'],
    ['Rentals','Clips Verleih'],
    ['Services','Services'],
    ['Affiliate','Affiliate'],
    ['About','Über Uns'],
    ['ABOUT','ÜBER UNS'],
    ['Press','Presse'],
    ['More','Mehr'],
    ['MORE','MEHR'],
    ['Help','Hilfe'],
    ['HELP','HILFE'],
    ['Home','Startseite'],
    ['Shop','Shop'],
    ['FAQ','FAQ'],
    // Footer newsletter
    ['Language & Currency','Sprache & Währung'],
  ];
  // Convert to object for rev() compatibility
  var DE = {};
  for(var _i=0;_i<DE_PAIRS.length;_i++){DE[DE_PAIRS[_i][0]]=DE_PAIRS[_i][1];}
  var CURR = {EUR:{s:'€',r:1},GBP:{s:'£',r:0.86},USD:{s:'$',r:1.09}};
  var SKIP = {SCRIPT:1,STYLE:1,NOSCRIPT:1,TEXTAREA:1,INPUT:1};

  function tx(node,pairs){
    if(node.nodeType===3){
      var v=node.nodeValue; if(!v||!v.trim())return;
      for(var i=0;i<pairs.length;i++){if(v.indexOf(pairs[i][0])!==-1)v=v.split(pairs[i][0]).join(pairs[i][1]);}
      if(v!==node.nodeValue)node.nodeValue=v;
    }else if(node.nodeType===1&&!SKIP[node.tagName]){
      if(node.placeholder){for(var i=0;i<pairs.length;i++){if(node.placeholder.indexOf(pairs[i][0])!==-1)node.placeholder=node.placeholder.split(pairs[i][0]).join(pairs[i][1]);}}
      for(var c=node.firstChild;c;c=c.nextSibling)tx(c,pairs);
    }
  }

  function revPairs(p){return p.map(function(x){return[x[1],x[0]];});}

  function setLang(lang){
    if(document.body.dataset.ohsLang===lang)return;
    if(lang==='de'){tx(document.body,DE_PAIRS);}
    else if(document.body.dataset.ohsLang==='de'){tx(document.body,revPairs(DE_PAIRS));}
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
