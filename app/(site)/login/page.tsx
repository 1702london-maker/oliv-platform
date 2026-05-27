import fs from "node:fs";
import path from "node:path";
import { forgotPasswordAction } from "@/app/(site)/login/actions";
import { LoginBox } from "@/components/auth/LoginBox";

function getShell() {
  const html = fs.readFileSync(path.join(process.cwd(), "shopify-clone", "shop.html"), "utf8");
  const marker = '<div class="template-404 page-width page-margin center">';
  const start = html.indexOf(marker);
  const end = html.indexOf("</div>", start) + "</div>".length;
  return {
    before: start > -1 ? html.slice(0, start) : html,
    after: start > -1 ? html.slice(end) : ""
  };
}

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; next?: string; message?: string }>;
}) {
  const params = await searchParams;
  const next = params.next?.startsWith("/") ? params.next : "/account";
  const error = params.error;
  const message = params.message;
  const showForgot = error === "reset-missing" || message === "reset-sent";
  const { before, after } = getShell();

  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: before }} />

      <div id="ohs-auth-main">
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
            max-width: 460px;
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
          .ohs-auth-field { display: grid; gap: 8px; margin-bottom: 20px; }
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
          .ohs-auth-row-end {
            display: flex;
            justify-content: flex-end;
            margin-top: -8px;
            margin-bottom: 16px;
          }
          .ohs-auth-link-sm {
            font-family: 'Montserrat', sans-serif;
            font-size: 11px;
            color: #B68A45;
            font-weight: 600;
            background: none;
            border: none;
            cursor: pointer;
            padding: 0;
            text-decoration: underline;
            text-underline-offset: 3px;
          }
          .ohs-auth-divider { border: none; border-top: 1px solid #e7d9c5; margin: 28px 0; }
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
          .ohs-auth-alert-error {
            background: #fdf3f3;
            border: 1px solid #e8c5c5;
            color: #8b3535;
            font-family: 'Montserrat', sans-serif;
            font-size: 12px;
            padding: 12px 16px;
            margin-bottom: 24px;
          }
          .ohs-auth-alert-info {
            background: #fdf8f0;
            border: 1px solid #e8d5b0;
            color: #7a5a20;
            font-family: 'Montserrat', sans-serif;
            font-size: 12px;
            padding: 12px 16px;
            margin-bottom: 24px;
          }
          .ohs-auth-sub {
            font-family: 'Montserrat', sans-serif;
            font-size: 13px;
            color: #6b5c4e;
            line-height: 1.6;
            margin: 0 0 28px;
          }
          .ohs-hidden { display: none !important; }
          @media (max-width: 520px) {
            .ohs-auth-card { padding: 36px 24px; }
            .ohs-auth-title { font-size: 34px; }
          }
        `}</style>

        <div className="ohs-auth-card">
          <p className="ohs-auth-eyebrow">
            {next === "/affiliate" ? "Affiliate Programme" : next === "/wholesale" ? "Wholesale Portal" : "Account"}
          </p>

          <div id="ohs-signin-panel" className={showForgot ? "ohs-hidden" : ""}>
            <h1 className="ohs-auth-title">
              {next === "/affiliate" ? "Affiliate Dashboard" : next === "/wholesale" ? "Wholesale Portal" : "Sign In"}
            </h1>
            {error === "invalid" && <div className="ohs-auth-alert-error">Incorrect email or password. Please try again.</div>}
            {error === "missing" && <div className="ohs-auth-alert-error">Please enter your email and password.</div>}
            {error === "profile" && (
              <div className="ohs-auth-alert-error">
                Login worked, but the account profile could not be prepared. Check the Supabase service role key in Vercel.
              </div>
            )}
            <LoginBox next={next} />
            <div className="ohs-auth-row-end">
              <button id="ohs-to-forgot" className="ohs-auth-link-sm" type="button">Forgot password?</button>
            </div>
            <hr className="ohs-auth-divider" />
            <p className="ohs-auth-footer-text">
              New to OlivHairSupply? <a href="/register">Create an account</a>
            </p>
          </div>

          <div id="ohs-forgot-panel" className={showForgot ? "" : "ohs-hidden"}>
            <h1 className="ohs-auth-title">Reset Password</h1>
            {message === "reset-sent" && <div className="ohs-auth-alert-info">Reset link sent. Please check your inbox.</div>}
            {error === "reset-missing" && <div className="ohs-auth-alert-error">Please enter your email address.</div>}
            <p className="ohs-auth-sub">Enter your email and we&apos;ll send you a link to reset your password.</p>
            <form action={forgotPasswordAction}>
              <input type="hidden" name="from" value="/login" />
              <div className="ohs-auth-field">
                <label className="ohs-auth-label" htmlFor="ohs-forgot-email">Email Address</label>
                <input className="ohs-auth-input" id="ohs-forgot-email" name="email" type="email" autoComplete="email" required />
              </div>
              <button className="ohs-auth-btn" type="submit">Send Reset Link</button>
            </form>
            <hr className="ohs-auth-divider" />
            <p className="ohs-auth-footer-text">
              <button id="ohs-to-signin" className="ohs-auth-link-sm" type="button" style={{ fontSize: "13px", color: "#2B2620" }}>Back to sign in</button>
            </p>
          </div>
        </div>

        <script dangerouslySetInnerHTML={{ __html: `
          (function(){
            var toForgot = document.getElementById('ohs-to-forgot');
            var toSignin = document.getElementById('ohs-to-signin');
            var signinPanel = document.getElementById('ohs-signin-panel');
            var forgotPanel = document.getElementById('ohs-forgot-panel');
            if(toForgot) toForgot.addEventListener('click', function(){
              signinPanel.classList.add('ohs-hidden');
              forgotPanel.classList.remove('ohs-hidden');
            });
            if(toSignin) toSignin.addEventListener('click', function(){
              forgotPanel.classList.add('ohs-hidden');
              signinPanel.classList.remove('ohs-hidden');
            });
          })();
        `}} />
      </div>

      <div dangerouslySetInnerHTML={{ __html: after }} />
    </>
  );
}
