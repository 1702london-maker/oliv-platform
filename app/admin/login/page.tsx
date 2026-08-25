export default function AdminLoginPage() {
  return (
    <main style={{ minHeight: "100vh", background: "#0f0f0f", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Montserrat, Arial, sans-serif" }}>
      <div style={{ width: "100%", maxWidth: 400, padding: "0 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <span style={{ display: "block", color: "#c9a96e", fontSize: 10, letterSpacing: ".28em", textTransform: "uppercase", fontWeight: 700 }}>OlivHairSupply</span>
          <span style={{ display: "block", color: "#fff", fontFamily: "Georgia, serif", fontSize: 32, fontWeight: 300, marginTop: 6 }}>Admin Access</span>
        </div>

        <form action="/api/auth/login-form" method="POST" style={{ display: "grid", gap: 16 }}>
          <input type="hidden" name="next" value="/admin" />

          <label style={labelStyle}>
            <span style={spanStyle}>Email</span>
            <input name="email" type="email" required autoComplete="email" style={inputStyle} />
          </label>

          <label style={labelStyle}>
            <span style={spanStyle}>Password</span>
            <input name="password" type="password" required autoComplete="current-password" style={inputStyle} />
          </label>

          <button type="submit" style={btnStyle}>
            Sign In
          </button>
        </form>

        <p style={{ marginTop: 24, textAlign: "center", color: "#6b5c4e", fontSize: 11 }}>
          Admin access only. <a href="/" style={{ color: "#c9a96e", textDecoration: "none" }}>Back to site ↗</a>
        </p>
      </div>
    </main>
  );
}

const labelStyle: React.CSSProperties = { display: "grid", gap: 7 };
const spanStyle: React.CSSProperties = { color: "#9b8878", fontSize: 10, fontWeight: 700, letterSpacing: ".2em", textTransform: "uppercase" };
const inputStyle: React.CSSProperties = { background: "#1a1a1a", border: "1px solid #3a3530", color: "#fff", fontFamily: "Montserrat, sans-serif", fontSize: 14, padding: "12px 14px" };
const btnStyle: React.CSSProperties = { marginTop: 8, background: "#c9a96e", color: "#0f0f0f", border: "none", fontFamily: "Montserrat, sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: ".2em", textTransform: "uppercase", padding: "14px", cursor: "pointer" };
