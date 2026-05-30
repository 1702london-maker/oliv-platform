/* OlivHairSupply — Currency Switcher
   Translation is handled server-side. This script only handles
   EUR / GBP / USD switching client-side via localStorage.        */
(function () {
  'use strict';

  var CURRENCIES = {
    EUR: { symbol: '€', rate: 1 },
    GBP: { symbol: '£', rate: 0.86 },
    USD: { symbol: '$', rate: 1.09 }
  };

  function getCurrency() {
    return localStorage.getItem('ohs-currency') || 'EUR';
  }

  // Store original EUR text on every price-containing element (once)
  function storePrices() {
    var walker = document.createTreeWalker(document.body, 4);
    var node;
    while ((node = walker.nextNode())) {
      var p = node.parentElement;
      if (!p || p.tagName === 'SCRIPT' || p.tagName === 'STYLE') continue;
      if (!node.nodeValue || node.nodeValue.indexOf('€') === -1) continue;
      if (!p.dataset.eurText) {
        p.dataset.eurText = p.innerHTML;
      }
    }
  }

  function applyPrices() {
    var code = getCurrency();
    var cfg  = CURRENCIES[code] || CURRENCIES.EUR;
    var els  = document.querySelectorAll('[data-eur-text]');
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      var orig = el.dataset.eurText;
      var result = orig.replace(/€\s*([\d,]+(?:\.\d{1,2})?)/g, function (_, num) {
        var eur = parseFloat(num.replace(/,/g, ''));
        var val = eur * cfg.rate;
        return cfg.symbol + (val % 1 === 0 ? val.toFixed(0) : val.toFixed(2));
      });
      el.innerHTML = result;
    }
    // Sync selectors
    var selectorVal = code === 'GBP' ? 'GB' : code === 'USD' ? 'US' : 'DE';
    document.querySelectorAll('select[name="country_code"]').forEach(function (s) {
      s.value = selectorVal;
    });
  }

  function bindSelectors() {
    document.querySelectorAll('select[name="country_code"]').forEach(function (sel) {
      sel.addEventListener('change', function () {
        var val  = sel.value;
        var code = val === 'GB' ? 'GBP' : val === 'US' ? 'USD' : 'EUR';
        localStorage.setItem('ohs-currency', code);
        document.querySelectorAll('select[name="country_code"]').forEach(function (s) { s.value = val; });
        applyPrices();
      });
      if (sel.form) {
        sel.form.addEventListener('submit', function (e) {
          if ((e.target as HTMLFormElement).id && (e.target as HTMLFormElement).id.indexOf('locale') !== -1) e.preventDefault();
        });
      }
    });
  }

  function init() {
    storePrices();
    applyPrices();
    bindSelectors();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
