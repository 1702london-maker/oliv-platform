import Link from "next/link";
import { logoutAction } from "@/app/(site)/login/actions";
import type { Profile } from "@/lib/auth/types";
import { formatEuro } from "@/lib/catalog/money";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type AffiliatePortalProps = {
  profile: Profile;
};

type AffiliateAccount = {
  id?: string;
  code: string;
  status: string;
  tier: string;
  total_sales_cents: number;
  total_commission_cents: number;
  pending_payout_cents: number;
  click_count: number;
  conversion_count: number;
  discount_rate: number;
};

export async function AffiliatePortal({ profile }: AffiliatePortalProps) {
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from("affiliates")
    .select(
      "id,code,status,tier,total_sales_cents,total_commission_cents,pending_payout_cents,click_count,conversion_count,discount_rate"
    )
    .or(`profile_id.eq.${profile.id},email.eq.${profile.email}`)
    .maybeSingle<AffiliateAccount>();

  const account = data || buildPendingAffiliate(profile);
  const [{ data: commissions }, { data: payouts }] = account.id
    ? await Promise.all([
        supabase
          .from("affiliate_commissions")
          .select("id,order_total_cents,commission_cents,status,created_at")
          .eq("affiliate_id", account.id)
          .order("created_at", { ascending: false })
          .limit(10),
        supabase
          .from("affiliate_payouts")
          .select("id,amount_cents,status,paid_at,created_at")
          .eq("affiliate_id", account.id)
          .order("created_at", { ascending: false })
          .limit(10)
      ])
    : [{ data: [] }, { data: [] }];
  const affiliateLink = `${process.env.NEXT_PUBLIC_SITE_URL || ""}/shop?ref=${account.code}`;
  const tier = getAffiliateTier(account.total_sales_cents);
  const nextTier = getNextTierMessage(account.total_sales_cents, "affiliate sales");
  const conversionRate = account.click_count
    ? `${((account.conversion_count / account.click_count) * 100).toFixed(1)}%`
    : "0%";

  return (
    <main className="ohs-portal">
      <div className="ohs-portal-shell">
        <div className="ohs-portal-top">
          <div>
            <p>Affiliate Account</p>
            <h1>Welcome, {profile.first_name || account.code}</h1>
          </div>
          <div className="ohs-portal-actions">
            <Link href="/">Back to Website</Link>
            <form action={logoutAction}>
              <button>Log Out</button>
            </form>
          </div>
        </div>

        <div className="ohs-portal-note">
          Your affiliate code and tracking link stay here whenever you log in. Tier updates after every €10,000 in affiliate sales.
        </div>

        <section className="ohs-portal-stats">
          <Stat label="Total Sales" value={formatEuro(account.total_sales_cents)} />
          <Stat label="Total Commission" value={formatEuro(account.total_commission_cents)} />
          <Stat label="Pending Payout" value={formatEuro(account.pending_payout_cents)} />
          <Stat label="Link Clicks" value={String(account.click_count)} />
          <Stat label="Conversion Rate" value={conversionRate} />
          <Stat label="Tier" value={tier} />
        </section>

        <section className="ohs-portal-grid">
          <div className="ohs-portal-card">
            <p>Discount Code</p>
            <strong>{account.code}</strong>
            <span>{account.discount_rate}% customer discount. This code must be created in Stripe/admin for checkout redemption.</span>
          </div>
          <div className="ohs-portal-card">
            <p>Affiliate Link</p>
            <strong>{affiliateLink}</strong>
            <span>Share this link so clicks and future commissions can be attributed to this account.</span>
          </div>
        </section>

        <div className="ohs-portal-note">{nextTier}</div>

        <section className="ohs-portal-grid">
          <div className="ohs-portal-card">
            <p>Recent Commissions</p>
            {commissions?.length ? (
              <div className="ohs-portal-orders">
                {commissions.map((commission) => (
                  <div key={commission.id}>
                    <span>{new Date(commission.created_at).toLocaleDateString("en-GB")}</span>
                    <span>{commission.status}</span>
                    <strong>{formatEuro(Number(commission.commission_cents || 0))}</strong>
                  </div>
                ))}
              </div>
            ) : (
              <span>No commission orders yet.</span>
            )}
          </div>
          <div className="ohs-portal-card">
            <p>Payout History</p>
            {payouts?.length ? (
              <div className="ohs-portal-orders">
                {payouts.map((payout) => (
                  <div key={payout.id}>
                    <span>{new Date(payout.paid_at || payout.created_at).toLocaleDateString("en-GB")}</span>
                    <span>{payout.status}</span>
                    <strong>{formatEuro(Number(payout.amount_cents || 0))}</strong>
                  </div>
                ))}
              </div>
            ) : (
              <span>No payouts recorded yet.</span>
            )}
          </div>
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

function buildPendingAffiliate(profile: Profile): AffiliateAccount {
  return {
    id: undefined,
    code: generateAffiliateCode(profile),
    status: "pending",
    tier: "Tier 1 Affiliate",
    total_sales_cents: 0,
    total_commission_cents: 0,
    pending_payout_cents: 0,
    click_count: 0,
    conversion_count: 0,
    discount_rate: 5
  };
}

function generateAffiliateCode(profile: Profile) {
  const name = `${profile.first_name || profile.email}`.replace(/[^a-z0-9]/gi, "").slice(0, 3).toUpperCase() || "OHS";
  return `${name}OHS${profile.id.replace(/-/g, "").slice(0, 4).toUpperCase()}`;
}

function getAffiliateTier(totalSalesCents: number) {
  const tierNumber = Math.floor(totalSalesCents / 1_000_000) + 1;
  return `Tier ${tierNumber} Affiliate`;
}

function getNextTierMessage(totalCents: number, label: string) {
  const nextThreshold = (Math.floor(totalCents / 1_000_000) + 1) * 1_000_000;
  return `Spend ${formatEuro(nextThreshold - totalCents)} more in ${label} to unlock the next tier.`;
}
