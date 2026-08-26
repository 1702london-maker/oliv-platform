import fs from "node:fs";
import path from "node:path";

const CATEGORY_FOLDERS: Record<string, string[]> = {
  "bizihair-extensions": ["products/bizihair-extensions"],
  "biziluxe-extensions": ["products/biziluxe-extensions"],
  "biziluxe-accessories": ["products/biziluxe-accessoires", "products/accessories"],
  "brushes-combs": ["products/buersten-und-kaemme"],
  "pro-salon-supplies": ["products/profi-friseurbedarf"],
};

const IMG_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);

function scan(dir: string, publicDir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) return scan(full, publicDir);
    if (IMG_EXT.has(path.extname(name).toLowerCase()) && !name.includes("${")) {
      return ["/" + path.relative(publicDir, full).replace(/\\/g, "/")];
    }
    return [];
  });
}

export type CatalogImage = { src: string; label: string };

export function getCatalogImagesForCategory(category: string): CatalogImage[] {
  const publicDir = path.join(process.cwd(), "public");
  const folders = CATEGORY_FOLDERS[category] || [];
  return folders
    .flatMap((f) => scan(path.join(publicDir, f), publicDir))
    .map((src) => ({ src, label: src.split("/").pop() || src }));
}

export function getAllCatalogImages(): Record<string, CatalogImage[]> {
  const result: Record<string, CatalogImage[]> = {};
  for (const cat of Object.keys(CATEGORY_FOLDERS)) {
    result[cat] = getCatalogImagesForCategory(cat);
  }
  return result;
}
