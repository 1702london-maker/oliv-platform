import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function POST(request: Request) {
  const formData = await request.formData();
  const locale = String(formData.get("locale_code") || "en");
  const country = String(formData.get("country_code") || "DE");
  const returnTo = String(formData.get("return_to") || "/");
  const cookieStore = await cookies();

  cookieStore.set("ohs_locale", locale, { path: "/", sameSite: "lax" });
  cookieStore.set("ohs_country", country, { path: "/", sameSite: "lax" });

  const cleanReturnTo = returnTo.replace(/^\/(de|en|es)\//, '/');
  redirect(cleanReturnTo.startsWith("/") && !cleanReturnTo.startsWith("//") ? cleanReturnTo : "/");
}
