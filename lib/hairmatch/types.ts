export type HairMatchAngle = "front" | "left" | "right" | "hair" | "back";

export type HairMatchPhoto = {
  angle: HairMatchAngle;
  dataUrl: string;
};

export type HairMatchMetric = {
  label: string;
  value: string;
  score: number;
  note: string;
};

export type HairMatchRecommendation = {
  id: string;
  name: string;
  category: "wigs" | "braids" | "frontals" | "closures" | "extensions";
  matchScore: number;
  texture: string;
  colour: string;
  length: string;
  reason: string;
  productSlugs: string[];
};

export type HairMatchAnalysis = {
  faceShape: string;
  skinTone: string;
  undertone: string;
  hairline: string;
  proportions: string;
  summary: string;
  confidence: number;
  metrics: HairMatchMetric[];
  recommendations: HairMatchRecommendation[];
};

export type HairMatchProduct = {
  title: string;
  slug: string;
  imageUrl: string | null;
  priceCents: number;
  reason: string;
};
