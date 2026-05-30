/* OlivHairSupply — Language + Currency Switcher
   EN (default) / DE language toggle + EUR/GBP/USD currency.     */
(function () {
  'use strict';

  // ── GERMAN TRANSLATIONS (topbar + nav only for now) ─────────────────────────
  var DE = {
    // Topbar
    'Worldwide Shipping — Free Over €200':          'Weltweiter Versand – Kostenlos ab 200 €',
    'Luxury Hair. Premium Quality. Designed for You.': 'Luxuriöses Haar. Höchste Qualität. Für dich geschaffen.',
    'Become an Affiliate →':                        'Affiliate-Partner werden →',

    // Primary nav (desktop + mobile)
    'Home':       'Startseite',
    'About':      'Über uns',
    'Shop':       'Shop',
    'Wholesale':  'Großhandel',
    'Training':   'Schulungen',
    'Appointment':'Termin buchen',
    'Services':   'Services',
    'Affiliate':  'Affiliate',
    'Rentals':    'Clips Verleih',

    // Mobile drawer
    'Language &amp; Currency': 'Sprache &amp; Währung',

    // Footer tagline
    'Luxury Hair. Premium Quality. Every Strand Designed Just For You.': 'Luxuriöses Haar. Premium-Qualität. Jede Strähne für dich perfektioniert.',

    // Footer section headings
    'More':  'Mehr',
    'MORE':  'Mehr',
    'Help':  'Hilfe',
    'HELP':  'Hilfe',
    'About': 'Über Uns',
    'ABOUT': 'Über Uns',
    'Stay Connected': 'Bleib verbunden',
    'STAY CONNECTED': 'Bleib verbunden',

    // Footer links — More column
    'Training':            'Schulungen',
    'Journal':             'Magazin',
    'Services':            'Services',
    'Wholesale':           'Großhandel',
    'Affiliate Programme': 'Affiliate Program',

    // Footer links — About column
    'Our Story':           'Unsere Geschichte',
    'Careers':             'Karriere',
    'Press':               'Presse',
    'Sustainability':      'Nachhaltigkeit',
    'Social Responsibility': 'Soziale Verantwortung',

    // Footer links — Help column
    'FAQ':          'FAQ',
    'Shipping':     'Versand',
    'Returns':      'Rücksendungen',
    'Track Order':  'Bestellung verfolgen',
    'Contact Us':   'Kontakt',

    // Footer newsletter
    'Stay connected with OlivHairSupply Club.':   'Bleib immer auf dem Laufenden mit dem OlivHairSupply Club.',
    'Stay connected with Olivhairsupply Club.':   'Bleib immer auf dem Laufenden mit dem OlivHairSupply Club.',
  };

  // ── CURRENCY CONFIG ──────────────────────────────────────────────────────────
  var CURRENCIES = {
    EUR: { symbol: '€', rate: 1 },
    GBP: { symbol: '£', rate: 0.86 },
    USD: { symbol: '$', rate: 1.09 }
  };

  // ── STORAGE ──────────────────────────────────────────────────────────────────
  function getLang()     { return localStorage.getItem('ohs-lang')     || 'en'; }
  function getCurrency() { return localStorage.getItem('ohs-currency') || 'EUR'; }

  // ── REMOVE SPANISH FROM SELECTORS ────────────────────────────────────────────
  function removeSpanish() {
    document.querySelectorAll('select[name="locale_code"] option[value="es"]').forEach(function (o) {
      o.parentNode.removeChild(o);
    });
  }

  // ── LANGUAGE ─────────────────────────────────────────────────────────────────
  // Walk text nodes and replace EN → DE (or restore DE → EN).
  // Works on leaf text nodes only; ignores script/style.
  var SKIP = { SCRIPT:1, STYLE:1, NOSCRIPT:1, TEXTAREA:1 };

  function translateNode(node, dict) {
    if (node.nodeType === 3) {
      var v = node.nodeValue;
      if (!v || !v.trim()) return;
      for (var k in dict) {
        if (v.indexOf(k) !== -1) v = v.split(k).join(dict[k]);
      }
      if (v !== node.nodeValue) node.nodeValue = v;
    } else if (node.nodeType === 1 && !SKIP[node.tagName]) {
      for (var c = node.firstChild; c; c = c.nextSibling) translateNode(c, dict);
    }
  }

  // Build reverse dict for EN restoration
  function reverseDict(dict) {
    var r = {};
    for (var k in dict) r[dict[k]] = k;
    return r;
  }

  function applyLanguage(lang) {
    // Guard: if already at this lang, skip (prevents double-apply in React StrictMode)
    if (document.body.dataset.ohsLang === lang) return;
    // Revert to EN first if switching from DE to EN
    if (lang === 'en' && document.body.dataset.ohsLang === 'de') {
      translateNode(document.body, reverseDict(DE));
    } else if (lang === 'de') {
      translateNode(document.body, DE);
    }
    document.body.dataset.ohsLang = lang;

    // Sync all locale selectors
    document.querySelectorAll('select[name="locale_code"]').forEach(function (s) {
      s.value = lang;
    });

    localStorage.setItem('ohs-lang', lang);
  }

  function bindLangSelectors() {
    document.querySelectorAll('select[name="locale_code"]').forEach(function (sel) {
      sel.addEventListener('change', function (e) {
        e.preventDefault();
        var lang = sel.value === 'de' ? 'de' : 'en';
        // Sync all selectors first
        document.querySelectorAll('select[name="locale_code"]').forEach(function (s) { s.value = lang; });
        applyLanguage(lang);
      });
      // Prevent form submission — handle client-side only
      if (sel.form) {
        sel.form.addEventListener('submit', function (e) { e.preventDefault(); });
      }
    });
  }

  // ── CURRENCY ──────────────────────────────────────────────────────────────────
  function storePrices() {
    var walker = document.createTreeWalker(document.body, 4);
    var node;
    while ((node = walker.nextNode())) {
      var p = node.parentElement;
      if (!p || SKIP[p.tagName]) continue;
      if (!node.nodeValue || node.nodeValue.indexOf('€') === -1) continue;
      if (!p.dataset.eurText) p.dataset.eurText = p.innerHTML;
    }
  }

  function applyPrices() {
    var code = getCurrency();
    var cfg  = CURRENCIES[code] || CURRENCIES.EUR;
    document.querySelectorAll('[data-eur-text]').forEach(function (el) {
      el.innerHTML = el.dataset.eurText.replace(/€\s*([\d,]+(?:\.\d{1,2})?)/g, function (_, n) {
        var eur = parseFloat(n.replace(/,/g, ''));
        var val = eur * cfg.rate;
        return cfg.symbol + (val % 1 === 0 ? val.toFixed(0) : val.toFixed(2));
      });
    });
    var selVal = code === 'GBP' ? 'GB' : code === 'USD' ? 'US' : 'DE';
    document.querySelectorAll('select[name="country_code"]').forEach(function (s) { s.value = selVal; });
  }

  function bindCurrencySelectors() {
    document.querySelectorAll('select[name="country_code"]').forEach(function (sel) {
      sel.addEventListener('change', function (e) {
        e.preventDefault();
        var val  = sel.value;
        var code = val === 'GB' ? 'GBP' : val === 'US' ? 'USD' : 'EUR';
        localStorage.setItem('ohs-currency', code);
        document.querySelectorAll('select[name="country_code"]').forEach(function (s) { s.value = val; });
        applyPrices();
      });
      if (sel.form) {
        sel.form.addEventListener('submit', function (e) { e.preventDefault(); });
      }
    });
  }

  // ── INIT ──────────────────────────────────────────────────────────────────────
  function init() {
    removeSpanish();
    // Apply saved language (only translate if DE — default is EN/English)
    var lang = getLang();
    if (lang === 'de') applyLanguage('de');
    else {
      document.querySelectorAll('select[name="locale_code"]').forEach(function (s) { s.value = 'en'; });
    }
    bindLangSelectors();
    storePrices();
    applyPrices();
    bindCurrencySelectors();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
