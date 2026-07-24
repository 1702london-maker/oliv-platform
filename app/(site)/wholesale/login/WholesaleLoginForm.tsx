"use client";

import { useState } from "react";

export function WholesaleLoginForm() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [showCode, setShowCode] = useState(false);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

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
          marginBottom: "24px"
        }}>
          Falsche E-Mail-Adresse oder falscher Zugangscode. Bitte erneut versuchen.
        </div>
      )}

      <div style={{ display: "grid", gap: "8px", marginBottom: "20px" }}>
        <label style={{
          fontFamily: "'Montserrat', sans-serif",
          fontSize: "10px",
          fontWeight: 700,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "#2B2620"
        }}>
          E-Mail-Adresse
        </label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          autoComplete="email"
          placeholder="deinname@beispiel.de"
          style={{
            width: "100%",
            border: "1px solid #dfceb15",
            background: "#fdfaf6",
            padding: "13px 16px",
            fontFamily: "'Montserrat', sans-serif",
            fontSize: "14px",
            color: "#2B2620",
            outline: "none",
            boxSizing: "border-box"
          }}
        />
      </div>

      <div style={{ display: "grid", gap: "8px", marginBottom: "20px" }}>
        <label style={{
          fontFamily: "'Montserrat', sans-serif",
          fontSize: "10px",
          fontWeight: 700,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "#2B2620"
        }}>
          Zugangscode
        </label>
        <div style={{ position: "relative" }}>
          <input
            type={showCode ? "text" : "password"}
            value={code}
            onChange={e => setCode(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleLogin()}
            autoComplete="off"
            placeholder="••••••••••••"
            style={{
              width: "100%",
              border: "1px solid #dfceb15",
              background: "#fdfaf6",
              padding: "13px 48px 13px 16px",
              fontFamily: "'Montserrat', sans-serif",
              fontSize: "14px",
              color: "#2B2620",
              outline: "none",
              boxSizing: "border-box"
            }}
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
              textTransform: "uppercase"
            }}
          >
            {showCode ? "Verbergen" : "Anzeigen"}
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
          marginTop: "8px"
        }}
      >
        {loading ? "Wird geprüft..." : "Zum Großhandelsportal"}
      </button>

      <div style={{ textAlign: "right", marginTop: "12px" }}>
        <a
          href="mailto:info@olivhairsupply.co.uk?subject=Zugangscode%20vergessen&body=Hallo%2C%20ich%20habe%20meinen%20Zugangscode%20vergessen.%20Bitte%20sende%20ihn%20an%20meine%20E-Mail-Adresse."
          style={{
            fontFamily: "'Montserrat', sans-serif",
            fontSize: "11px",
            color: "#B68A45",
            fontWeight: 600,
            textDecoration: "underline",
            textUnderlineOffset: "3px"
          }}
        >
          Zugangscode vergessen?
        </a>
      </div>
    </div>
  );
}
