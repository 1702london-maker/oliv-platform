import { loginAction } from "@/app/(site)/login/actions";

export function LoginBox({ next }: { next: string }) {
  return (
    <form action={loginAction}>
      <input type="hidden" name="next" value={next} />
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
      <button className="ohs-auth-btn" type="submit">Sign In</button>
    </form>
  );
}
