import { NextRequest, NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/auth/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

async function requireAdmin() {
  const profile = await getCurrentProfile();
  if (!profile?.roles.includes("admin")) throw new Error("unauthorized");
}

// POST → upload a replacement image for a page
export async function POST(req: NextRequest) {
  try { await requireAdmin(); } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }
  const form = await req.formData();
  const file = form.get("file") as File | null;
  const pageKey = form.get("pageKey") as string | null;
  const originalSrc = form.get("originalSrc") as string | null;
  if (!file || !pageKey || !originalSrc) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const ext = file.name.split(".").pop() || "jpg";
  const storagePath = `page-overrides/${pageKey}/${Date.now()}.${ext}`;
  const admin = createSupabaseAdminClient();
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await admin.storage
    .from("product-images")
    .upload(storagePath, buffer, { contentType: file.type || "image/jpeg", upsert: true });
  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

  const { data: urlData } = admin.storage.from("product-images").getPublicUrl(storagePath);

  const { data, error: dbError } = await admin
    .from("page_images")
    .upsert(
      { page_key: pageKey, original_src: normalizeOriginalSrc(originalSrc), replacement_url: urlData.publicUrl },
      { onConflict: "page_key,original_src" }
    )
    .select("id")
    .single();
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });

  return NextResponse.json({ id: data.id, url: urlData.publicUrl });
}

function normalizeOriginalSrc(src: string) {
  try {
    const url = new URL(src, "https://olivhairsupply.de");
    return `${url.pathname}${url.search}`;
  } catch {
    return src;
  }
}

// DELETE → remove a page image override (restores original)
export async function DELETE(req: NextRequest) {
  try { await requireAdmin(); } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const admin = createSupabaseAdminClient();
  const { data: row } = await admin.from("page_images").select("replacement_url").eq("id", id).single();

  if (row?.replacement_url) {
    try {
      const url = new URL(row.replacement_url);
      const parts = url.pathname.split("/object/public/product-images/");
      if (parts[1]) await admin.storage.from("product-images").remove([decodeURIComponent(parts[1])]);
    } catch { /* non-fatal */ }
  }

  const { error } = await admin.from("page_images").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
