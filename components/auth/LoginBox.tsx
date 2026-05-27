"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function LoginBox({ next }: { next: string }) {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") || "").trim().toLowerCase();
    const password = String(fd.get("password") || "");

    if (!email || !password) {
      setErrorMsg("Please enter your email and password.");
      setLoading(false);
      return;
    }

    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setErrorMsg("Incorrect email or password.");
      setLoading(false);
      return;
    }

    // Hard navigate — guarantees the server receives a fresh cookie on the next request
    window.location.href = next;
  }

  return (
    <form onSubmit={handleSubmit}>
      {errorMsg && <div className="ohs-auth-alert-error">{errorMsg}</div>}
      <div className="ohs-auth-field">
        <label className="ohs-auth-label" htmlFor="ohs-login-email">Email Address</label>
        <input
          className="ohs-auth-input"
          id="ohs-login-email"
          name="email"
          type="email"
          autoComplete="email"
          required
        />
      </div>
      <div className="ohs-auth-field">
        <label className="ohs-auth-label" htmlFor="ohs-login-password">Password</label>
        <input
          className="ohs-auth-input"
          id="ohs-login-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </div>
      <button className="ohs-auth-btn" type="submit" disabled={loading}>
        {loading ? "Signing in…" : "Sign In"}
      </button>
    </form>
  );
}
