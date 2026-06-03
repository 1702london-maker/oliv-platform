const DEFAULT_EMAIL_SITE_URL = "https://oliv-platform.vercel.app";

export type ApplicationApprovalType = "affiliate" | "wholesale" | "training";

export function buildApplicationApprovalUrl(type: ApplicationApprovalType, id: string) {
  const secret = process.env.SUPABASE_WEBHOOK_SECRET || "";
  const siteUrl = (process.env.EMAIL_SITE_URL || process.env.NEXT_PUBLIC_EMAIL_SITE_URL || DEFAULT_EMAIL_SITE_URL).replace(/\/$/, "");
  const params = new URLSearchParams({ type, id, secret });
  return `${siteUrl}/api/admin/applications/approve?${params.toString()}`;
}
