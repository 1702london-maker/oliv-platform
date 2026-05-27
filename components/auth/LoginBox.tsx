"use client";

import { useState } from "react";

type LoginBoxProps = {
  next: string;
};

export function LoginBox({ next }: LoginBoxProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, next })
      });
      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || "Login failed. Please try again.");
        return;
      }

      window.location.href = data.next || "/account";
    } catch {
      setMessage("Login could not connect. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {message ? <div className="ohs-auth-alert-error">{message}</div> : null}
      <div className="ohs-auth-field">
        <label className="ohs-auth-label" htmlFor="ohs-login-email">Email Address</label>
        <input
          className="ohs-auth-input"
          id="ohs-login-email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </div>
      <div className="ohs-auth-field">
        <label className="ohs-auth-label" htmlFor="ohs-login-password">Password</label>
        <input
          className="ohs-auth-input"
          id="ohs-login-password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") void submit();
          }}
        />
      </div>
      <button className="ohs-auth-btn" type="button" onClick={submit} disabled={loading}>
        {loading ? "Signing In..." : "Sign In"}
      </button>
    </div>
  );
}
