import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getWholesaleSession } from "@/lib/auth/wholesale-session";
import { ShopifyClonePage } from "@/components/ShopifyClonePage";

const WHOLESALE_CATEGORIES = [
  { slug: "bizihair-extensions",     label: "Bizihair Extensions" },
  { slug: "biziluxe-extensions",     label: "BiziLuxe Extensions" },
  { slug: "biziluxe-accessoires",    label: "BiziLuxe Accessoires" },
  { slug: "biziluxe-stylinggeraete", label: "BiziLuxe Stylinggeräte" },
  { slug: "buersten-und-kaemme",     label: "Bürsten & Kämme" },
  { slug: "profi-friseurbedarf",     label: "Profi Friseurbedarf" },
];

export default async function WholesalePage() {
  const session = await getWholesaleSession();

  if (session) {
    const admin = createSupabaseAdminClient();
    const { data: account } = await admin
      .from("wholesale_accounts")
      .select("business_name")
      .eq("id", session.id)
      .maybeSingle();

    const businessName = account?.business_name ?? session.business_name ?? "Wholesale Partner";

    // ── Script 1: minimal boot — EXACTLY the affiliate page pattern ──
    const bootScript = `<script>
(function(){
  function boot(){
    var nm = document.getElementById('owhl-name-display');
    if(nm) nm.textContent = ${JSON.stringify(businessName)};
    var overlay = document.getElementById('owhl-login-overlay');
    if(overlay){ overlay.classList.add('open'); document.body.style.overflow='hidden'; }
    var lp = document.getElementById('owhl-login-panel');
    if(lp) lp.style.display='none';
    var dp = document.getElementById('owhl-dash-panel');
    if(dp) dp.classList.add('visible');
    window.owhlLogout = function(){
      fetch('/api/wholesale/logout',{method:'POST'})
        .then(function(){ window.location.href='/wholesale'; });
    };
  }
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',boot);
  } else { boot(); }
})();
<\/script>`;

    // ── Script 2: products, filters, cart ──
    // NOTE: \\\' throughout — template literal \\\\ becomes \\ in string, then \\' in browser JS
    // is a valid escaped single-quote inside a JS single-quoted string literal.
    const shopScript = `<script>
(function(){
  var CATS = ${JSON.stringify(WHOLESALE_CATEGORIES)};
  var cart = {};
  var ALL_PRODS = [];

  function initShop(){
    injectCSS();
    buildFilters();
    loadProducts();
  }

  /* ── CSS ── */
  function injectCSS(){
    var s = document.createElement('style');
    s.textContent =
      '.owhl-product-grid{display:grid!important;grid-template-columns:repeat(3,1fr)!important;gap:8px!important;}' +
      '.owhl-product-card{padding:10px!important;}' +
      '.owhl-product-thumb{margin-bottom:8px!important;overflow:hidden;}' +
      '.owhl-product-thumb img{width:100%;height:100%;object-fit:cover;display:block;}' +
      '.owhl-product-name{font-size:14px!important;margin-bottom:1px!important;}' +
      '.owhl-product-sku{font-size:8px!important;margin-bottom:6px!important;}' +
      '.owhl-product-price{font-size:13px!important;}' +
      '.owhl-product-rrp{font-size:11px!important;}' +
      '.owhl-product-saving{font-size:9px!important;}' +
      '.owhl-qty-btn{width:26px!important;height:30px!important;}' +
      '.owhl-qty-input{width:30px!important;height:30px!important;font-size:12px!important;}' +
      '.owhl-add-btn{font-size:9px!important;height:30px!important;}' +
      '.owhl-variant-select{width:100%;border:1px solid #E3D6C5;background:#FFFDFB;padding:5px 7px;font-family:Montserrat,sans-serif;font-size:10px;color:#2B2620;margin-bottom:7px;outline:none;cursor:pointer;}' +
      '.owhl-whl-empty{grid-column:1/-1;padding:36px 20px;text-align:center;border:1px dashed #E3D6C5;font-family:Montserrat,sans-serif;font-size:11px;color:#A0907E;letter-spacing:1.5px;text-transform:uppercase;}' +
      '.owhl-success-overlay{position:fixed;inset:0;background:rgba(43,38,32,.88);display:flex;align-items:center;justify-content:center;z-index:999999;padding:24px;}' +
      '.owhl-success-box{background:#FFFDFB;border:1px solid #E3D6C5;max-width:500px;width:100%;padding:52px 44px;text-align:center;}' +
      '.owhl-success-tick{width:46px;height:46px;background:#B68A45;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 22px;font-size:20px;color:#fff;}' +
      '.owhl-success-eye{font-family:Montserrat,sans-serif;font-size:9px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#B68A45;margin-bottom:12px;}' +
      '.owhl-success-ttl{font-family:"Cormorant Garamond",Georgia,serif;font-size:30px;font-weight:300;color:#2B2620;margin-bottom:18px;line-height:1.2;}' +
      '.owhl-success-msg{font-family:Montserrat,sans-serif;font-size:12px;color:#6B5C4E;line-height:1.85;margin-bottom:28px;}' +
      '.owhl-success-cta{background:#2B2620;color:#F6F1E8;border:none;padding:13px 30px;font-family:Montserrat,sans-serif;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;cursor:pointer;}' +
      '@media(max-width:900px){.owhl-product-grid{grid-template-columns:repeat(2,1fr)!important;}}' +
      '@media(max-width:540px){.owhl-product-grid{grid-template-columns:1fr!important;}}';
    document.head.appendChild(s);
  }

  /* ── filters ── */
  function buildFilters(){
    var row = document.querySelector('.owhl-filter-row');
    if(!row) return;
    row.innerHTML = '';
    var all = document.createElement('button');
    all.className = 'owhl-filter-btn active';
    all.textContent = 'All';
    all.setAttribute('data-filter', 'all');
    row.appendChild(all);
    CATS.forEach(function(c){
      var btn = document.createElement('button');
      btn.className = 'owhl-filter-btn';
      btn.textContent = c.label;
      btn.setAttribute('data-filter', c.slug);
      row.appendChild(btn);
    });
    row.addEventListener('click', function(e){
      var btn = e.target.closest('.owhl-filter-btn');
      if(!btn) return;
      row.querySelectorAll('.owhl-filter-btn').forEach(function(b){ b.classList.remove('active'); });
      btn.classList.add('active');
      renderGrid(btn.getAttribute('data-filter'));
    });
  }

  /* ── load products ── */
  function loadProducts(){
    var grid = document.getElementById('owhl-product-grid');
    if(grid) grid.innerHTML = '<div style="padding:32px;text-align:center;font-family:Montserrat,sans-serif;font-size:11px;color:#A0907E;letter-spacing:1px;">Loading products…<\/div>';
    fetch('/api/wholesale/products')
      .then(function(r){ return r.json(); })
      .then(function(d){
        ALL_PRODS = d.products || [];
        renderGrid('all');
        wireGridEvents();
      })
      .catch(function(){
        var g = document.getElementById('owhl-product-grid');
        if(g) g.innerHTML = '<div style="padding:32px;text-align:center;font-family:Montserrat,sans-serif;font-size:11px;color:#A0907E;">Products are loading. Please refresh.<\/div>';
      });
  }

  /* ── render grid ── */
  function renderGrid(slug){
    var grid = document.getElementById('owhl-product-grid');
    if(!grid) return;
    var list = slug === 'all' ? ALL_PRODS : ALL_PRODS.filter(function(p){ return p.categorySlug === slug; });
    if(!list.length){
      grid.innerHTML = '<div class="owhl-whl-empty">Coming Soon — Products for this collection are being added<\/div>';
      return;
    }
    grid.innerHTML = list.map(buildCard).join('');
    populateSelects(list);
    wireGridEvents();
  }

  function fmt(cents){ return '€'+(cents/100).toFixed(2).replace('.',','); }
  function esc(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  function buildCard(p){
    var v0 = p.variants[0];
    var multi = p.variants.length > 1 && v0.title !== 'Standard';
    var save  = Math.round((1 - v0.wholesale_price_cents/v0.retail_price_cents)*100);
    var img   = p.image_url
      ? '<img src="'+esc(p.image_url)+'" alt="'+esc(p.title)+'" loading="lazy">'
      : '<span style="font-size:8px;color:#A0907E;letter-spacing:2px;text-transform:uppercase;font-family:Montserrat,sans-serif;">'+esc(p.title.substring(0,4))+'<\/span>';
    var vsel  = multi
      ? '<select class="owhl-variant-select" data-role="vsel"><\/select>'
      : '';
    return '<div class="owhl-product-card" data-pid="'+esc(p.id)+'">' +
      '<div class="owhl-product-thumb">'+img+'<\/div>' +
      '<div class="owhl-product-name">'+esc(p.title)+'<\/div>' +
      '<span class="owhl-product-sku" data-role="sku">'+esc(v0.sku||p.id)+'<\/span>' +
      vsel +
      '<div class="owhl-product-prices">' +
        '<span class="owhl-product-price" data-role="wp">'+fmt(v0.wholesale_price_cents)+'<\/span>' +
        '<span class="owhl-product-rrp" data-role="rp">'+fmt(v0.retail_price_cents)+'<\/span>' +
        '<span class="owhl-product-saving" data-role="sv">Save '+save+'%<\/span>' +
      '<\/div>' +
      '<div class="owhl-product-actions">' +
        '<div class="owhl-qty-wrap">' +
          '<button class="owhl-qty-btn" data-role="qdec">-<\/button>' +
          '<input class="owhl-qty-input" data-role="qty" type="number" value="3" min="3" readonly>' +
          '<button class="owhl-qty-btn" data-role="qinc">+<\/button>' +
        '<\/div>' +
        '<button class="owhl-add-btn" data-role="add">Add to Order<\/button>' +
      '<\/div>' +
    '<\/div>';
  }

  function populateSelects(list){
    list.forEach(function(p){
      var card = document.querySelector('[data-pid="'+esc(p.id)+'"]');
      if(!card) return;
      var sel = card.querySelector('[data-role="vsel"]');
      if(!sel) return;
      p.variants.forEach(function(v){
        var o = document.createElement('option');
        o.value = v.id;
        o.dataset.w = v.wholesale_price_cents;
        o.dataset.r = v.retail_price_cents;
        o.dataset.s = v.sku||'';
        o.textContent = v.title;
        sel.appendChild(o);
      });
      sel.addEventListener('change', function(){
        var opt = sel.options[sel.selectedIndex];
        var w=parseInt(opt.dataset.w), r=parseInt(opt.dataset.r);
        card.querySelector('[data-role="wp"]').textContent = fmt(w);
        card.querySelector('[data-role="rp"]').textContent = fmt(r);
        card.querySelector('[data-role="sv"]').textContent = 'Save '+Math.round((1-w/r)*100)+'%';
        card.querySelector('[data-role="sku"]').textContent = opt.dataset.s||'';
        card.querySelector('[data-role="qty"]').value = '3';
      });
    });
  }

  /* ── grid event delegation (qty / add) ── */
  function wireGridEvents(){
    var grid = document.getElementById('owhl-product-grid');
    if(!grid || grid._wired) return;
    grid._wired = true;
    grid.addEventListener('click', function(e){
      var card = e.target.closest('[data-pid]');
      if(!card) return;
      var pid = card.getAttribute('data-pid');
      var role = e.target.getAttribute('data-role');
      if(role === 'qdec'){
        var qi = card.querySelector('[data-role="qty"]');
        if(qi) qi.value = Math.max(3,(parseInt(qi.value)||3)-1);
      } else if(role === 'qinc'){
        var qi = card.querySelector('[data-role="qty"]');
        if(qi) qi.value = Math.max(3,(parseInt(qi.value)||3)+1);
      } else if(role === 'add'){
        owhlAdd(pid, card);
      }
    });
  }

  /* ── add to cart ── */
  function owhlAdd(pid, card){
    var prod = ALL_PRODS.find(function(p){ return p.id===pid; });
    if(!prod) return;
    if(!card) card = document.querySelector('[data-pid="'+pid+'"]');
    var sel = card ? card.querySelector('[data-role="vsel"]') : null;
    var vid = sel ? sel.value : prod.variants[0].id;
    var v = prod.variants.find(function(x){ return x.id===vid; }) || prod.variants[0];
    var qEl = card ? card.querySelector('[data-role="qty"]') : null;
    var qty = Math.max(3, parseInt((qEl||{}).value)||3);
    var key = pid+':'+vid;
    if(cart[key]) cart[key].qty += qty;
    else cart[key] = {productId:pid,variantId:vid,name:prod.title,
      variantTitle:(v.title==='Standard'?'':v.title),sku:v.sku||pid,
      price:v.wholesale_price_cents,qty:qty};
    var btn = card ? card.querySelector('[data-role="add"]') : null;
    if(btn){ btn.textContent='Added ✓'; btn.classList.add('added');
      setTimeout(function(){ btn.textContent='Add to Order'; btn.classList.remove('added'); },1400); }
    renderCart();
  }

  /* ── cart ── */
  function renderCart(){
    var entries = Object.keys(cart).map(function(k){ return {k:k,v:cart[k]}; });
    var tq = entries.reduce(function(s,e){ return s+e.v.qty; },0);
    var tc = entries.reduce(function(s,e){ return s+(e.v.price*e.v.qty); },0);
    var ce = document.getElementById('owhl-cart-count');
    var te = document.getElementById('owhl-cart-total');
    if(ce) ce.textContent = tq+' item'+(tq!==1?'s':'');
    if(te) te.textContent = fmt(tc);
    var ie = document.getElementById('owhl-cart-items');
    var ee = document.getElementById('owhl-cart-empty');
    var fe = document.getElementById('owhl-cart-foot');
    if(!entries.length){
      if(ee) ee.style.display='';
      if(ie) ie.innerHTML='';
      if(fe) fe.style.display='none';
      return;
    }
    if(ee) ee.style.display='none';
    if(fe) fe.style.display='';
    if(ie){
      ie.innerHTML = entries.map(function(e){
        var it=e.v, k=e.k, lb=it.name+(it.variantTitle?' — '+it.variantTitle:'');
        return '<div class="owhl-cart-item" data-key="'+esc(k)+'">' +
          '<div class="owhl-cart-item-row1"><div>' +
            '<div class="owhl-cart-item-name">'+esc(lb)+'<\/div>' +
            '<span class="owhl-cart-item-sku">'+esc(it.sku)+'<\/span>' +
          '<\/div><button class="owhl-cart-item-remove" data-crole="rm">Remove<\/button><\/div>' +
          '<div class="owhl-cart-item-row2">' +
            '<div class="owhl-qty-wrap">' +
              '<button class="owhl-qty-btn" data-crole="cdec">−<\/button>' +
              '<input class="owhl-qty-input" type="number" value="'+it.qty+'" readonly>' +
              '<button class="owhl-qty-btn" data-crole="cinc">+<\/button>' +
            '<\/div>' +
            '<span class="owhl-cart-item-total">'+fmt(it.price*it.qty)+'<\/span>' +
          '<\/div><\/div>';
      }).join('');
      wireCartEvents();
    }
  }

  function wireCartEvents(){
    var ie = document.getElementById('owhl-cart-items');
    if(!ie || ie._wired) return;
    ie._wired = true;
    ie.addEventListener('click', function(e){
      var item = e.target.closest('[data-key]');
      if(!item) return;
      var k = item.getAttribute('data-key');
      var crole = e.target.getAttribute('data-crole');
      if(crole==='rm'){ delete cart[k]; renderCart(); }
      else if(crole==='cdec'){ if(cart[k]){ cart[k].qty=Math.max(3,cart[k].qty-1); renderCart(); } }
      else if(crole==='cinc'){ if(cart[k]){ cart[k].qty=cart[k].qty+1; renderCart(); } }
    });
  }

  /* ── submit order ── */
  window.owhlSubmitOrder = function(){
    var items = Object.values(cart);
    if(!items.length){ alert('Please add items to your order first.'); return; }
    var note = (document.getElementById('owhl-order-note')||{}).value||'';
    var total = items.reduce(function(s,it){ return s+(it.price*it.qty); },0);
    var btn = document.querySelector('.owhl-cart-submit-btn');
    if(btn){ btn.textContent='Submitting…'; btn.disabled=true; }
    fetch('/api/wholesale/submit-order',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({items:items,notes:note,total_wholesale_cents:total})})
    .then(function(r){ return r.json(); })
    .then(function(d){
      if(d.ok){ cart={}; renderCart(); showSuccess(); }
      else{ alert('Something went wrong. Please try again.'); if(btn){btn.textContent='Submit Order Request';btn.disabled=false;} }
    })
    .catch(function(){ alert('Network error.'); if(btn){btn.textContent='Submit Order Request';btn.disabled=false;} });
  };

  function showSuccess(){
    var m = document.createElement('div');
    m.className = 'owhl-success-overlay';
    m.innerHTML =
      '<div class="owhl-success-box">' +
        '<div class="owhl-success-tick">✓<\/div>' +
        '<p class="owhl-success-eye">Order Received<\/p>' +
        '<h2 class="owhl-success-ttl">Thank You<\/h2>' +
        '<p class="owhl-success-msg">Thank you for your wholesale order request. Your order is currently being reviewed by our supply team. An invoice will be sent to your registered email with confirmed stock availability and payment instructions.<br><br><strong>OlivHairSupply Wholesale Team<\/strong><\/p>' +
        '<button class="owhl-success-cta" id="owhl-success-close">Close<\/button>' +
      '<\/div>';
    document.body.appendChild(m);
    document.getElementById('owhl-success-close').addEventListener('click', function(){ m.remove(); });
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded', initShop);
  } else { initShop(); }
})();
<\/script>`;

    return <ShopifyClonePage page="wholesale" injectBeforeClose={bootScript + shopScript} />;
  }

  /* ── public page (not logged in) ── */
  const loginScript = `<script>
(function(){
  window.owhlOpenLogin = function(){ window.location.href='/wholesale/login'; };
  window.owhlTryLogin  = function(){ window.location.href='/wholesale/login'; };
})();
<\/script>`;

  return <ShopifyClonePage page="wholesale" injectBeforeClose={loginScript} />;
}
