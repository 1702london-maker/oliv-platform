import { NextResponse } from "next/server";
import { generateTryOnImage } from "@/lib/hairmatch/ai";
import type { HairMatchRecommendation } from "@/lib/hairmatch/types";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/security/rate-limit";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const rl = await checkRateLimit({ key: "ip", value: getClientIp(request), endpoint: "hairmatch-tryon", limit: 5, windowSecs: 3600 });
  if (!rl.allowed) return rateLimitResponse(rl);

  try {
    const body = await request.json();
    const photo = String(body.photo || "");
    const recommendation = body.recommendation as HairMatchRecommendation | undefined;

    if (!photo || !recommendation) {
      return NextResponse.json({ error: "photo_and_recommendation_required" }, { status: 400 });
    }

    const image = await generateTryOnImage(photo, recommendation);
    return NextResponse.json({ image });
  } catch (error) {
    console.error("[HairMatch] Try-on error:", error);
    return NextResponse.json({
      error: "tryon_failed",
      message: error instanceof Error ? error.message : "HairMatch try-on failed",
    }, { status: 500 });
  }
}
