import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { PrintInvoiceButton } from "./PrintInvoiceButton";

type Props = { params: Promise<{ id: string }> };

type OrderItem = {
  id: string;
  title: string | null;
  sku: string | null;
  quantity: number | null;
  unit_price_cents: number | null;
  total_cents: number | null;
};

type Address = {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
};

type InvoiceCopy = typeof INVOICE_COPY.en;

export default async function AdminOrderDetailPage({ params }: Props) {
  const { id } = await params;
  const admin = createSupabaseAdminClient();
  const cookieStore = await cookies();
  const lang = readInvoiceLang(cookieStore.get("ohs-lang")?.value || cookieStore.get("ohs_lang")?.value);
  const copy = INVOICE_COPY[lang];

  const { data: order } = await admin
    .from("orders")
    .select("id,status,email,currency,subtotal_cents,discount_cents,total_cents,affiliate_code,customer_name,customer_phone,billing_address,shipping_address,created_at,updated_at")
    .eq("id", id)
    .maybeSingle();

  if (!order) notFound();

  const { data: items } = await admin
    .from("order_items")
    .select("id,title,sku,quantity,unit_price_cents,total_cents")
    .eq("order_id", id)
    .order("id", { ascending: true });

  const orderItems = (items || []) as OrderItem[];
  const currency = String(order.currency || "eur").toUpperCase();
  const deliveryAddress = formatAddress((order.shipping_address || order.billing_address) as Address | null) || copy.noAddress;

  return (
    <section className="ohs-invoice-page" style={{ maxWidth: 1040, margin: "0 auto", padding: "42px 24px" }}>
      <div className="no-print" style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center", marginBottom: 24 }}>
        <Link href="/admin/orders" style={backLink}>{copy.backToOrders}</Link>
        <PrintInvoiceButton label={copy.printInvoice} />
      </div>

      <article className="ohs-print-invoice" style={invoice}>
        <header style={invoiceHeader}>
          <div>
            <p style={eyebrow}>OlivHairSupply</p>
            <h1 style={title}>{copy.orderInvoice}</h1>
            <p style={muted}>{copy.invoiceForOrder} {String(order.id).slice(0, 8).toUpperCase()}</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <span style={statusBadge(String(order.status || "draft"))}>
              {copy.status[String(order.status || "draft")] || order.status || "draft"}
            </span>
            <p style={{ ...muted, marginTop: 14 }}>
              {new Date(order.created_at).toLocaleString(lang === "de" ? "de-DE" : "en-GB")}
            </p>
          </div>
        </header>

        <div style={infoGrid}>
          <InfoBlock label={copy.customerName} value={order.customer_name || copy.noName} />
          <InfoBlock label={copy.email} value={order.email || copy.noEmail} />
          <InfoBlock label={copy.phoneNumber} value={order.customer_phone || copy.noPhone} />
          <InfoBlock label={copy.address} value={deliveryAddress} />
          <InfoBlock label={copy.orderId} value={order.id} mono />
          <InfoBlock label={copy.affiliateCode} value={order.affiliate_code || copy.none} />
        </div>

        <table style={table}>
          <thead>
            <tr>
              <th style={th}>{copy.productOrdered}</th>
              <th style={th}>{copy.colourOptions}</th>
              <th style={th}>SKU</th>
              <th style={{ ...th, textAlign: "right" }}>{copy.qty}</th>
              <th style={{ ...th, textAlign: "right" }}>{copy.unit}</th>
              <th style={{ ...th, textAlign: "right" }}>{copy.total}</th>
            </tr>
          </thead>
          <tbody>
            {orderItems.length ? orderItems.map((item) => (
              <tr key={item.id} style={{ borderBottom: "1px solid #eadfce" }}>
                <td style={td}><div style={{ fontWeight: 600 }}>{productName(item.title, copy)}</div></td>
                <td style={td}><ItemOptions title={item.title} copy={copy} /></td>
                <td style={td}><code style={code}>{item.sku || "-"}</code></td>
                <td style={{ ...td, textAlign: "right" }}>{item.quantity || 0}</td>
                <td style={{ ...td, textAlign: "right" }}>{money(item.unit_price_cents || 0, currency, lang)}</td>
                <td style={{ ...td, textAlign: "right", fontWeight: 700 }}>{money(item.total_cents || 0, currency, lang)}</td>
              </tr>
            )) : (
              <tr>
                <td colSpan={6} style={{ ...td, color: "#9b8878", fontStyle: "italic" }}>{copy.noItems}</td>
              </tr>
            )}
          </tbody>
        </table>

        <div style={totals}>
          <Row label={copy.subtotal} value={money(order.subtotal_cents || 0, currency, lang)} />
          <Row label={copy.discount} value={`-${money(order.discount_cents || 0, currency, lang)}`} />
          <Row label={copy.totalPaid} value={money(order.total_cents || 0, currency, lang)} strong />
        </div>

        <footer style={footer}>
          <p>OlivHairSupply Berlin</p>
          <p>{copy.footer}</p>
        </footer>
      </article>
    </section>
  );
}

function ItemOptions({ title, copy }: { title: string | null; copy: InvoiceCopy }) {
  const options = parseItemOptions(title, copy);
  if (!options.length) return <span style={mutedSmall}>{copy.noOptions}</span>;
  return (
    <div style={optionList}>
      {options.map((option, index) => (
        <span key={`${option.label}-${option.value}-${index}`} style={optionPill}>
          <strong>{option.label}:</strong> {option.value}
        </span>
      ))}
    </div>
  );
}

function productName(title: string | null, copy: InvoiceCopy) {
  return String(title || copy.untitledProduct).split(" - ")[0] || copy.untitledProduct;
}

function parseItemOptions(title: string | null, copy: InvoiceCopy) {
  const rawOptions = String(title || "").split(" - ").slice(1).join(" - ");
  if (!rawOptions) return [];
  return rawOptions.split("/").map((part) => part.trim()).filter(Boolean).map((part) => {
    if (/^\d+\s*cm$/i.test(part) || /^\d+\s*(inch|inches|in)$/i.test(part)) {
      return { label: copy.length, value: part };
    }
    return { label: copy.colour, value: part.replace(/^Colour:\s*/i, "") };
  });
}

function formatAddress(address: Address | null | undefined) {
  if (!address) return "";
  const first = [address.line1, address.line2].filter(Boolean).join(", ");
  const second = [address.postal_code, address.city].filter(Boolean).join(" ");
  const third = [address.state, address.country].filter(Boolean).join(", ");
  return [first, second, third].filter(Boolean).join("\n");
}

function InfoBlock({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={infoBlock}>
      <p style={infoLabel}>{label}</p>
      <p style={{ ...infoValue, fontFamily: mono ? "monospace" : "Montserrat, Arial, sans-serif" }}>{value}</p>
    </div>
  );
}

function Row({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div style={totalRow}>
      <span>{label}</span>
      <strong style={{ fontSize: strong ? 20 : 14 }}>{value}</strong>
    </div>
  );
}

function money(cents: number, currency: string, lang: "en" | "de") {
  return new Intl.NumberFormat(lang === "de" ? "de-DE" : "en-GB", { style: "currency", currency }).format(cents / 100);
}

function readInvoiceLang(value: string | null | undefined): "en" | "de" {
  return value === "en" ? "en" : "de";
}

function statusBadge(status: string): React.CSSProperties {
  const base: React.CSSProperties = { display: "inline-block", padding: "7px 10px", fontSize: 10, fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase" };
  if (status === "paid") return { ...base, background: "#e4eddf", color: "#315f38" };
  if (status === "shipped") return { ...base, background: "#e0eaf8", color: "#1a3f7a" };
  if (status === "cancelled") return { ...base, background: "#f4e4e0", color: "#8b3535" };
  return { ...base, background: "#fdf3e0", color: "#8a6200" };
}

const INVOICE_COPY = {
  en: {
    backToOrders: "Back to Orders",
    printInvoice: "Print Invoice",
    orderInvoice: "Order Invoice",
    invoiceForOrder: "Invoice for order",
    customerName: "Customer Name",
    email: "Email",
    phoneNumber: "Phone Number",
    address: "Address",
    orderId: "Order ID",
    affiliateCode: "Affiliate Code",
    productOrdered: "Product Ordered",
    colourOptions: "Colour / Options",
    qty: "Qty",
    unit: "Unit",
    total: "Total",
    subtotal: "Subtotal",
    discount: "Discount",
    totalPaid: "Total Paid",
    colour: "Colour",
    length: "Length",
    none: "None",
    untitledProduct: "Untitled product",
    noName: "No name captured",
    noEmail: "No email captured",
    noPhone: "No phone captured",
    noAddress: "No address captured",
    noOptions: "No colour or option captured",
    noItems: "No item rows were found for this order.",
    footer: "This invoice is generated from the OlivHairSupply admin dashboard.",
    status: { draft: "Draft", paid: "Paid", shipped: "Shipped", cancelled: "Cancelled" } as Record<string, string>,
  },
  de: {
    backToOrders: "Zurueck zu Bestellungen",
    printInvoice: "Rechnung drucken",
    orderInvoice: "Bestellrechnung",
    invoiceForOrder: "Rechnung fuer Bestellung",
    customerName: "Kundenname",
    email: "E-Mail",
    phoneNumber: "Telefonnummer",
    address: "Adresse",
    orderId: "Bestellnummer",
    affiliateCode: "Affiliate-Code",
    productOrdered: "Bestelltes Produkt",
    colourOptions: "Farbe / Optionen",
    qty: "Menge",
    unit: "Einzelpreis",
    total: "Gesamt",
    subtotal: "Zwischensumme",
    discount: "Rabatt",
    totalPaid: "Gesamt bezahlt",
    colour: "Farbe",
    length: "Laenge",
    none: "Keine",
    untitledProduct: "Unbenanntes Produkt",
    noName: "Kein Name erfasst",
    noEmail: "Keine E-Mail erfasst",
    noPhone: "Keine Telefonnummer erfasst",
    noAddress: "Keine Adresse erfasst",
    noOptions: "Keine Farbe oder Option erfasst",
    noItems: "Fuer diese Bestellung wurden keine Artikelzeilen gefunden.",
    footer: "Diese Rechnung wurde im OlivHairSupply Admin-Dashboard erstellt.",
    status: { draft: "Entwurf", paid: "Bezahlt", shipped: "Versendet", cancelled: "Storniert" } as Record<string, string>,
  },
};

const backLink: React.CSSProperties = { color: "#6b5c4e", fontSize: 11, fontWeight: 700, letterSpacing: ".16em", textTransform: "uppercase", textDecoration: "none" };
const invoice: React.CSSProperties = { background: "#fff", border: "1px solid #e2d5c0", padding: 34, color: "#2b2620" };
const invoiceHeader: React.CSSProperties = { display: "flex", justifyContent: "space-between", gap: 24, borderBottom: "1px solid #e2d5c0", paddingBottom: 24, marginBottom: 24 };
const eyebrow: React.CSSProperties = { color: "#b68a45", fontSize: 10, fontWeight: 700, letterSpacing: ".26em", textTransform: "uppercase", margin: 0 };
const title: React.CSSProperties = { fontFamily: "Georgia, serif", fontSize: 42, fontWeight: 300, margin: "8px 0" };
const muted: React.CSSProperties = { color: "#8f7d6c", fontSize: 12, margin: 0 };
const infoGrid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12, marginBottom: 28 };
const infoBlock: React.CSSProperties = { background: "#fbf7f1", border: "1px solid #eadfce", padding: 14, minWidth: 0 };
const infoLabel: React.CSSProperties = { color: "#b68a45", fontSize: 9, fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", margin: "0 0 7px" };
const infoValue: React.CSSProperties = { color: "#2b2620", fontSize: 12, lineHeight: 1.5, margin: 0, wordBreak: "break-word", whiteSpace: "pre-line" };
const table: React.CSSProperties = { width: "100%", borderCollapse: "collapse", border: "1px solid #e2d5c0", fontSize: 13 };
const th: React.CSSProperties = { background: "#2b2620", color: "#fff", padding: "11px 12px", textAlign: "left", fontSize: 9.5, fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase" };
const td: React.CSSProperties = { padding: "13px 12px", verticalAlign: "top" };
const code: React.CSSProperties = { fontSize: 11, color: "#6b5c4e" };
const optionList: React.CSSProperties = { display: "flex", flexWrap: "wrap", gap: 7, marginTop: 8 };
const optionPill: React.CSSProperties = { display: "inline-flex", gap: 4, border: "1px solid #eadfce", background: "#fbf7f1", color: "#6b5c4e", padding: "5px 7px", fontSize: 10, lineHeight: 1.2 };
const mutedSmall: React.CSSProperties = { color: "#9b8878", fontSize: 11, fontStyle: "italic" };
const totals: React.CSSProperties = { width: "min(360px, 100%)", marginLeft: "auto", marginTop: 24, border: "1px solid #e2d5c0" };
const totalRow: React.CSSProperties = { display: "flex", justifyContent: "space-between", gap: 18, padding: "13px 16px", borderBottom: "1px solid #eadfce", fontSize: 13 };
const footer: React.CSSProperties = { marginTop: 34, borderTop: "1px solid #e2d5c0", paddingTop: 18, color: "#8f7d6c", fontSize: 11, lineHeight: 1.7 };
