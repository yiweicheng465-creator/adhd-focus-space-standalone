import { useEffect, useRef, useState } from "react";

interface User { id: string; name: string | null }
interface Props { onLogin: (user: User) => void }

export function LoginScreen({ onLogin }: Props) {
  const btnRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch Google Client ID from server
    fetch("/api/config")
      .then((r) => r.json())
      .then((cfg) => {
        const clientId = cfg.googleClientId;
        if (!clientId) {
          setError("Google login not configured yet. Add GOOGLE_CLIENT_ID to Vercel env vars.");
          return;
        }
        loadGIS(() => {
          (window as any).google.accounts.id.initialize({
            client_id: clientId,
            callback: handleCredential,
            auto_select: false,
          });
          if (btnRef.current) {
            (window as any).google.accounts.id.renderButton(btnRef.current, {
              theme: "outline",
              size: "large",
              text: "sign_in_with",
              shape: "rectangular",
              width: 280,
            });
          }
        });
      })
      .catch(() => setError("Could not connect to server."));
  }, []);

  function loadGIS(cb: () => void) {
    if ((window as any).google?.accounts) { cb(); return; }
    const s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client";
    s.onload = cb;
    document.head.appendChild(s);
  }

  async function handleCredential(response: { credential: string }) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/google", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: response.credential }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Login failed");
      onLogin(data.user);
    } catch (err: any) {
      setError(err.message ?? "Login failed. Try again.");
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{ background: "oklch(0.93 0.045 355)" }}
    >
      <div
        style={{
          background: "oklch(0.978 0.012 355)",
          border: "1.5px solid oklch(0.82 0.08 340)",
          borderRadius: 8,
          boxShadow: "0 20px 60px rgba(140,40,90,0.25), 0 4px 16px rgba(180,60,120,0.15)",
          width: "min(360px, 92vw)",
          overflow: "hidden",
        }}
      >
        {/* Retro title bar */}
        <div style={{
          background: "#F9D6E8",
          borderBottom: "1.5px solid oklch(0.80 0.08 340)",
          padding: "6px 10px",
          display: "flex", alignItems: "center", gap: 6,
        }}>
          {["oklch(0.62 0.18 340)", "oklch(0.72 0.10 310)", "oklch(0.78 0.10 290)"].map((bg, i) => (
            <div key={i} style={{ width: 10, height: 10, borderRadius: "50%", background: bg }} />
          ))}
          <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: "#8A3060", marginLeft: 4 }}>
            daily_checkin.exe
          </span>
        </div>

        {/* Content */}
        <div style={{ padding: "32px 32px 28px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
          {/* Logo / icon */}
          <div style={{ fontSize: 36 }}>✦</div>

          <div>
            <h1 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "1.6rem", fontWeight: 700,
              color: "oklch(0.28 0.040 320)",
              margin: "0 0 8px",
            }}>
              ADHD Focus Space
            </h1>
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "0.85rem", color: "oklch(0.55 0.040 330)",
              margin: 0, lineHeight: 1.5,
            }}>
              Sign in to get started. Your data stays on your device.
            </p>
          </div>

          {/* Google Sign-In button */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, width: "100%" }}>
            {loading ? (
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.85rem", color: "oklch(0.55 0.040 330)" }}>
                Signing in…
              </div>
            ) : (
              <div ref={btnRef} />
            )}
            {error && (
              <p style={{
                fontFamily: "'DM Sans', sans-serif", fontSize: "0.75rem",
                color: "oklch(0.52 0.14 25)", margin: 0, textAlign: "center", lineHeight: 1.4,
              }}>
                {error}
              </p>
            )}
          </div>

          <p style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: "0.68rem",
            color: "oklch(0.65 0.030 330)", margin: 0, lineHeight: 1.5,
          }}>
            Your OpenAI key is stored encrypted. Your data is stored on your device — back up to Google Drive to sync across devices.
          </p>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <a
              href="/privacy"
              style={{
                fontFamily: "'DM Sans', sans-serif", fontSize: "0.68rem",
                color: "oklch(0.52 0.10 340)", textDecoration: "underline",
              }}
            >
              Privacy Policy
            </a>
            <span style={{ fontSize: "0.68rem", color: "oklch(0.65 0.03 330)" }}>·</span>
            <a
              href="/terms"
              style={{
                fontFamily: "'DM Sans', sans-serif", fontSize: "0.68rem",
                color: "oklch(0.52 0.10 340)", textDecoration: "underline",
              }}
            >
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
