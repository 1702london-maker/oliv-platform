import { NextRequest, NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/auth/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

async function isAdmin() {
  const profile = await getCurrentProfile();
  return profile?.roles.includes("admin") ?? false;
}

// GET /api/admin/products/colors?slug=xxx
export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug");
  if (!slug) return NextResponse.json({ error: "missing slug" }, { status: 400 });
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("product_colors")
    .select("id, name, hex, image_url, in_stock, position")
    .eq("product_slug", slug)
    .order("position", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ colors: data ?? [] });
}

// POST /api/admin/products/colors — add a colour
export async function POST(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { product_slug, name, hex, image_url } = await req.json();
  if (!product_slug || !name || !hex) return NextResponse.json({ error: "missing fields" }, { status: 400 });
  const admin = createSupabaseAdminClient();
  const { data: existing } = await admin.from("product_colors").select("position").eq("product_slug", product_slug).order("position", { ascending: false }).limit(1).maybeSingle();
  const position = (existing?.position ?? -1) + 1;
  const { data, error } = await admin.from("product_colors").insert({ product_slug, name, hex, image_url: image_url || null, position }).select("id, name, hex, image_url, in_stock, position").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ color: data });
}

// PATCH /api/admin/products/colors — update a colour
export async function PATCH(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id, name, hex, image_url, in_stock } = await req.json();
  if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });
  const admin = createSupabaseAdminClient();
  const updates: Record<string, unknown> = {};
  if (name !== undefined) updates.name = name;
  if (hex !== undefined) updates.hex = hex;
  if (image_url !== undefined) updates.image_url = image_url || null;
  if (in_stock !== undefined) updates.in_stock = in_stock;
  const { error } = await admin.from("product_colors").update(updates).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// DELETE /api/admin/products/colors?id=xxx
export async function DELETE(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });
  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("product_colors").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
