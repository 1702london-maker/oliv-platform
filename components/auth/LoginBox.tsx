type LoginBoxProps = {
  next: string;
  error?: string;
  detail?: string;
};

export function LoginBox({ next, error, detail }: LoginBoxProps) {
  const message =
    error === "missing"
      ? "Please enter your email and password."
      : error === "invalid"
        ? `Incorrect email or password.${detail ? ` (${detail})` : ""}`
        : error === "profile"
          ? "Login worked, but the account profile could not be prepared. Check the Supabase service role key in Vercel."
          : "";

  return (
    <form action="/api/auth/login-form" method="post">
      <input name="next" type="hidden" value={next} />
      {message ? <div className="ohs-auth-alert-error">{message}</div> : null}
      <div className="ohs-auth-field">
        <label className="ohs-auth-label" htmlFor="ohs-login-email">Email Address</label>
        <input className="ohs-auth-input" id="ohs-login-email" name="email" type="email" autoComplete="email" required />
      </div>
      <div className="ohs-auth-field">
        <label className="ohs-auth-label" htmlFor="ohs-login-password">Password</label>
        <input className="ohs-auth-input" id="ohs-login-password" name="password" type="password" autoComplete="current-password" required />
      </div>
      <button className="ohs-auth-btn" type="submit">Sign In</button>
    </form>
  );
}
