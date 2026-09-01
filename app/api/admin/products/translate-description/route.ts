import { NextRequest, NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/auth/session";

type TargetLang = "en" | "de";

export async function POST(req: NextRequest) {
  const profile = await getCurrentProfile();
  if (!profile?.roles.includes("admin")) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { text, targetLang } = await req.json() as { text?: string; targetLang?: TargetLang };
  const source = String(text || "").trim();
  if (!source) return NextResponse.json({ translatedText: "" });
  if (targetLang !== "en" && targetLang !== "de") {
    return NextResponse.json({ error: "targetLang must be en or de" }, { status: 400 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "OPENAI_API_KEY is not configured" }, { status: 500 });
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_TRANSLATION_MODEL || process.env.OPENAI_RECEPTION_MODEL || "gpt-4o-mini",
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text: "Translate OlivHairSupply product descriptions between English and German. Keep a warm premium salon retail tone. Preserve product names, colour codes, lengths, measurements, prices, and brand names exactly. Return only the translated description.",
            },
          ],
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: `Target language: ${targetLang === "de" ? "German" : "English"}\n\nDescription:\n${source}`,
            },
          ],
        },
      ],
      temperature: 0.2,
    }),
  });

  const json = await response.json().catch(() => null);
  if (!response.ok) {
    return NextResponse.json({ error: json?.error?.message || "Translation failed" }, { status: 500 });
  }

  const translatedText = extractOutputText(json).trim();
  return NextResponse.json({ translatedText });
}

function extractOutputText(payload: unknown) {
  const response = payload as {
    output_text?: string;
    output?: Array<{ content?: Array<{ text?: string }> }>;
  } | null;
  if (!response) return "";
  if (response.output_text) return response.output_text;
  return response.output
    ?.flatMap((item) => item.content || [])
    .map((content) => content.text || "")
    .join("")
    || "";
}
