import { NextResponse } from "next/server";
import { generateTryOnImage } from "@/lib/hairmatch/ai";
import type { HairMatchRecommendation } from "@/lib/hairmatch/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
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
