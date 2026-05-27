"use client";

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "'Montserrat', sans-serif", background: "#F8F5EF", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", padding: "48px 24px", maxWidth: "480px" }}>
          <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.28em", textTransform: "uppercase", color: "#B68A45", margin: "0 0 16px" }}>
            Something went wrong
          </p>
          <h1 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "38px", fontWeight: 300, color: "#2B2620", margin: "0 0 20px", lineHeight: 1.1 }}>
            Page Unavailable
          </h1>
          <p style={{ fontSize: "13px", color: "#6b5c4e", margin: "0 0 32px", lineHeight: 1.7 }}>
            We&rsquo;re sorry, an unexpected error occurred. Please try again or return to the homepage.
          </p>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
            <button
              onClick={reset}
              style={{ background: "#2B2620", color: "#fff", border: "none", padding: "13px 28px", fontSize: "10px", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", cursor: "pointer" }}
            >
              Try Again
            </button>
            <a
              href="/"
              style={{ background: "transparent", color: "#2B2620", border: "1px solid #dfceb5", padding: "13px 28px", fontSize: "10px", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", textDecoration: "none" }}
            >
              Back to Home
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
