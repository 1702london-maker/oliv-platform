import { ShopifyClonePage } from "@/components/ShopifyClonePage";
import { WholesalePortal } from "@/components/portals/WholesalePortal";
import { getCurrentProfile } from "@/lib/auth/session";

export default async function WholesalePage() {
  const profile = await getCurrentProfile();

  // Only show the wholesale portal to users who have been explicitly
  // granted the wholesale role by an admin — everyone else sees the
  // application / information page regardless of login status.
  if (profile && profile.roles.includes("wholesale")) {
    return <WholesalePortal profile={profile} />;
  }

  // Not approved — show the public application / information page.
  // Logged-in retail customers land here too and see the apply form.
  return <ShopifyClonePage page="wholesale" />;
}
