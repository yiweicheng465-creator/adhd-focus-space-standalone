/**
 * LoginScreen — full-screen email-only login overlay.
 * Retro pink aesthetic matching the rest of the app.
 */

import { useState } from "react";
import type { User } from "@/lib/auth";

interface LoginScreenProps {
  onLogin: (user: User) => void;
  login: (email: string, name?: string) => Promise<User>;
}

export function LoginScreen({ onLogin, login }: LoginScreenProps) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const user = await login(email.trim(), name.trim() || undefined);
      onLogin(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "oklch(0.96 0.025 355)",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {/* Decorative background dots */}
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
        {[
          { top: "8%", left: "12%", size: 6, opacity: 0.15 },
          { top: "15%", right: "20%", size: 4, opacity: 0.12 },
          { bottom: "20%", left: "8%", size: 8, opacity: 0.10 },
          { bottom: "10%", right: "15%", size: 5, opacity: 0.13 },
          { top: "40%", left: "5%", size: 3, opacity: 0.08 },
          { top: "30%", right: "8%", size: 7, opacity: 0.10 },
        ].map((dot, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              width: dot.size * 2,
              height: dot.size * 2,
              borderRadius: "50%",
              background: "oklch(0.58 0.18 340)",
              opacity: dot.opacity,
              ...dot,
            }}
          />
        ))}
        {/* Pink star accents */}
        <div style={{ position: "absolute", top: "22%", left: "18%", opacity: 0.18 }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M10 0 L10.6 8.4 L19 10 L10.6 11.6 L10 20 L9.4 11.6 L1 10 L9.4 8.4 Z" fill="oklch(0.62 0.14 340)" />
          </svg>
        </div>
        <div style={{ position: "absolute", bottom: "28%", right: "22%", opacity: 0.14 }}>
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
            <path d="M10 0 L10.6 8.4 L19 10 L10.6 11.6 L10 20 L9.4 11.6 L1 10 L9.4 8.4 Z" fill="oklch(0.62 0.14 340)" />
          </svg>
        </div>
      </div>

      {/* Login card — retro window style */}
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          filter: "drop-shadow(4px 4px 0 oklch(0.55 0.12 340 / 0.28))",
          position: "relative",
          zIndex: 1,
          margin: "0 16px",
        }}
      >
        {/* Title bar */}
        <div
          style={{
            background: "#F9D6E8",
            borderRadius: "6px 6px 0 0",
            border: "1.5px solid oklch(0.82 0.08 340)",
            borderBottom: "1px solid oklch(0.82 0.08 340)",
            padding: "6px 10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {/* Traffic light dots */}
            {[
              "oklch(0.72 0.18 25)",
              "oklch(0.78 0.14 85)",
              "oklch(0.72 0.14 160)",
            ].map((c, i) => (
              <div
                key={i}
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: c,
                }}
              />
            ))}
          </div>
          <span
            style={{
              fontSize: "0.58rem",
              fontFamily: "'Space Mono', monospace",
              letterSpacing: "0.10em",
              color: "oklch(0.38 0.10 340)",
              textTransform: "lowercase",
            }}
          >
            adhd_focus.app
          </span>
          <div style={{ width: 48 }} />
        </div>

        {/* Body */}
        <div
          style={{
            background: "oklch(0.985 0.010 355)",
            border: "1.5px solid oklch(0.82 0.08 340)",
            borderTop: "none",
            borderRadius: "0 0 6px 6px",
            padding: "28px 28px 24px",
          }}
        >
          {/* Logo + headline */}
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}>
              <svg width="42" height="42" viewBox="0 0 42 42" fill="none">
                <circle cx="21" cy="21" r="20" fill="oklch(0.58 0.18 340 / 0.12)" stroke="oklch(0.58 0.18 340)" strokeWidth="1.5" />
                <path d="M21 8C21 8 19 14 19 18C19 20.5 21 22.5 21 22.5C21 22.5 17 21 17 17C17 17 14 20 14 24C14 28 17.5 31 21 31C24.5 31 28 28 28 24C28 19 24 15 21 8Z" fill="oklch(0.58 0.18 340)" opacity="0.9" />
              </svg>
            </div>
            <h1
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "1.5rem",
                fontWeight: 700,
                fontStyle: "italic",
                color: "oklch(0.28 0.040 320)",
                margin: 0,
              }}
            >
              ADHD Focus Space
            </h1>
            <p
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: "0.58rem",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "oklch(0.62 0.060 330)",
                marginTop: 4,
              }}
            >
              Your calm, focused workspace
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Email */}
            <div>
              <label
                htmlFor="ls-email"
                style={{
                  display: "block",
                  fontSize: "0.58rem",
                  fontFamily: "'Space Mono', monospace",
                  letterSpacing: "0.10em",
                  textTransform: "uppercase",
                  color: "oklch(0.45 0.12 340)",
                  marginBottom: 6,
                }}
              >
                Enter your email to continue
              </label>
              <input
                id="ls-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoFocus
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "9px 12px",
                  border: "1.5px solid oklch(0.82 0.08 340)",
                  borderRadius: 6,
                  background: "oklch(0.975 0.018 355)",
                  color: "oklch(0.28 0.040 320)",
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: "0.875rem",
                  outline: "none",
                  transition: "border-color 0.15s",
                }}
                onFocus={(e) => (e.target.style.borderColor = "oklch(0.58 0.18 340)")}
                onBlur={(e) => (e.target.style.borderColor = "oklch(0.82 0.08 340)")}
              />
            </div>

            {/* Name (optional) */}
            <div>
              <label
                htmlFor="ls-name"
                style={{
                  display: "block",
                  fontSize: "0.58rem",
                  fontFamily: "'Space Mono', monospace",
                  letterSpacing: "0.10em",
                  textTransform: "uppercase",
                  color: "oklch(0.45 0.12 340)",
                  marginBottom: 6,
                }}
              >
                What should we call you?{" "}
                <span style={{ color: "oklch(0.62 0.060 330)", textTransform: "none", fontFamily: "'DM Sans', sans-serif", letterSpacing: 0 }}>
                  (optional)
                </span>
              </label>
              <input
                id="ls-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name or nickname"
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "9px 12px",
                  border: "1.5px solid oklch(0.82 0.08 340)",
                  borderRadius: 6,
                  background: "oklch(0.975 0.018 355)",
                  color: "oklch(0.28 0.040 320)",
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: "0.875rem",
                  outline: "none",
                  transition: "border-color 0.15s",
                }}
                onFocus={(e) => (e.target.style.borderColor = "oklch(0.58 0.18 340)")}
                onBlur={(e) => (e.target.style.borderColor = "oklch(0.82 0.08 340)")}
              />
            </div>

            {/* Error */}
            {error && (
              <p
                style={{
                  fontSize: "0.78rem",
                  color: "oklch(0.52 0.18 25)",
                  fontFamily: "'DM Sans', sans-serif",
                  margin: 0,
                  padding: "6px 10px",
                  background: "oklch(0.96 0.04 25 / 0.5)",
                  border: "1px solid oklch(0.82 0.10 25 / 0.4)",
                  borderRadius: 4,
                }}
              >
                {error}
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !email.trim()}
              style={{
                width: "100%",
                padding: "10px 16px",
                background:
                  loading || !email.trim()
                    ? "oklch(0.82 0.040 340)"
                    : "oklch(0.58 0.18 340)",
                border: "none",
                borderRadius: 6,
                color: "white",
                fontFamily: "'Space Mono', monospace",
                fontSize: "0.68rem",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                cursor: loading || !email.trim() ? "not-allowed" : "pointer",
                transition: "background 0.15s, transform 0.1s",
                transform: "translateY(0)",
              }}
              onMouseEnter={(e) => {
                if (!loading && email.trim()) {
                  (e.target as HTMLButtonElement).style.background = "oklch(0.52 0.18 340)";
                }
              }}
              onMouseLeave={(e) => {
                if (!loading && email.trim()) {
                  (e.target as HTMLButtonElement).style.background = "oklch(0.58 0.18 340)";
                }
              }}
            >
              {loading ? "Signing in…" : "Continue →"}
            </button>
          </form>

          <p
            style={{
              textAlign: "center",
              fontSize: "0.65rem",
              color: "oklch(0.62 0.040 330)",
              fontFamily: "'DM Sans', sans-serif",
              marginTop: 16,
              lineHeight: 1.5,
            }}
          >
            No password needed. Your data stays in your browser.
          </p>
        </div>
      </div>
    </div>
  );
}
