import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  const legacyRedirect = getLegacyRedirect(request);
  if (legacyRedirect) {
    return NextResponse.redirect(legacyRedirect, 301);
  }

  let response = NextResponse.next({
    request
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const needsSupabaseSessionRefresh = [
    "/account",
    "/auth",
    "/cart",
    "/checkout",
    "/login",
    "/register",
    "/api/auth",
    "/api/checkout",
  ].some((path) => request.nextUrl.pathname.startsWith(path));

  if (!supabaseUrl || !supabaseAnonKey || !needsSupabaseSessionRefresh) {
    response.headers.set("x-pathname", request.nextUrl.pathname);
    applySecurityHeaders(response);
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(
        cookiesToSet: Array<{
          name: string;
          value: string;
          options: Parameters<typeof response.cookies.set>[2];
        }>
      ) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      }
    }
  });

  await supabase.auth.getUser();

  // Pass pathname to server components via header (used by admin layout to skip auth on login page)
  response.headers.set("x-pathname", request.nextUrl.pathname);

  applySecurityHeaders(response);

  return response;
}

function getLegacyRedirect(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const normalizedPath = pathname.replace(/\/+$/, "") || "/";
  const target = LEGACY_REDIRECTS[normalizedPath];

  if (target) {
    const url = request.nextUrl.clone();
    url.pathname = target.pathname;
    url.search = target.search ?? "";
    return url;
  }

  if (normalizedPath.startsWith("/produkt-kategorie/")) {
    const parts = normalizedPath.split("/").filter(Boolean);
    const legacyCategory = parts[1] ?? "";
    const category = LEGACY_CATEGORY_SLUGS[legacyCategory];
    const url = request.nextUrl.clone();
    url.pathname = "/shop";
    url.search = category ? `?category=${category}` : "";
    return url;
  }

  if (normalizedPath.startsWith("/produkt/")) {
    const parts = normalizedPath.split("/").filter(Boolean);
    const product = LEGACY_PRODUCT_SLUGS[parts[1] ?? ""];
    const url = request.nextUrl.clone();
    if (product) {
      url.pathname = `/products/${product}`;
      url.search = "";
    } else {
      url.pathname = "/shop";
      url.search = "";
    }
    return url;
  }

  return null;
}

const LEGACY_REDIRECTS: Record<string, { pathname: string; search?: string }> = {
  "/shop/page/2": { pathname: "/shop", search: "?view=all" },
  "/collections": { pathname: "/shop" },
  "/pages/training": { pathname: "/training" },
  "/blogs/journal": { pathname: "/" },
};

const LEGACY_CATEGORY_SLUGS: Record<string, string> = {
  haarverlangerung: "bizihair-extensions",
  haarverlaengerung: "bizihair-extensions",
  "echthaar-extensions": "bizihair-extensions",
  "keratin-bondings-1": "bizihair-extensions",
  "tape-extensions": "bizihair-extensions",
  "clip-in-extensions": "biziluxe-extensions",
  "biziluxe-extensions": "biziluxe-extensions",
  perucken: "biziluxe-extensions",
  wigs: "biziluxe-extensions",
  zubehor: "biziluxe-accessoires",
  "friseurbedarf": "profi-friseurbedarf",
  "styling-tools": "biziluxe-stylinggeraete",
  "buersten-und-kaemme": "buersten-und-kaemme",
};

const LEGACY_PRODUCT_SLUGS: Record<string, string> = {
  "tape-in-extensions": "bizihair-tape-in-extensions",
  "keratin-bondings": "bizihair-keratin-extensions",
  "genius-weft": "bizihair-weft-extensions",
  "weft-extensions": "bizihair-weft-extensions",
  "slip-on-bonnet": "slip-on-bonnet",
  "tie-up-bonnet": "tie-up-bonnet",
};

function applySecurityHeaders(response: NextResponse) {
  response.headers.set("X-Frame-Options", "SAMEORIGIN");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com https://cdn.jsdelivr.net https://app.mirror-app.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.resend.com https://challenges.cloudflare.com https://app.mirror-app.com",
      "frame-src https://challenges.cloudflare.com https://app.mirror-app.com",
      "frame-ancestors 'none'",
    ].join("; ")
  );
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
