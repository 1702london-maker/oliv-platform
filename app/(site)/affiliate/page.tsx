import fs from "node:fs";
import path from "node:path";
import { AffiliatePortal } from "@/components/portals/AffiliatePortal";
import { getCurrentProfile } from "@/lib/auth/session";
import { loginAction, forgotPasswordAction } from "@/app/(site)/login/actions";

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

export default async function AffiliatePage({
  searchParams,
}: {
  searchParams: Promise<{ application?: string; error?: string; message?: string }>;
}) {
  const profile = await getCurrentProfile();
  if (profile) return <AffiliatePortal profile={profile} />;

  const params = await searchParams;
  const appStatus = params.application;
  const loginError = params.error;
  const message = params.message;
  const { before, after } = getShell();

  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: before }} />

      <div id="oaff-public">
        <style>{`
          /* ── Hero ─────────────────────────────────── */
          .oaff-hero {
            position: relative;
            min-height: 540px;
            display: flex;
            align-items: center;
            background: linear-gradient(135deg, #1a1410 0%, #2B2620 55%, #3d2e23 100%);
            overflow: hidden;
          }
          .oaff-hero-bg {
            position: absolute;
            inset: 0;
            background: url('https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1600&q=80') center/cover no-repeat;
            opacity: 0.12;
          }
          .oaff-hero-inner {
            position: relative;
            max-width: 680px;
            margin: 0 auto;
            padding: 88px 32px;
            text-align: center;
          }
          .oaff-hero-eyebrow {
            font-family: 'Montserrat', sans-serif;
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 0.32em;
            text-transform: uppercase;
            color: #C9A96E;
            display: block;
            margin-bottom: 20px;
          }
          .oaff-hero-title {
            font-family: 'Cormorant Garamond', Georgia, serif;
            font-size: clamp(44px, 6vw, 74px);
            font-weight: 300;
            color: #ffffff;
            margin: 0 0 22px;
            line-height: 1.05;
          }
          .oaff-hero-title em { font-style: italic; color: #C9A96E; }
          .oaff-hero-sub {
            font-family: 'Montserrat', sans-serif;
            font-size: 14px;
            color: rgba(255,255,255,0.68);
            line-height: 1.85;
            margin: 0 0 40px;
          }
          .oaff-hero-btns { display: flex; gap: 14px; justify-content: center; flex-wrap: wrap; }
          .oaff-btn-gold {
            background: #B68A45;
            color: #fff;
            border: none;
            padding: 16px 36px;
            font-family: 'Montserrat', sans-serif;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.2em;
            text-transform: uppercase;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
            transition: background 0.2s;
          }
          .oaff-btn-gold:hover { background: #a07838; }
          .oaff-btn-outline {
            background: transparent;
            color: #fff;
            border: 1px solid rgba(255,255,255,0.45);
            padding: 16px 36px;
            font-family: 'Montserrat', sans-serif;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.2em;
            text-transform: uppercase;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
            transition: border-color 0.2s, background 0.2s;
          }
          .oaff-btn-outline:hover { border-color: #fff; background: rgba(255,255,255,0.07); }

          /* ── Stats bar ────────────────────────────── */
          .oaff-stats {
            background: #2B2620;
            padding: 22px 24px;
          }
          .oaff-stats-inner {
            max-width: 860px;
            margin: 0 auto;
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            text-align: center;
            gap: 8px;
          }
          .oaff-stat-val {
            font-family: 'Cormorant Garamond', Georgia, serif;
            font-size: 28px;
            font-weight: 300;
            color: #C9A96E;
            display: block;
            line-height: 1;
            margin-bottom: 5px;
          }
          .oaff-stat-label {
            font-family: 'Montserrat', sans-serif;
            font-size: 9px;
            font-weight: 700;
            letter-spacing: 0.2em;
            text-transform: uppercase;
            color: rgba(255,255,255,0.5);
          }

          /* ── Body ─────────────────────────────────── */
          .oaff-body { background: #F8F5EF; padding: 64px 24px 88px; }
          .oaff-body-inner { max-width: 760px; margin: 0 auto; display: grid; gap: 72px; }

          /* ── Section headers ──────────────────────── */
          .oaff-sec-eyebrow {
            font-family: 'Montserrat', sans-serif;
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 0.28em;
            text-transform: uppercase;
            color: #B68A45;
            margin: 0 0 14px;
          }
          .oaff-sec-title {
            font-family: 'Cormorant Garamond', Georgia, serif;
            font-size: 38px;
            font-weight: 300;
            color: #2B2620;
            margin: 0 0 8px;
            line-height: 1.1;
          }
          .oaff-sec-sub {
            font-family: 'Montserrat', sans-serif;
            font-size: 13px;
            color: #6b5c4e;
            margin: 0 0 32px;
            line-height: 1.75;
          }

          /* ── Card ─────────────────────────────────── */
          .oaff-card {
            background: #fff;
            border: 1px solid #e0d2bc;
            padding: 40px 44px;
          }

          /* ── Form ─────────────────────────────────── */
          .oaff-form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
          .oaff-form-field { display: grid; gap: 8px; margin-bottom: 20px; }
          .oaff-form-label {
            font-family: 'Montserrat', sans-serif;
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 0.18em;
            text-transform: uppercase;
            color: #2B2620;
          }
          .oaff-form-input, .oaff-form-select, .oaff-form-textarea {
            width: 100%;
            border: 1px solid #dfceb5;
            background: #fdfaf6;
            padding: 12px 16px;
            font-family: 'Montserrat', sans-serif;
            font-size: 13px;
            color: #2B2620;
            outline: none;
            box-sizing: border-box;
            transition: border-color 0.2s;
            -webkit-appearance: none;
            appearance: none;
            border-radius: 0;
          }
          .oaff-form-input:focus, .oaff-form-select:focus, .oaff-form-textarea:focus { border-color: #B68A45; }
          .oaff-form-input::placeholder, .oaff-form-textarea::placeholder { color: #b5a494; }
          .oaff-form-select {
            cursor: pointer;
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='7' viewBox='0 0 12 7'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%236b5c4e' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
            background-repeat: no-repeat;
            background-position: right 14px center;
            padding-right: 36px;
          }
          .oaff-form-textarea { resize: vertical; min-height: 110px; }
          .oaff-form-check { display: flex; gap: 12px; align-items: flex-start; margin-bottom: 24px; }
          .oaff-form-check input[type="checkbox"] {
            width: 16px; height: 16px;
            flex-shrink: 0; margin-top: 2px;
            accent-color: #2B2620; cursor: pointer;
          }
          .oaff-form-check-label {
            font-family: 'Montserrat', sans-serif;
            font-size: 12px;
            color: #6b5c4e;
            line-height: 1.65;
          }
          .oaff-form-submit {
            width: 100%;
            background: #2B2620;
            color: #fff;
            border: none;
            padding: 15px 24px;
            font-family: 'Montserrat', sans-serif;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.22em;
            text-transform: uppercase;
            cursor: pointer;
            transition: background 0.2s;
          }
          .oaff-form-submit:hover { background: #3d3530; }
          .oaff-form-note {
            font-family: 'Montserrat', sans-serif;
            font-size: 11px;
            color: #9b8878;
            text-align: center;
            margin-top: 14px;
            line-height: 1.6;
          }

          /* ── Alerts ───────────────────────────────── */
          .oaff-alert {
            padding: 13px 18px;
            margin-bottom: 24px;
            font-family: 'Montserrat', sans-serif;
            font-size: 12px;
            line-height: 1.5;
          }
          .oaff-alert-success { background: #f0faf5; border: 1px solid #b5ddc8; color: #2a6a4a; }
          .oaff-alert-error   { background: #fdf3f3; border: 1px solid #e8c5c5; color: #8b3535; }
          .oaff-alert-info    { background: #fdf8f0; border: 1px solid #e8d5b0; color: #7a5a20; }

          /* ── Login / Forgot toggle ─────────────────── */
          .oaff-login-divider { border: none; border-top: 1px solid #e7d9c5; margin: 24px 0; }
          .oaff-link-btn {
            background: none; border: none;
            font-family: 'Montserrat', sans-serif;
            font-size: 12px; font-weight: 600;
            color: #B68A45; cursor: pointer; padding: 0;
            text-decoration: underline; text-underline-offset: 3px;
          }
          .oaff-back-btn {
            background: none; border: none;
            font-family: 'Montserrat', sans-serif;
            font-size: 12px; color: #6b5c4e;
            cursor: pointer; padding: 0;
            text-decoration: underline; text-underline-offset: 3px;
          }
          .oaff-hidden { display: none !important; }
          .oaff-text-center { text-align: center; }
          .oaff-reset-sub {
            font-family: 'Montserrat', sans-serif;
            font-size: 13px; color: #6b5c4e;
            margin: 0 0 28px; line-height: 1.7;
          }

          /* ── Responsive ───────────────────────────── */
          @media (max-width: 640px) {
            .oaff-form-row { grid-template-columns: 1fr; gap: 0; }
            .oaff-card { padding: 28px 20px; }
            .oaff-stats-inner { grid-template-columns: repeat(2, 1fr); }
            .oaff-sec-title { font-size: 30px; }
            .oaff-hero-inner { padding: 60px 24px; }
          }
        `}</style>

        {/* ── Hero ─────────────────────────────────── */}
        <section className="oaff-hero">
          <div className="oaff-hero-bg" />
          <div className="oaff-hero-inner">
            <span className="oaff-hero-eyebrow">OlivHairSupply Affiliate</span>
            <h1 className="oaff-hero-title">
              Earn. Influence. <em>Elevate.</em>
            </h1>
            <p className="oaff-hero-sub">
              Turn your influence into income with the OlivHairSupply Affiliate Programme.
              Earn competitive commissions sharing products you love.
            </p>
            <div className="oaff-hero-btns">
              <a href="#oaff-apply" className="oaff-btn-gold">Become an Affiliate</a>
              <a href="#oaff-login" className="oaff-btn-outline">Log in to Dashboard</a>
            </div>
          </div>
        </section>

        {/* ── Stats bar ──────────────────────────────── */}
        <div className="oaff-stats">
          <div className="oaff-stats-inner">
            <div><span className="oaff-stat-val">10%</span><span className="oaff-stat-label">Commission Rate</span></div>
            <div><span className="oaff-stat-val">60d</span><span className="oaff-stat-label">Cookie Window</span></div>
            <div><span className="oaff-stat-val">Weekly</span><span className="oaff-stat-label">Payouts</span></div>
            <div><span className="oaff-stat-val">1:1</span><span className="oaff-stat-label">Dedicated Support</span></div>
          </div>
        </div>

        {/* ── Body ───────────────────────────────────── */}
        <div className="oaff-body">
          <div className="oaff-body-inner">

            {/* APPLICATION FORM */}
            <section id="oaff-apply">
              <p className="oaff-sec-eyebrow">Join the Programme</p>
              <h2 className="oaff-sec-title">Apply Now</h2>
              <p className="oaff-sec-sub">
                Fill in your details below. Our team reviews every application personally
                and will contact you within 3 to 5 business days.
              </p>

              {appStatus === "submitted" && (
                <div className="oaff-alert oaff-alert-success">
                  ✓ &nbsp;Application submitted — we'll be in touch within 3–5 business days.
                </div>
              )}
              {appStatus === "missing" && (
                <div className="oaff-alert oaff-alert-error">
                  Please complete all required fields and try again.
                </div>
              )}

              <div className="oaff-card">
                <form action="/api/applications/affiliate" method="POST">
                  <div className="oaff-form-row">
                    <div className="oaff-form-field">
                      <label className="oaff-form-label" htmlFor="aff-name">Full Name</label>
                      <input className="oaff-form-input" type="text" id="aff-name" name="contact[Full Name]" placeholder="Your full name" required />
                    </div>
                    <div className="oaff-form-field">
                      <label className="oaff-form-label" htmlFor="aff-email">Email Address</label>
                      <input className="oaff-form-input" type="email" id="aff-email" name="contact[email]" placeholder="your@email.com" required />
                    </div>
                  </div>
                  <div className="oaff-form-row">
                    <div className="oaff-form-field">
                      <label className="oaff-form-label" htmlFor="aff-phone">Phone Number</label>
                      <input className="oaff-form-input" type="tel" id="aff-phone" name="contact[Phone]" placeholder="+49 000 000 0000" />
                    </div>
                    <div className="oaff-form-field">
                      <label className="oaff-form-label" htmlFor="aff-platform">Primary Platform</label>
                      <select className="oaff-form-select" id="aff-platform" name="contact[Primary Platform]" required defaultValue="">
                        <option value="" disabled>Select platform</option>
                        <option value="Instagram">Instagram</option>
                        <option value="TikTok">TikTok</option>
                        <option value="YouTube">YouTube</option>
                        <option value="Facebook">Facebook</option>
                        <option value="Blog or Website">Blog or Website</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                  <div className="oaff-form-row">
                    <div className="oaff-form-field">
                      <label className="oaff-form-label" htmlFor="aff-handle">Social Media Handle</label>
                      <input className="oaff-form-input" type="text" id="aff-handle" name="contact[Social Handle]" placeholder="@yourhandle" required />
                    </div>
                    <div className="oaff-form-field">
                      <label className="oaff-form-label" htmlFor="aff-followers">Follower Count</label>
                      <select className="oaff-form-select" id="aff-followers" name="contact[Followers]" required defaultValue="">
                        <option value="" disabled>Select range</option>
                        <option value="Under 5k">Under 5,000</option>
                        <option value="5k-10k">5,000 – 10,000</option>
                        <option value="10k-50k">10,000 – 50,000</option>
                        <option value="50k-100k">50,000 – 100,000</option>
                        <option value="100k+">Over 100,000</option>
                      </select>
                    </div>
                  </div>
                  <div className="oaff-form-field">
                    <label className="oaff-form-label" htmlFor="aff-url">Profile Link</label>
                    <input className="oaff-form-input" type="url" id="aff-url" name="contact[Profile URL]" placeholder="https://instagram.com/yourhandle" />
                  </div>
                  <div className="oaff-form-field">
                    <label className="oaff-form-label" htmlFor="aff-about">Tell us about yourself and your audience</label>
                    <textarea className="oaff-form-textarea" id="aff-about" name="contact[body]" placeholder="Briefly describe your content, your audience, and why you'd like to partner with OlivHairSupply." required />
                  </div>
                  <div className="oaff-form-check">
                    <input type="checkbox" id="aff-agree" required />
                    <label className="oaff-form-check-label" htmlFor="aff-agree">
                      I agree to promote OlivHairSupply authentically and in accordance with brand guidelines.
                    </label>
                  </div>
                  <button className="oaff-form-submit" type="submit">Submit Application</button>
                  <p className="oaff-form-note">We review all applications personally. You will hear from us within 3 to 5 business days.</p>
                </form>
              </div>
            </section>

            {/* DASHBOARD LOGIN */}
            <section id="oaff-login">
              <p className="oaff-sec-eyebrow">Already a Member</p>
              <h2 className="oaff-sec-title">Dashboard Login</h2>
              <p className="oaff-sec-sub">Access your affiliate dashboard to track commissions, view your analytics, and manage your account.</p>

              {loginError === "invalid" && <div className="oaff-alert oaff-alert-error">Incorrect email or password. Please try again.</div>}
              {loginError === "missing" && <div className="oaff-alert oaff-alert-error">Please enter your email and password.</div>}
              {loginError === "reset-missing" && <div className="oaff-alert oaff-alert-error">Please enter your email address.</div>}
              {message === "reset-sent" && <div className="oaff-alert oaff-alert-info">✓ &nbsp;Reset link sent — please check your inbox.</div>}

              <div className="oaff-card">
                {/* Login form */}
                <div id="oaff-login-wrap">
                  <form action={loginAction}>
                    <input type="hidden" name="next" value="/affiliate" />
                    <div className="oaff-form-field">
                      <label className="oaff-form-label" htmlFor="oaff-dash-email">Email Address</label>
                      <input className="oaff-form-input" id="oaff-dash-email" name="email" type="email" autoComplete="email" required />
                    </div>
                    <div className="oaff-form-field">
                      <label className="oaff-form-label" htmlFor="oaff-dash-pw">Password</label>
                      <input className="oaff-form-input" id="oaff-dash-pw" name="password" type="password" autoComplete="current-password" required />
                    </div>
                    <button className="oaff-form-submit" type="submit">Log in to Dashboard</button>
                  </form>
                  <hr className="oaff-login-divider" />
                  <p className="oaff-text-center">
                    <button id="oaff-to-forgot" className="oaff-link-btn" type="button">Forgot your password?</button>
                  </p>
                </div>

                {/* Forgot password form */}
                <div id="oaff-forgot-wrap" className="oaff-hidden">
                  <p className="oaff-sec-eyebrow" style={{ marginBottom: "8px" }}>Reset Password</p>
                  <p className="oaff-reset-sub">Enter your email and we'll send you a link to reset your password.</p>
                  <form action={forgotPasswordAction}>
                    <input type="hidden" name="from" value="/affiliate" />
                    <div className="oaff-form-field">
                      <label className="oaff-form-label" htmlFor="oaff-reset-email">Email Address</label>
                      <input className="oaff-form-input" id="oaff-reset-email" name="email" type="email" autoComplete="email" required />
                    </div>
                    <button className="oaff-form-submit" type="submit">Send Reset Link</button>
                  </form>
                  <hr className="oaff-login-divider" />
                  <p className="oaff-text-center">
                    <button id="oaff-to-login" className="oaff-back-btn" type="button">← Back to login</button>
                  </p>
                </div>
              </div>
            </section>

          </div>
        </div>

        <script dangerouslySetInnerHTML={{ __html: `
          (function(){
            var toForgot = document.getElementById('oaff-to-forgot');
            var toLogin  = document.getElementById('oaff-to-login');
            var loginW   = document.getElementById('oaff-login-wrap');
            var forgotW  = document.getElementById('oaff-forgot-wrap');
            if(toForgot) toForgot.addEventListener('click', function(){
              loginW.classList.add('oaff-hidden');
              forgotW.classList.remove('oaff-hidden');
            });
            if(toLogin) toLogin.addEventListener('click', function(){
              forgotW.classList.add('oaff-hidden');
              loginW.classList.remove('oaff-hidden');
            });
          })();
        `}} />
      </div>

      <div dangerouslySetInnerHTML={{ __html: after }} />
    </>
  );
}
