import { logoutAction } from "@/app/(site)/login/actions";
import { requireProfile } from "@/lib/auth/session";
import { formatEuro } from "@/lib/catalog/money";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";

export default async function AccountPage() {
  const profile = await requireProfile();
  const supabase = createSupabaseAdminClient();
  const { data: orders } = await supabase
    .from("orders")
    .select("id,status,total_cents,affiliate_code,created_at")
    .eq("customer_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(10);

  return (
    <main className="min-h-screen bg-linen px-6 py-12">
      <div className="mx-auto max-w-5xl">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold">Account</p>
        <h1 className="mt-3 font-serif text-5xl">Welcome back</h1>
        <div className="mt-8 border border-[#e3d6c5] bg-white p-6">
          <p className="text-sm text-cocoa">Signed in as</p>
          <p className="mt-1 text-lg font-semibold">{profile.email}</p>
          <p className="mt-4 text-sm uppercase tracking-[0.18em] text-cocoa">
            Roles: {profile.roles.join(", ")}
          </p>
        </div>
        <div className="mt-6 grid gap-3 border border-[#e3d6c5] bg-white p-6 md:grid-cols-3">
          <Link className="border border-[#d8c7ad] px-5 py-3 text-center text-xs font-bold uppercase tracking-[0.22em]" href="/shop">
            Shop
          </Link>
          <Link className="border border-[#d8c7ad] px-5 py-3 text-center text-xs font-bold uppercase tracking-[0.22em]" href="/affiliate">
            Affiliate Portal
          </Link>
          <Link className="border border-[#d8c7ad] px-5 py-3 text-center text-xs font-bold uppercase tracking-[0.22em]" href="/wholesale">
            Wholesale Portal
          </Link>
        </div>
        <div className="mt-6 border border-[#e3d6c5] bg-white p-6">
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-cocoa">Order history</h2>
          <div className="mt-5 grid gap-3">
            {orders?.length ? (
              orders.map((order) => (
                <div key={order.id} className="grid gap-2 border border-[#eadcc8] p-4 md:grid-cols-4">
                  <span className="text-sm text-cocoa">{new Date(order.created_at).toLocaleDateString("en-GB")}</span>
                  <span className="text-sm text-cocoa">{order.status}</span>
                  <span className="text-sm font-semibold">{formatEuro(Number(order.total_cents || 0))}</span>
                  <span className="text-sm text-cocoa">{order.affiliate_code || ""}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-cocoa">No orders yet.</p>
            )}
          </div>
        </div>
        <form action={logoutAction} className="mt-6">
          <button className="border border-[#d8c7ad] bg-white px-5 py-3 text-xs font-bold uppercase tracking-[0.22em]">
            Log out
          </button>
        </form>
      </div>
    </main>
  );
}
