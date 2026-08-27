import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function ensureProfile(
  id: string,
  email: string,
  metadata: {
    first_name?: string;
    last_name?: string;
    [key: string]: unknown;
  } = {}
) {
  try {
    const admin = createSupabaseAdminClient();
    const { data: existing } = await admin.from("profiles").select("roles,first_name,last_name").eq("id", id).maybeSingle();
    const roles = existing?.roles?.length ? existing.roles : ["customer"];
    const { data, error } = await admin.from("profiles").upsert(
      {
        id,
        email,
        first_name: typeof metadata.first_name === "string" ? metadata.first_name : existing?.first_name || null,
        last_name: typeof metadata.last_name === "string" ? metadata.last_name : existing?.last_name || null,
        roles
      },
      { onConflict: "id", ignoreDuplicates: false }
    ).select("id,email,first_name,last_name,phone,roles").single();

    return error ? null : data;
  } catch (error) {
    console.error("Unable to ensure login profile", error);
    return null;
  }
}
