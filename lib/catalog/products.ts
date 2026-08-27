import { createSupabaseServerClient } from "@/lib/supabase/server";
import fs from "node:fs";
import path from "node:path";
export { formatEuro, formatMoney } from "@/lib/catalog/money";

export type CatalogVariant = {
  id: string;
  shopify_id?: number | null;
  title: string;
  color: string | null;
  sku: string | null;
  image_url: string | null;
  attributes?: Record<string, unknown>;
  retail_price_cents: number;
  wholesale_price_cents: number | null;
  inventory_quantity: number;
};

export type CatalogProduct = {
  id: string;
  shopify_id?: number | null;
  title: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  gallery?: string[];
  variants: CatalogVariant[];
  attributes?: Record<string, unknown>;
};

type ProductOverride = {
  slug: string;
  title: string | null;
  description: string | null;
  retail_price_cents: number | null;
  wholesale_price_cents: number | null;
  category_slug: string | null;
  hidden: boolean | null;
  merged_into_slug: string | null;
};

// BiziLuxe colour codes — exactly as written in the product documents
const BIZILUXE_COLOURS = [
  { name: "1",      hex: "#1C1008",                                           img: "colour-1.jpg" },
  { name: "1B",     hex: "#2C1A0E",                                           img: "colour-1a.jpg" },
  { name: "2",      hex: "#5A3520",                                           img: "colour-2.jpg" },
  { name: "Ice",    hex: "#EDE8DE",                                           img: "colour-613.jpg" },
  { name: "Silver", hex: "#C8BFA8",                                           img: "colour-60a.jpg" },
  { name: "Ombré 18/60B",   hex: "linear-gradient(135deg,#3D2314 50%,#EDE0C0 50%)",  img: "colour-sb.jpg" },
  { name: "Highlights 4/6/8", hex: "linear-gradient(135deg,#8B5E3C 40%,#C8A870 60%)",  img: "colour-4-6-8.jpg" },
  { name: "Balayage 8/22",  hex: "linear-gradient(135deg,#9B7040 50%,#D8CDB8 50%)",  img: "colour-8-22.jpg" },
];

// BiziHair colour codes — exactly as written in the product documents
const BIZIHAIR_COLOURS = [
  { name: "1",   hex: "#140E08", img: "colour-1.png" },
  { name: "1A",  hex: "#131010", img: "colour-1a.png" },
  { name: "1B",  hex: "#473326", img: "colour-1b.png" },
  { name: "2",   hex: "#4C3E34", img: "colour-2.png" },
  { name: "4",   hex: "#C6BC9F", img: "colour-4.png" },
  { name: "8",   hex: "#DDC599", img: "colour-8.png" },
  { name: "Red", hex: "#8B1A1A", img: "colour-red.png" },
];
const LENGTHS = ["40cm","45cm","50cm","55cm","60cm","65cm","70cm","75cm"];

function makeExtensionVariants(slug: string, folder: string, basePrice: number): CatalogVariant[] {
  return BIZILUXE_COLOURS.flatMap((colour) =>
    LENGTHS.map((length) => ({
      id: `${slug}-${colour.name}-${length}`.toLowerCase().replace(/[\s/]+/g,"-"),
      title: `${colour.name} / ${length}`,
      color: colour.name,
      sku: `${slug}-${colour.name}-${length}`.toUpperCase().replace(/[\s/]+/g,"-"),
      image_url: `/products/${folder}/${colour.img}`,
      attributes: { length, colour_hex: colour.hex },
      retail_price_cents: basePrice + (LENGTHS.indexOf(length) * 1000),
      wholesale_price_cents: Math.round((basePrice + LENGTHS.indexOf(length) * 1000) * 0.7),
      inventory_quantity: 20
    }))
  );
}

const SLIP_ON_BONNET_COLOURS = [
  { name: "Black",  hex: "#1A1A1A", img: "black.jpg" },
  { name: "Rose",   hex: "#D4A0A0", img: "rose.jpg" },
  { name: "Pink",   hex: "#E8257A", img: "pink.jpg" },
];

const TIE_UP_BONNET_COLOURS = [
  { name: "Champagne Gold", hex: "#C9A96E", img: "champagne-gold.jpg" },
  { name: "Pink",           hex: "#C0607A", img: "pink.jpg" },
  { name: "Light Pink",     hex: "#F2C4C4", img: "light-pink.jpg" },
  { name: "Black",          hex: "#1A1A1A", img: "black.jpg" },
  { name: "Dark Blue",      hex: "#1B2D5B", img: "dark-blue.jpg" },
];

function makeBonnetVariants(slug: string, folder: string, colours: { name: string; hex: string; img: string }[], priceBase: number): CatalogVariant[] {
  return colours.map((colour) => ({
    id: `${slug}-${colour.name}`.toLowerCase().replace(/\s+/g, "-"),
    title: colour.name,
    color: colour.name,
    sku: `${slug}-${colour.name}`.toUpperCase().replace(/\s+/g, "-"),
    image_url: `/products/accessories/${folder}/${colour.img}`,
    attributes: { colour_hex: colour.hex },
    retail_price_cents: priceBase,
    wholesale_price_cents: Math.round(priceBase * 0.7),
    inventory_quantity: 20
  }));
}

function getProSalonProducts(): CatalogProduct[] {
  const items = [
    { id: "salon-apron",           title: "Professional Salon Apron",        price: 2990, desc: "Professional waterproof salon apron. Comfortable fit with pocket. Protects clothing during colouring and styling services." },
    { id: "smart-bowl",            title: "Smart Bowl",                       price: 1990, desc: "Smart colour mixing bowl designed to attach directly to the shampoo bowl. Includes mixing spatula and anti-slip tray. Available in black and white." },
    { id: "salon-trolley-drawers", title: "Salon Trolley with Drawers",      price: 12900, desc: "Professional salon trolley with 5 pull-out drawers. Wood-effect panels with metal frame and lockable castors." },
    { id: "salon-service-trolley", title: "Salon Service Trolley",           price: 9900, desc: "3-shelf black salon service trolley with top tray, tool holder and lockable castors. Ideal for colouring services." },
    { id: "colour-mixing-trolley", title: "Colour Mixing Trolley",           price: 14900, desc: "Premium acrylic colour mixing trolley with 3 mixing bowl holders, tool holder and lower storage shelf." },
    { id: "hair-cutting-cape",     title: "Professional Hair Cutting Cape",  price: 1490,  desc: "Waterproof professional hair cutting cape. Full-length coverage with adjustable neck closure. Salon quality." },
    { id: "detmold",               title: "Tinting Bowl (Black & White)",     price:  890,  desc: "Professional two-tone tinting bowl with handle spout. Black gloss interior, white exterior for easy colour visibility." },
    { id: "essen",                 title: "Hair Cutting Cape (Textured)",     price: 2490,  desc: "Premium waterproof salon cutting cape in textured black. Lightweight with professional neck closure." },
    { id: "herford",               title: "Adjustable Wig Stand Tripod",      price: 3490,  desc: "Professional adjustable tripod stand for mannequin heads and wig forms. Height-adjustable with stable metal base." },
    { id: "muenster",              title: "Disposable Gloves (100 pcs)",      price: 1490,  desc: "Non-medical disposable gloves, 100 per box. Essential for hair colouring and chemical treatments." },
    { id: "recklinghausen",        title: "Open Shelf Salon Trolley",         price: 18990, desc: "Professional rolling salon trolley with three open shelves. Holds bowls, colour products and styling tools. Lockable wheels." },
  ];
  const extraProducts: CatalogProduct[] = [
    { id: "paderborn",    title: "Cross-Back Salon Apron", slug: "paderborn",    description: "Professional cross-back salon apron in dark navy with front pocket. Comfortable, adjustable fit for long salon shifts.", image_url: "/products/profi-friseurbedarf/paderborn-main.jpg", attributes: {}, variants: [{ id: "paderborn-standard", title: "Standard", color: null, sku: "CROSS-BACK-APRON", image_url: "/products/profi-friseurbedarf/paderborn-main.jpg", attributes: {}, retail_price_cents: 2490, wholesale_price_cents: 1743, inventory_quantity: 15 }] },
    {
      id: "tinting-tray",
      title: "Tinting Tray",
      slug: "tinting-tray",
      description: "Professional colour mixing tray with measurement markings. Lightweight and easy to clean. Available in White and Black.",
      image_url: "/products/profi-friseurbedarf/tinting-tray-white/tinting-tray-white-main.jpg",
      attributes: {},
      variants: [
        { id: "tinting-tray-white", title: "White", color: "White", sku: "TINTING-TRAY-WHITE", image_url: "/products/profi-friseurbedarf/tinting-tray-white/tinting-tray-white-main.jpg", attributes: { colour_hex: "#F5F5F5" }, retail_price_cents: 990, wholesale_price_cents: 693, inventory_quantity: 20 },
        { id: "tinting-tray-black", title: "Black", color: "Black", sku: "TINTING-TRAY-BLACK", image_url: "/products/profi-friseurbedarf/tinting-tray-black/tinting-tray-black-main.jpg", attributes: { colour_hex: "#1A1A1A" }, retail_price_cents: 990, wholesale_price_cents: 693, inventory_quantity: 20 },
      ]
    },
    // ── Moved from Accessories — professional installation & removal products ─
    {
      id: "wesel",
      title: "Micro Rings Set",
      slug: "wesel",
      description: "Professional micro ring set for hair extensions. Comes in 4 shades: Blonde, Light Brown, Dark Brown and Black.",
      image_url: "/products/profi-friseurbedarf/wesel/wesel-main.jpg",
      attributes: {},
      variants: [
        { id: "wesel-blonde",      title: "Blonde",      color: "Blonde",      sku: "MICRO-RINGS-BLONDE",     image_url: "/products/profi-friseurbedarf/wesel/wesel-main.jpg", attributes: { colour_hex: "#D4A843" }, retail_price_cents: 1490, wholesale_price_cents: 1043, inventory_quantity: 20 },
        { id: "wesel-light-brown", title: "Light Brown", color: "Light Brown", sku: "MICRO-RINGS-LIGHT-BROWN", image_url: "/products/profi-friseurbedarf/wesel/wesel-main.jpg", attributes: { colour_hex: "#8B6340" }, retail_price_cents: 1490, wholesale_price_cents: 1043, inventory_quantity: 20 },
        { id: "wesel-dark-brown",  title: "Dark Brown",  color: "Dark Brown",  sku: "MICRO-RINGS-DARK-BROWN",  image_url: "/products/profi-friseurbedarf/wesel/wesel-main.jpg", attributes: { colour_hex: "#4A2C17" }, retail_price_cents: 1490, wholesale_price_cents: 1043, inventory_quantity: 20 },
        { id: "wesel-black",       title: "Black",       color: "Black",       sku: "MICRO-RINGS-BLACK",       image_url: "/products/profi-friseurbedarf/wesel/wesel-main.jpg", attributes: { colour_hex: "#1A1A1A" }, retail_price_cents: 1490, wholesale_price_cents: 1043, inventory_quantity: 20 },
      ]
    },
    {
      id: "keratin-heat-shield",
      title: "Keratin Heat Shield",
      slug: "keratin-heat-shield",
      description: "BiziLuxe keratin bond heat shield protectors. 10 pcs per box. Protects bonds during heat styling. Available in Black and Clear.",
      image_url: "/products/profi-friseurbedarf/bavaria-main.jpg",
      attributes: {},
      variants: [
        { id: "keratin-heat-shield-black", title: "Black", color: "Black", sku: "KERATIN-HEAT-SHIELD-BLACK", image_url: "/products/profi-friseurbedarf/bavaria-main.jpg", attributes: { colour_hex: "#1A1A1A" }, retail_price_cents: 1490, wholesale_price_cents: 1043, inventory_quantity: 20 },
        { id: "keratin-heat-shield-clear", title: "Clear", color: "Clear", sku: "KERATIN-HEAT-SHIELD-CLEAR", image_url: "/products/profi-friseurbedarf/rhein-main.jpg",   attributes: { colour_hex: "#E8E8E8" }, retail_price_cents: 1490, wholesale_price_cents: 1043, inventory_quantity: 20 },
      ]
    },
  ];
  return [
    ...items.map((item) => ({
      id: item.id,
      title: item.title,
      slug: item.id,
      description: item.desc,
      image_url: `/products/profi-friseurbedarf/${item.id}/${item.id}-main.jpg`,
      attributes: {},
      variants: [{
        id: `${item.id}-standard`,
        title: "Standard",
        color: null,
        sku: item.id.toUpperCase(),
        image_url: `/products/profi-friseurbedarf/${item.id}/${item.id}-main.jpg`,
        attributes: {},
        retail_price_cents: item.price,
        wholesale_price_cents: Math.round(item.price * 0.7),
        inventory_quantity: 15
      }]
    })),
    ...extraProducts,
  ];
}

function getBiziLuxeAccessoryProducts(): CatalogProduct[] {
  return [
    // ── Hair Protection ──────────────────────────────────────────────────────
    {
      id: "slip-on-bonnet",
      title: "Premium Slip-On Bonnet",
      slug: "slip-on-bonnet",
      description: "Luxurious satin sleep bonnet. Easy slip-on, comfortable fit, breathable. Available in 3 colours.",
      image_url: "/products/accessories/slip-on-bonnet/slip-on-bonnet-main.jpg",
      attributes: {},
      variants: makeBonnetVariants("slip-on-bonnet", "slip-on-bonnet", SLIP_ON_BONNET_COLOURS, 1990)
    },
    {
      id: "tie-up-bonnet",
      title: "Premium Tie-Up Bonnet",
      slug: "tie-up-bonnet",
      description: "Premium satin bonnet with wide tie band for a secure hold. Luxurious satin for beautiful hair every day. Available in 5 colours.",
      image_url: "/products/accessories/tie-up-bonnet/tie-up-bonnet-main.jpg",
      attributes: {},
      variants: makeBonnetVariants("tie-up-bonnet", "tie-up-bonnet", TIE_UP_BONNET_COLOURS, 2490)
    },
    {
      id: "dortmund",
      title: "Slip-On Bonnet (Black)",
      slug: "dortmund",
      description: "Lightweight slip-on hair bonnet in black for protecting styles overnight. Smooth lining reduces frizz and breakage.",
      image_url: "/products/profi-friseurbedarf/dortmund/dortmund-main.jpg",
      attributes: {},
      variants: [{ id: "dortmund-standard", title: "Black", color: "Black", sku: "SLIP-ON-BONNET-BLACK", image_url: "/products/profi-friseurbedarf/dortmund/dortmund-main.jpg", attributes: { colour_hex: "#1A1A1A" }, retail_price_cents: 1090, wholesale_price_cents: 763, inventory_quantity: 25 }]
    },
    // ── Clips & Organising ───────────────────────────────────────────────────
    {
      id: "sectioning-clips",
      title: "Sectioning Clips",
      slug: "sectioning-clips",
      description: "BiziLuxe professional sectioning clips. Pack of 6. Available in White and Matte Black.",
      image_url: "/products/accessories/sectioning-clips/sectioning-clips-main.jpg",
      attributes: {},
      variants: [
        { id: "sectioning-clips-standard",    title: "White",       color: "White",       sku: "SECTIONING-CLIPS-WHITE",      image_url: "/products/accessories/sectioning-clips/sectioning-clips-main.jpg",       attributes: { colour_hex: "#F5F5F5" }, retail_price_cents:  790, wholesale_price_cents:  553, inventory_quantity: 30 },
        { id: "sectioning-clips-matte-black", title: "Matte Black", color: "Matte Black", sku: "SECTIONING-CLIPS-MATTE-BLACK", image_url: "/products/accessories/matte-section-clips/matte-section-clips-main.jpg", attributes: { colour_hex: "#2C2C2C" }, retail_price_cents:  990, wholesale_price_cents:  693, inventory_quantity: 25 },
      ]
    },
    {
      id: "neuschwanstein",
      title: "BiziLuxe Gold Clips (20 pcs)",
      slug: "neuschwanstein",
      description: "BiziLuxe gold metal sectioning clips in a luxury round tin. 20 pcs per tin.",
      image_url: "/products/profi-friseurbedarf/neuschwanstein-main.jpg",
      attributes: {},
      variants: [{ id: "neuschwanstein-standard", title: "Standard", color: null, sku: "GOLD-CLIPS-TIN", image_url: "/products/profi-friseurbedarf/neuschwanstein-main.jpg", attributes: {}, retail_price_cents: 1990, wholesale_price_cents: 1393, inventory_quantity: 20 }]
    },
    {
      id: "drachenfels",
      title: "Rose Gold Sectioning Clips",
      slug: "drachenfels",
      description: "BiziLuxe rose gold metal sectioning clips with open-slot design. Set of 5 in a branded bag.",
      image_url: "/products/profi-friseurbedarf/drachenfels-main.jpg",
      attributes: {},
      variants: [{ id: "drachenfels-standard", title: "Standard", color: null, sku: "ROSE-GOLD-SECTION-CLIPS", image_url: "/products/profi-friseurbedarf/drachenfels-main.jpg", attributes: {}, retail_price_cents: 1490, wholesale_price_cents: 1043, inventory_quantity: 20 }]
    },
    {
      id: "gator-grip-clips",
      title: "Gator Grip Clips",
      slug: "gator-grip-clips",
      description: "Professional salon-grade alligator sectioning clips. Strong hold for thick sections. Pack of 6. Available in Silver, White, Clear and Black.",
      image_url: "/products/profi-friseurbedarf/arnsberg/arnsberg-main.jpg",
      attributes: {},
      variants: [
        { id: "gator-grip-clips-silver", title: "Silver", color: "Silver", sku: "GATOR-GRIP-CLIPS-SILVER", image_url: "/products/profi-friseurbedarf/arnsberg/arnsberg-main.jpg", attributes: { colour_hex: "#C0C0C0" }, retail_price_cents: 1290, wholesale_price_cents: 903, inventory_quantity: 25 },
        { id: "gator-grip-clips-white",  title: "White",  color: "White",  sku: "GATOR-GRIP-CLIPS-WHITE",  image_url: "/products/profi-friseurbedarf/hagen/hagen-main.jpg",    attributes: { colour_hex: "#F0F0F0" }, retail_price_cents: 1290, wholesale_price_cents: 903, inventory_quantity: 25 },
        { id: "gator-grip-clips-clear",  title: "Clear",  color: "Clear",  sku: "GATOR-GRIP-CLIPS-CLEAR",  image_url: "/products/profi-friseurbedarf/minden/minden-main.jpg",  attributes: { colour_hex: "#D8D8D8" }, retail_price_cents: 1290, wholesale_price_cents: 903, inventory_quantity: 25 },
        { id: "gator-grip-clips-black",  title: "Black",  color: "Black",  sku: "GATOR-GRIP-CLIPS-BLACK",  image_url: "/products/profi-friseurbedarf/witten/witten-main.jpg",  attributes: { colour_hex: "#1A1A1A" }, retail_price_cents: 1290, wholesale_price_cents: 903, inventory_quantity: 25 },
      ]
    },
    // ── Hair Tools & Application ─────────────────────────────────────────────
    {
      id: "fine-mist-spray-bottle",
      title: "Fine Mist Spray Bottle",
      slug: "fine-mist-spray-bottle",
      description: "BiziLuxe fine mist continuous spray bottle. 300ml capacity. 360° spray for even moisture distribution.",
      image_url: "/products/accessories/fine-mist-spray-bottle/fine-mist-spray-bottle-main.jpg",
      attributes: {},
      variants: [
        { id: "fine-mist-spray-bottle-black", title: "Black", color: "Black", sku: "FINE-MIST-SPRAY-BLACK", image_url: "/products/accessories/fine-mist-spray-bottle/fine-mist-spray-bottle-main.jpg", attributes: { colour_hex: "#1A1A1A" }, retail_price_cents: 1290, wholesale_price_cents: 903, inventory_quantity: 20 },
        { id: "fine-mist-spray-bottle-champagne-gold", title: "Champagne Gold", color: "Champagne Gold", sku: "FINE-MIST-SPRAY-CHAMPAGNE-GOLD", image_url: "/products/accessories/fine-mist-spray-bottle/fine-mist-spray-bottle-main.jpg", attributes: { colour_hex: "#C9A96E" }, retail_price_cents: 1290, wholesale_price_cents: 903, inventory_quantity: 20 },
      ]
    },
    {
      id: "bocholt",
      title: "Professional Elastic Hair Bands",
      slug: "bocholt",
      description: "BiziLuxe professional elastic hair bands. Gentle on hair with no metal parts. Pack of 6.",
      image_url: "/products/profi-friseurbedarf/bocholt/bocholt-main.jpg",
      attributes: {},
      variants: [{ id: "bocholt-standard", title: "Standard", color: null, sku: "ELASTIC-HAIR-BANDS-6", image_url: "/products/profi-friseurbedarf/bocholt/bocholt-main.jpg", attributes: {}, retail_price_cents: 690, wholesale_price_cents: 483, inventory_quantity: 30 }]
    },
    {
      id: "hair-extension-thread",
      title: "Hair Extension Thread",
      slug: "hair-extension-thread",
      description: "Professional hair extension thread in Black, Brown and Clear. Strong elastic thread for weaving and Brazilian knot techniques.",
      image_url: "/products/accessories/hair-extension-thread/hair-extension-thread-main.jpg",
      attributes: {},
      variants: [
        { id: "hair-extension-thread-black", title: "Black", color: "Black", sku: "HAIR-THREAD-BLACK", image_url: "/products/accessories/hair-extension-thread/hair-extension-thread-main.jpg", attributes: { colour_hex: "#1A1A1A" }, retail_price_cents: 890, wholesale_price_cents: 623, inventory_quantity: 30 },
        { id: "hair-extension-thread-brown", title: "Brown", color: "Brown", sku: "HAIR-THREAD-BROWN", image_url: "/products/accessories/hair-extension-thread/hair-extension-thread-main.jpg", attributes: { colour_hex: "#5C3A1E" }, retail_price_cents: 890, wholesale_price_cents: 623, inventory_quantity: 30 },
        { id: "hair-extension-thread-clear", title: "Clear", color: "Clear", sku: "HAIR-THREAD-CLEAR", image_url: "/products/accessories/hair-extension-thread/hair-extension-thread-main.jpg", attributes: { colour_hex: "#ECECEC" }, retail_price_cents: 890, wholesale_price_cents: 623, inventory_quantity: 30 },
      ]
    },
    {
      id: "hair-weaving-needles",
      title: "Hair Weaving Needles",
      slug: "hair-weaving-needles",
      description: "Professional curved hair weaving needles. Set of 3 sizes for different weaving and extension techniques.",
      image_url: "/products/accessories/hair-weaving-needles/hair-weaving-needles-main.jpg",
      attributes: {},
      variants: [{ id: "hair-weaving-needles-standard", title: "Set of 3", color: null, sku: "HAIR-WEAVING-NEEDLES", image_url: "/products/accessories/hair-weaving-needles/hair-weaving-needles-main.jpg", attributes: {}, retail_price_cents: 690, wholesale_price_cents: 483, inventory_quantity: 30 }]
    },
    // ── Extension Application & Removal ─────────────────────────────────────
    {
      id: "berghain",
      title: "BiziLuxe Cotton Thread for Sew-In",
      slug: "berghain",
      description: "Professional cotton thread for sew-in extensions. 1000 yards per spool. Available in 5 colours: Beige, Light Brown, Brown, Dark Brown and Black.",
      image_url: "/products/profi-friseurbedarf/berghain-main.jpg",
      attributes: {},
      variants: [
        { id: "berghain-beige",       title: "Beige",       color: "Beige",       sku: "COTTON-THREAD-BEIGE",      image_url: "/products/profi-friseurbedarf/berghain-main.jpg", attributes: { colour_hex: "#D4BFA0" }, retail_price_cents: 1290, wholesale_price_cents: 903, inventory_quantity: 30 },
        { id: "berghain-light-brown", title: "Light Brown", color: "Light Brown", sku: "COTTON-THREAD-LIGHT-BROWN", image_url: "/products/profi-friseurbedarf/berghain-main.jpg", attributes: { colour_hex: "#A07850" }, retail_price_cents: 1290, wholesale_price_cents: 903, inventory_quantity: 30 },
        { id: "berghain-brown",       title: "Brown",       color: "Brown",       sku: "COTTON-THREAD-BROWN",      image_url: "/products/profi-friseurbedarf/berghain-main.jpg", attributes: { colour_hex: "#6B4226" }, retail_price_cents: 1290, wholesale_price_cents: 903, inventory_quantity: 30 },
        { id: "berghain-dark-brown",  title: "Dark Brown",  color: "Dark Brown",  sku: "COTTON-THREAD-DARK-BROWN", image_url: "/products/profi-friseurbedarf/berghain-main.jpg", attributes: { colour_hex: "#3D1F0A" }, retail_price_cents: 1290, wholesale_price_cents: 903, inventory_quantity: 30 },
        { id: "berghain-black",       title: "Black",       color: "Black",       sku: "COTTON-THREAD-BLACK",      image_url: "/products/profi-friseurbedarf/berghain-main.jpg", attributes: { colour_hex: "#1A1A1A" }, retail_price_cents: 1290, wholesale_price_cents: 903, inventory_quantity: 30 },
      ]
    },
    { id: "eisenach",        title: "BiziLuxe Removal Tonic",    slug: "eisenach",        description: "BiziLuxe tape extension removal tonic. 100ml spray bottle. Gently dissolves tape adhesive for clean, damage-free removal.",                                              image_url: "/products/profi-friseurbedarf/eisenach-main.jpg",        attributes: {}, variants: [{ id: "eisenach-standard",        title: "Standard", color: null, sku: "REMOVAL-TONIC-TAPE",   image_url: "/products/profi-friseurbedarf/eisenach-main.jpg",        attributes: {}, retail_price_cents: 1990, wholesale_price_cents: 1393, inventory_quantity: 20 }] },
    { id: "taunus",          title: "BiziLuxe K-Tip Remover",    slug: "taunus",          description: "BiziLuxe K-Tip hair extension remover spray. 100ml. Gently dissolves keratin bonds for clean, damage-free removal.",                                                     image_url: "/products/profi-friseurbedarf/taunus-main.jpg",          attributes: {}, variants: [{ id: "taunus-standard",          title: "Standard", color: null, sku: "KTIP-REMOVER",         image_url: "/products/profi-friseurbedarf/taunus-main.jpg",          attributes: {}, retail_price_cents: 1990, wholesale_price_cents: 1393, inventory_quantity: 20 }] },
    { id: "mannheim",        title: "BiziLuxe Double Sided Tape", slug: "mannheim",        description: "BiziLuxe double sided tape tabs for tape-in hair extensions. 60 tabs per pack (4.0 cm × 0.8 cm). Ultra-strong hold.",                                                    image_url: "/products/profi-friseurbedarf/mannheim-main.jpg",         attributes: {}, variants: [{ id: "mannheim-standard",        title: "Standard", color: null, sku: "DOUBLE-SIDED-TAPE-60", image_url: "/products/profi-friseurbedarf/mannheim-main.jpg",         attributes: {}, retail_price_cents:  990, wholesale_price_cents:  693, inventory_quantity: 30 }] },
    { id: "speicherstadt",   title: "BiziLuxe Tape Scraper",      slug: "speicherstadt",   description: "BiziLuxe tape scraper tool for easy removal of tape-in extension tabs. Ergonomic handle with dual-blade head.",                                                           image_url: "/products/profi-friseurbedarf/speicherstadt-main.jpg",   attributes: {}, variants: [{ id: "speicherstadt-standard",   title: "Standard", color: null, sku: "TAPE-SCRAPER",        image_url: "/products/profi-friseurbedarf/speicherstadt-main.jpg",   attributes: {}, retail_price_cents:  990, wholesale_price_cents:  693, inventory_quantity: 25 }] },
    { id: "hamburger-hafen", title: "BiziLuxe Latch Hook Tool",   slug: "hamburger-hafen", description: "BiziLuxe professional latch hook tool with gold handle. Includes 3 interchangeable needle sizes for micro ring and nano ring installations. Comes with BiziLuxe case.", image_url: "/products/profi-friseurbedarf/hamburger-hafen-main.jpg", attributes: {}, variants: [{ id: "hamburger-hafen-standard", title: "Standard", color: null, sku: "LATCH-HOOK-TOOL",      image_url: "/products/profi-friseurbedarf/hamburger-hafen-main.jpg", attributes: {}, retail_price_cents: 1990, wholesale_price_cents: 1393, inventory_quantity: 15 }] },
  ];
}

function getBiziLuxeExtensionProducts(): CatalogProduct[] {
  return [
    {
      id: "biziluxe-tape-in",
      title: "Tape-In Extensions",
      slug: "tape-in-extensions",
      description: "Premium Remy Echthaar Tape-In Extensions. Unsichtbare Klebestreifen für nahtloses Blending. Verfügbar in 10 Farben und 8 Längen.",
      image_url: "/products/biziluxe-extensions/tape-in/tape-in-main.jpg",
      attributes: {},
      variants: makeExtensionVariants("tape-in", "biziluxe-extensions/tape-in", 8900)
    },
    {
      id: "biziluxe-weft",
      title: "Genius Weft Extensions",
      slug: "weft-extensions",
      description: "Handgeknüpfte Genius Weft Echthaar Extensions für maximales Volumen. Ideal für Salon-Installation. Verfügbar in 10 Farben und 8 Längen.",
      image_url: "/products/biziluxe-extensions/weft/weft-main.jpg",
      attributes: {},
      variants: makeExtensionVariants("weft", "biziluxe-extensions/weft", 11900)
    },
    {
      id: "biziluxe-utip",
      title: "U-Tip Extensions",
      slug: "utip-extensions",
      description: "Keratin U-Tip Bonding Extensions für natürlichen Fall und lange Haltbarkeit. Professionelle Salon-Anwendung. Verfügbar in 10 Farben und 8 Längen.",
      image_url: "/products/biziluxe-extensions/utip/utip-main.jpg",
      attributes: {},
      variants: makeExtensionVariants("utip", "biziluxe-extensions/utip", 14900)
    }
  ];
}

const MINI_BRUSH_COLOURS = [
  { name: "White/Ivory", hex: "#F5F0E8", img: "white-ivory/mini-travel-brush-main.jpg" },
  { name: "Terracotta",  hex: "#C4633A", img: "terracotta/mini-travel-brush-main.jpg" },
  { name: "Black",       hex: "#1A1A1A", img: "black/mini-travel-brush-main.jpg" },
];

function getBrushesProducts(): CatalogProduct[] {
  return [
    {
      id: "mini-travel-brush",
      title: "BiziLuxe Travel Brush & Comb",
      slug: "mini-travel-brush",
      description: "BiziLuxe compact travel essentials. Choose the folding mini travel brush in 3 colours, or the pocket comb with mixed boar and nylon bristles.",
      image_url: "/products/buersten-und-kaemme/mini-travel-brush/white-ivory/mini-travel-brush-main.jpg",
      attributes: {},
      variants: [
        ...MINI_BRUSH_COLOURS.map((colour) => ({
          id: `mini-travel-brush-${colour.name}`.toLowerCase().replace(/[\s/]+/g, "-"),
          title: colour.name,
          color: colour.name,
          sku: `BIZILUXE-MINI-BRUSH-${colour.name}`.toUpperCase().replace(/[\s/]+/g, "-"),
          image_url: `/products/buersten-und-kaemme/mini-travel-brush/${colour.img}`,
          attributes: { colour_hex: colour.hex },
          retail_price_cents: 1490,
          wholesale_price_cents: 1043,
          inventory_quantity: 30
        })),
        { id: "mini-travel-brush-pocket-comb", title: "Pocket Comb", color: null, sku: "BIZILUXE-POCKET-COMB", image_url: "/products/buersten-und-kaemme/lueneburg/lueneburg-main.jpg", attributes: {}, retail_price_cents: 1490, wholesale_price_cents: 1043, inventory_quantity: 25 }
      ]
    },
    {
      id: "vent-brush",
      title: "BiziLuxe Vent Brush",
      slug: "vent-brush",
      description: "Professional BiziLuxe vent brush for smooth detangling and everyday styling. Choose Classic or Flexible.",
      image_url: "/products/buersten-und-kaemme/vent-brush/vent-brush-main.jpg",
      attributes: {},
      variants: [
        { id: "vent-brush-classic",  title: "Classic",  color: null, sku: "BIZILUXE-VENT-BRUSH-CLASSIC",  image_url: "/products/buersten-und-kaemme/vent-brush/vent-brush-main.jpg", attributes: {}, retail_price_cents: 2490, wholesale_price_cents: 1743, inventory_quantity: 30 },
        { id: "vent-brush-flexible", title: "Flexible", color: null, sku: "BIZILUXE-VENT-BRUSH-FLEXIBLE", image_url: "/products/buersten-und-kaemme/bremen-main.jpg",                 attributes: {}, retail_price_cents: 2190, wholesale_price_cents: 1533, inventory_quantity: 20 },
      ]
    },
    {
      id: "wooden-paddle-brush",
      title: "BiziLuxe Wooden Paddle Brush",
      slug: "wooden-paddle-brush",
      description: "Professional wooden paddle brush for smooth detangling, blow-drying and everyday styling.",
      image_url: "/products/buersten-und-kaemme/wooden-paddle-brush/wooden-paddle-brush-main.jpg",
      attributes: {},
      variants: [{ id: "wooden-paddle-brush-standard", title: "Standard", color: null, sku: "BIZILUXE-WOODEN-PADDLE-BRUSH", image_url: "/products/buersten-und-kaemme/wooden-paddle-brush/wooden-paddle-brush-main.jpg", attributes: {}, retail_price_cents: 2990, wholesale_price_cents: 2093, inventory_quantity: 30 }]
    },
    {
      id: "detangling-brush",
      title: "BiziLuxe Detangling Brush",
      slug: "detangling-brush",
      description: "Professional hair brush designed for smooth, pain-free detangling on wet or dry hair.",
      image_url: "/products/buersten-und-kaemme/detangling-brush/detangling-brush-main.jpg",
      attributes: {},
      variants: [{ id: "detangling-brush-standard", title: "Standard", color: null, sku: "BIZILUXE-DETANGLING-BRUSH", image_url: "/products/buersten-und-kaemme/detangling-brush/detangling-brush-main.jpg", attributes: {}, retail_price_cents: 1990, wholesale_price_cents: 1393, inventory_quantity: 30 }]
    },
    {
      id: "edge-brush-comb",
      title: "Edge Brush & Comb",
      slug: "edge-brush-comb",
      description: "Dual-ended edge brush and comb for precise edge styling and baby hair control. Firm bristles with fine-tooth comb end. Available in Yellow and Blue.",
      image_url: "/products/buersten-und-kaemme/edge-brush-comb-yellow/edge-brush-comb-yellow-main.jpg",
      attributes: {},
      variants: [
        { id: "edge-brush-comb-yellow", title: "Yellow", color: "Yellow", sku: "EDGE-BRUSH-COMB-YELLOW", image_url: "/products/buersten-und-kaemme/edge-brush-comb-yellow/edge-brush-comb-yellow-main.jpg", attributes: { colour_hex: "#F5C842" }, retail_price_cents: 990, wholesale_price_cents: 693, inventory_quantity: 30 },
        { id: "edge-brush-comb-blue",   title: "Blue",   color: "Blue",   sku: "EDGE-BRUSH-COMB-BLUE",   image_url: "/products/buersten-und-kaemme/edge-brush-comb-blue/edge-brush-comb-blue-main.jpg",   attributes: { colour_hex: "#2B5EA7" }, retail_price_cents: 990, wholesale_price_cents: 693, inventory_quantity: 30 },
      ]
    },
    {
      id: "wide-tint-brush",
      title: "Wide Tint Brush",
      slug: "wide-tint-brush",
      description: "Professional wide tint brush for colour application. Flexible bristles for even, precise distribution. Available in White and Black.",
      image_url: "/products/buersten-und-kaemme/wide-tint-brush-white/wide-tint-brush-white-main.jpg",
      attributes: {},
      variants: [
        { id: "wide-tint-brush-white", title: "White", color: "White", sku: "WIDE-TINT-BRUSH-WHITE", image_url: "/products/buersten-und-kaemme/wide-tint-brush-white/wide-tint-brush-white-main.jpg", attributes: { colour_hex: "#F5F5F5" }, retail_price_cents: 1290, wholesale_price_cents: 903, inventory_quantity: 25 },
        { id: "wide-tint-brush-black", title: "Black", color: "Black", sku: "WIDE-TINT-BRUSH-BLACK", image_url: "/products/buersten-und-kaemme/wide-tint-brush-black/wide-tint-brush-black-main.jpg", attributes: { colour_hex: "#1A1A1A" }, retail_price_cents: 1290, wholesale_price_cents: 903, inventory_quantity: 25 },
      ]
    },
    {
      id: "celle",
      title: "9-Row Styling Brush",
      slug: "celle",
      description: "Professional 9-row styling brush with nylon pins. Ideal for smoothing and finishing all hair types.",
      image_url: "/products/buersten-und-kaemme/celle/celle-main.jpg",
      attributes: {},
      variants: [{ id: "celle-standard", title: "Standard", color: null, sku: "STYLING-BRUSH-9ROW", image_url: "/products/buersten-und-kaemme/celle/celle-main.jpg", attributes: {}, retail_price_cents: 1690, wholesale_price_cents: 1183, inventory_quantity: 25 }]
    },
    {
      id: "biziluxe-styling-combs",
      title: "BiziLuxe Styling Combs",
      slug: "biziluxe-styling-combs",
      description: "BiziLuxe Styling Comb Collection. Choose the Rat-Tail Comb for precise sectioning or the Styling Comb for parting and backcombing. Chemical & heat resistant.",
      image_url: "/products/buersten-und-kaemme/goslar/goslar-main.jpg",
      attributes: {},
      variants: [
        { id: "biziluxe-styling-combs-rat-tail", title: "Rat-Tail Comb", color: null, sku: "BIZILUXE-RAT-TAIL-COMB",  image_url: "/products/buersten-und-kaemme/goslar/goslar-main.jpg",       attributes: {}, retail_price_cents: 890, wholesale_price_cents: 623, inventory_quantity: 30 },
        { id: "biziluxe-styling-combs-styling",  title: "Styling Comb",  color: null, sku: "BIZILUXE-STYLING-COMB",   image_url: "/products/buersten-und-kaemme/hildesheim/hildesheim-main.jpg", attributes: {}, retail_price_cents: 890, wholesale_price_cents: 623, inventory_quantity: 30 },
      ]
    },
    {
      id: "hameln",
      title: "Metal Pick Comb",
      slug: "hameln",
      description: "Professional metal pin pick comb with decorative handle. Wide-spaced metal tines ideal for detangling and styling all hair types.",
      image_url: "/products/buersten-und-kaemme/hameln/hameln-main.jpg",
      attributes: {},
      variants: [{ id: "hameln-standard", title: "Standard", color: null, sku: "METAL-PICK-COMB", image_url: "/products/buersten-und-kaemme/hameln/hameln-main.jpg", attributes: {}, retail_price_cents: 990, wholesale_price_cents: 693, inventory_quantity: 30 }]
    },
    {
      id: "luebeck",
      title: "BiziLuxe Vent Brush (Wood Handle)",
      slug: "luebeck",
      description: "BiziLuxe premium vent brush with natural wood handle. Cushion base with ball-tipped pins for gentle detangling and blow-dry styling.",
      image_url: "/products/buersten-und-kaemme/luebeck/luebeck-main.jpg",
      attributes: {},
      variants: [{ id: "luebeck-standard", title: "Standard", color: null, sku: "BIZILUXE-VENT-BRUSH-WOOD", image_url: "/products/buersten-und-kaemme/luebeck/luebeck-main.jpg", attributes: {}, retail_price_cents: 2490, wholesale_price_cents: 1743, inventory_quantity: 20 }]
    },
    {
      id: "biziluxe-professional-combs",
      title: "BiziLuxe Professional Combs",
      slug: "biziluxe-professional-combs",
      description: "BiziLuxe Styling Comb Collection. Choose the Dressing Comb for fine-tooth finishing or the Metal Tail Comb with precision stainless steel rat-tail pin. Chemical & heat resistant.",
      image_url: "/products/buersten-und-kaemme/wolfenbuettel/wolfenbuettel-main.jpg",
      attributes: {},
      variants: [
        { id: "biziluxe-professional-combs-dressing",   title: "Dressing Comb",   color: null, sku: "BIZILUXE-DRESSING-COMB",   image_url: "/products/buersten-und-kaemme/wolfenbuettel/wolfenbuettel-main.jpg",  attributes: {}, retail_price_cents: 1090, wholesale_price_cents: 763, inventory_quantity: 30 },
        { id: "biziluxe-professional-combs-metal-tail", title: "Metal Tail Comb", color: null, sku: "BIZILUXE-METAL-TAIL-COMB",  image_url: "/products/profi-friseurbedarf/bielefeld/bielefeld-main.jpg",         attributes: {}, retail_price_cents: 1090, wholesale_price_cents: 763, inventory_quantity: 30 },
      ]
    },
  ];
}

function makeBiziHairVariants(prefix: string, folder: string, basePrice: number): CatalogVariant[] {
  return BIZIHAIR_COLOURS.flatMap((colour) =>
    LENGTHS.map((length) => ({
      id: `${prefix}-${colour.name}-${length}`.toLowerCase().replace(/[\s/]+/g, "-"),
      title: `${colour.name} / ${length}`,
      color: colour.name,
      sku: `${prefix}-${colour.name}-${length}`.toUpperCase().replace(/[\s/]+/g, "-"),
      image_url: `/products/bizihair-extensions/${folder}/${colour.img}`,
      attributes: { length, colour_hex: colour.hex },
      retail_price_cents: basePrice + (LENGTHS.indexOf(length) * 1000),
      wholesale_price_cents: Math.round((basePrice + LENGTHS.indexOf(length) * 1000) * 0.7),
      inventory_quantity: 20
    }))
  );
}

function getBiziHairProducts(): CatalogProduct[] {
  return [
    {
      id: "bizihair-weft",
      title: "BiziHair Genius Weft Extensions",
      slug: "bizihair-weft-extensions",
      description: "BiziHair Genius Weft Human Hair Extensions. Available in 7 colours and 8 lengths.",
      image_url: "/products/bizihair-extensions/weft/weft-1.jpeg",
      gallery: [
        "/products/bizihair-extensions/weft/weft-1.jpeg",
        "/products/bizihair-extensions/weft/weft-2.jpeg",
        "/products/bizihair-extensions/weft/weft-3.jpeg",
        "/products/bizihair-extensions/weft/weft-4.jpeg",
        "/products/bizihair-extensions/weft/weft-5.jpeg",
        "/products/bizihair-extensions/weft/weft-6.jpeg",
        "/products/bizihair-extensions/weft/weft-7.jpeg",
        "/products/bizihair-extensions/weft/weft-8.jpeg",
        "/products/bizihair-extensions/weft/weft-9.jpeg",
        "/products/bizihair-extensions/weft/weft-10.jpeg",
      ],
      attributes: {},
      variants: makeBiziHairVariants("bizihair-weft", "weft", 8900)
    },
    {
      id: "bizihair-tape-in",
      title: "BiziHair Tape-In Extensions",
      slug: "bizihair-tape-in-extensions",
      description: "BiziHair Tape-In Human Hair Extensions. Invisible adhesive strips for seamless blending. Available in 7 colours and 8 lengths.",
      image_url: "/products/bizihair-extensions/tape-in/tape-in-1.jpeg",
      gallery: [
        "/products/bizihair-extensions/tape-in/tape-in-1.jpeg",
        "/products/bizihair-extensions/tape-in/tape-in-2.jpeg",
        "/products/bizihair-extensions/tape-in/tape-in-3.jpeg",
        "/products/bizihair-extensions/tape-in/tape-in-4.jpeg",
        "/products/bizihair-extensions/tape-in/tape-in-5.jpeg",
        "/products/bizihair-extensions/tape-in/tape-in-6.jpeg",
        "/products/bizihair-extensions/tape-in/tape-in-7.jpeg",
        "/products/bizihair-extensions/tape-in/tape-in-8.jpeg",
      ],
      attributes: {},
      variants: makeBiziHairVariants("bizihair-tape-in", "weft", 9900)
    },
    {
      id: "bizihair-keratin",
      title: "BiziHair Keratin Bonding Extensions",
      slug: "bizihair-keratin-extensions",
      description: "BiziHair Keratin Bonding Human Hair Extensions. Individual strand application for the most natural, seamless result. Available in 7 colours and 8 lengths.",
      image_url: "/products/bizihair-extensions/keratin/keratin-1.jpeg",
      gallery: [
        "/products/bizihair-extensions/keratin/keratin-1.jpeg",
        "/products/bizihair-extensions/keratin/keratin-2.jpeg",
        "/products/bizihair-extensions/keratin/keratin-3.jpeg",
        "/products/bizihair-extensions/keratin/keratin-4.jpeg",
      ],
      attributes: {},
      variants: makeBiziHairVariants("bizihair-keratin", "weft", 11900)
    }
  ];
}

function getBiziLuxeStylingToolProducts(): CatalogProduct[] {
  return [
    { id: "solingen",    title: "BiziLuxe Hair Straightener",              slug: "solingen",    description: "BiziLuxe professional hair straightener with rose gold plates and digital temperature control. Suitable for all hair types.",                                            image_url: "/products/profi-friseurbedarf/solingen-main.jpg",    attributes: {}, variants: [{ id: "solingen-standard",    title: "Standard", color: null, sku: "HAIR-STRAIGHTENER-ROSEGOLD",  image_url: "/products/profi-friseurbedarf/solingen-main.jpg",    attributes: {}, retail_price_cents: 7990,  wholesale_price_cents: 5593, inventory_quantity: 10 }] },
    {
      id: "wiesbaden",
      title: "BiziLuxe Hair Dryer",
      slug: "wiesbaden",
      description: "BiziLuxe professional ionic hair dryer with rose gold accents. Available as Hair Dryer only or as a Dryer & Straightener Set.",
      image_url: "/products/profi-friseurbedarf/wiesbaden-main.jpg",
      attributes: {},
      variants: [
        { id: "wiesbaden-hair-dryer",  title: "Hair Dryer",               color: null, sku: "HAIR-DRYER-BIZILUXE",    image_url: "/products/profi-friseurbedarf/wiesbaden-main.jpg",  attributes: {}, retail_price_cents:  8990, wholesale_price_cents: 6293,  inventory_quantity: 10 },
        { id: "waldenburg-dryer-set",  title: "Dryer & Straightener Set", color: null, sku: "DRYER-STRAIGHTENER-SET",  image_url: "/products/profi-friseurbedarf/waldenburg-main.jpg", attributes: {}, retail_price_cents: 14990, wholesale_price_cents: 10493, inventory_quantity: 5  },
      ]
    },
    { id: "glashuette",  title: "Keratin Bond Fusion Iron",                slug: "glashuette",  description: "Professional keratin bond fusion iron for applying and removing bonded extensions. Temperature-controlled with LCD display. Comes with carrying case.",                 image_url: "/products/profi-friseurbedarf/glashuette-main.jpg",  attributes: {}, variants: [{ id: "glashuette-standard",  title: "Standard", color: null, sku: "KERATIN-FUSION-IRON",         image_url: "/products/profi-friseurbedarf/glashuette-main.jpg",  attributes: {}, retail_price_cents: 5990,  wholesale_price_cents: 4193, inventory_quantity: 10 }] },
    { id: "ruhrstahl",   title: "BiziLuxe Gold Scissors",                  slug: "ruhrstahl",   description: "BiziLuxe professional gold-finish hairdressing scissors. Precision blades for clean, sharp cuts. Lightweight ergonomic design.",                                        image_url: "/products/profi-friseurbedarf/ruhrstahl-main.jpg",   attributes: {}, variants: [{ id: "ruhrstahl-standard",   title: "Standard", color: null, sku: "GOLD-SCISSORS",               image_url: "/products/profi-friseurbedarf/ruhrstahl-main.jpg",   attributes: {}, retail_price_cents: 3990,  wholesale_price_cents: 2793, inventory_quantity: 15 }] },
    { id: "zollverein",  title: "BiziLuxe Extension Tool Kit",             slug: "zollverein",  description: "BiziLuxe complete hair extension tool kit in a luxury zipper case. Includes gold scissors, pliers, latch hook tools and section clips.",                               image_url: "/products/profi-friseurbedarf/zollverein-main.jpg",  attributes: {}, variants: [{ id: "zollverein-standard",  title: "Standard", color: null, sku: "EXTENSION-TOOL-KIT",          image_url: "/products/profi-friseurbedarf/zollverein-main.jpg",  attributes: {}, retail_price_cents: 9990,  wholesale_price_cents: 6993, inventory_quantity: 10 }] },
  ];
}

// Supabase product slugs that belong in pro-salon (professional equipment only)
const SUPABASE_PRO_SALON_SLUGS = [
  "parchim",        // Extension Pliers
  "ruegen",         // Extension Scissors
  "guestrow",       // Keratin Beads
  "usedom",         // Loop Needle
  "neubrandenburg", // K-Tips Remover
];
// Supabase product slugs that belong in brushes
const SUPABASE_BRUSH_SLUGS = ["schwerin-brush"];
// Slugs that must NOT appear in accessories (they live in other categories or are duplicates)
const NON_ACCESSORY_SUPABASE_SLUGS = new Set([
  ...SUPABASE_PRO_SALON_SLUGS,
  ...SUPABASE_BRUSH_SLUGS,
  // Duplicates of hardcoded accessories — block the Supabase version
  "removal-toner", "wismar", "waren", "greifswald",
  // Claw clips and sectioning clips — not wanted in accessories
  "demmin", "anklam", "biziluxe-claw-clip", "biziluxe-lace-front-tape",
]);

function getCuratedProducts(): CatalogProduct[] {
  return mergeCatalogProducts(
    mergeCatalogProducts(
      mergeCatalogProducts(getBiziLuxeExtensionProducts(), getBiziHairProducts()),
      mergeCatalogProducts(getBrushesProducts(), getBiziLuxeAccessoryProducts())
    ),
    mergeCatalogProducts(getBiziLuxeStylingToolProducts(), getProSalonProducts())
  );
}

async function fetchProductOverrides(): Promise<Map<string, ProductOverride>> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from("product_overrides")
      .select("slug,title,description,retail_price_cents,wholesale_price_cents,category_slug,hidden,merged_into_slug");
    return new Map((data || []).map((row) => [row.slug, row as ProductOverride]));
  } catch {
    return new Map();
  }
}

async function fetchProductOverride(slug: string): Promise<ProductOverride | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from("product_overrides")
      .select("slug,title,description,retail_price_cents,wholesale_price_cents,category_slug,hidden,merged_into_slug")
      .eq("slug", slug)
      .maybeSingle();
    return (data as ProductOverride | null) || null;
  } catch {
    return null;
  }
}

function applyOverrideToProduct(product: CatalogProduct, override?: ProductOverride | null): CatalogProduct {
  if (!override) return product;
  let variants = product.variants;
  if (override.retail_price_cents != null && product.variants.length > 0) {
    const baseRetail = product.variants[0].retail_price_cents;
    const baseWholesale = product.variants[0].wholesale_price_cents ?? 0;
    const retailShift = override.retail_price_cents - baseRetail;
    const wholesaleShift = override.wholesale_price_cents != null
      ? override.wholesale_price_cents - baseWholesale
      : 0;
    variants = product.variants.map((variant) => ({
      ...variant,
      retail_price_cents: variant.retail_price_cents + retailShift,
      wholesale_price_cents: variant.wholesale_price_cents != null
        ? variant.wholesale_price_cents + wholesaleShift
        : null,
    }));
  }
  return {
    ...product,
    title: override.title || product.title,
    description: override.description || product.description,
    variants,
  };
}

async function applyCatalogOverrides(products: CatalogProduct[], categorySlug?: string): Promise<CatalogProduct[]> {
  const overrides = await fetchProductOverrides();
  const seen = new Set<string>();
  const filtered = products.flatMap((product) => {
    const override = overrides.get(product.slug);
    if (override?.hidden || override?.merged_into_slug) return [];
    if (categorySlug && override?.category_slug && override.category_slug !== categorySlug) return [];
    seen.add(product.slug);
    return [applyOverrideToProduct(product, override)];
  });

  if (!categorySlug) return filtered;

  const movedIn = getCuratedProducts().flatMap((product) => {
    if (seen.has(product.slug)) return [];
    const override = overrides.get(product.slug);
    if (!override || override.hidden || override.merged_into_slug || override.category_slug !== categorySlug) return [];
    seen.add(product.slug);
    return [applyOverrideToProduct(product, override)];
  });

  return [...filtered, ...movedIn];
}

async function fetchSupabaseProductsBySlugs(slugs: string[]): Promise<CatalogProduct[]> {
  if (!slugs.length) return [];
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("products")
    .select("id,shopify_id,title,slug,description,image_url,product_variants(id,shopify_id,title,color,sku,retail_price_cents,wholesale_price_cents,inventory_quantity,image_url,attributes,position)")
    .in("slug", slugs)
    .eq("status", "active");
  return (data || []).map((product): CatalogProduct => ({
    id: product.id,
    shopify_id: product.shopify_id,
    title: product.title,
    slug: product.slug,
    description: product.description,
    image_url: product.image_url,
    variants: (product.product_variants || []).sort((a: any, b: any) => (a.position ?? 99) - (b.position ?? 99))
  }));
}

export async function getCatalogProducts(categorySlug?: string): Promise<CatalogProduct[]> {
  if (categorySlug === "biziluxe-extensions") return applyCatalogOverrides(getBiziLuxeExtensionProducts(), categorySlug);
  if (categorySlug === "bizihair-extensions") return applyCatalogOverrides(getBiziHairProducts(), categorySlug);
  if (categorySlug === "buersten-und-kaemme") {
    const supabaseBrushes = await fetchSupabaseProductsBySlugs(SUPABASE_BRUSH_SLUGS);
    return applyCatalogOverrides(mergeCatalogProducts(getBrushesProducts(), supabaseBrushes), categorySlug);
  }
  const localAccessoryProducts =
    categorySlug === "accessories" || categorySlug === "biziluxe-accessoires"
      ? getBiziLuxeAccessoryProducts()
      : null;
  if (categorySlug === "biziluxe-stylinggeraete") return applyCatalogOverrides(getBiziLuxeStylingToolProducts(), categorySlug);
  if (categorySlug === "profi-friseurbedarf") {
    const supabaseProSalon = await fetchSupabaseProductsBySlugs(SUPABASE_PRO_SALON_SLUGS);
    return applyCatalogOverrides(mergeCatalogProducts(getProSalonProducts(), supabaseProSalon), categorySlug);
  }

  const supabase = await createSupabaseServerClient();
  let productIds: string[] | null = null;
  let needsPathCategoryFallback = false;

  if (categorySlug) {
    const { data: links, error: linksError } = await supabase
      .from("product_collections")
      .select("product_id,collections!inner(slug)")
      .eq("collections.slug", categorySlug);

    if (linksError) {
      console.error("Failed to load category products", linksError);
      return applyCatalogOverrides(getLocalPublicProducts(categorySlug), categorySlug);
    }

    productIds = (links || []).map((link) => link.product_id);
    if (!productIds.length) {
      productIds = null;
      needsPathCategoryFallback = true;
    }
  }

  let query = supabase
    .from("products")
    .select(
      "id,shopify_id,title,slug,description,image_url,product_variants(id,shopify_id,title,color,sku,retail_price_cents,wholesale_price_cents,inventory_quantity,image_url,attributes,position)"
    )
    .eq("status", "active")
    .order("title", { ascending: true });

  if (productIds) {
    query = query.in("id", productIds);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Failed to load catalog products", error);
    return getLocalShopifyProducts(categorySlug);
  }

  const products = (data || []).map((product): CatalogProduct => ({
    id: product.id,
    shopify_id: product.shopify_id,
    title: product.title,
    slug: product.slug,
    description: product.description,
    image_url: product.image_url,
    variants: (product.product_variants || []).sort((a: any, b: any) => (a.position ?? 99) - (b.position ?? 99))
  }));

  if (categorySlug && needsPathCategoryFallback) {
    const pathMatches = products.filter((product) => product.image_url?.includes(`/products/${categorySlug}/`));
    if (localAccessoryProducts) {
      const filtered = pathMatches.filter((p) => !NON_ACCESSORY_SUPABASE_SLUGS.has(p.slug));
      return applyCatalogOverrides(mergeCatalogProducts(localAccessoryProducts, filtered), categorySlug);
    }
    return applyCatalogOverrides(pathMatches.length ? pathMatches : getLocalPublicProducts(categorySlug), categorySlug);
  }

  if (localAccessoryProducts) {
    const filtered = products.filter((p) => !NON_ACCESSORY_SUPABASE_SLUGS.has(p.slug));
    return applyCatalogOverrides(mergeCatalogProducts(localAccessoryProducts, filtered), categorySlug);
  }
  return applyCatalogOverrides(products.length ? products : getLocalPublicProducts(categorySlug), categorySlug);
}

function mergeCatalogProducts(primary: CatalogProduct[], secondary: CatalogProduct[]) {
  const seen = new Set(primary.map((product) => product.slug));
  return [
    ...primary,
    ...secondary.filter((product) => {
      if (seen.has(product.slug)) return false;
      seen.add(product.slug);
      return true;
    })
  ];
}

export async function getCatalogProductBySlug(slug: string): Promise<CatalogProduct | null> {
  const override = await fetchProductOverride(slug);
  if (override?.hidden && !override.merged_into_slug) return null;
  if (override?.merged_into_slug && override.merged_into_slug !== slug) {
    return getCatalogProductBySlug(override.merged_into_slug);
  }
  const extensionSlugs = ["tape-in-extensions", "weft-extensions", "utip-extensions"];
  if (extensionSlugs.includes(slug)) {
    const product = getBiziLuxeExtensionProducts().find((p) => p.slug === slug) || null;
    return mergeAdminImages(product ? applyOverrideToProduct(product, override) : null);
  }
  const brushSlugs = ["mini-travel-brush", "vent-brush", "wooden-paddle-brush", "detangling-brush", "edge-brush-comb", "wide-tint-brush", "celle", "biziluxe-styling-combs", "hameln", "luebeck", "biziluxe-professional-combs"];
  if (brushSlugs.includes(slug)) {
    const product = getBrushesProducts().find((p) => p.slug === slug) || null;
    return mergeAdminImages(product ? applyOverrideToProduct(product, override) : null);
  }
  const biziHairSlugs = ["bizihair-weft-extensions", "bizihair-tape-in-extensions", "bizihair-keratin-extensions"];
  if (biziHairSlugs.includes(slug)) {
    const product = getBiziHairProducts().find((p) => p.slug === slug) || null;
    return mergeAdminImages(product ? applyOverrideToProduct(product, override) : null);
  }
  const accessorySlugs = ["slip-on-bonnet", "tie-up-bonnet", "sectioning-clips", "gator-grip-clips", "fine-mist-spray-bottle", "hair-extension-thread", "hair-weaving-needles", "dortmund", "bocholt", "neuschwanstein", "drachenfels", "berghain", "eisenach", "taunus", "mannheim", "speicherstadt", "hamburger-hafen"];
  if (accessorySlugs.includes(slug)) {
    const product = getBiziLuxeAccessoryProducts().find((p) => p.slug === slug) || null;
    return mergeAdminImages(product ? applyOverrideToProduct(product, override) : null);
  }
  const stylingToolSlugs = ["solingen", "wiesbaden", "glashuette", "ruhrstahl", "zollverein"];
  if (stylingToolSlugs.includes(slug)) {
    const product = getBiziLuxeStylingToolProducts().find((p) => p.slug === slug) || null;
    return mergeAdminImages(product ? applyOverrideToProduct(product, override) : null);
  }
  const proSalonSlugs = ["salon-apron", "smart-bowl", "tinting-tray", "salon-trolley-drawers", "salon-service-trolley", "colour-mixing-trolley", "hair-cutting-cape", "detmold", "essen", "herford", "muenster", "recklinghausen", "paderborn", "wesel", "keratin-heat-shield"];
  if (proSalonSlugs.includes(slug)) {
    const product = getProSalonProducts().find((p) => p.slug === slug) || null;
    return mergeAdminImages(product ? applyOverrideToProduct(product, override) : null);
  }
  const products = await getCatalogProducts();
  const product = products.find((item) => item.slug === slug) || getLocalPublicProductBySlug(slug);
  return mergeAdminImages(product ? applyOverrideToProduct(product, override) : null);
}

async function mergeAdminImages(product: CatalogProduct | null): Promise<CatalogProduct | null> {
  if (!product) return null;
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from("product_images")
      .select("url, position")
      .or(`product_id.eq.${product.id},product_slug.eq.${product.slug}`)
      .neq("hidden", true)
      .order("position", { ascending: true });

    if (data && data.length > 0) {
      const adminGallery = data.map((r: { url: string; position: number }) => r.url);
      return { ...product, gallery: adminGallery, image_url: adminGallery[0] };
    }
  } catch {
    // Fall back to static gallery silently
  }
  return product;
}

export async function getCatalogVariantsByIds(ids: string[]): Promise<CatalogVariant[]> {
  if (!ids.length) return [];

  const products = await getCatalogProducts();
  const variants = products.flatMap((product) =>
    product.variants.map((variant) => ({
      ...variant,
      title: `${product.title} - ${variant.title === "Default Title" ? "Standard" : variant.title}`
    }))
  );

  return variants.filter((variant) => ids.includes(variant.id));
}

function getLocalShopifyProducts(categorySlug?: string): CatalogProduct[] {
  const filePath = path.join(process.cwd(), "shopify-products.json");
  if (!fs.existsSync(filePath)) return getLocalPublicProducts(categorySlug);

  const { products } = JSON.parse(fs.readFileSync(filePath, "utf8")) as {
    products: Array<{
      id: number;
      title: string;
      handle: string;
      body_html?: string;
      images?: Array<{ src: string }>;
      variants: Array<{
        id: number;
        title: string;
        sku?: string;
        price: string;
        inventory_quantity?: number;
      }>;
    }>;
  };

  return products.map((product) => ({
    id: String(product.id),
    shopify_id: product.id,
    title: product.title,
    slug: product.handle,
    description: product.body_html || null,
    image_url: product.images?.[0]?.src || null,
    variants: product.variants.map((variant) => ({
      id: String(variant.id),
      shopify_id: variant.id,
      title: variant.title,
      sku: variant.sku || null,
      retail_price_cents: Math.round(Number(variant.price) * 100),
      wholesale_price_cents: null,
      inventory_quantity: Number(variant.inventory_quantity || 0),
      attributes: {},
      color: null,
      image_url: null
    }))
  }));
}

function getLocalPublicProducts(categorySlug?: string): CatalogProduct[] {
  const productsRoot = path.join(process.cwd(), "public", "products");
  if (!fs.existsSync(productsRoot)) return [];

  const categoryDirs = categorySlug
    ? [categorySlug]
    : fs.readdirSync(productsRoot).filter((entry) => fs.statSync(path.join(productsRoot, entry)).isDirectory());

  return categoryDirs.flatMap((category) => {
    const categoryPath = path.join(productsRoot, category);
    if (!fs.existsSync(categoryPath)) return [];

    return fs
      .readdirSync(categoryPath)
      .filter((file) => file.endsWith("-main.jpg"))
      .map((file, index) => {
        const slug = file.replace("-main.jpg", "");
        const title = toProductTitle(slug);
        const priceCents = getFallbackPrice(category, index);

        return {
          id: `${category}-${slug}`,
          title,
          slug,
          description: `${title} from the ${toProductTitle(category)} collection.`,
          image_url: `/products/${category}/${file}`,
          variants: [
            {
              id: `${category}-${slug}-standard`,
              title: "Standard",
              sku: `${category}-${slug}`.toUpperCase(),
              retail_price_cents: priceCents,
              wholesale_price_cents: Math.round(priceCents * 0.7),
              inventory_quantity: 25,
              attributes: {},
              color: null,
              image_url: null
            }
          ]
        };
      });
  });
}

function getLocalPublicProductBySlug(slug: string): CatalogProduct | null {
  return getLocalPublicProducts().find((product) => product.slug === slug) || null;
}

function getFallbackPrice(category: string, index: number) {
  if (category === "biziluxe-extensions") return 12000 + index * 1500;
  if (category === "profi-friseurbedarf") return 4500 + index * 700;
  if (category === "biziluxe-accessoires") return 2900 + index * 500;
  return 3900 + index * 500;
}

function toProductTitle(slug: string) {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
