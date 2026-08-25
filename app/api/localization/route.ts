import { NextRequest, NextResponse } from "next/server";

// Handles the localization form POST from the nav (EN/DE switcher)
export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const locale = formData.get("locale_code") as string | null;
  const returnTo = (formData.get("return_to") as string) || "/";

  const lang = locale?.startsWith("en") ? "en" : "de";

  const res = NextResponse.redirect(new URL(returnTo, req.url));
  res.cookies.set("ohs_lang", lang, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  return res;
}
