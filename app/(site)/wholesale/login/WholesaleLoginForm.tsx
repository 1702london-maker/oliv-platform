"use client";

import { useState, useEffect } from "react";

const T = {
  en: {
    error: "Incorrect email or access code. Please try again.",
    email: "Email Address",
    emailPh: "your@email.com",
    code: "Access Code",
    show: "Show",
    hide: "Hide",
    submit: "Access Wholesale Portal",
    loading: "Checking...",
    forgot: "Forgot Access Code?",
    forgotSubject: "Forgot%20Access%20Code",
    forgotBody: "Hello%2C%20I%20have%20forgotten%20my%20access%20code.%20Please%20resend%20it%20to%20my%20email%20address.",
  },
  de: {
    error: "Falsche E-Mail-Adresse oder falscher Zugangscode. Bitte erneut versuchen.",
    email: "E-Mail-Adresse",
    emailPh: "deinname@beispiel.de",
    code: "Zugangscode",
    show: "Anzeigen",
    hide: "Verbergen",
    submit: "Zum Großhandelsportal",
    loading: "Wird geprüft...",
    forgot: "Zugangscode vergessen?",
    forgotSubject: "Zugangscode%20vergessen",
    forgotBody: "Hallo%2C%20ich%20habe%20meinen%20Zugangscode%20vergessen.%20Bitte%20sende%20ihn%20an%20meine%20E-Mail-Adresse.",
  },
};

function useLang() {
  const [lang, setLang] = useState<"en" | "de">("de");

  useEffect(() => {
    const read = () => {
      const stored = (typeof localStorage !== "undefined" && localStorage.getItem("ohs-lang")) || "de";
      setLang(stored === "en" ? "en" : "de");
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

const inputStyle: React.CSSProperties = {
  width: "100%",
  border: "1px solid #dfceb5",
  background: "#fdfaf6",
  padding: "13px 16px",
  fontFamily: "'Montserrat', sans-serif",
  fontSize: "14px",
  color: "#2B2620",
  outline: "none",
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  fontFamily: "'Montserrat', sans-serif",
  fontSize: "10px",
  fontWeight: 700,
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  color: "#2B2620",
};

export function WholesaleLoginForm() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [showCode, setShowCode] = useState(false);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const lang = useLang();
  const t = T[lang];

  async function handleLogin() {
    setError(false);
    if (!email || !code) { setError(true); return; }
    setLoading(true);
    try {
      const r = await fetch("/api/wholesale/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password: code.trim() }),
      });
      if (r.ok) {
        window.location.href = "/wholesale";
      } else {
        setError(true);
        setLoading(false);
      }
    } catch {
      setError(true);
      setLoading(false);
    }
  }

  return (
    <div>
      {error && (
        <div style={{
          background: "#fdf3f3",
          border: "1px solid #e8c5c5",
          color: "#8b3535",
          fontFamily: "'Montserrat', sans-serif",
          fontSize: "12px",
          padding: "12px 16px",
          marginBottom: "24px",
        }}>
          {t.error}
        </div>
      )}

      <div style={{ display: "grid", gap: "8px", marginBottom: "20px" }}>
        <label style={labelStyle}>{t.email}</label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          autoComplete="email"
          placeholder={t.emailPh}
          style={inputStyle}
        />
      </div>

      <div style={{ display: "grid", gap: "8px", marginBottom: "20px" }}>
        <label style={labelStyle}>{t.code}</label>
        <div style={{ position: "relative" }}>
          <input
            type={showCode ? "text" : "password"}
            value={code}
            onChange={e => setCode(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleLogin()}
            autoComplete="off"
            placeholder="••••••••••••"
            style={{ ...inputStyle, padding: "13px 48px 13px 16px" }}
          />
          <button
            type="button"
            onClick={() => setShowCode(v => !v)}
            style={{
              position: "absolute",
              right: "14px",
              top: "50%",
              transform: "translateY(-50%)",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#9B8878",
              padding: 0,
              fontSize: "11px",
              fontFamily: "'Montserrat', sans-serif",
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            {showCode ? t.hide : t.show}
          </button>
        </div>
      </div>

      <button
        onClick={handleLogin}
        disabled={loading}
        style={{
          width: "100%",
          background: loading ? "#6b5c4e" : "#2B2620",
          color: "#ffffff",
          border: "none",
          padding: "15px 24px",
          fontFamily: "'Montserrat', sans-serif",
          fontSize: "11px",
          fontWeight: 700,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          cursor: loading ? "default" : "pointer",
          marginTop: "8px",
        }}
      >
        {loading ? t.loading : t.submit}
      </button>

      <div style={{ textAlign: "right", marginTop: "12px" }}>
        <a
          href={`mailto:info@olivhairsupply.co.uk?subject=${t.forgotSubject}&body=${t.forgotBody}`}
          style={{
            fontFamily: "'Montserrat', sans-serif",
            fontSize: "11px",
            color: "#B68A45",
            fontWeight: 600,
            textDecoration: "underline",
            textUnderlineOffset: "3px",
          }}
        >
          {t.forgot}
        </a>
      </div>
    </div>
  );
}
