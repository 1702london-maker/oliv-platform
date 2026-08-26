import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { MediaManager } from "./MediaManager";

export const dynamic = "force-dynamic";

export const CATEGORIES = [
  { key: "bizihair-extensions", label: "BiziHair Extensions" },
  { key: "biziluxe-extensions", label: "BiziLuxe Extensions" },
  { key: "biziluxe-accessories", label: "BiziLuxe Accessories" },
  { key: "brushes-combs", label: "Brushes & Combs" },
  { key: "pro-salon-supplies", label: "Pro Salon Supplies" },
];

export default async function MediaPage() {
  const admin = createSupabaseAdminClient();

  const { data: images } = await admin
    .from("product_images")
    .select("id, url, position, category, product_id, created_at")
    .order("created_at", { ascending: false });

  return (
    <section style={{ padding: "36px 32px", maxWidth: 1400 }}>
      <p style={eyebrow}>Admin</p>
      <h1 style={title}>Media Library</h1>
      <p style={{ color: "#6b5c4e", fontSize: 13, margin: "6px 0 28px" }}>
        Upload images to any category. Drag to reorder. Move images between categories.
      </p>
      <MediaManager initialImages={images || []} categories={CATEGORIES} />
    </section>
  );
}

const eyebrow: React.CSSProperties = { color: "#b68a45", fontSize: 10, fontWeight: 700, letterSpacing: "0.24em", textTransform: "uppercase", margin: 0 };
const title: React.CSSProperties = { fontFamily: "Georgia, serif", fontSize: 40, fontWeight: 300, margin: "6px 0 0" };
