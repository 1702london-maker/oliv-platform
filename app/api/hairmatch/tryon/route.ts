import { NextResponse } from "next/server";
import { generateTryOnDescription } from "@/lib/hairmatch/ai";
import type { HairMatchRecommendation } from "@/lib/hairmatch/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const recommendation = body.recommendation as HairMatchRecommendation | undefined;

    if (!recommendation) {
      return NextResponse.json({ error: "recommendation_required" }, { status: 400 });
    }

    const description = await generateTryOnDescription(recommendation);
    return NextResponse.json({ description });
  } catch (error) {
    console.error("[HairMatch] Try-on error:", error);
    return NextResponse.json({
      error: "tryon_failed",
      message: error instanceof Error ? error.message : "HairMatch try-on failed",
    }, { status: 500 });
  }
}
