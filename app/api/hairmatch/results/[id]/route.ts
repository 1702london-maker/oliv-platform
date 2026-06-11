import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type Props = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: Props) {
  try {
    const { id } = await params;
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("hairmatch_sessions")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error("[HairMatch] Result lookup error:", error);
      return NextResponse.json({ error: "lookup_failed" }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    return NextResponse.json({ result: data });
  } catch (error) {
    console.error("[HairMatch] Result error:", error);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
