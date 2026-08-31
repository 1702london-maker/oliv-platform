import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { PrintInvoiceButton } from "./PrintInvoiceButton";

type Props = {
  params: Promise<{ id: string }>;
};

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

export default async function AdminOrderDetailPage({ params }: Props) {
  const { id } = await params;
  const admin = createSupabaseAdminClient();

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
  const deliveryAddress = formatAddress((order.shipping_address || order.billing_address) as Address | null);

  return (
    <section style={{ maxWidth: 1040, margin: "0 auto", padding: "42px 24px" }}>
      <div className="no-print" style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center", marginBottom: 24 }}>
        <Link href="/admin/orders" style={backLink}>Back to Orders</Link>
        <PrintInvoiceButton />
      </div>

      <article style={invoice}>
        <header style={invoiceHeader}>
          <div>
            <p style={eyebrow}>OlivHairSupply</p>
            <h1 style={title}>Order Invoice</h1>
            <p style={muted}>Invoice for order {String(order.id).slice(0, 8).toUpperCase()}</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <span style={statusBadge(String(order.status || "draft"))}>{order.status || "draft"}</span>
            <p style={{ ...muted, marginTop: 14 }}>{new Date(order.created_at).toLocaleString("en-GB")}</p>
          </div>
        </header>

        <div style={infoGrid}>
          <InfoBlock label="Customer Name" value={order.customer_name || "No name captured"} />
          <InfoBlock label="Email" value={order.email || "No email captured"} />
          <InfoBlock label="Phone Number" value={order.customer_phone || "No phone captured"} />
          <InfoBlock label="Address" value={deliveryAddress} />
          <InfoBlock label="Order ID" value={order.id} mono />
          <InfoBlock label="Affiliate Code" value={order.affiliate_code || "None"} />
        </div>

        <table style={table}>
          <thead>
            <tr>
              <th style={th}>Product Ordered</th>
              <th style={th}>Colour / Options</th>
              <th style={th}>SKU</th>
              <th style={{ ...th, textAlign: "right" }}>Qty</th>
              <th style={{ ...th, textAlign: "right" }}>Unit</th>
              <th style={{ ...th, textAlign: "right" }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {orderItems.length ? orderItems.map((item) => (
              <tr key={item.id} style={{ borderBottom: "1px solid #eadfce" }}>
                <td style={td}>
                  <div style={{ fontWeight: 600 }}>{productName(item.title)}</div>
                </td>
                <td style={td}><ItemOptions title={item.title} /></td>
                <td style={td}><code style={code}>{item.sku || "-"}</code></td>
                <td style={{ ...td, textAlign: "right" }}>{item.quantity || 0}</td>
                <td style={{ ...td, textAlign: "right" }}>{money(item.unit_price_cents || 0, currency)}</td>
                <td style={{ ...td, textAlign: "right", fontWeight: 700 }}>{money(item.total_cents || 0, currency)}</td>
              </tr>
            )) : (
              <tr>
                <td colSpan={6} style={{ ...td, color: "#9b8878", fontStyle: "italic" }}>
                  No item rows were found for this order.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div style={totals}>
          <Row label="Subtotal" value={money(order.subtotal_cents || 0, currency)} />
          <Row label="Discount" value={`-${money(order.discount_cents || 0, currency)}`} />
          <Row label="Total Paid" value={money(order.total_cents || 0, currency)} strong />
        </div>

        <footer style={footer}>
          <p>OlivHairSupply Berlin</p>
          <p>This invoice is generated from the OlivHairSupply admin dashboard.</p>
        </footer>
      </article>
    </section>
  );
}

function ItemOptions({ title }: { title: string | null }) {
  const options = parseItemOptions(title);
  if (!options.length) return <span style={mutedSmall}>No colour or option captured</span>;
  return (
    <div style={optionList}>
      {options.map((option) => (
        <span key={option.label} style={optionPill}>
          <strong>{option.label}:</strong> {option.value}
        </span>
      ))}
    </div>
  );
}

function productName(title: string | null) {
  return String(title || "Untitled product").split(" - ")[0] || "Untitled product";
}

function parseItemOptions(title: string | null) {
  const rawOptions = String(title || "").split(" - ").slice(1).join(" - ");
  if (!rawOptions) return [];
  const parts = rawOptions.split("/").map((part) => part.trim()).filter(Boolean);
  return parts.map((part) => {
    if (/^\d+\s*cm$/i.test(part)) return { label: "Length", value: part };
    if (/^\d+\s*(inch|inches|in)$/i.test(part)) return { label: "Length", value: part };
    return { label: "Colour", value: part };
  });
}

function formatAddress(address: Address | null | undefined) {
  if (!address) return "No address captured";
  const first = [address.line1, address.line2].filter(Boolean).join(", ");
  const second = [address.postal_code, address.city].filter(Boolean).join(" ");
  const third = [address.state, address.country].filter(Boolean).join(", ");
  return [first, second, third].filter(Boolean).join("\n") || "No address captured";
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

function money(cents: number, currency: string) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
  }).format(cents / 100);
}

function statusBadge(status: string): React.CSSProperties {
  const base: React.CSSProperties = { display: "inline-block", padding: "7px 10px", fontSize: 10, fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase" };
  if (status === "paid") return { ...base, background: "#e4eddf", color: "#315f38" };
  if (status === "shipped") return { ...base, background: "#e0eaf8", color: "#1a3f7a" };
  if (status === "cancelled") return { ...base, background: "#f4e4e0", color: "#8b3535" };
  return { ...base, background: "#fdf3e0", color: "#8a6200" };
}

const backLink: React.CSSProperties = { color: "#6b5c4e", fontSize: 11, fontWeight: 700, letterSpacing: ".16em", textTransform: "uppercase", textDecoration: "none" };
const invoice: React.CSSProperties = { background: "#fff", border: "1px solid #e2d5c0", padding: 34, color: "#2b2620" };
const invoiceHeader: React.CSSProperties = { display: "flex", justifyContent: "space-between", gap: 24, borderBottom: "1px solid #e2d5c0", paddingBottom: 24, marginBottom: 24 };
const eyebrow: React.CSSProperties = { color: "#b68a45", fontSize: 10, fontWeight: 700, letterSpacing: ".26em", textTransform: "uppercase", margin: 0 };
const title: React.CSSProperties = { fontFamily: "Georgia, serif", fontSize: 42, fontWeight: 300, margin: "8px 0" };
const muted: React.CSSProperties = { color: "#8f7d6c", fontSize: 12, margin: 0 };
const infoGrid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12, marginBottom: 28 };
const infoBlock: React.CSSProperties = { background: "#fbf7f1", border: "1px solid #eadfce", padding: 14, minWidth: 0 };
const infoLabel: React.CSSProperties = { color: "#b68a45", fontSize: 9, fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", margin: "0 0 7px" };
const infoValue: React.CSSProperties = { color: "#2b2620", fontSize: 12, lineHeight: 1.5, margin: 0, wordBreak: "break-word" };
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
