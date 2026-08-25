import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  try {
    await requireRole("admin");
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const productId = formData.get("productId") as string;
  const position = Number(formData.get("position") || 0);

  if (!file || !productId) {
    return NextResponse.json({ error: "Missing file or productId" }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const fileName = `${productId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const admin = createSupabaseAdminClient();

  const { error: uploadError } = await admin.storage
    .from("product-images")
    .upload(fileName, buffer, {
      contentType: file.type || "image/jpeg",
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: urlData } = admin.storage.from("product-images").getPublicUrl(fileName);
  const publicUrl = urlData.publicUrl;

  const { data: row, error: dbError } = await admin
    .from("product_images")
    .insert({ product_id: productId, url: publicUrl, position })
    .select("id, url, position")
    .single();

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json({ image: row });
}
