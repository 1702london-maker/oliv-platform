import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const trackSchema = z.object({
  code: z.string().trim().min(2),
  landingPath: z.string().trim().default("/"),
  visitorId: z.string().trim().optional(),
  referrer: z.string().trim().optional()
});

export async function POST(request: Request) {
  const parsed = trackSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const code = parsed.data.code.toUpperCase();
  const supabase = createSupabaseAdminClient();
  const { data: affiliate } = await supabase
    .from("affiliates")
    .select("id,click_count")
    .eq("code", code)
    .maybeSingle();

  if (!affiliate) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  await supabase.from("affiliate_clicks").insert({
    affiliate_id: affiliate.id,
    landing_path: parsed.data.landingPath,
    visitor_id: parsed.data.visitorId || null,
    referrer: parsed.data.referrer || null
  });

  await supabase
    .from("affiliates")
    .update({ click_count: Number(affiliate.click_count || 0) + 1 })
    .eq("id", affiliate.id);

  return NextResponse.json({ ok: true });
}
