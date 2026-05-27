import { ShopifyClonePage } from "@/components/ShopifyClonePage";
import { AffiliatePortal } from "@/components/portals/AffiliatePortal";
import { getCurrentProfile } from "@/lib/auth/session";

export default async function AffiliatePage() {
  const profile = await getCurrentProfile();
  if (profile) return <AffiliatePortal profile={profile} />;
  return <ShopifyClonePage page="affiliate" />;
}
