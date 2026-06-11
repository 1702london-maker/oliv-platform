import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const analysis = body.analysis;
    const products = Array.isArray(body.products) ? body.products : [];
    const tryOnImages = Array.isArray(body.tryOnImages) ? body.tryOnImages : [];
    const email = typeof body.email === "string" ? body.email.toLowerCase() : null;
    const name = typeof body.name === "string" ? body.name : null;

    if (!analysis) {
      return NextResponse.json({ error: "analysis_required" }, { status: 400 });
    }

    const auth = await createSupabaseServerClient();
    const { data: userData } = await auth.auth.getUser();
    const supabase = createSupabaseAdminClient();

    const { data, error } = await supabase
      .from("hairmatch_sessions")
      .insert({
        user_id: userData.user?.id || null,
        customer_email: email || userData.user?.email || null,
        customer_name: name,
        analysis,
        recommendations: analysis.recommendations || [],
        matched_products: products,
        tryon_images: tryOnImages,
        status: "saved",
      })
      .select("id")
      .single();

    if (error || !data) {
      console.error("[HairMatch] Save DB error:", error);
      return NextResponse.json({ error: "save_failed" }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: data.id });
  } catch (error) {
    console.error("[HairMatch] Save error:", error);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
