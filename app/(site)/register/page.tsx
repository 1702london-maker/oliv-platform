import fs from "node:fs";
import path from "node:path";
import { registerAction } from "@/app/(site)/login/actions";

function getShell() {
  const html = fs.readFileSync(
    path.join(process.cwd(), "shopify-clone", "shop.html"),
    "utf8"
  );
  const marker = '<div class="template-404 page-width page-margin center">';
  const start = html.indexOf(marker);
  const end = html.indexOf("</div>", start) + "</div>".length;
  return {
    before: start > -1 ? html.slice(0, start) : html,
    after: start > -1 ? html.slice(end) : "",
  };
}

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const error = params.error;
  const { before, after } = getShell();

  const errorMsg =
    error === "failed"
      ? "We couldn't create your account. This email may already be in use."
      : error === "missing"
      ? "Please fill in all required fields."
      : null;

  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: before }} />

      <main id="ohs-auth-main">
        <style>{`
          #ohs-auth-main {
            background: #F8F5EF;
            min-height: 60vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 64px 24px;
          }
          .ohs-auth-card {
            background: #ffffff;
            border: 1px solid #e0d2bc;
            width: 100%;
            max-width: 500px;
            padding: 52px 48px;
          }
          .ohs-auth-eyebrow {
            font-family: 'Montserrat', sans-serif;
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 0.28em;
            text-transform: uppercase;
            color: #B68A45;
            margin: 0 0 14px;
          }
          .ohs-auth-title {
            font-family: 'Cormorant Garamond', Georgia, serif;
            font-size: 42px;
            font-weight: 300;
            color: #2B2620;
            margin: 0 0 36px;
            line-height: 1.1;
          }
          .ohs-auth-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
          }
          .ohs-auth-field {
            display: grid;
            gap: 8px;
            margin-bottom: 20px;
          }
          .ohs-auth-label {
            font-family: 'Montserrat', sans-serif;
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 0.18em;
            text-transform: uppercase;
            color: #2B2620;
          }
          .ohs-auth-input {
            width: 100%;
            border: 1px solid #dfceb5;
            background: #fdfaf6;
            padding: 13px 16px;
            font-family: 'Montserrat', sans-serif;
            font-size: 14px;
            color: #2B2620;
            outline: none;
            box-sizing: border-box;
            transition: border-color 0.2s;
          }
          .ohs-auth-input:focus { border-color: #B68A45; }
          .ohs-auth-hint {
            font-family: 'Montserrat', sans-serif;
            font-size: 11px;
            color: #9b8878;
            margin-top: 4px;
          }
          .ohs-auth-btn {
            width: 100%;
            background: #2B2620;
            color: #ffffff;
            border: none;
            padding: 15px 24px;
            font-family: 'Montserrat', sans-serif;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.22em;
            text-transform: uppercase;
            cursor: pointer;
            margin-top: 8px;
            transition: background 0.2s;
          }
          .ohs-auth-btn:hover { background: #3d3530; }
          .ohs-auth-divider {
            border: none;
            border-top: 1px solid #e7d9c5;
            margin: 28px 0;
          }
          .ohs-auth-footer-text {
            font-family: 'Montserrat', sans-serif;
            font-size: 13px;
            color: #6b5c4e;
            margin: 0;
            text-align: center;
          }
          .ohs-auth-footer-text a {
            color: #2B2620;
            font-weight: 700;
            text-decoration: underline;
            text-underline-offset: 3px;
          }
          .ohs-auth-error {
            background: #fdf3f3;
            border: 1px solid #e8c5c5;
            color: #8b3535;
            font-family: 'Montserrat', sans-serif;
            font-size: 12px;
            padding: 12px 16px;
            margin-bottom: 24px;
            letter-spacing: 0.04em;
          }
          .ohs-auth-terms {
            font-family: 'Montserrat', sans-serif;
            font-size: 11px;
            color: #9b8878;
            text-align: center;
            margin-top: 16px;
            line-height: 1.6;
          }
          .ohs-auth-terms a { color: #6b5c4e; text-decoration: underline; }
          @media (max-width: 520px) {
            .ohs-auth-card { padding: 36px 24px; }
            .ohs-auth-title { font-size: 34px; }
            .ohs-auth-row { grid-template-columns: 1fr; gap: 0; }
          }
        `}</style>

        <div className="ohs-auth-card">
          <p className="ohs-auth-eyebrow">Account</p>
          <h1 className="ohs-auth-title">Create Account</h1>

          {errorMsg && <div className="ohs-auth-error">{errorMsg}</div>}

          <form action={registerAction}>
            <div className="ohs-auth-row">
              <div className="ohs-auth-field">
                <label className="ohs-auth-label" htmlFor="ohs-reg-fname">
                  First Name
                </label>
                <input
                  className="ohs-auth-input"
                  id="ohs-reg-fname"
                  name="first_name"
                  type="text"
                  autoComplete="given-name"
                />
              </div>
              <div className="ohs-auth-field">
                <label className="ohs-auth-label" htmlFor="ohs-reg-lname">
                  Last Name
                </label>
                <input
                  className="ohs-auth-input"
                  id="ohs-reg-lname"
                  name="last_name"
                  type="text"
                  autoComplete="family-name"
                />
              </div>
            </div>

            <div className="ohs-auth-field">
              <label className="ohs-auth-label" htmlFor="ohs-reg-email">
                Email Address
              </label>
              <input
                className="ohs-auth-input"
                id="ohs-reg-email"
                name="email"
                type="email"
                autoComplete="email"
                required
              />
            </div>

            <div className="ohs-auth-field">
              <label className="ohs-auth-label" htmlFor="ohs-reg-password">
                Password
              </label>
              <input
                className="ohs-auth-input"
                id="ohs-reg-password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
              />
              <p className="ohs-auth-hint">Minimum 8 characters</p>
            </div>

            <button className="ohs-auth-btn" type="submit">
              Create Account
            </button>

            <p className="ohs-auth-terms">
              By creating an account you agree to our{" "}
              <a href="/pages/terms">Terms</a> and{" "}
              <a href="/pages/privacy-policy">Privacy Policy</a>.
            </p>
          </form>

          <hr className="ohs-auth-divider" />

          <p className="ohs-auth-footer-text">
            Already have an account?{" "}
            <a href="/login">Sign in</a>
          </p>
        </div>
      </main>

      <div dangerouslySetInnerHTML={{ __html: after }} />
    </>
  );
}
