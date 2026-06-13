"use client";

import { useEffect, useRef, useState } from "react";

type Msg = { role: "user" | "assistant"; content: string };

const SESSION_KEY = "ohs-chat-messages";
const WELCOME_EN = "Hello and welcome to OlivHairSupply.\nHow can we help you today?";
const WELCOME_DE = "Hallo und herzlich willkommen bei OlivHairSupply.\nWie können wir Ihnen heute helfen?";

// ── Icons ──────────────────────────────────────────────────────────────────

function WhatsAppIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="#ffffff" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="#ffffff" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
    </svg>
  );
}

// ── Shared pill button style (matches original ohs-chat-btn exactly) ────────

const PILL: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "11px 18px 11px 14px",
  borderRadius: 50,
  fontFamily: "'Montserrat', Arial, sans-serif",
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: 1,
  color: "#ffffff",
  boxShadow: "0 4px 20px rgba(0,0,0,0.18)",
  whiteSpace: "nowrap",
  textDecoration: "none",
  border: "none",
  cursor: "pointer",
  transition: "transform 0.2s, box-shadow 0.2s",
};

const ICON_WRAP: React.CSSProperties = {
  width: 22,
  height: 22,
  flexShrink: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

// ── Markdown inline renderer (handles [text](url) links and **bold**) ─────
function MdLine({ text }: { text: string }) {
  // Split on markdown links [label](url) and **bold**
  const parts = text.split(/(\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*)/g);
  const result: React.ReactNode[] = [];
  let i = 0;
  while (i < parts.length) {
    const part = parts[i];
    if (!part) { i++; continue; }
    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    const boldMatch = part.match(/^\*\*([^*]+)\*\*$/);
    if (linkMatch) {
      const [, label, href] = linkMatch;
      const isExternal = href.startsWith("http");
      result.push(
        <a
          key={i}
          href={href}
          target={isExternal ? "_blank" : "_self"}
          rel={isExternal ? "noopener noreferrer" : undefined}
          style={{ color: "#B68A45", textDecoration: "underline", cursor: "pointer" }}
        >
          {label}
        </a>
      );
    } else if (boldMatch) {
      result.push(<strong key={i}>{boldMatch[1]}</strong>);
    } else {
      result.push(<span key={i}>{part}</span>);
    }
    i++;
  }
  return <>{result}</>;
}

// ── Component ──────────────────────────────────────────────────────────────

export function FloatingChatWidget() {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [lang, setLang] = useState<"en" | "de">("en");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Detect mobile
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Read language from localStorage and keep in sync
  useEffect(() => {
    const readLang = () => {
      try {
        const stored = localStorage.getItem("ohs-lang");
        setLang(stored === "de" ? "de" : "en");
      } catch { /* */ }
    };
    readLang();
    window.addEventListener("storage", readLang);
    // Also poll occasionally in case same-tab change
    const interval = setInterval(readLang, 800);
    return () => { window.removeEventListener("storage", readLang); clearInterval(interval); };
  }, []);

  // Load from sessionStorage on mount
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(SESSION_KEY);
      if (saved) {
        const parsed: Msg[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
          return;
        }
      }
    } catch { /* */ }
    const welcome = lang === "de" ? WELCOME_DE : WELCOME_EN;
    setMessages([{ role: "assistant", content: welcome }]);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Persist to sessionStorage
  useEffect(() => {
    if (!messages.length) return;
    try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(messages)); } catch { /* */ }
  }, [messages]);

  // Scroll to bottom
  useEffect(() => {
    if (open && !minimized) {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 60);
    }
  }, [messages, open, minimized]);

  // Focus input when window opens
  useEffect(() => {
    if (open && !minimized) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open, minimized]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    const updated: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(updated);
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updated, lang }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.reply || "Sorry, I didn't get that. Please try again." }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "I'm sorry, I couldn't connect. Please try again or contact us on WhatsApp." }]);
    }
    setLoading(false);
  }

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  function openChat() {
    setOpen(true);
    setMinimized(false);
  }

  // ── Floating button wrap position ────────────────────────────────────────
  const wrapStyle: React.CSSProperties = {
    position: "fixed", right: 16, bottom: isMobile ? 90 : 100, zIndex: 100000,
    display: "flex", flexDirection: "column", gap: isMobile ? 10 : 12,
    alignItems: "flex-end", pointerEvents: "auto",
  };

  // On mobile: round buttons, no label
  const mobilePillOverride: React.CSSProperties = isMobile
    ? { padding: 12, borderRadius: "50%" }
    : {};

  // ── Chat window position ─────────────────────────────────────────────────
  const windowStyle: React.CSSProperties = {
    position: "fixed",
    bottom: isMobile ? 0 : 24,
    right: isMobile ? 0 : 20,
    left: isMobile ? 0 : "auto",
    width: isMobile ? "100%" : 380,
    maxHeight: isMobile ? "85vh" : (minimized ? "auto" : 540),
    background: "#fff",
    border: isMobile ? "none" : "1px solid #E2D5C0",
    boxShadow: "0 12px 48px rgba(0,0,0,0.22)",
    zIndex: 100001,
    display: "flex",
    flexDirection: "column",
    fontFamily: "'Montserrat', Arial, sans-serif",
    borderRadius: isMobile ? "16px 16px 0 0" : 0,
    overflow: "hidden",
  };

  return (
    <>
      {/* ── Floating buttons ── */}
      <div style={wrapStyle} aria-label="Contact us">

        {/* WhatsApp — restored exactly as original */}
        <a
          href="https://wa.me/4915786283439"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat on WhatsApp"
          style={{ ...PILL, background: "#25D366", ...mobilePillOverride }}
        >
          <span style={ICON_WRAP}><WhatsAppIcon /></span>
          {!isMobile && <span>WhatsApp</span>}
        </a>

        {/* Chat button */}
        <button
          type="button"
          onClick={openChat}
          aria-label="Open chat"
          style={{ ...PILL, background: "#2B2620", border: "1px solid #CBB899", ...mobilePillOverride }}
        >
          <span style={ICON_WRAP}><ChatIcon /></span>
          {!isMobile && <span>Chat</span>}
        </button>
      </div>

      {/* ── Chat window ── */}
      {open && (
        <div style={windowStyle} role="dialog" aria-label="Chat with Oliv Hair Supply">

          {/* Header */}
          <div style={{ background: "#2B2620", color: "#fff", padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>Chat</div>
              {!minimized && (
                <div style={{ fontSize: 10, color: "#CBB899", marginTop: 3, letterSpacing: "0.12em", textTransform: "uppercase" }}>
                  How can we help?
                </div>
              )}
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button
                type="button"
                onClick={() => setMinimized(m => !m)}
                aria-label={minimized ? "Expand chat" : "Minimise chat"}
                style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.25)", color: "#fff", width: 28, height: 28, cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                {minimized ? "▲" : "▼"}
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close chat"
                style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.25)", color: "#fff", width: 28, height: 28, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                ×
              </button>
            </div>
          </div>

          {!minimized && (
            <>
              {/* Messages */}
              <div style={{ flex: 1, overflowY: "auto", padding: "16px 14px", display: "flex", flexDirection: "column", gap: 10, background: "#FAF7F2" }}>
                {messages.map((msg, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
                    <div style={{
                      maxWidth: "80%",
                      padding: "10px 14px",
                      fontSize: 12,
                      lineHeight: 1.65,
                      background: msg.role === "user" ? "#2B2620" : "#fff",
                      color: msg.role === "user" ? "#fff" : "#2B2620",
                      border: msg.role === "user" ? "none" : "1px solid #E2D5C0",
                      borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                      boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                    }}>
                      {msg.content.split("\n").map((line, j, arr) => (
                        <span key={j}><MdLine text={line} />{j < arr.length - 1 && <br />}</span>
                      ))}
                    </div>
                  </div>
                ))}

                {loading && (
                  <div style={{ display: "flex", justifyContent: "flex-start" }}>
                    <div style={{ padding: "10px 14px", fontSize: 12, color: "#9B8878", fontStyle: "italic", background: "#fff", border: "1px solid #E2D5C0", borderRadius: "16px 16px 16px 4px" }}>
                      Typing…
                    </div>
                  </div>
                )}

                <div ref={bottomRef} />
              </div>

              {/* Input area */}
              <div style={{ padding: "10px 12px", borderTop: "1px solid #E2D5C0", display: "flex", gap: 8, alignItems: "flex-end", background: "#fff", flexShrink: 0 }}>
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="Type your message…"
                  rows={1}
                  style={{
                    flex: 1,
                    resize: "none",
                    border: "1px solid #E2D5C0",
                    padding: "9px 12px",
                    fontSize: 12,
                    fontFamily: "'Montserrat', Arial, sans-serif",
                    lineHeight: 1.5,
                    outline: "none",
                    background: "#FAF7F2",
                    color: "#2B2620",
                    maxHeight: 100,
                    overflowY: "auto",
                  }}
                />
                <button
                  type="button"
                  onClick={send}
                  disabled={!input.trim() || loading}
                  aria-label="Send message"
                  style={{
                    background: input.trim() && !loading ? "#2B2620" : "#E2D5C0",
                    border: "none",
                    color: "#fff",
                    width: 38,
                    height: 38,
                    cursor: input.trim() && !loading ? "pointer" : "not-allowed",
                    fontSize: 16,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    transition: "background 0.15s",
                  }}
                >
                  ›
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
