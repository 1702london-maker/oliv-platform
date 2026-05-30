/* OlivHairSupply — Global Translation + Currency Engine
   Handles DE translation and EUR/GBP/USD switching across all pages.
   Runs via ShopifyClonePageClient useEffect script injection.      */
(function () {
  'use strict';

  // ─── DEFAULTS ──────────────────────────────────────────────────────────────
  var DEFAULT_LANG     = 'de';
  var DEFAULT_CURRENCY = 'EUR';

  // ─── CURRENCY CONFIG ────────────────────────────────────────────────────────
  var CURRENCIES = {
    EUR: { symbol: '€', rate: 1,    label: 'EUR €' },
    GBP: { symbol: '£', rate: 0.86, label: 'GBP £' },
    USD: { symbol: '$', rate: 1.09, label: 'USD $' }
  };

  // ─── TRANSLATION DICTIONARY (EN → DE) ──────────────────────────────────────
  // Ordered longest-first to avoid partial replacements.
  var DICT = [
    // ── ANNOUNCEMENT BAR ──
    ['WORLDWIDE SHIPPING — FREE OVER €200', 'WELTWEITER VERSAND — KOSTENLOS AB €200'],
    ['Luxury Hair. Premium Quality. Designed for You.', 'Luxushaar. Premium-Qualität. Für Sie kreiert.'],
    ['BECOME AN AFFILIATE →', 'PARTNER WERDEN →'],

    // ── NAVIGATION ──
    ['Open menu', 'Menü öffnen'],
    ['Close menu', 'Menü schließen'],
    ['Affiliate Programme', 'Partnerprogramm'],
    ['Social Responsibility', 'Soziale Verantwortung'],
    ['Track Order', 'Bestellung verfolgen'],
    ['Contact Us', 'Kontakt'],
    ['Our Story', 'Unsere Geschichte'],
    ['Sustainability', 'Nachhaltigkeit'],
    ['Appointments', 'Termine'],
    ['Wholesale', 'Großhandel'],
    ['Training', 'Training'],
    ['Services', 'Leistungen'],
    ['Careers', 'Karriere'],
    ['Journal', 'Journal'],
    ['Rentals', 'Vermietung'],
    ['Account', 'Konto'],
    ['Search', 'Suche'],
    ['Press', 'Presse'],
    ['Shop', 'Shop'],
    ['Cart', 'Warenkorb'],
    ['FAQ', 'FAQ'],

    // ── FOOTER HEADINGS ──
    ['STAY CONNECTED', 'BLEIB IN KONTAKT'],
    ['ABOUT', 'ÜBER UNS'],
    ['MORE', 'MEHR'],
    ['HELP', 'HILFE'],

    // ── FOOTER LINKS / TEXT ──
    ['Stay connected with Olivhairsupply Club.', 'Bleib in Kontakt mit dem Olivhairsupply Club.'],
    ['© 2026 OlivHairSupply. All rights reserved.', '© 2026 OlivHairSupply. Alle Rechte vorbehalten.'],
    ['All rights reserved.', 'Alle Rechte vorbehalten.'],
    ['Privacy Policy', 'Datenschutzerklärung'],
    ['Terms and Conditions', 'AGB'],
    ['Shipping', 'Versand'],
    ['Returns', 'Rücksendungen'],

    // ── TRUST STRIP ──
    ['100% HUMAN HAIR', '100% ECHTHAAR'],
    ['FREE EU SHIPPING OVER €200', 'KOSTENLOSER EU-VERSAND AB €200'],
    ['EXPERT COLOUR MATCHING', 'PROFESSIONELLE FARBBERATUNG'],
    ['WORLDWIDE DELIVERY', 'WELTWEITER VERSAND'],
    ['PREMIUM QUALITY', 'PREMIUM-QUALITÄT'],
    ['ETHICALLY SOURCED', 'ETHISCH BEZOGEN'],

    // ── NEWSLETTER ──
    ['The OlivHairSupply Edit', 'Das OlivHairSupply Edit'],
    ['Join the OlivHairSupply Edit', 'Werde Teil des OlivHairSupply Edits'],
    ['Exclusive drops, expert hair tips, and luxury updates — straight to your inbox.', 'Exklusive Neuheiten, professionelle Haartipps und Luxus-Updates — direkt in Ihr Postfach.'],
    ['No spam. Unsubscribe at any time.', 'Kein Spam. Jederzeit abmelden.'],
    ['Subscribe →', 'Abonnieren →'],
    ['Subscribe', 'Abonnieren'],
    ['Email address', 'E-Mail-Adresse'],
    ['First name', 'Vorname'],

    // ── COMMON BUTTONS ──
    ['Book Appointment', 'Termin buchen'],
    ['Explore Products', 'Produkte entdecken'],
    ['Explore Services', 'Leistungen entdecken'],
    ['Become a Wholesaler', 'Großhändler werden'],
    ['Log Into Wholesale Shop', 'Großhandel-Anmeldung'],
    ['Become an Affiliate', 'Partner werden'],
    ['View All Products', 'Alle Produkte anzeigen'],
    ['View Services', 'Leistungen anzeigen'],
    ['View Collection', 'Kollektion ansehen'],
    ['Return Home', 'Zur Startseite'],
    ['Add to Cart', 'In den Warenkorb'],
    ['Apply Now', 'Jetzt bewerben'],
    ['Learn More', 'Mehr erfahren'],
    ['Read More', 'Mehr lesen'],
    ['Shop Now', 'Jetzt kaufen'],
    ['Get Started', 'Loslegen'],
    ['Contact Us', 'Kontakt aufnehmen'],
    ['Send Message', 'Nachricht senden'],
    ['Submit', 'Absenden'],
    ['Back', 'Zurück'],
    ['Continue', 'Weiter'],

    // ── HOME PAGE HERO + SECTIONS ──
    ['Premium Hair. Expert Installation.', 'Premium-Haar. Professionelle Installation.'],
    ['Shop BiziLux', 'BiziLux kaufen'],
    ['Book a Service', 'Service buchen'],
    ['Our Hair Extensions', 'Unsere Haarverlängerungen'],
    ['Trusted by thousands of clients across Europe.', 'Von Tausenden Kundinnen in ganz Europa vertraut.'],
    ['As seen in', 'Bekannt aus'],
    ['New Arrivals', 'Neuheiten'],
    ['Best Sellers', 'Bestseller'],
    ['Featured Products', 'Ausgewählte Produkte'],
    ['Shop All', 'Alle kaufen'],
    ['Hair Extensions', 'Haarverlängerungen'],
    ['Accessories', 'Accessoires'],
    ['Care Products', 'Pflegeprodukte'],
    ['Why OlivHairSupply?', 'Warum OlivHairSupply?'],
    ['Premium Quality', 'Premium-Qualität'],
    ['Expert Installation', 'Professionelle Installation'],
    ['Colour Matched', 'Farblich abgestimmt'],
    ['Aftercare Support', 'Nachsorge & Support'],

    // ── SHOP / PRODUCTS ──
    ['Add to cart', 'In den Warenkorb'],
    ['Sold out', 'Ausverkauft'],
    ['In stock', 'Auf Lager'],
    ['Out of stock', 'Nicht verfügbar'],
    ['Free shipping', 'Kostenloser Versand'],
    ['Free EU shipping on orders over €200', 'Kostenloser EU-Versand ab €200'],
    ['Length', 'Länge'],
    ['Colour', 'Farbe'],
    ['Weight', 'Gewicht'],
    ['Quantity', 'Menge'],
    ['Save', 'Sparen'],
    ['Sale', 'Angebot'],

    // ── SERVICES PAGE ──
    ['Our Services', 'Unsere Leistungen'],
    ['Services Tailored to You.', 'Leistungen für Sie.'],
    ['Book an Appointment', 'Termin vereinbaren'],
    ['How It Works', 'So funktioniert es'],
    ['What\'s Included', 'Was ist enthalten'],
    ['Pricing', 'Preise'],
    ['Duration', 'Dauer'],
    ['From', 'Ab'],

    // ── APPOINTMENTS ──
    ['Book Your Experience', 'Ihr Erlebnis buchen'],
    ['Appointment', 'Termin'],
    ['Choose Your Location', 'Standort wählen'],
    ['Select Your Service', 'Service auswählen'],
    ['Configure Your Service', 'Service konfigurieren'],
    ['Choose Your Stylist', 'Stylist auswählen'],
    ['Select a Date', 'Datum auswählen'],
    ['Select a Time', 'Zeit auswählen'],
    ['Your Details', 'Ihre Angaben'],
    ['Confirm Your Appointment', 'Termin bestätigen'],
    ['Request Booking', 'Buchung anfragen'],
    ['Review Booking', 'Buchung prüfen'],
    ['Request Received', 'Anfrage erhalten'],
    ['Your appointment request has been received.', 'Ihre Terminanfrage ist eingegangen.'],
    ['Our team will confirm your booking within 24 hours via email or WhatsApp.', 'Unser Team bestätigt Ihre Buchung innerhalb von 24 Stunden per E-Mail oder WhatsApp.'],
    ['This is a booking request.', 'Dies ist eine Buchungsanfrage.'],
    ['No payment is required at this stage.', 'Eine Zahlung ist zu diesem Zeitpunkt nicht erforderlich.'],
    ['Full Name', 'Vollständiger Name'],
    ['Email Address', 'E-Mail-Adresse'],
    ['Phone Number', 'Telefonnummer'],
    ['Additional Notes (optional)', 'Zusätzliche Hinweise (optional)'],
    ['Your full name', 'Ihr vollständiger Name'],
    ['Please select a location to continue.', 'Bitte wählen Sie einen Standort aus.'],
    ['Please select a service to continue.', 'Bitte wählen Sie einen Service aus.'],
    ['Please complete all required selections.', 'Bitte treffen Sie alle erforderlichen Auswahlen.'],
    ['Please select a stylist to continue.', 'Bitte wählen Sie einen Stylisten aus.'],
    ['Please select a date to continue.', 'Bitte wählen Sie ein Datum aus.'],
    ['Please select a time slot to continue.', 'Bitte wählen Sie einen Zeitslot aus.'],
    ['Please complete all required fields correctly.', 'Bitte füllen Sie alle Pflichtfelder korrekt aus.'],
    ['Estimated Total', 'Geschätzter Gesamtbetrag'],
    ['Pricing may vary by location.', 'Preise können je nach Standort variieren.'],
    ['Dates with a gold dot have availability.', 'Daten mit einem goldenen Punkt sind verfügbar.'],
    ['We are open Monday to Saturday.', 'Wir sind Montag bis Samstag geöffnet.'],
    ['All times are Berlin local time', 'Alle Zeiten in Berliner Ortszeit'],
    ['Please arrive 5 minutes before your appointment.', 'Bitte kommen Sie 5 Minuten vor Ihrem Termin.'],
    ['Available times for your selected stylist and date.', 'Verfügbare Zeiten für Ihren gewählten Stylisten und das Datum.'],
    ['Allergies, special requests or anything we should know...', 'Allergien, besondere Wünsche oder alles, was wir wissen sollten...'],
    ['Your Booking', 'Ihre Buchung'],
    ['Summary', 'Zusammenfassung'],
    ['Select a location to begin.', 'Bitte wählen Sie einen Standort um zu beginnen.'],
    ['Location', 'Standort'],
    ['Service', 'Service'],
    ['Stylist', 'Stylist'],
    ['Date', 'Datum'],
    ['Time', 'Uhrzeit'],
    ['Notes', 'Hinweise'],
    ['Options', 'Optionen'],
    ['Name', 'Name'],
    ['Email', 'E-Mail'],
    ['Phone', 'Telefon'],

    // ── WHOLESALE ──
    ['Partner With OlivHairSupply', 'Partner von OlivHairSupply werden'],
    ['Wholesale', 'Großhandel'],
    ['Apply for Wholesale Account', 'Großhandelskonto beantragen'],
    ['Minimum Order', 'Mindestbestellung'],
    ['Wholesale Pricing', 'Großhandelspreise'],
    ['Trade Customers', 'Geschäftskunden'],
    ['Already a member?', 'Bereits Mitglied?'],
    ['Log in', 'Anmelden'],
    ['Apply', 'Bewerben'],

    // ── AFFILIATE ──
    ['Affiliate Programme', 'Partnerprogramm'],
    ['Earn Commission', 'Provision verdienen'],
    ['Commission Rate', 'Provisionssatz'],
    ['Join the Programme', 'Am Programm teilnehmen'],
    ['Your unique referral link', 'Ihr persönlicher Empfehlungslink'],
    ['Apply to Affiliate Programme', 'Für das Partnerprogramm bewerben'],

    // ── TRAINING ──
    ['Hair Training', 'Haartraining'],
    ['Professional Training', 'Professionelles Training'],
    ['Course Duration', 'Kursdauer'],
    ['Certificate', 'Zertifikat'],
    ['Book Your Training', 'Training buchen'],
    ['What You\'ll Learn', 'Was Sie lernen werden'],
    ['Who Is This For?', 'Für wen ist das?'],

    // ── ABOUT ──
    ['About Us', 'Über uns'],
    ['Our Mission', 'Unsere Mission'],
    ['Our Vision', 'Unsere Vision'],
    ['Our Team', 'Unser Team'],
    ['Founded in', 'Gegründet'],
    ['Based in Berlin', 'Mit Sitz in Berlin'],

    // ── CONTACT ──
    ['Get In Touch', 'Kontakt aufnehmen'],
    ['Send us a message', 'Schreiben Sie uns'],
    ['Your message', 'Ihre Nachricht'],
    ['Subject', 'Betreff'],
    ['Message', 'Nachricht'],
    ['Opening Hours', 'Öffnungszeiten'],
    ['Monday', 'Montag'],
    ['Tuesday', 'Dienstag'],
    ['Wednesday', 'Mittwoch'],
    ['Thursday', 'Donnerstag'],
    ['Friday', 'Freitag'],
    ['Saturday', 'Samstag'],
    ['Sunday', 'Sonntag'],
    ['Closed', 'Geschlossen'],

    // ── FAQ ──
    ['Frequently Asked Questions', 'Häufig gestellte Fragen'],
    ['How long does installation take?', 'Wie lange dauert die Installation?'],
    ['How do I care for my extensions?', 'Wie pflege ich meine Extensions?'],
    ['Can I colour my extensions?', 'Kann ich meine Extensions färben?'],
    ['How long do extensions last?', 'Wie lange halten Extensions?'],

    // ── SHIPPING / RETURNS ──
    ['Shipping & Delivery', 'Versand & Lieferung'],
    ['Standard Delivery', 'Standardlieferung'],
    ['Express Delivery', 'Expresslieferung'],
    ['Free Shipping', 'Kostenloser Versand'],
    ['Delivery Time', 'Lieferzeit'],
    ['Business Days', 'Werktage'],
    ['Return Policy', 'Rückgaberichtlinie'],
    ['How to Return', 'So retournieren Sie'],
    ['Refund', 'Rückerstattung'],
    ['Exchange', 'Umtausch'],

    // ── JOURNAL ──
    ['Latest Articles', 'Neueste Artikel'],
    ['Read article', 'Artikel lesen'],
    ['Hair Tips', 'Haartipps'],
    ['Style Inspiration', 'Style-Inspiration'],
    ['Care Guide', 'Pflegeguide'],
    ['min read', 'Min. Lesezeit'],

    // ── CAREERS ──
    ['Join Our Team', 'Unser Team verstärken'],
    ['Open Positions', 'Offene Stellen'],
    ['Apply Now', 'Jetzt bewerben'],
    ['Full Time', 'Vollzeit'],
    ['Part Time', 'Teilzeit'],

    // ── RENTALS ──
    ['Hair Rentals', 'Haarvermietung'],
    ['Rental Period', 'Mietdauer'],
    ['Per Day', 'Pro Tag'],
    ['Per Week', 'Pro Woche'],
    ['Availability', 'Verfügbarkeit'],

    // ── COMMON LABELS ──
    ['Loading...', 'Wird geladen...'],
    ['Error', 'Fehler'],
    ['Success', 'Erfolgreich'],
    ['Required', 'Pflichtfeld'],
    ['Optional', 'Optional'],
    ['Select...', 'Bitte wählen...'],
    ['Yes', 'Ja'],
    ['No', 'Nein'],
    ['Close', 'Schließen'],
    ['Open', 'Öffnen'],
    ['Save', 'Speichern'],
    ['Cancel', 'Abbrechen'],
    ['Confirm', 'Bestätigen'],
    ['Edit', 'Bearbeiten'],
    ['Delete', 'Löschen'],
    ['Next', 'Weiter'],
    ['Previous', 'Zurück'],
    ['Step', 'Schritt'],
    ['of', 'von'],
    ['Total', 'Gesamt'],
    ['Subtotal', 'Zwischensumme'],
    ['Tax', 'MwSt.'],
    ['Free', 'Kostenlos'],
    ['per', 'pro'],
    ['or', 'oder'],
    ['and', 'und'],
  ];

  // ─── CURRENCY STORAGE ────────────────────────────────────────────────────────
  function getCurrency() {
    return localStorage.getItem('ohs-currency') || DEFAULT_CURRENCY;
  }
  function setCurrency(code) {
    localStorage.setItem('ohs-currency', code);
  }

  // ─── TRANSLATE DOM ────────────────────────────────────────────────────────────
  // Walk text nodes and apply dictionary replacements.
  // Skip script, style, noscript tags.
  var SKIP_TAGS = { SCRIPT: 1, STYLE: 1, NOSCRIPT: 1, TEXTAREA: 1, INPUT: 1, SELECT: 1 };

  function translateNode(node) {
    if (node.nodeType === 3) { // TEXT_NODE
      var val = node.nodeValue;
      if (!val || !val.trim()) return;
      for (var i = 0; i < DICT.length; i++) {
        var en = DICT[i][0], de = DICT[i][1];
        if (val.indexOf(en) !== -1) {
          val = val.split(en).join(de);
        }
      }
      if (val !== node.nodeValue) node.nodeValue = val;
    } else if (node.nodeType === 1 && !SKIP_TAGS[node.tagName]) {
      // Also translate placeholder and aria-label attributes
      if (node.placeholder) {
        for (var j = 0; j < DICT.length; j++) {
          if (node.placeholder.indexOf(DICT[j][0]) !== -1) {
            node.placeholder = node.placeholder.split(DICT[j][0]).join(DICT[j][1]);
          }
        }
      }
      if (node.title) {
        for (var k = 0; k < DICT.length; k++) {
          if (node.title.indexOf(DICT[k][0]) !== -1) {
            node.title = node.title.split(DICT[k][0]).join(DICT[k][1]);
          }
        }
      }
      for (var c = node.firstChild; c; c = c.nextSibling) {
        translateNode(c);
      }
    }
  }

  function translatePage() {
    translateNode(document.body);
  }

  // ─── CURRENCY CONVERSION ──────────────────────────────────────────────────────
  // Store original EUR prices on first run using data-eur attribute.
  function storePrices() {
    // Match text nodes containing € prices
    var walker = document.createTreeWalker(document.body, 4 /* NodeFilter.SHOW_TEXT */);
    var node;
    while ((node = walker.nextNode())) {
      if (!node.parentElement || SKIP_TAGS[node.parentElement.tagName]) continue;
      var text = node.nodeValue;
      if (!text || text.indexOf('€') === -1) continue;
      // Mark the parent element if not already marked
      var parent = node.parentElement;
      if (!parent.dataset.eurStored) {
        parent.dataset.eurStored = '1';
        parent.dataset.eurText = parent.innerHTML;
      }
    }
  }

  function applyPrices() {
    var code  = getCurrency();
    var cfg   = CURRENCIES[code] || CURRENCIES.EUR;
    var rate  = cfg.rate;
    var sym   = cfg.symbol;

    // Find all elements that had EUR prices stored
    var els = document.querySelectorAll('[data-eur-text]');
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      var original = el.dataset.eurText;
      // Replace €X.XX or €X patterns with converted value
      var converted = original.replace(/€\s*([\d,]+(?:\.\d{1,2})?)/g, function (_, num) {
        var eur = parseFloat(num.replace(/,/g, ''));
        var val = eur * rate;
        // Format: no decimal for round numbers, 2dp otherwise
        var formatted = val % 1 === 0 ? val.toFixed(0) : val.toFixed(2);
        return sym + formatted;
      });
      el.innerHTML = converted;
    }

    // Update the currency selector displays
    var sels = document.querySelectorAll('select[name="country_code"]');
    for (var s = 0; s < sels.length; s++) {
      sels[s].value = code === 'EUR' ? 'DE' : code === 'GBP' ? 'GB' : 'US';
    }
  }

  // Intercept the currency select form submission — handle client-side
  function bindCurrencySelectors() {
    var sels = document.querySelectorAll('select[name="country_code"]');
    for (var i = 0; i < sels.length; i++) {
      (function (sel) {
        sel.addEventListener('change', function (e) {
          e.preventDefault();
          var val = sel.value;
          var code = val === 'GB' ? 'GBP' : val === 'US' ? 'USD' : 'EUR';
          setCurrency(code);
          // Sync all selectors
          var all = document.querySelectorAll('select[name="country_code"]');
          for (var j = 0; j < all.length; j++) all[j].value = val;
          applyPrices();
        });
        // Prevent the parent form from submitting
        if (sel.form) {
          sel.form.addEventListener('submit', function (e) {
            if (e.target.id && e.target.id.indexOf('locale') !== -1) e.preventDefault();
          });
        }
      })(sels[i]);
    }
  }

  // ─── INIT ─────────────────────────────────────────────────────────────────────
  function init() {
    // 1. Translate text to German
    translatePage();
    // 2. Store EUR prices then apply selected currency
    storePrices();
    applyPrices();
    // 3. Bind currency selector
    bindCurrencySelectors();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
