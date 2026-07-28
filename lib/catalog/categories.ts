import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ShopCategory = {
  id: string;
  title: string;
  slug: string;
  position: number;
  image_url: string | null;
};

const fallbackCategories: ShopCategory[] = [
  { id: "1", title: "Bizihair Extensions", slug: "bizihair-extensions", position: 1, image_url: null },
  { id: "2", title: "BiziLuxe Extensions", slug: "biziluxe-extensions", position: 2, image_url: null },
  { id: "3", title: "BiziLuxe Accessories", slug: "biziluxe-accessoires", position: 3, image_url: null },
  { id: "4", title: "BiziLuxe Styling Tools", slug: "biziluxe-stylinggeraete", position: 4, image_url: null },
  { id: "5", title: "Brushes & Combs", slug: "buersten-und-kaemme", position: 5, image_url: null },
  { id: "6", title: "Pro Salon Supplies", slug: "profi-friseurbedarf", position: 6, image_url: null }
];

export async function getShopCategories(): Promise<ShopCategory[]> {
  return fallbackCategories;
}
