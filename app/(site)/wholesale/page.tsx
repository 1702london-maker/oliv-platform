import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getWholesaleSession } from "@/lib/auth/wholesale-session";
import { getCatalogProducts } from "@/lib/catalog/products";
import { ShopifyClonePage } from "@/components/ShopifyClonePage";

const WHOLESALE_CATEGORIES = [
  { slug: "biziluxe-extensions",    label: "BiziLuxe Extensions" },
  { slug: "bizihair-extensions",    label: "Bizihair Extensions" },
  { slug: "biziluxe-accessoires",   label: "Accessoires" },
  { slug: "profi-friseurbedarf",    label: "Professional" },
  { slug: "biziluxe-stylinggeraete", label: "Styling Tools" },
  { slug: "buersten-und-kaemme",    label: "Brushes & Combs" },
];

function safeJson(obj: unknown): string {
  return JSON.stringify(obj)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}

export default async function WholesalePage() {
  const session = await getWholesaleSession();

  if (session) {
    const admin = createSupabaseAdminClient();
    const { data: account } = await admin
      .from("wholesale_accounts")
      .select("business_name,tier,lifetime_spend_cents")
      .eq("id", session.id)
      .maybeSingle();

    const businessName = (account?.business_name ?? session.business_name ?? "Wholesale Partner") as string;
    const tier = (account?.tier ?? "Verified") as string;

    // Fetch all products from the platform catalog (same source as retail shop)
    const rawProducts = await getCatalogProducts();

    // Tag each product with its category (from image_url path) + apply 15% wholesale pricing
    const products = rawProducts.map(p => {
      const match = p.image_url?.match(/\/products\/([^/]+)\//);
      const categorySlug = match?.[1] ?? "other";
      return {
        id: p.id,
        title: p.title,
        image_url: p.image_url ?? null,
        categorySlug,
        variants: p.variants.map(v => ({
          id: v.id,
          title: v.title === "Default Title" ? "Standard" : v.title,
          sku: v.sku ?? null,
          retail_price_cents: v.retail_price_cents,
          wholesale_price_cents: Math.round(v.retail_price_cents * 0.85),
        })),
      };
    });

    const script = `<script>
(function(){
  var BIZ     = ${safeJson(businessName)};
  var TIER    = ${safeJson(tier)};
  var PRODS   = ${safeJson(products)};
  var CATS    = ${safeJson(WHOLESALE_CATEGORIES)};
  var cart    = {};
  var filter  = 'all';

  /* ── helpers ── */
  function fmt(cents){
    return '€' + (cents/100).toFixed(2).replace('.',',');
  }
  function esc(s){
    return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  /* ── boot ── */
  function boot(){
    /* dashboard open */
    var overlay = document.getElementById('owhl-login-overlay');
    if(overlay){ overlay.classList.add('open'); document.body.style.overflow='hidden'; }
    var lp = document.getElementById('owhl-login-panel');
    if(lp) lp.style.display='none';
    var dp = document.getElementById('owhl-dash-panel');
    if(dp) dp.classList.add('visible');

    /* business name + tier */
    var nm = document.getElementById('owhl-name-display');
    if(nm) nm.textContent = BIZ;
    var sv = document.querySelectorAll('.owhl-dash-stat-val');
    if(sv[3]) sv[3].textContent = TIER;

    /* logout */
    window.owhlLogout = function(){
      fetch('/api/wholesale/logout',{method:'POST'})
        .then(function(){ window.location.href='/wholesale'; });
    };

    /* CSS overrides — smaller cards, 3-col grid */
    var s = document.createElement('style');
    s.textContent =
      '.owhl-product-grid{grid-template-columns:repeat(3,1fr)!important;gap:8px!important;}' +
      '.owhl-product-card{padding:10px!important;}' +
      '.owhl-product-thumb{margin-bottom:8px!important;overflow:hidden;}' +
      '.owhl-product-thumb img{width:100%;height:100%;object-fit:cover;display:block;}' +
      '.owhl-product-name{font-size:14px!important;margin-bottom:1px!important;}' +
      '.owhl-product-sku{font-size:8px!important;margin-bottom:6px!important;}' +
      '.owhl-product-prices{margin-bottom:7px!important;}' +
      '.owhl-product-price{font-size:13px!important;}' +
      '.owhl-product-rrp{font-size:11px!important;}' +
      '.owhl-product-saving{font-size:9px!important;}' +
      '.owhl-qty-btn{width:26px!important;height:30px!important;font-size:14px!important;}' +
      '.owhl-qty-input{width:30px!important;height:30px!important;font-size:12px!important;}' +
      '.owhl-add-btn{font-size:9px!important;height:30px!important;letter-spacing:1px!important;}' +
      '.owhl-variant-select{width:100%;border:1px solid #E3D6C5;background:#FFFDFB;padding:5px 7px;' +
        'font-family:Montserrat,sans-serif;font-size:10px;color:#2B2620;margin-bottom:7px;outline:none;cursor:pointer;border-radius:0;}' +
      '.owhl-whl-empty{grid-column:1/-1;padding:36px 20px;text-align:center;border:1px dashed #E3D6C5;' +
        'font-family:Montserrat,sans-serif;font-size:11px;color:#A0907E;letter-spacing:1.5px;text-transform:uppercase;}' +
      '.owhl-success-overlay{position:fixed;inset:0;background:rgba(43,38,32,.88);display:flex;align-items:center;' +
        'justify-content:center;z-index:999999;padding:24px;}' +
      '.owhl-success-box{background:#FFFDFB;border:1px solid #E3D6C5;max-width:500px;width:100%;padding:52px 44px;text-align:center;}' +
      '.owhl-success-tick{width:46px;height:46px;background:#B68A45;border-radius:50%;display:flex;align-items:center;' +
        'justify-content:center;margin:0 auto 22px;font-size:20px;color:#fff;}' +
      '.owhl-success-eye{font-family:Montserrat,sans-serif;font-size:9px;font-weight:700;letter-spacing:3px;' +
        'text-transform:uppercase;color:#B68A45;margin-bottom:12px;}' +
      '.owhl-success-ttl{font-family:"Cormorant Garamond",Georgia,serif;font-size:30px;font-weight:300;' +
        'color:#2B2620;margin-bottom:18px;line-height:1.2;}' +
      '.owhl-success-msg{font-family:Montserrat,sans-serif;font-size:12px;color:#6B5C4E;line-height:1.85;margin-bottom:28px;}' +
      '.owhl-success-cta{background:#2B2620;color:#F6F1E8;border:none;padding:13px 30px;' +
        'font-family:Montserrat,sans-serif;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;cursor:pointer;}' +
      '@media(max-width:900px){.owhl-product-grid{grid-template-columns:repeat(2,1fr)!important;}}' +
      '@media(max-width:540px){.owhl-product-grid{grid-template-columns:1fr!important;}}';
    document.head.appendChild(s);

    buildFilters();
    renderGrid('all');
  }

  /* ── filter buttons ── */
  function buildFilters(){
    var row = document.querySelector('.owhl-filter-row');
    if(!row) return;
    var allBtn = '<button class="owhl-filter-btn active" onclick="owhlFilter(\'all\',this)">All</button>';
    var catBtns = CATS.map(function(c){
      return '<button class="owhl-filter-btn" onclick="owhlFilter(\''+esc(c.slug)+'\',this)">'+esc(c.label)+'</button>';
    }).join('');
    row.innerHTML = allBtn + catBtns;
  }

  window.owhlFilter = function(slug, btn){
    filter = slug;
    document.querySelectorAll('.owhl-filter-btn').forEach(function(b){ b.classList.remove('active'); });
    btn.classList.add('active');
    renderGrid(slug);
  };

  /* ── product grid ── */
  function renderGrid(slug){
    var grid = document.getElementById('owhl-product-grid');
    if(!grid) return;
    var list = slug === 'all' ? PRODS : PRODS.filter(function(p){ return p.categorySlug === slug; });
    if(!list.length){
      grid.innerHTML = '<div class="owhl-whl-empty">Coming Soon — Products for this collection are being added</div>';
      return;
    }
    grid.innerHTML = list.map(function(p){ return buildCard(p); }).join('');
  }

  function buildCard(p){
    var v0 = p.variants[0];
    var multi = p.variants.length > 1 && !(p.variants.length===1 && v0.title==='Standard');
    var savePct = Math.round((1 - v0.wholesale_price_cents/v0.retail_price_cents)*100);
    var imgHtml = p.image_url
      ? '<img src="'+esc(p.image_url)+'" alt="'+esc(p.title)+'" loading="lazy">'
      : '<span style="font-family:Montserrat,sans-serif;font-size:8px;color:#A0907E;letter-spacing:2px;text-transform:uppercase;">'+esc(p.title.substring(0,4))+'</span>';

    var varSel = '';
    if(multi){
      varSel = '<select class="owhl-variant-select" id="vsel-'+esc(p.id)+'" onchange="owhlVarChange(\''+esc(p.id)+'\')">';
      p.variants.forEach(function(v){
        varSel += '<option value="'+esc(v.id)+'" data-w="'+v.wholesale_price_cents+'" data-r="'+v.retail_price_cents+'" data-sku="'+esc(v.sku||'')+'">';
        varSel += esc(v.title)+'</option>';
      });
      varSel += '</select>';
    }

    return '<div class="owhl-product-card" data-pid="'+esc(p.id)+'">' +
      '<div class="owhl-product-thumb">'+imgHtml+'</div>' +
      '<div class="owhl-product-name">'+esc(p.title)+'</div>' +
      '<span class="owhl-product-sku" id="psku-'+esc(p.id)+'">'+esc(v0.sku||p.id)+'</span>' +
      varSel +
      '<div class="owhl-product-prices">' +
        '<span class="owhl-product-price" id="pwhl-'+esc(p.id)+'">'+fmt(v0.wholesale_price_cents)+'</span>' +
        '<span class="owhl-product-rrp" id="prrp-'+esc(p.id)+'">'+fmt(v0.retail_price_cents)+'</span>' +
        '<span class="owhl-product-saving" id="psav-'+esc(p.id)+'">Save '+savePct+'%</span>' +
      '</div>' +
      '<div class="owhl-product-actions">' +
        '<div class="owhl-qty-wrap">' +
          '<button class="owhl-qty-btn" onclick="owhlQty(\''+esc(p.id)+'\',-1)">&#8722;</button>' +
          '<input class="owhl-qty-input" id="pqty-'+esc(p.id)+'" type="number" value="3" min="3" readonly>' +
          '<button class="owhl-qty-btn" onclick="owhlQty(\''+esc(p.id)+'\',1)">+</button>' +
        '</div>' +
        '<button class="owhl-add-btn" id="padd-'+esc(p.id)+'" onclick="owhlAdd(\''+esc(p.id)+'\')">Add to Order</button>' +
      '</div>' +
    '</div>';
  }

  /* ── variant change ── */
  window.owhlVarChange = function(pid){
    var sel = document.getElementById('vsel-'+pid);
    if(!sel) return;
    var opt = sel.options[sel.selectedIndex];
    var w = parseInt(opt.getAttribute('data-w'));
    var r = parseInt(opt.getAttribute('data-r'));
    var sku = opt.getAttribute('data-sku');
    var savePct = Math.round((1-w/r)*100);
    var pw=document.getElementById('pwhl-'+pid), pr=document.getElementById('prrp-'+pid),
        ps=document.getElementById('psav-'+pid), psk=document.getElementById('psku-'+pid),
        pq=document.getElementById('pqty-'+pid);
    if(pw) pw.textContent=fmt(w);
    if(pr) pr.textContent=fmt(r);
    if(ps) ps.textContent='Save '+savePct+'%';
    if(psk && sku) psk.textContent=sku;
    if(pq) pq.value='3'; /* reset to minimum on variant change */
  };

  /* ── qty controls ── */
  window.owhlQty = function(pid, delta){
    var el = document.getElementById('pqty-'+pid);
    if(!el) return;
    el.value = Math.max(3, (parseInt(el.value)||3) + delta);
  };

  /* ── add to cart ── */
  window.owhlAdd = function(pid){
    var prod = PRODS.find(function(p){ return p.id===pid; });
    if(!prod) return;

    var sel = document.getElementById('vsel-'+pid);
    var vid = sel ? sel.value : prod.variants[0].id;
    var variant = prod.variants.find(function(v){ return v.id===vid; })||prod.variants[0];

    var qtyEl = document.getElementById('pqty-'+pid);
    var qty = Math.max(3, parseInt(qtyEl ? qtyEl.value : '3')||3);
    var key = pid+':'+vid;

    if(cart[key]){ cart[key].qty += qty; }
    else {
      cart[key] = {
        productId: pid,
        variantId: vid,
        name: prod.title,
        variantTitle: (variant.title==='Standard'?'':variant.title)||'',
        sku: variant.sku||pid,
        price: variant.wholesale_price_cents,
        qty: qty
      };
    }

    /* feedback */
    var btn = document.getElementById('padd-'+pid);
    if(btn){ btn.textContent='Added ✓'; btn.classList.add('added');
      setTimeout(function(){ btn.textContent='Add to Order'; btn.classList.remove('added'); },1400); }

    renderCart();
  };

  /* ── cart render ── */
  function renderCart(){
    var itemsEl  = document.getElementById('owhl-cart-items');
    var emptyEl  = document.getElementById('owhl-cart-empty');
    var footEl   = document.getElementById('owhl-cart-foot');
    var countEl  = document.getElementById('owhl-cart-count');
    var totalEl  = document.getElementById('owhl-cart-total');

    var entries = Object.keys(cart).map(function(k){ return {k:k,v:cart[k]}; });
    var totalQty   = entries.reduce(function(s,e){ return s+e.v.qty; },0);
    var totalCents = entries.reduce(function(s,e){ return s+(e.v.price*e.v.qty); },0);

    if(countEl) countEl.textContent = totalQty+' item'+(totalQty!==1?'s':'');
    if(totalEl) totalEl.textContent = fmt(totalCents);

    if(!entries.length){
      if(emptyEl){ emptyEl.style.display=''; }
      if(itemsEl){ itemsEl.innerHTML=''; }
      if(footEl){ footEl.style.display='none'; }
      return;
    }

    if(emptyEl){ emptyEl.style.display='none'; }
    if(footEl){ footEl.style.display=''; }

    if(itemsEl){
      itemsEl.innerHTML = entries.map(function(e){
        var it=e.v, k=e.k;
        var label = it.name + (it.variantTitle ? ' — '+it.variantTitle : '');
        return '<div class="owhl-cart-item">' +
          '<div class="owhl-cart-item-row1">' +
            '<div>' +
              '<div class="owhl-cart-item-name">'+esc(label)+'</div>' +
              '<span class="owhl-cart-item-sku">'+esc(it.sku)+'</span>' +
            '</div>' +
            '<button class="owhl-cart-item-remove" onclick="owhlCartRemove(\''+k+'\')">Remove</button>' +
          '</div>' +
          '<div class="owhl-cart-item-row2">' +
            '<div class="owhl-qty-wrap">' +
              '<button class="owhl-qty-btn" onclick="owhlCartQty(\''+k+'\',-1)">&#8722;</button>' +
              '<input class="owhl-qty-input" type="number" value="'+it.qty+'" min="3" readonly style="pointer-events:none;">' +
              '<button class="owhl-qty-btn" onclick="owhlCartQty(\''+k+'\',1)">+</button>' +
            '</div>' +
            '<span class="owhl-cart-item-total">'+fmt(it.price*it.qty)+'</span>' +
          '</div>' +
        '</div>';
      }).join('');
    }
  }

  window.owhlCartRemove = function(k){ delete cart[k]; renderCart(); };

  window.owhlCartQty = function(k, delta){
    if(!cart[k]) return;
    cart[k].qty = Math.max(3, cart[k].qty+delta);
    renderCart();
  };

  /* ── submit order ── */
  window.owhlSubmitOrder = function(){
    var entries = Object.keys(cart).map(function(k){ return cart[k]; });
    if(!entries.length){
      alert('Please add items to your order first.');
      return;
    }
    var note      = (document.getElementById('owhl-order-note')||{}).value||'';
    var totalCents = entries.reduce(function(s,it){ return s+(it.price*it.qty); },0);
    var btn = document.querySelector('.owhl-cart-submit-btn');
    if(btn){ btn.textContent='Submitting…'; btn.disabled=true; }

    fetch('/api/wholesale/submit-order',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ items:entries, notes:note, total_wholesale_cents:totalCents })
    })
    .then(function(r){ return r.json(); })
    .then(function(d){
      if(d.ok){
        cart={};
        renderCart();
        showSuccess();
      } else {
        alert('Something went wrong. Please try again.');
        if(btn){ btn.textContent='Submit Order Request'; btn.disabled=false; }
      }
    })
    .catch(function(){
      alert('Network error. Please try again.');
      if(btn){ btn.textContent='Submit Order Request'; btn.disabled=false; }
    });
  };

  /* ── success modal ── */
  function showSuccess(){
    var m = document.createElement('div');
    m.className='owhl-success-overlay';
    m.innerHTML =
      '<div class="owhl-success-box">' +
        '<div class="owhl-success-tick">✓</div>' +
        '<p class="owhl-success-eye">Order Received</p>' +
        '<h2 class="owhl-success-ttl">Thank You</h2>' +
        '<p class="owhl-success-msg">Thank you for your wholesale order request.' +
          ' Your order is currently being reviewed by our supply team.' +
          ' An invoice will be sent to your registered email with confirmed' +
          ' stock availability and payment instructions.' +
          '<br><br><strong>OlivHairSupply Wholesale Team</strong></p>' +
        '<button class="owhl-success-cta" onclick="this.closest(\'.owhl-success-overlay\').remove()">Close</button>' +
      '</div>';
    document.body.appendChild(m);
  }

  /* ── run ── */
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded', boot);
  } else { boot(); }
})();
</script>`;

    return <ShopifyClonePage page="wholesale" injectBeforeClose={script} />;
  }

  /* ── public (not logged in) ── */
  const loginScript = `<script>
(function(){
  window.owhlOpenLogin = function(){ window.location.href='/wholesale/login'; };
  window.owhlTryLogin  = function(){ window.location.href='/wholesale/login'; };
})();
</script>`;

  return <ShopifyClonePage page="wholesale" injectBeforeClose={loginScript} />;
}
