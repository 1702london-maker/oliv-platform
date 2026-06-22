import { MetadataRoute } from "next";

const base = "https://olivhairsupply.de";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: base, lastModified: now, changeFrequency: "weekly", priority: 1.0 },
    { url: `${base}/shop`, lastModified: now, changeFrequency: "daily", priority: 0.95 },
    { url: `${base}/appointments`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/ai-hairmatch-pro`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/pages/services`, lastModified: now, changeFrequency: "monthly", priority: 0.85 },
    { url: `${base}/pages/about`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/pages/training`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/pages/rentals`, lastModified: now, changeFrequency: "monthly", priority: 0.75 },
    { url: `${base}/wholesale`, lastModified: now, changeFrequency: "monthly", priority: 0.75 },
    { url: `${base}/affiliate`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/pages/faq`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/pages/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/blogs/journal`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/pages/press`, lastModified: now, changeFrequency: "monthly", priority: 0.65 },
    { url: `${base}/pages/careers`, lastModified: now, changeFrequency: "monthly", priority: 0.65 },
    { url: `${base}/pages/sustainability`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/pages/vouchers`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/pages/shipping`, lastModified: now, changeFrequency: "monthly", priority: 0.55 },
    { url: `${base}/pages/returns`, lastModified: now, changeFrequency: "monthly", priority: 0.55 },
    { url: `${base}/pages/track-order`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/pages/privacy-policy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/pages/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/pages/impressum`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];
}
