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

    // ── Script 1: minimal boot (exact affiliate pattern) ──
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

    // ── Script 2: shop (products, filters, cart, product modal) ──
    const shopScript = `<script>
(function(){
  var CATS = ${JSON.stringify(WHOLESALE_CATEGORIES)};
  var cart = {};
  var ALL_PRODS = [];

  /* ── gallery alternates (same as retail product page) ── */
  var GALLERY_ALTS = {
    '/products/biziluxe-extensions':  ['koenigsallee-main.jpg','sanssouci-main.jpg','nymphenburg-main.jpg'],
    '/products/bizihair-extensions':  ['koenigsallee-main.jpg','sanssouci-main.jpg','nymphenburg-main.jpg'],
    '/products/biziluxe-accessoires': ['saphir-main.jpg','rotenburg-main.jpg','schwarzwald-main.jpg'],
    '/products/profi-friseurbedarf':  ['waldenburg-main.jpg','zeppelin-main.jpg','glashuette-main.jpg']
  };

  function getGallery(imageUrl){
    if(!imageUrl) return [null,null,null];
    var parts = imageUrl.split('/'); parts.pop();
    var catPath = parts.join('/');
    var gallery = [imageUrl];
    var alts = GALLERY_ALTS[catPath] || [];
    for(var i=0; i<alts.length && gallery.length<3; i++){
      var next = catPath+'/'+alts[i];
      if(gallery.indexOf(next)===-1) gallery.push(next);
    }
    while(gallery.length<3) gallery.push(imageUrl);
    return gallery.slice(0,3);
  }

  function initShop(){
    injectCSS();
    buildFilters();
    loadProducts();
  }

  /* ── CSS ── */
  function injectCSS(){
    var s = document.createElement('style');
    s.textContent =
      /* product grid */
      '.owhl-product-grid{display:grid!important;grid-template-columns:repeat(3,1fr)!important;gap:10px!important;}' +
      '.owhl-product-card{padding:14px!important;cursor:pointer;}' +
      '.owhl-product-thumb{margin-bottom:10px!important;overflow:hidden;cursor:pointer;}' +
      '.owhl-product-thumb img{width:100%;height:100%;object-fit:cover;display:block;transition:transform 0.3s;}' +
      '.owhl-product-card:hover .owhl-product-thumb img{transform:scale(1.04);}' +
      '.owhl-product-name{font-size:15px!important;margin-bottom:2px!important;}' +
      '.owhl-product-sku{font-size:8px!important;margin-bottom:8px!important;}' +
      '.owhl-product-price{font-size:14px!important;}' +
      '.owhl-product-rrp{font-size:12px!important;}' +
      '.owhl-product-saving{font-size:10px!important;}' +
      '.owhl-qty-btn{width:28px!important;height:32px!important;}' +
      '.owhl-qty-input{width:32px!important;height:32px!important;font-size:12px!important;}' +
      '.owhl-add-btn{font-size:9px!important;height:32px!important;}' +
      '.owhl-variant-select{width:100%;border:1px solid #E3D6C5;background:#FFFDFB;padding:5px 7px;font-family:Montserrat,sans-serif;font-size:10px;color:#2B2620;margin-bottom:7px;outline:none;cursor:pointer;}' +
      '.owhl-whl-empty{grid-column:1/-1;padding:36px 20px;text-align:center;border:1px dashed #E3D6C5;font-family:Montserrat,sans-serif;font-size:11px;color:#A0907E;letter-spacing:1.5px;text-transform:uppercase;}' +
      /* success overlay */
      '.owhl-success-overlay{position:fixed;inset:0;background:rgba(43,38,32,.88);display:flex;align-items:center;justify-content:center;z-index:999999;padding:24px;}' +
      '.owhl-success-box{background:#FFFDFB;border:1px solid #E3D6C5;max-width:500px;width:100%;padding:52px 44px;text-align:center;}' +
      '.owhl-success-tick{width:46px;height:46px;background:#B68A45;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 22px;font-size:20px;color:#fff;}' +
      '.owhl-success-eye{font-family:Montserrat,sans-serif;font-size:9px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#B68A45;margin-bottom:12px;}' +
      '.owhl-success-ttl{font-family:"Cormorant Garamond",Georgia,serif;font-size:30px;font-weight:300;color:#2B2620;margin-bottom:18px;line-height:1.2;}' +
      '.owhl-success-msg{font-family:Montserrat,sans-serif;font-size:12px;color:#6B5C4E;line-height:1.85;margin-bottom:28px;}' +
      '.owhl-success-cta{background:#2B2620;color:#F6F1E8;border:none;padding:13px 30px;font-family:Montserrat,sans-serif;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;cursor:pointer;}' +
      /* product detail modal */
      '#owhl-pdp-modal{position:fixed;inset:0;background:rgba(15,10,6,.88);z-index:100000;display:none;align-items:center;justify-content:center;padding:16px;}' +
      '#owhl-pdp-modal.open{display:flex;}' +
      '.owhl-pdp-inner{background:#FFFDFB;border:1px solid #E3D6C5;max-width:820px;width:100%;max-height:92vh;overflow-y:auto;position:relative;display:grid;grid-template-columns:1fr 1fr;}' +
      '.owhl-pdp-close{position:absolute;top:12px;right:12px;width:30px;height:30px;background:none;border:1px solid #E3D6C5;cursor:pointer;font-size:16px;color:#2B2620;z-index:10;display:flex;align-items:center;justify-content:center;line-height:1;}' +
      '.owhl-pdp-close:hover{border-color:#2B2620;background:#EDE5D8;}' +
      '.owhl-pdp-images{padding:20px;display:flex;flex-direction:column;gap:8px;}' +
      '.owhl-pdp-main{aspect-ratio:1;overflow:hidden;background:linear-gradient(135deg,#EDE5D8,#D8CCB8);}' +
      '.owhl-pdp-main img{width:100%;height:100%;object-fit:cover;display:block;transition:opacity .25s;}' +
      '.owhl-pdp-thumbs{display:flex;gap:6px;}' +
      '.owhl-pdp-thumb{flex:1;aspect-ratio:1;overflow:hidden;background:#EDE5D8;cursor:pointer;border:2px solid transparent;transition:border-color .2s;}' +
      '.owhl-pdp-thumb.active{border-color:#B68A45;}' +
      '.owhl-pdp-thumb:hover{border-color:#B68A45;}' +
      '.owhl-pdp-thumb img{width:100%;height:100%;object-fit:cover;display:block;}' +
      '.owhl-pdp-info{padding:28px 24px;display:flex;flex-direction:column;gap:12px;border-left:1px solid #E3D6C5;}' +
      '.owhl-pdp-eyebrow{font-family:Montserrat,sans-serif;font-size:9px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#B68A45;margin:0;}' +
      '.owhl-pdp-title{font-family:"Cormorant Garamond",Georgia,serif;font-size:26px;font-weight:300;color:#2B2620;line-height:1.2;margin:0;}' +
      '.owhl-pdp-sku{font-family:Montserrat,sans-serif;font-size:9px;color:#A0907E;letter-spacing:1.5px;text-transform:uppercase;}' +
      '.owhl-pdp-prices{display:flex;align-items:baseline;gap:8px;flex-wrap:wrap;}' +
      '.owhl-pdp-price{font-family:Montserrat,sans-serif;font-size:20px;font-weight:700;color:#B68A45;}' +
      '.owhl-pdp-rrp{font-family:Montserrat,sans-serif;font-size:13px;color:#A0907E;text-decoration:line-through;}' +
      '.owhl-pdp-saving{font-family:Montserrat,sans-serif;font-size:11px;font-weight:700;color:#5A8A50;}' +
      '.owhl-pdp-vsel{width:100%;border:1px solid #E3D6C5;background:#FFFDFB;padding:10px 12px;font-family:Montserrat,sans-serif;font-size:11px;color:#2B2620;outline:none;cursor:pointer;appearance:auto;}' +
      '.owhl-pdp-vsel-wrap label{font-family:Montserrat,sans-serif;font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#6B5C4E;display:block;margin-bottom:5px;}' +
      '.owhl-pdp-qty-wrap{display:flex;align-items:center;border:1.5px solid #E3D6C5;width:fit-content;}' +
      '.owhl-pdp-qbtn{width:36px;height:42px;background:#EDE5D8;border:none;font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-family:Montserrat,sans-serif;}' +
      '.owhl-pdp-qbtn:hover{background:#D8CCB8;}' +
      '.owhl-pdp-qinput{width:48px;height:42px;border:none;border-left:1px solid #E3D6C5;border-right:1px solid #E3D6C5;text-align:center;font-family:Montserrat,sans-serif;font-size:14px;font-weight:500;color:#1F1F1F;outline:none;background:#FFFDFB;padding:0;}' +
      '.owhl-pdp-add{background:#2B2620;color:#F6F1E8;font-family:Montserrat,sans-serif;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;padding:14px;border:none;cursor:pointer;transition:background .2s;width:100%;}' +
      '.owhl-pdp-add:hover{background:#B68A45;}' +
      '.owhl-pdp-add.added{background:#5A8A50;}' +
      '.owhl-pdp-note{font-family:Montserrat,sans-serif;font-size:10px;color:#A0907E;line-height:1.6;margin:0;}' +
      '@media(max-width:900px){.owhl-product-grid{grid-template-columns:repeat(2,1fr)!important;}}' +
      '@media(max-width:540px){.owhl-product-grid{grid-template-columns:1fr!important;}}' +
      '@media(max-width:640px){.owhl-pdp-inner{grid-template-columns:1fr;}.owhl-pdp-info{border-left:none;border-top:1px solid #E3D6C5;}}';
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
    all.setAttribute('data-filter','all');
    row.appendChild(all);
    CATS.forEach(function(c){
      var btn = document.createElement('button');
      btn.className = 'owhl-filter-btn';
      btn.textContent = c.label;
      btn.setAttribute('data-filter', c.slug);
      row.appendChild(btn);
    });
    row.addEventListener('click',function(e){
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
    var list = slug==='all' ? ALL_PRODS : ALL_PRODS.filter(function(p){ return p.categorySlug===slug; });
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
    var multi = p.variants.length>1 && v0.title!=='Standard';
    var save  = v0.retail_price_cents>0 ? Math.round((1-v0.wholesale_price_cents/v0.retail_price_cents)*100) : 0;
    var img   = p.image_url
      ? '<img src="'+esc(p.image_url)+'" alt="'+esc(p.title)+'" loading="lazy">'
      : '<span style="font-size:8px;color:#A0907E;letter-spacing:2px;text-transform:uppercase;font-family:Montserrat,sans-serif;">'+esc(p.title.substring(0,4))+'<\/span>';
    var vsel  = multi ? '<select class="owhl-variant-select" data-role="vsel"><\/select>' : '';
    return '<div class="owhl-product-card" data-pid="'+esc(p.id)+'">' +
      '<div class="owhl-product-thumb" data-role="view">'+img+'<\/div>' +
      '<div class="owhl-product-name" data-role="view">'+esc(p.title)+'<\/div>' +
      '<span class="owhl-product-sku" data-role="sku">'+esc(v0.sku||p.id)+'<\/span>' +
      vsel +
      '<div class="owhl-product-prices">' +
        '<span class="owhl-product-price" data-role="wp">'+fmt(v0.wholesale_price_cents)+'<\/span>' +
        '<span class="owhl-product-rrp" data-role="rp">'+fmt(v0.retail_price_cents)+'<\/span>' +
        (save>0?'<span class="owhl-product-saving" data-role="sv">Save '+save+'%<\/span>':'') +
      '<\/div>' +
      '<div class="owhl-product-actions">' +
        '<div class="owhl-qty-wrap">' +
          '<button class="owhl-qty-btn" data-role="qdec">−<\/button>' +
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
      sel.addEventListener('change',function(){
        var opt = sel.options[sel.selectedIndex];
        var w=parseInt(opt.dataset.w), r=parseInt(opt.dataset.r);
        var wp=card.querySelector('[data-role="wp"]');
        var rp=card.querySelector('[data-role="rp"]');
        var sv=card.querySelector('[data-role="sv"]');
        var sk=card.querySelector('[data-role="sku"]');
        var qt=card.querySelector('[data-role="qty"]');
        if(wp) wp.textContent=fmt(w);
        if(rp) rp.textContent=fmt(r);
        if(sv) sv.textContent=r>0?'Save '+Math.round((1-w/r)*100)+'%':'';
        if(sk) sk.textContent=opt.dataset.s||'';
        if(qt) qt.value='3';
      });
    });
  }

  /* ── grid events ── */
  function wireGridEvents(){
    var grid = document.getElementById('owhl-product-grid');
    if(!grid || grid._wired) return;
    grid._wired = true;
    grid.addEventListener('click',function(e){
      var card = e.target.closest('[data-pid]');
      if(!card) return;
      var pid = card.getAttribute('data-pid');
      var roleEl = e.target.closest('[data-role]');
      var role = roleEl ? roleEl.getAttribute('data-role') : null;
      if(role==='qdec'){
        var qi=card.querySelector('[data-role="qty"]');
        if(qi) qi.value=Math.max(3,(parseInt(qi.value)||3)-1);
      } else if(role==='qinc'){
        var qi=card.querySelector('[data-role="qty"]');
        if(qi) qi.value=Math.max(3,(parseInt(qi.value)||3)+1);
      } else if(role==='add'){
        addFromCard(pid,card);
      } else if(role==='view'){
        openPDP(pid);
      }
    });
  }

  /* ── add from card (quick add) ── */
  function addFromCard(pid, card){
    var prod=ALL_PRODS.find(function(p){ return p.id===pid; });
    if(!prod) return;
    var sel=card.querySelector('[data-role="vsel"]');
    var vid=sel?sel.value:prod.variants[0].id;
    var v=prod.variants.find(function(x){ return x.id===vid; })||prod.variants[0];
    var qEl=card.querySelector('[data-role="qty"]');
    var qty=Math.max(3,parseInt((qEl||{}).value)||3);
    addToCart(prod,v,qty);
    var btn=card.querySelector('[data-role="add"]');
    if(btn){ btn.textContent='Added ✓'; btn.classList.add('added');
      setTimeout(function(){ btn.textContent='Add to Order'; btn.classList.remove('added'); },1400); }
  }

  /* ── product detail popup ── */
  var pdpModal = null;
  var pdpProd  = null;

  function createPDPModal(){
    if(pdpModal) return;
    pdpModal = document.createElement('div');
    pdpModal.id = 'owhl-pdp-modal';
    pdpModal.innerHTML =
      '<div class="owhl-pdp-inner">' +
        '<button class="owhl-pdp-close" id="owhl-pdp-close" aria-label="Close">&times;<\/button>' +
        '<div class="owhl-pdp-images">' +
          '<div class="owhl-pdp-main"><img id="owhl-pdp-mainimg" src="" alt=""><\/div>' +
          '<div class="owhl-pdp-thumbs" id="owhl-pdp-thumbs"><\/div>' +
        '<\/div>' +
        '<div class="owhl-pdp-info">' +
          '<p class="owhl-pdp-eyebrow">OlivHairSupply<\/p>' +
          '<h2 class="owhl-pdp-title" id="owhl-pdp-title"><\/h2>' +
          '<span class="owhl-pdp-sku" id="owhl-pdp-sku"><\/span>' +
          '<div class="owhl-pdp-vsel-wrap" id="owhl-pdp-vsel-wrap" style="display:none">' +
            '<label>Variant<\/label>' +
            '<select class="owhl-pdp-vsel" id="owhl-pdp-vsel"><\/select>' +
          '<\/div>' +
          '<div class="owhl-pdp-prices">' +
            '<span class="owhl-pdp-price" id="owhl-pdp-price"><\/span>' +
            '<span class="owhl-pdp-rrp" id="owhl-pdp-rrp"><\/span>' +
            '<span class="owhl-pdp-saving" id="owhl-pdp-saving"><\/span>' +
          '<\/div>' +
          '<div class="owhl-pdp-qty-wrap">' +
            '<button class="owhl-pdp-qbtn" id="owhl-pdp-qdec">−<\/button>' +
            '<input class="owhl-pdp-qinput" id="owhl-pdp-qty" type="number" value="3" min="3" readonly>' +
            '<button class="owhl-pdp-qbtn" id="owhl-pdp-qinc">+<\/button>' +
          '<\/div>' +
          '<button class="owhl-pdp-add" id="owhl-pdp-add">Add to Order<\/button>' +
          '<p class="owhl-pdp-note">Minimum order: 3 units per variant. Prices shown are wholesale rates.<\/p>' +
        '<\/div>' +
      '<\/div>';
    document.body.appendChild(pdpModal);

    /* close */
    document.getElementById('owhl-pdp-close').addEventListener('click', closePDP);
    pdpModal.addEventListener('click',function(e){ if(e.target===pdpModal) closePDP(); });

    /* variant change */
    document.getElementById('owhl-pdp-vsel').addEventListener('change', pdpUpdateVariant);

    /* qty buttons */
    document.getElementById('owhl-pdp-qdec').addEventListener('click',function(){
      var el=document.getElementById('owhl-pdp-qty');
      if(el) el.value=Math.max(3,(parseInt(el.value)||3)-1);
    });
    document.getElementById('owhl-pdp-qinc').addEventListener('click',function(){
      var el=document.getElementById('owhl-pdp-qty');
      if(el) el.value=Math.max(3,(parseInt(el.value)||3)+1);
    });

    /* add to order */
    document.getElementById('owhl-pdp-add').addEventListener('click',function(){
      if(!pdpProd) return;
      var sel=document.getElementById('owhl-pdp-vsel');
      var vid=sel?sel.value:(pdpProd.variants[0]&&pdpProd.variants[0].id);
      var v=pdpProd.variants.find(function(x){ return x.id===vid; })||pdpProd.variants[0];
      var qty=Math.max(3,parseInt(document.getElementById('owhl-pdp-qty').value)||3);
      addToCart(pdpProd,v,qty);
      var btn=document.getElementById('owhl-pdp-add');
      btn.textContent='Added ✓'; btn.classList.add('added');
      setTimeout(function(){ btn.textContent='Add to Order'; btn.classList.remove('added'); },1400);
    });

    /* thumbnail clicks */
    document.getElementById('owhl-pdp-thumbs').addEventListener('click',function(e){
      var th=e.target.closest('.owhl-pdp-thumb');
      if(!th) return;
      var src=th.getAttribute('data-src');
      var mi=document.getElementById('owhl-pdp-mainimg');
      if(mi && src){ mi.src=src; }
      document.querySelectorAll('.owhl-pdp-thumb').forEach(function(t){ t.classList.remove('active'); });
      th.classList.add('active');
    });
  }

  function openPDP(pid){
    createPDPModal();
    pdpProd = ALL_PRODS.find(function(p){ return p.id===pid; });
    if(!pdpProd) return;

    /* images */
    var gallery = getGallery(pdpProd.image_url);
    var mi = document.getElementById('owhl-pdp-mainimg');
    if(mi){ mi.src=gallery[0]||''; mi.alt=pdpProd.title; }
    var thumbs = document.getElementById('owhl-pdp-thumbs');
    if(thumbs){
      thumbs.innerHTML = gallery.map(function(src,i){
        return '<div class="owhl-pdp-thumb'+(i===0?' active':'')+'" data-src="'+esc(src||'')+'">'+
          '<img src="'+esc(src||'')+'" alt="'+esc(pdpProd.title)+' '+(i+1)+'">'+
        '<\/div>';
      }).join('');
    }

    /* title & sku */
    var v0 = pdpProd.variants[0];
    var titleEl=document.getElementById('owhl-pdp-title');
    if(titleEl) titleEl.textContent=pdpProd.title;
    var skuEl=document.getElementById('owhl-pdp-sku');
    if(skuEl) skuEl.textContent=v0.sku||pdpProd.id;

    /* variant select */
    var vsel=document.getElementById('owhl-pdp-vsel');
    var vwrap=document.getElementById('owhl-pdp-vsel-wrap');
    vsel.innerHTML='';
    var multi = pdpProd.variants.length>1 && v0.title!=='Standard';
    if(multi){
      pdpProd.variants.forEach(function(v){
        var o=document.createElement('option');
        o.value=v.id;
        o.dataset.w=v.wholesale_price_cents;
        o.dataset.r=v.retail_price_cents;
        o.dataset.s=v.sku||'';
        o.textContent=v.title;
        vsel.appendChild(o);
      });
      vwrap.style.display='';
    } else {
      vwrap.style.display='none';
    }

    /* prices */
    pdpUpdateVariant();

    /* qty reset */
    var qEl=document.getElementById('owhl-pdp-qty');
    if(qEl) qEl.value='3';

    /* show */
    pdpModal.classList.add('open');
  }

  function closePDP(){
    if(pdpModal){ pdpModal.classList.remove('open'); }
    pdpProd=null;
  }

  function pdpUpdateVariant(){
    if(!pdpProd) return;
    var vsel=document.getElementById('owhl-pdp-vsel');
    var v;
    if(vsel && vsel.options.length){
      var opt=vsel.options[vsel.selectedIndex];
      v={ wholesale_price_cents:parseInt(opt.dataset.w)||0,
          retail_price_cents:parseInt(opt.dataset.r)||0,
          sku:opt.dataset.s||'' };
      var skuEl=document.getElementById('owhl-pdp-sku');
      if(skuEl) skuEl.textContent=v.sku||pdpProd.id;
    } else {
      v=pdpProd.variants[0];
    }
    var prEl=document.getElementById('owhl-pdp-price');
    var rrEl=document.getElementById('owhl-pdp-rrp');
    var svEl=document.getElementById('owhl-pdp-saving');
    if(prEl) prEl.textContent=fmt(v.wholesale_price_cents);
    if(rrEl) rrEl.textContent=fmt(v.retail_price_cents);
    if(svEl) svEl.textContent=v.retail_price_cents>0?'Save '+Math.round((1-v.wholesale_price_cents/v.retail_price_cents)*100)+'%':'';
    var qEl=document.getElementById('owhl-pdp-qty');
    if(qEl) qEl.value='3';
  }

  /* ── shared add-to-cart logic ── */
  function addToCart(prod, v, qty){
    var key=prod.id+':'+v.id;
    if(cart[key]) cart[key].qty+=qty;
    else cart[key]={productId:prod.id,variantId:v.id,name:prod.title,
      variantTitle:(v.title==='Standard'?'':v.title),sku:v.sku||prod.id,
      price:v.wholesale_price_cents,qty:qty};
    renderCart();
  }

  /* ── cart ── */
  function renderCart(){
    var entries=Object.keys(cart).map(function(k){ return {k:k,v:cart[k]}; });
    var tq=entries.reduce(function(s,e){ return s+e.v.qty; },0);
    var tc=entries.reduce(function(s,e){ return s+(e.v.price*e.v.qty); },0);
    var ce=document.getElementById('owhl-cart-count');
    var te=document.getElementById('owhl-cart-total');
    if(ce) ce.textContent=tq+' item'+(tq!==1?'s':'');
    if(te) te.textContent=fmt(tc);
    var ie=document.getElementById('owhl-cart-items');
    var ee=document.getElementById('owhl-cart-empty');
    var fe=document.getElementById('owhl-cart-foot');
    if(!entries.length){
      if(ee) ee.style.display='';
      if(ie) ie.innerHTML='';
      if(fe) fe.style.display='none';
      return;
    }
    if(ee) ee.style.display='none';
    if(fe) fe.style.display='';
    if(ie){
      ie.innerHTML=entries.map(function(e){
        var it=e.v,k=e.k,lb=it.name+(it.variantTitle?' — '+it.variantTitle:'');
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
    var ie=document.getElementById('owhl-cart-items');
    if(!ie||ie._wired) return;
    ie._wired=true;
    ie.addEventListener('click',function(e){
      var item=e.target.closest('[data-key]');
      if(!item) return;
      var k=item.getAttribute('data-key');
      var crole=e.target.getAttribute('data-crole');
      if(crole==='rm'){ delete cart[k]; renderCart(); }
      else if(crole==='cdec'){ if(cart[k]){ cart[k].qty=Math.max(3,cart[k].qty-1); renderCart(); } }
      else if(crole==='cinc'){ if(cart[k]){ cart[k].qty+=1; renderCart(); } }
    });
  }

  /* ── submit order ── */
  window.owhlSubmitOrder=function(){
    var items=Object.values(cart);
    if(!items.length){ alert('Please add items to your order first.'); return; }
    var note=(document.getElementById('owhl-order-note')||{}).value||'';
    var total=items.reduce(function(s,it){ return s+(it.price*it.qty); },0);
    var btn=document.querySelector('.owhl-cart-submit-btn');
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
    var m=document.createElement('div'); m.className='owhl-success-overlay';
    m.innerHTML='<div class="owhl-success-box">' +
      '<div class="owhl-success-tick">✓<\/div>' +
      '<p class="owhl-success-eye">Order Received<\/p>' +
      '<h2 class="owhl-success-ttl">Thank You<\/h2>' +
      '<p class="owhl-success-msg">Your order request is being reviewed by our supply team. An invoice will be sent to your registered email with confirmed stock availability and payment instructions.<br><br><strong>OlivHairSupply Wholesale Team<\/strong><\/p>' +
      '<button class="owhl-success-cta" id="owhl-success-close">Close<\/button>' +
    '<\/div>';
    document.body.appendChild(m);
    document.getElementById('owhl-success-close').addEventListener('click',function(){ m.remove(); });
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',initShop);
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
  function maybeOpenApply(){
    if(window.location.search.indexOf('apply=1')!==-1){
      var o=document.getElementById('owhl-apply-overlay');
      if(o){ o.classList.add('open'); document.body.style.overflow='hidden'; }
    }
  }
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',maybeOpenApply);
  } else { maybeOpenApply(); }
})();
<\/script>`;

  return <ShopifyClonePage page="wholesale" injectBeforeClose={loginScript} />;
}
