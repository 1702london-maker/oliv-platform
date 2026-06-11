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
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is missing. Add it in Vercel to enable real HairMatch analysis.");
  }

  const content: Array<Record<string, unknown>> = [
    {
      type: "text",
      text: "Analyze these OHS HairMatch customer photos. Recommend practical OlivHairSupply products and appointment guidance.",
    },
    ...photos.slice(0, 5).map((photo) => ({
      type: "image_url",
      image_url: {
        url: photo.dataUrl,
        detail: "low",
      },
    })),
  ];

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_VISION_MODEL || "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content },
      ],
      temperature: 0.35,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HairMatch analysis failed: ${text.slice(0, 500)}`);
  }

  const json = await response.json();
  const raw = json.choices?.[0]?.message?.content;
  const parsed = JSON.parse(raw || "{}") as HairMatchAnalysis;
  return normalizeAnalysis(parsed);
}

export async function generateTryOnImage(photo: string, recommendation: HairMatchRecommendation): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is missing. Add it in Vercel to enable real AI try-on generation.");
  }

  const prompt = [
    "Create a realistic luxury hair try-on image using the uploaded customer's face as identity reference.",
    `Style: ${recommendation.name}.`,
    `Category: ${recommendation.category}.`,
    `Texture: ${recommendation.texture}. Colour: ${recommendation.colour}. Length: ${recommendation.length}.`,
    "Keep face, skin tone, facial features and pose natural. Change only hairstyle/hair product. Premium salon lighting, realistic result.",
  ].join(" ");

  const form = new FormData();
  form.append("model", process.env.OPENAI_IMAGE_MODEL || "gpt-image-1");
  form.append("prompt", prompt);
  form.append("size", "1024x1024");
  form.append("image", dataUrlToBlob(photo), "customer.png");

  const response = await fetch("https://api.openai.com/v1/images/edits", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HairMatch try-on failed: ${text.slice(0, 500)}`);
  }

  const json = await response.json();
  const b64 = json.data?.[0]?.b64_json;
  if (!b64) throw new Error("HairMatch try-on did not return an image.");
  return `data:image/png;base64,${b64}`;
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

function dataUrlToBlob(dataUrl: string) {
  const [header, data] = dataUrl.split(",");
  const mime = header.match(/data:(.*?);/)?.[1] || "image/png";
  const bytes = Buffer.from(data || "", "base64");
  return new Blob([bytes], { type: mime });
}
