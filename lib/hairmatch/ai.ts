import type { HairMatchAnalysis, HairMatchPhoto, HairMatchRecommendation } from "@/lib/hairmatch/types";

const SYSTEM_PROMPT = `You are OHS AI HairMatch Pro for OlivHairSupply, a luxury hair extension and salon brand.
Analyze customer hair photos for face shape, skin tone/undertone, hairline, proportions, current hair profile and recommend wigs, braids, frontals, closures and extensions.
Return only valid JSON matching this TypeScript shape:
{
 "faceShape": string,
 "skinTone": string,
 "undertone": string,
 "hairline": string,
 "proportions": string,
 "summary": string,
 "confidence": number,
 "metrics": [{"label": string, "value": string, "score": number, "note": string}],
 "recommendations": [{"id": string, "name": string, "category": "wigs"|"braids"|"frontals"|"closures"|"extensions", "matchScore": number, "texture": string, "colour": string, "length": string, "reason": string, "productSlugs": string[]}]
}
Use a warm luxury salon tone. Do not diagnose medical conditions.`;

export async function analyzeHairMatchPhotos(photos: HairMatchPhoto[]): Promise<HairMatchAnalysis> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is missing. Add it in Vercel Environment Variables to enable real HairMatch analysis.");
  }

  // Build content blocks: text instruction + up to 5 images
  const content: Array<Record<string, unknown>> = [
    {
      type: "text",
      text: "Analyze these OHS HairMatch customer photos. Recommend practical OlivHairSupply products and appointment guidance.",
    },
    ...photos.slice(0, 5).map((photo) => {
      // Extract base64 data and media type from dataUrl
      const match = photo.dataUrl.match(/^data:(image\/[a-z+]+);base64,(.+)$/);
      const mediaType = (match?.[1] ?? "image/jpeg") as "image/jpeg" | "image/png" | "image/gif" | "image/webp";
      const data = match?.[2] ?? photo.dataUrl;
      return {
        type: "image",
        source: {
          type: "base64",
          media_type: mediaType,
          data,
        },
      };
    }),
  ];

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6",
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content }],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HairMatch analysis failed: ${text.slice(0, 500)}`);
  }

  const json = await response.json();
  const raw = json.content?.[0]?.text;

  // Claude sometimes wraps JSON in markdown code fences — strip them
  const cleaned = (raw || "")
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  const parsed = JSON.parse(cleaned || "{}") as HairMatchAnalysis;
  return normalizeAnalysis(parsed);
}

/**
 * Try-on image generation — Claude does not have an image generation API.
 * Instead we return a rich styling description that the UI renders as an
 * annotated overlay on the customer's original photo.
 */
export async function generateTryOnDescription(
  recommendation: HairMatchRecommendation
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return buildFallbackDescription(recommendation);

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6",
      max_tokens: 300,
      messages: [
        {
          role: "user",
          content: `You are a luxury hair stylist at OlivHairSupply. Write a 2-sentence vivid visual description of how this style will look on the customer. Style: ${recommendation.name}. Texture: ${recommendation.texture}. Colour: ${recommendation.colour}. Length: ${recommendation.length}. Keep it aspirational and specific.`,
        },
      ],
    }),
  });

  if (!response.ok) return buildFallbackDescription(recommendation);
  const json = await response.json();
  return json.content?.[0]?.text?.trim() || buildFallbackDescription(recommendation);
}

function buildFallbackDescription(rec: HairMatchRecommendation): string {
  return `${rec.name} — ${rec.texture} texture in ${rec.colour}, ${rec.length} length. ${rec.reason}`;
}

function normalizeAnalysis(input: HairMatchAnalysis): HairMatchAnalysis {
  const recommendations = Array.isArray(input.recommendations) && input.recommendations.length
    ? input.recommendations
    : defaultRecommendations();

  return {
    faceShape: input.faceShape || "Balanced oval",
    skinTone: input.skinTone || "Medium",
    undertone: input.undertone || "Neutral warm",
    hairline: input.hairline || "Soft natural hairline",
    proportions: input.proportions || "Balanced proportions",
    summary: input.summary || "Your features support soft, luxurious styling with face-framing length and polished movement.",
    confidence: clamp(Number(input.confidence || 86), 1, 100),
    metrics: (Array.isArray(input.metrics) ? input.metrics : []).slice(0, 10).map((metric) => ({
      label: String(metric.label || "Metric"),
      value: String(metric.value || "-"),
      score: clamp(Number(metric.score || 75), 1, 100),
      note: String(metric.note || ""),
    })),
    recommendations: recommendations.slice(0, 10).map((rec, index) => ({
      id: rec.id || `style-${index + 1}`,
      name: rec.name || "BiziLuxe Signature Style",
      category: rec.category || "extensions",
      matchScore: clamp(Number(rec.matchScore || 82), 1, 100),
      texture: rec.texture || "Wavy",
      colour: rec.colour || "Natural colour",
      length: rec.length || "50cm",
      reason: rec.reason || "A balanced luxury option for your facial proportions and hair goals.",
      productSlugs: Array.isArray(rec.productSlugs) ? rec.productSlugs : [],
    })),
  };
}

function defaultRecommendations(): HairMatchRecommendation[] {
  return [
    { id: "extensions-soft-wave", name: "BiziLuxe Soft Wave Extensions", category: "extensions", matchScore: 92, texture: "Wellig", colour: "1A Naturschwarz", length: "55cm", reason: "Adds soft movement while keeping the face open and balanced.", productSlugs: [] },
    { id: "frontal-glam", name: "HD Frontal Glam", category: "frontals", matchScore: 89, texture: "Glatt", colour: "2 Schokobraun", length: "50cm", reason: "A polished frontal look with clean face framing and flexible parting.", productSlugs: [] },
    { id: "closure-natural", name: "Natural Closure Finish", category: "closures", matchScore: 87, texture: "Wellig", colour: "4 Mittelbraun", length: "45cm", reason: "Creates a refined finish with lower maintenance than a full frontal.", productSlugs: [] },
    { id: "wig-editorial", name: "Luxury Everyday Wig", category: "wigs", matchScore: 86, texture: "Glatt", colour: "Tiefschwarz", length: "40cm", reason: "A clean luxury silhouette for everyday styling.", productSlugs: [] },
    { id: "braids-soft", name: "Protective Braid Plan", category: "braids", matchScore: 81, texture: "Braids", colour: "Natural black", length: "Medium", reason: "Protective styling with a premium, low-tension finish.", productSlugs: [] },
  ];
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, Math.round(value)));
}
