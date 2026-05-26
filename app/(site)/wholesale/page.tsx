import { ShopifyClonePage } from "@/components/ShopifyClonePage";
import { WholesalePortal } from "@/components/portals/WholesalePortal";
import { getCurrentProfile } from "@/lib/auth/session";

export default async function WholesalePage() {
  const profile = await getCurrentProfile();
  if (profile) return <WholesalePortal profile={profile} />;

  return <ShopifyClonePage page="wholesale" />;
}
