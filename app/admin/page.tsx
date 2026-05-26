import { approveAffiliate, approveWholesale } from "@/app/admin/actions";
import { formatEuro } from "@/lib/catalog/money";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export default async function AdminPage() {
  const supabase = createSupabaseAdminClient();
  const [{ data: affiliates }, { data: wholesaleAccounts }, { data: orders }] = await Promise.all([
    supabase
      .from("affiliates")
      .select("id,email,display_name,status,code,total_sales_cents,total_commission_cents,profile_id")
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("wholesale_accounts")
      .select("id,email,business_name,status,tier,lifetime_spend_cents,profile_id")
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("orders")
      .select("id,email,status,total_cents,affiliate_code,created_at")
      .order("created_at", { ascending: false })
      .limit(12)
  ]);

  return (
    <main className="min-h-screen bg-linen px-6 py-10">
      <div className="mx-auto max-w-7xl">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold">Admin</p>
        <h1 className="mt-3 font-serif text-5xl">Operations dashboard</h1>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <section className="border border-[#e3d6c5] bg-white p-5">
            <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-cocoa">Affiliate accounts</h2>
            <div className="mt-5 grid gap-3">
              {(affiliates || []).map((affiliate) => (
                <article key={affiliate.id} className="border border-[#eadcc8] p-4">
                  <div className="font-semibold">{affiliate.display_name || affiliate.email}</div>
                  <div className="mt-1 text-sm text-cocoa">{affiliate.email} · {affiliate.code}</div>
                  <div className="mt-2 text-xs uppercase tracking-[0.16em] text-cocoa">
                    {affiliate.status} · Sales {formatEuro(Number(affiliate.total_sales_cents || 0))} · Commission {formatEuro(Number(affiliate.total_commission_cents || 0))}
                  </div>
                  {affiliate.status !== "approved" ? (
                    <form action={approveAffiliate} className="mt-3">
                      <input name="id" type="hidden" value={affiliate.id} />
                      <button className="border border-[#2b2620] px-4 py-2 text-xs font-bold uppercase tracking-[0.18em]">
                        Approve
                      </button>
                    </form>
                  ) : null}
                </article>
              ))}
            </div>
          </section>

          <section className="border border-[#e3d6c5] bg-white p-5">
            <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-cocoa">Wholesale accounts</h2>
            <div className="mt-5 grid gap-3">
              {(wholesaleAccounts || []).map((account) => (
                <article key={account.id} className="border border-[#eadcc8] p-4">
                  <div className="font-semibold">{account.business_name}</div>
                  <div className="mt-1 text-sm text-cocoa">{account.email || "No email captured"}</div>
                  <div className="mt-2 text-xs uppercase tracking-[0.16em] text-cocoa">
                    {account.status} · {account.tier} · Spend {formatEuro(Number(account.lifetime_spend_cents || 0))}
                  </div>
                  {account.status !== "approved" && account.email ? (
                    <form action={approveWholesale} className="mt-3">
                      <input name="id" type="hidden" value={account.id} />
                      <button className="border border-[#2b2620] px-4 py-2 text-xs font-bold uppercase tracking-[0.18em]">
                        Approve
                      </button>
                    </form>
                  ) : null}
                </article>
              ))}
            </div>
          </section>

          <section className="border border-[#e3d6c5] bg-white p-5 lg:col-span-2">
            <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-cocoa">Recent orders</h2>
            <div className="mt-5 grid gap-3">
              {(orders || []).map((order) => (
                <article key={order.id} className="grid gap-2 border border-[#eadcc8] p-4 md:grid-cols-4">
                  <div className="font-semibold">{order.email}</div>
                  <div className="text-sm text-cocoa">{order.status}</div>
                  <div className="text-sm text-cocoa">{formatEuro(Number(order.total_cents || 0))}</div>
                  <div className="text-sm text-cocoa">{order.affiliate_code || "No affiliate"}</div>
                </article>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
