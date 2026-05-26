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
  { id: "3", title: "BiziLuxe Accessoires", slug: "biziluxe-accessoires", position: 3, image_url: null },
  { id: "4", title: "BiziLuxe Stylinggeräte", slug: "biziluxe-stylinggeraete", position: 4, image_url: null },
  { id: "5", title: "Bürsten & Kämme", slug: "buersten-und-kaemme", position: 5, image_url: null },
  { id: "6", title: "Profi Friseurbedarf", slug: "profi-friseurbedarf", position: 6, image_url: null }
];

export async function getShopCategories(): Promise<ShopCategory[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("shop_categories")
    .select("id,title,slug,position,image_url")
    .order("position", { ascending: true });

  if (error) {
    console.error("Failed to load shop categories", error);
    return fallbackCategories;
  }

  return data?.length ? data : fallbackCategories;
}
