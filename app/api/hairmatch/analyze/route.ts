import { NextResponse } from "next/server";
import { analyzeHairMatchPhotos } from "@/lib/hairmatch/ai";
import { getHairMatchProducts } from "@/lib/hairmatch/products";
import type { HairMatchPhoto } from "@/lib/hairmatch/types";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const photos = Array.isArray(body.photos) ? body.photos as HairMatchPhoto[] : [];
    const serviceType = typeof body.serviceType === "string" ? body.serviceType : "";
    const wantsVolume = typeof body.wantsVolume === "boolean" ? body.wantsVolume : null;

    if (!photos.length) {
      return NextResponse.json({ error: "photos_required" }, { status: 400 });
    }

    const analysis = await analyzeHairMatchPhotos(photos, serviceType, wantsVolume);
    const products = await getHairMatchProducts(analysis.recommendations);

    return NextResponse.json({ analysis, products });
  } catch (error) {
    console.error("[HairMatch] Analyze error:", error);
    return NextResponse.json({
      error: "analysis_failed",
      message: error instanceof Error ? error.message : "HairMatch analysis failed",
    }, { status: 500 });
  }
}
