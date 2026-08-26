import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const file = form.get("file") as File | null;
  const pageKey = form.get("pageKey") as string | null;
  const originalSrc = form.get("originalSrc") as string | null;

  if (!file || !pageKey || !originalSrc) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const ext = file.name.split(".").pop() || "jpg";
  const storagePath = `page-overrides/${pageKey}/${Date.now()}.${ext}`;

  const admin = createSupabaseAdminClient();

  const { error: uploadError } = await admin.storage
    .from("product-images")
    .upload(storagePath, file, { contentType: file.type, upsert: true });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: urlData } = admin.storage.from("product-images").getPublicUrl(storagePath);
  const publicUrl = urlData.publicUrl;

  const { data, error: dbError } = await admin
    .from("page_images")
    .upsert(
      { page_key: pageKey, original_src: originalSrc, replacement_url: publicUrl },
      { onConflict: "page_key,original_src" }
    )
    .select("id")
    .single();

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json({ id: data.id, url: publicUrl });
}
