import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api/", "/auth/", "/checkout", "/cart", "/account", "/login", "/register"]
      }
    ],
    sitemap: "https://olivhairsupply.de/sitemap.xml",
    host: "https://olivhairsupply.de"
  };
}
