import { logoutAction } from "@/app/(site)/login/actions";
import { requireProfile } from "@/lib/auth/session";
import Link from "next/link";

export default async function AccountPage() {
  const profile = await requireProfile();

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
        <form action={logoutAction} className="mt-6">
          <button className="border border-[#d8c7ad] bg-white px-5 py-3 text-xs font-bold uppercase tracking-[0.22em]">
            Log out
          </button>
        </form>
      </div>
    </main>
  );
}
