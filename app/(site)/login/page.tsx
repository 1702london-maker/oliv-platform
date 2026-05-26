import Link from "next/link";
import { loginAction } from "@/app/(site)/login/actions";

export default function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  return (
    <main className="min-h-screen bg-linen px-6 py-12">
      <div className="mx-auto max-w-md border border-[#e3d6c5] bg-white p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold">Account</p>
        <h1 className="mt-3 font-serif text-4xl">Log in</h1>
        <form action={loginAction} className="mt-8 grid gap-4">
          <label className="grid gap-2 text-sm font-semibold text-cocoa">
            Email
            <input className="border border-[#d8c7ad] px-4 py-3" name="email" type="email" required />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-cocoa">
            Password
            <input className="border border-[#d8c7ad] px-4 py-3" name="password" type="password" required />
          </label>
          <button className="bg-ink px-5 py-3 text-xs font-bold uppercase tracking-[0.22em] text-white">
            Log in
          </button>
        </form>
        <p className="mt-5 text-sm text-cocoa">
          New here?{" "}
          <Link className="font-semibold text-ink underline" href="/register">
            Create an account
          </Link>
        </p>
      </div>
    </main>
  );
}
