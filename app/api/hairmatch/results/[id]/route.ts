import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const runtime = "nodejs";

type Props = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, { params }: Props) {
  try {
    const { id } = await params;

    // Require the session token that was set when the quiz was submitted
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(`hairmatch_session_${id}`)?.value ||
      new URL(request.url).searchParams.get("token");
    if (!sessionToken || sessionToken !== id) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("hairmatch_sessions")
      .select("id, recommendations, created_at")
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
