import Link from "next/link";
import { registerAction } from "@/app/(site)/login/actions";

export default function RegisterPage() {
  return (
    <main className="min-h-screen bg-linen px-6 py-12">
      <div className="mx-auto max-w-md border border-[#e3d6c5] bg-white p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold">Account</p>
        <h1 className="mt-3 font-serif text-4xl">Create account</h1>
        <form action={registerAction} className="mt-8 grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-semibold text-cocoa">
              First name
              <input className="border border-[#d8c7ad] px-4 py-3" name="first_name" />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-cocoa">
              Last name
              <input className="border border-[#d8c7ad] px-4 py-3" name="last_name" />
            </label>
          </div>
          <label className="grid gap-2 text-sm font-semibold text-cocoa">
            Email
            <input className="border border-[#d8c7ad] px-4 py-3" name="email" type="email" required />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-cocoa">
            Password
            <input className="border border-[#d8c7ad] px-4 py-3" name="password" type="password" required />
          </label>
          <button className="bg-ink px-5 py-3 text-xs font-bold uppercase tracking-[0.22em] text-white">
            Create account
          </button>
        </form>
        <p className="mt-5 text-sm text-cocoa">
          Already have an account?{" "}
          <Link className="font-semibold text-ink underline" href="/login">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
