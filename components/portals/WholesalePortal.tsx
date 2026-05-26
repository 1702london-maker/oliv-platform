import Link from "next/link";
import { logoutAction } from "@/app/(site)/login/actions";
import type { Profile } from "@/lib/auth/types";
import { formatEuro } from "@/lib/catalog/money";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type WholesalePortalProps = {
  profile: Profile;
};

type WholesaleAccount = {
  business_name: string;
  status: string;
  tier: string;
  lifetime_spend_cents: number;
};

export async function WholesalePortal({ profile }: WholesalePortalProps) {
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from("wholesale_accounts")
    .select("business_name,status,tier,lifetime_spend_cents")
    .eq("profile_id", profile.id)
    .maybeSingle<WholesaleAccount>();
  const { data: orders } = await supabase
    .from("orders")
    .select("id,status,total_cents,created_at")
    .eq("customer_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(10);

  const account = data || {
    business_name: "Wholesale Partner",
    status: "pending",
    tier: getWholesaleTier(0),
    lifetime_spend_cents: 0
  };

  return (
    <main className="ohs-portal">
      <div className="ohs-portal-shell">
        <div className="ohs-portal-top">
          <div>
            <p>Wholesale Account</p>
            <h1>Welcome, {account.business_name}</h1>
          </div>
          <div className="ohs-portal-actions">
            <Link href="/">Back to Website</Link>
            <form action={logoutAction}>
              <button>Log Out</button>
            </form>
          </div>
        </div>

        <div className="ohs-portal-note">
          Your wholesale dashboard stays available after login. Your tier updates as your wholesale spend grows.
        </div>

        <section className="ohs-portal-stats">
          <Stat label="Total Orders" value={String(orders?.length || 0)} />
          <Stat label="Total Spent" value={formatEuro(account.lifetime_spend_cents)} />
          <Stat label="Last Order" value={orders?.[0] ? formatEuro(Number(orders[0].total_cents || 0)) : "None"} />
          <Stat label="Tier" value={getWholesaleTier(account.lifetime_spend_cents)} />
        </section>

        <div className="ohs-portal-note">{getNextTierMessage(account.lifetime_spend_cents)}</div>

        <section className="ohs-portal-card">
          <p>BiziLuxe Wholesale Shop</p>
          <strong>Wholesale ordering is connected next.</strong>
          <span>
            The account portal is now session-based. The next step is connecting wholesale prices and order history to Supabase orders.
          </span>
          <Link href="/shop">Browse Products</Link>
        </section>

        <section className="ohs-portal-card">
          <p>Order History</p>
          {orders?.length ? (
            <div className="ohs-portal-orders">
              {orders.map((order) => (
                <div key={order.id}>
                  <span>{new Date(order.created_at).toLocaleDateString("en-GB")}</span>
                  <span>{order.status}</span>
                  <strong>{formatEuro(Number(order.total_cents || 0))}</strong>
                </div>
              ))}
            </div>
          ) : (
            <span>No wholesale orders yet.</span>
          )}
        </section>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function getWholesaleTier(totalSpentCents: number) {
  if (totalSpentCents >= 1_000_000) return "Top Tier";
  if (totalSpentCents >= 500_000) return "Growth Tier";
  return "Verified";
}

function getNextTierMessage(totalCents: number) {
  if (totalCents >= 1_000_000) return "You are on the top wholesale tier.";
  const nextThreshold = totalCents >= 500_000 ? 1_000_000 : 500_000;
  return `Spend ${formatEuro(nextThreshold - totalCents)} more to unlock the next wholesale tier.`;
}
