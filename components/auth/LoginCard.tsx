"use client";

import { useState, useEffect } from "react";

const T = {
  en: {
    eyebrow: "Account",
    signIn: "Sign In",
    registered: "Account created. Please sign in with your email and password.",
    email: "Email Address",
    emailPh: "your@email.com",
    password: "Password",
    signInBtn: "Sign In",
    forgotLink: "Forgot Password?",
    newHere: "New to OlivHairSupply?",
    createAccount: "Create Account",
    resetTitle: "Reset Password",
    resetSent: "Reset link sent. Please check your inbox.",
    resetMissing: "Please enter your email address.",
    resetSub: "Enter your email address and we will send you a link to reset your password.",
    resetBtn: "Send Reset Link",
    backToLogin: "Back to Sign In",
    errorMissing: "Please enter your email address and password.",
    errorInvalid: "Incorrect email address or password.",
    errorProfile: "Login successful but account profile could not be loaded. Check Supabase Service Role Key in Vercel.",
  },
  de: {
    eyebrow: "Konto",
    signIn: "Anmelden",
    registered: "Konto erstellt. Bitte melde dich mit deiner E-Mail-Adresse und deinem Passwort an.",
    email: "E-Mail-Adresse",
    emailPh: "deinname@beispiel.de",
    password: "Passwort",
    signInBtn: "Anmelden",
    forgotLink: "Passwort vergessen?",
    newHere: "Neu bei OlivHairSupply?",
    createAccount: "Konto erstellen",
    resetTitle: "Passwort zurücksetzen",
    resetSent: "Reset-Link gesendet. Bitte überprüfe deinen Posteingang.",
    resetMissing: "Bitte gib deine E-Mail-Adresse ein.",
    resetSub: "Gib deine E-Mail-Adresse ein und wir senden dir einen Link zum Zurücksetzen deines Passworts.",
    resetBtn: "Reset-Link senden",
    backToLogin: "Zurück zur Anmeldung",
    errorMissing: "Bitte gib deine E-Mail-Adresse und dein Passwort ein.",
    errorInvalid: "Falsche E-Mail-Adresse oder falsches Passwort.",
    errorProfile: "Anmeldung erfolgreich, aber das Kontoprofil konnte nicht geladen werden.",
  },
};

function useLang(): "en" | "de" {
  const [lang, setLang] = useState<"en" | "de">("de");

  useEffect(() => {
    const read = () => {
      try {
        const s = localStorage.getItem("ohs-lang") || "de";
        setLang(s === "en" ? "en" : "de");
      } catch { setLang("de"); }
    };
    read();

    const obs = new MutationObserver(() => {
      const attr = document.body.dataset.ohsLang;
      if (attr) setLang(attr === "en" ? "en" : "de");
    });
    obs.observe(document.body, { attributes: true, attributeFilter: ["data-ohs-lang"] });
    return () => obs.disconnect();
  }, []);

  return lang;
}

type Props = {
  next: string;
  error?: string;
  detail?: string;
  message?: string;
  showForgot?: boolean;
  forgotAction: (formData: FormData) => Promise<void>;
};

export function LoginCard({ next, error, detail, message, showForgot, forgotAction }: Props) {
  const lang = useLang();
  const t = T[lang];
  const [panel, setPanel] = useState<"signin" | "forgot">(showForgot ? "forgot" : "signin");

  useEffect(() => {
    setPanel(showForgot ? "forgot" : "signin");
  }, [showForgot]);

  const errorMsg =
    error === "missing" ? t.errorMissing
    : error === "invalid" ? `${t.errorInvalid}${detail ? ` (${detail})` : ""}`
    : error === "profile" ? t.errorProfile
    : "";

  return (
    <div className="ohs-auth-card">
      <p className="ohs-auth-eyebrow">{t.eyebrow}</p>

      {/* ── Sign In panel ── */}
      {panel === "signin" && (
        <div>
          <h1 className="ohs-auth-title">{t.signIn}</h1>
          {message === "registered" && (
            <div className="ohs-auth-alert-info">{t.registered}</div>
          )}
          <form action="/api/auth/login-form" method="post">
            <input name="next" type="hidden" value={next} />
            {errorMsg && <div className="ohs-auth-alert-error">{errorMsg}</div>}
            <div className="ohs-auth-field">
              <label className="ohs-auth-label" htmlFor="ohs-login-email">{t.email}</label>
              <input
                className="ohs-auth-input"
                id="ohs-login-email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder={t.emailPh}
                required
              />
            </div>
            <div className="ohs-auth-field">
              <label className="ohs-auth-label" htmlFor="ohs-login-password">{t.password}</label>
              <input
                className="ohs-auth-input"
                id="ohs-login-password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
              />
            </div>
            <button className="ohs-auth-btn" type="submit">{t.signInBtn}</button>
          </form>
          <div className="ohs-auth-row-end">
            <button
              className="ohs-auth-link-sm"
              type="button"
              onClick={() => setPanel("forgot")}
            >
              {t.forgotLink}
            </button>
          </div>
          <hr className="ohs-auth-divider" />
          <p className="ohs-auth-footer-text">
            {t.newHere} <a href="/register">{t.createAccount}</a>
          </p>
        </div>
      )}

      {/* ── Forgot Password panel ── */}
      {panel === "forgot" && (
        <div>
          <h1 className="ohs-auth-title">{t.resetTitle}</h1>
          {message === "reset-sent" && (
            <div className="ohs-auth-alert-info">{t.resetSent}</div>
          )}
          {error === "reset-missing" && (
            <div className="ohs-auth-alert-error">{t.resetMissing}</div>
          )}
          <p className="ohs-auth-sub">{t.resetSub}</p>
          <form action={forgotAction}>
            <input type="hidden" name="from" value="/login" />
            <div className="ohs-auth-field">
              <label className="ohs-auth-label" htmlFor="ohs-forgot-email">{t.email}</label>
              <input
                className="ohs-auth-input"
                id="ohs-forgot-email"
                name="email"
                type="email"
                autoComplete="email"
                required
              />
            </div>
            <button className="ohs-auth-btn" type="submit">{t.resetBtn}</button>
          </form>
          <hr className="ohs-auth-divider" />
          <p className="ohs-auth-footer-text">
            <button
              className="ohs-auth-link-sm"
              type="button"
              style={{ fontSize: "13px", color: "#2B2620" }}
              onClick={() => setPanel("signin")}
            >
              {t.backToLogin}
            </button>
          </p>
        </div>
      )}
    </div>
  );
}
