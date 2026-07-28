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
  variants: CatalogVariant[];
  attributes?: Record<string, unknown>;
};

// BiziLuxe colour codes — exactly as written in the product documents
const BIZILUXE_COLOURS = [
  { name: "1",      hex: "#1C1008",                                           img: "colour-1.jpg" },
  { name: "1B",     hex: "#2C1A0E",                                           img: "colour-1a.jpg" },
  { name: "2",      hex: "#5A3520",                                           img: "colour-2.jpg" },
  { name: "Ice",    hex: "#EDE8DE",                                           img: "colour-613.jpg" },
  { name: "Silver", hex: "#C8BFA8",                                           img: "colour-60a.jpg" },
  { name: "18/60B", hex: "linear-gradient(135deg,#3D2314 50%,#EDE0C0 50%)",  img: "colour-sb.jpg" },
  { name: "4/6/8",  hex: "linear-gradient(135deg,#8B5E3C 40%,#C8A870 60%)",  img: "colour-4-6-8.jpg" },
  { name: "8/22",   hex: "linear-gradient(135deg,#9B7040 50%,#D8CDB8 50%)",  img: "colour-8-22.jpg" },
];

// BiziHair colour codes — exactly as written in the product documents
const BIZIHAIR_COLOURS = [
  { name: "1",   hex: "#1C1008", img: "colour-1.jpg" },
  { name: "1A",  hex: "#231A10", img: "colour-1a.jpg" },
  { name: "1B",  hex: "#3D2314", img: "colour-1b.jpg" },
  { name: "2",   hex: "#6B3A22", img: "colour-2.jpg" },
  { name: "4",   hex: "#8B5E3C", img: "colour-4.jpg" },
  { name: "8",   hex: "#9B7040", img: "colour-8.jpg" },
  { name: "Red", hex: "#8B1A1A", img: "colour-red.jpg" },
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
    { id: "tinting-tray-white",    title: "Tinting Tray White",              price:  990, desc: "Professional white colour mixing tray with measurement markings. Lightweight and easy to clean." },
    { id: "tinting-tray-black",    title: "Tinting Tray Black",              price:  990, desc: "Professional black colour mixing tray with measurement markings. Lightweight and easy to clean." },
    { id: "salon-trolley-drawers", title: "Salon Trolley with Drawers",      price: 12900, desc: "Professional salon trolley with 5 pull-out drawers. Wood-effect panels with metal frame and lockable castors." },
    { id: "salon-service-trolley", title: "Salon Service Trolley",           price: 9900, desc: "3-shelf black salon service trolley with top tray, tool holder and lockable castors. Ideal for colouring services." },
    { id: "colour-mixing-trolley", title: "Colour Mixing Trolley",           price: 14900, desc: "Premium acrylic colour mixing trolley with 3 mixing bowl holders, tool holder and lower storage shelf." },
    { id: "hair-cutting-cape",     title: "Professional Hair Cutting Cape",  price: 1490, desc: "Waterproof professional hair cutting cape. Full-length coverage with adjustable neck closure. Salon quality." },
  ];
  return items.map((item) => ({
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
  }));
}

function getBiziLuxeAccessoryProducts(): CatalogProduct[] {
  const proAccessories: CatalogProduct[] = [
    {
      id: "gator-grip-clips",
      title: "Gator Grip Clips",
      slug: "gator-grip-clips",
      description: "Professional metal Gator Grip sectioning clips. Strong spring mechanism for secure hold. Pack of 12.",
      image_url: "/products/accessories/gator-grip-clips/gator-grip-clips-main.jpg",
      attributes: {},
      variants: [{ id: "gator-grip-clips-standard", title: "Standard", color: null, sku: "GATOR-GRIP-CLIPS", image_url: "/products/accessories/gator-grip-clips/gator-grip-clips-main.jpg", attributes: {}, retail_price_cents: 1490, wholesale_price_cents: 1043, inventory_quantity: 25 }]
    },
    {
      id: "matte-section-clips",
      title: "Matte Section Clips",
      slug: "matte-section-clips",
      description: "Matte black professional sectioning clips. Soft-grip finish, strong hold. Pack of 6.",
      image_url: "/products/accessories/matte-section-clips/matte-section-clips-main.jpg",
      attributes: {},
      variants: [{ id: "matte-section-clips-standard", title: "Standard", color: null, sku: "MATTE-SECTION-CLIPS", image_url: "/products/accessories/matte-section-clips/matte-section-clips-main.jpg", attributes: {}, retail_price_cents: 990, wholesale_price_cents: 693, inventory_quantity: 25 }]
    },
    {
      id: "sectioning-clips",
      title: "Sectioning Clips (6 Pack)",
      slug: "sectioning-clips",
      description: "Professional white sectioning clips. Lightweight with strong spring. Pack of 6.",
      image_url: "/products/accessories/sectioning-clips/sectioning-clips-main.jpg",
      attributes: {},
      variants: [{ id: "sectioning-clips-standard", title: "Standard", color: null, sku: "SECTIONING-CLIPS-6", image_url: "/products/accessories/sectioning-clips/sectioning-clips-main.jpg", attributes: {}, retail_price_cents: 790, wholesale_price_cents: 553, inventory_quantity: 30 }]
    },
    {
      id: "fine-mist-spray-bottle",
      title: "Fine Mist Spray Bottle",
      slug: "fine-mist-spray-bottle",
      description: "BiziLuxe fine mist continuous spray bottle. 300ml capacity. Ideal for moisturising and styling.",
      image_url: "/products/accessories/fine-mist-spray-bottle/fine-mist-spray-bottle-main.jpg",
      attributes: {},
      variants: [{ id: "fine-mist-spray-bottle-standard", title: "Standard", color: null, sku: "FINE-MIST-SPRAY", image_url: "/products/accessories/fine-mist-spray-bottle/fine-mist-spray-bottle-main.jpg", attributes: {}, retail_price_cents: 1290, wholesale_price_cents: 903, inventory_quantity: 20 }]
    },
    {
      id: "hair-extension-thread",
      title: "Hair Extension Thread",
      slug: "hair-extension-thread",
      description: "Professional hair extension thread in Black, Brown and Clear. Strong elastic thread for weaving and Brazilian knot techniques.",
      image_url: "/products/accessories/hair-extension-thread/hair-extension-thread-main.jpg",
      attributes: {},
      variants: [
        { id: "hair-extension-thread-black",  title: "Black",  color: "Black",  sku: "HAIR-THREAD-BLACK",  image_url: "/products/accessories/hair-extension-thread/hair-extension-thread-main.jpg", attributes: { colour_hex: "#1A1A1A" }, retail_price_cents: 890, wholesale_price_cents: 623, inventory_quantity: 30 },
        { id: "hair-extension-thread-brown",  title: "Brown",  color: "Brown",  sku: "HAIR-THREAD-BROWN",  image_url: "/products/accessories/hair-extension-thread/hair-extension-thread-main.jpg", attributes: { colour_hex: "#5C3A1E" }, retail_price_cents: 890, wholesale_price_cents: 623, inventory_quantity: 30 },
        { id: "hair-extension-thread-clear",  title: "Clear",  color: "Clear",  sku: "HAIR-THREAD-CLEAR",  image_url: "/products/accessories/hair-extension-thread/hair-extension-thread-main.jpg", attributes: { colour_hex: "#ECECEC" }, retail_price_cents: 890, wholesale_price_cents: 623, inventory_quantity: 30 },
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
  ];

  return [
    ...proAccessories,
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
    }
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
      title: "BiziLuxe Mini Travel Brush",
      slug: "mini-travel-brush",
      description: "Compact folding travel hair brush with soft nylon bristles. Ideal for handbags, travel and everyday styling. Available in 3 colours.",
      image_url: "/products/buersten-und-kaemme/mini-travel-brush/white-ivory/mini-travel-brush-main.jpg",
      attributes: {},
      variants: MINI_BRUSH_COLOURS.map((colour) => ({
        id: `mini-travel-brush-${colour.name}`.toLowerCase().replace(/[\s/]+/g, "-"),
        title: colour.name,
        color: colour.name,
        sku: `BIZILUXE-MINI-BRUSH-${colour.name}`.toUpperCase().replace(/[\s/]+/g, "-"),
        image_url: `/products/buersten-und-kaemme/mini-travel-brush/${colour.img}`,
        attributes: { colour_hex: colour.hex },
        retail_price_cents: 1490,
        wholesale_price_cents: 1043,
        inventory_quantity: 30
      }))
    },
    {
      id: "vent-brush",
      title: "BiziLuxe Vent Brush",
      slug: "vent-brush",
      description: "Professional hair brush designed for smooth detangling, comfortable styling and everyday salon or home use.",
      image_url: "/products/buersten-und-kaemme/vent-brush/vent-brush-main.jpg",
      attributes: {},
      variants: [{
        id: "vent-brush-standard",
        title: "Standard",
        color: null,
        sku: "BIZILUXE-VENT-BRUSH",
        image_url: "/products/buersten-und-kaemme/vent-brush/vent-brush-main.jpg",
        attributes: {},
        retail_price_cents: 2490,
        wholesale_price_cents: 1743,
        inventory_quantity: 30
      }]
    },
    {
      id: "wooden-paddle-brush",
      title: "BiziLuxe Wooden Paddle Brush",
      slug: "wooden-paddle-brush",
      description: "Professional hair brush designed for smooth detangling, comfortable styling and everyday salon or home use.",
      image_url: "/products/buersten-und-kaemme/wooden-paddle-brush/wooden-paddle-brush-main.jpg",
      attributes: {},
      variants: [{
        id: "wooden-paddle-brush-standard",
        title: "Standard",
        color: null,
        sku: "BIZILUXE-WOODEN-PADDLE-BRUSH",
        image_url: "/products/buersten-und-kaemme/wooden-paddle-brush/wooden-paddle-brush-main.jpg",
        attributes: {},
        retail_price_cents: 2990,
        wholesale_price_cents: 2093,
        inventory_quantity: 30
      }]
    },
    {
      id: "detangling-brush",
      title: "BiziLuxe Detangling Brush",
      slug: "detangling-brush",
      description: "Professional hair brush designed for smooth detangling, comfortable styling and everyday salon or home use.",
      image_url: "/products/buersten-und-kaemme/detangling-brush/detangling-brush-main.jpg",
      attributes: {},
      variants: [{
        id: "detangling-brush-standard",
        title: "Standard",
        color: null,
        sku: "BIZILUXE-DETANGLING-BRUSH",
        image_url: "/products/buersten-und-kaemme/detangling-brush/detangling-brush-main.jpg",
        attributes: {},
        retail_price_cents: 1990,
        wholesale_price_cents: 1393,
        inventory_quantity: 30
      }]
    },
    {
      id: "edge-brush-comb-yellow",
      title: "Edge Brush & Comb (Yellow)",
      slug: "edge-brush-comb-yellow",
      description: "Dual-ended edge brush and comb for precise edge styling and baby hair control. Firm bristles with fine-tooth comb end.",
      image_url: "/products/buersten-und-kaemme/edge-brush-comb-yellow/edge-brush-comb-yellow-main.jpg",
      attributes: {},
      variants: [{
        id: "edge-brush-comb-yellow-standard",
        title: "Standard",
        color: null,
        sku: "EDGE-BRUSH-COMB-YELLOW",
        image_url: "/products/buersten-und-kaemme/edge-brush-comb-yellow/edge-brush-comb-yellow-main.jpg",
        attributes: {},
        retail_price_cents: 990,
        wholesale_price_cents: 693,
        inventory_quantity: 30
      }]
    },
    {
      id: "edge-brush-comb-blue",
      title: "Edge Brush & Comb (Blue)",
      slug: "edge-brush-comb-blue",
      description: "Dual-ended edge brush and comb for precise edge styling and baby hair control. Firm bristles with fine-tooth comb end.",
      image_url: "/products/buersten-und-kaemme/edge-brush-comb-blue/edge-brush-comb-blue-main.jpg",
      attributes: {},
      variants: [{
        id: "edge-brush-comb-blue-standard",
        title: "Standard",
        color: null,
        sku: "EDGE-BRUSH-COMB-BLUE",
        image_url: "/products/buersten-und-kaemme/edge-brush-comb-blue/edge-brush-comb-blue-main.jpg",
        attributes: {},
        retail_price_cents: 990,
        wholesale_price_cents: 693,
        inventory_quantity: 30
      }]
    },
    {
      id: "wide-tint-brush-white",
      title: "Wide Tint Brush (White)",
      slug: "wide-tint-brush-white",
      description: "Professional wide tint brush for colour application. Flexible bristles for even distribution of colour products.",
      image_url: "/products/buersten-und-kaemme/wide-tint-brush-white/wide-tint-brush-white-main.jpg",
      attributes: {},
      variants: [{
        id: "wide-tint-brush-white-standard",
        title: "Standard",
        color: null,
        sku: "WIDE-TINT-BRUSH-WHITE",
        image_url: "/products/buersten-und-kaemme/wide-tint-brush-white/wide-tint-brush-white-main.jpg",
        attributes: {},
        retail_price_cents: 1290,
        wholesale_price_cents: 903,
        inventory_quantity: 25
      }]
    },
    {
      id: "wide-tint-brush-black",
      title: "Wide Tint Brush (Black)",
      slug: "wide-tint-brush-black",
      description: "Professional wide tint brush for colour application. Flexible bristles for even distribution of colour products.",
      image_url: "/products/buersten-und-kaemme/wide-tint-brush-black/wide-tint-brush-black-main.jpg",
      attributes: {},
      variants: [{
        id: "wide-tint-brush-black-standard",
        title: "Standard",
        color: null,
        sku: "WIDE-TINT-BRUSH-BLACK",
        image_url: "/products/buersten-und-kaemme/wide-tint-brush-black/wide-tint-brush-black-main.jpg",
        attributes: {},
        retail_price_cents: 1290,
        wholesale_price_cents: 903,
        inventory_quantity: 25
      }]
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
      id: "goslar",
      title: "BiziLuxe Rat-Tail Comb",
      slug: "goslar",
      description: "BiziLuxe Styling Comb Collection. Premium rat-tail comb for precise sectioning and styling. Chemical & heat resistant.",
      image_url: "/products/buersten-und-kaemme/goslar/goslar-main.jpg",
      attributes: {},
      variants: [{ id: "goslar-standard", title: "Standard", color: null, sku: "BIZILUXE-RAT-TAIL-COMB", image_url: "/products/buersten-und-kaemme/goslar/goslar-main.jpg", attributes: {}, retail_price_cents: 890, wholesale_price_cents: 623, inventory_quantity: 30 }]
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
      id: "hildesheim",
      title: "BiziLuxe Styling Comb",
      slug: "hildesheim",
      description: "BiziLuxe Styling Comb Collection. Fine-tooth tail comb for precise parting, backcombing and finishing. Chemical & heat resistant.",
      image_url: "/products/buersten-und-kaemme/hildesheim/hildesheim-main.jpg",
      attributes: {},
      variants: [{ id: "hildesheim-standard", title: "Standard", color: null, sku: "BIZILUXE-STYLING-COMB", image_url: "/products/buersten-und-kaemme/hildesheim/hildesheim-main.jpg", attributes: {}, retail_price_cents: 890, wholesale_price_cents: 623, inventory_quantity: 30 }]
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
      id: "lueneburg",
      title: "BiziLuxe Pocket Comb",
      slug: "lueneburg",
      description: "BiziLuxe compact folding pocket comb with mixed boar and nylon bristles. Folds flat for handbag or travel. Comes in BiziLuxe gift packaging.",
      image_url: "/products/buersten-und-kaemme/lueneburg/lueneburg-main.jpg",
      attributes: {},
      variants: [{ id: "lueneburg-standard", title: "Standard", color: null, sku: "BIZILUXE-POCKET-COMB", image_url: "/products/buersten-und-kaemme/lueneburg/lueneburg-main.jpg", attributes: {}, retail_price_cents: 1490, wholesale_price_cents: 1043, inventory_quantity: 25 }]
    },
    {
      id: "wolfenbuettel",
      title: "BiziLuxe Dressing Comb",
      slug: "wolfenbuettel",
      description: "BiziLuxe Styling Comb Collection. Professional dressing comb with fine teeth and metal rat-tail pin. For all hair types. Chemical & heat resistant.",
      image_url: "/products/buersten-und-kaemme/wolfenbuettel/wolfenbuettel-main.jpg",
      attributes: {},
      variants: [{ id: "wolfenbuettel-standard", title: "Standard", color: null, sku: "BIZILUXE-DRESSING-COMB", image_url: "/products/buersten-und-kaemme/wolfenbuettel/wolfenbuettel-main.jpg", attributes: {}, retail_price_cents: 1090, wholesale_price_cents: 763, inventory_quantity: 30 }]
    },
    {
      id: "bremen",
      title: "BiziLuxe Flexible Vent Brush",
      slug: "bremen",
      description: "BiziLuxe flexible vent brush with open-slot base and ball-tipped pins. Reduces breakage during blow-drying and detangling.",
      image_url: "/products/buersten-und-kaemme/bremen-main.jpg",
      attributes: {},
      variants: [{ id: "bremen-standard", title: "Standard", color: null, sku: "BIZILUXE-FLEX-VENT-BRUSH", image_url: "/products/buersten-und-kaemme/bremen-main.jpg", attributes: {}, retail_price_cents: 2190, wholesale_price_cents: 1533, inventory_quantity: 20 }]
    }
  ];
}

function getBiziHairProducts(): CatalogProduct[] {
  return [
    {
      id: "bizihair-weft",
      title: "BiziHair Genius Weft Extensions",
      slug: "bizihair-weft-extensions",
      description: "BiziHair Genius Weft Echthaar Extensions. Erhältlich in 7 Farben und 8 Längen.",
      image_url: "/products/bizihair-extensions/weft/weft-main.jpg",
      attributes: {},
      variants: BIZIHAIR_COLOURS.flatMap((colour) =>
        LENGTHS.map((length) => ({
          id: `bizihair-weft-${colour.name}-${length}`.toLowerCase().replace(/[\s/]+/g, "-"),
          title: `${colour.name} / ${length}`,
          color: colour.name,
          sku: `BIZIHAIR-WEFT-${colour.name}-${length}`.toUpperCase().replace(/[\s/]+/g, "-"),
          image_url: `/products/bizihair-extensions/weft/${colour.img}`,
          attributes: { length, colour_hex: colour.hex },
          retail_price_cents: 8900 + (LENGTHS.indexOf(length) * 1000),
          wholesale_price_cents: Math.round((8900 + LENGTHS.indexOf(length) * 1000) * 0.7),
          inventory_quantity: 20
        }))
      )
    }
  ];
}

export async function getCatalogProducts(categorySlug?: string): Promise<CatalogProduct[]> {
  if (categorySlug === "biziluxe-extensions") return getBiziLuxeExtensionProducts();
  if (categorySlug === "bizihair-extensions") return getBiziHairProducts();
  if (categorySlug === "buersten-und-kaemme") return getBrushesProducts();
  if (categorySlug === "accessories" || categorySlug === "biziluxe-accessoires") return getBiziLuxeAccessoryProducts();
  if (categorySlug === "profi-friseurbedarf") return getProSalonProducts();

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
      return getLocalPublicProducts(categorySlug);
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
    return pathMatches.length ? pathMatches : getLocalPublicProducts(categorySlug);
  }

  return products.length ? products : getLocalPublicProducts(categorySlug);
}

export async function getCatalogProductBySlug(slug: string): Promise<CatalogProduct | null> {
  const extensionSlugs = ["tape-in-extensions", "weft-extensions", "utip-extensions"];
  if (extensionSlugs.includes(slug)) {
    return getBiziLuxeExtensionProducts().find((p) => p.slug === slug) || null;
  }
  const brushSlugs = ["mini-travel-brush", "vent-brush", "wooden-paddle-brush", "detangling-brush", "edge-brush-comb-yellow", "edge-brush-comb-blue", "wide-tint-brush-white", "wide-tint-brush-black", "celle", "goslar", "hameln", "hildesheim", "luebeck", "lueneburg", "wolfenbuettel", "bremen"];
  if (brushSlugs.includes(slug)) {
    return getBrushesProducts().find((p) => p.slug === slug) || null;
  }
  if (slug === "bizihair-weft-extensions") {
    return getBiziHairProducts()[0];
  }
  const accessorySlugs = ["slip-on-bonnet", "tie-up-bonnet", "gator-grip-clips", "matte-section-clips", "sectioning-clips", "fine-mist-spray-bottle", "hair-extension-thread", "hair-weaving-needles"];
  if (accessorySlugs.includes(slug)) {
    return getBiziLuxeAccessoryProducts().find((p) => p.slug === slug) || null;
  }
  const proSalonSlugs = ["salon-apron", "smart-bowl", "tinting-tray-white", "tinting-tray-black", "salon-trolley-drawers", "salon-service-trolley", "colour-mixing-trolley", "hair-cutting-cape"];
  if (proSalonSlugs.includes(slug)) {
    return getProSalonProducts().find((p) => p.slug === slug) || null;
  }
  const products = await getCatalogProducts();
  return products.find((product) => product.slug === slug) || getLocalPublicProductBySlug(slug);
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
