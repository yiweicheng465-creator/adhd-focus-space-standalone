/**
 * ADHD Focus Space — Vercel Serverless API
 * Express app with JWT auth, Neon DB, AES-256-GCM encryption, OpenAI proxy
 */

import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { neon } from "@neondatabase/serverless";
import OpenAI from "openai";

const app = express();

// ── Middleware ──────────────────────────────────────────────────────────────
const ALLOWED_ORIGINS = [
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "",
  process.env.FRONTEND_URL ?? "",
  "http://localhost:5173",
  "http://localhost:3000",
].filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      // Allow requests with no origin (server-to-server) or from allowed origins
      if (!origin || ALLOWED_ORIGINS.some((o) => origin.startsWith(o)) || /\.vercel\.app$/.test(origin)) {
        cb(null, true);
      } else {
        cb(null, true); // permissive for now; lock down in production as needed
      }
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// ── Env & helpers ────────────────────────────────────────────────────────────
const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret-change-me";
const ENCRYPTION_KEY_HEX = process.env.ENCRYPTION_KEY ?? "";
// ENCRYPTION_KEY must be exactly 32 bytes = 64 hex chars
const ENC_KEY = ENCRYPTION_KEY_HEX
  ? Buffer.from(ENCRYPTION_KEY_HEX, "hex")
  : crypto.randomBytes(32); // dev fallback (won't persist across restarts)

const IS_PROD = process.env.NODE_ENV === "production";

function getSql() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  return neon(url);
}

// ── JWT helpers ──────────────────────────────────────────────────────────────
interface JwtPayload {
  sub: string; // user id (email)
  name: string | null;
}

function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "30d" });
}

function setAuthCookie(res: express.Response, token: string) {
  res.cookie("adhd_token", token, {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days in ms
    path: "/",
  });
}

function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

// ── Auth middleware ──────────────────────────────────────────────────────────
interface AuthRequest extends express.Request {
  user?: JwtPayload;
}

function requireAuth(
  req: AuthRequest,
  res: express.Response,
  next: express.NextFunction
) {
  const token = req.cookies?.adhd_token;
  if (!token) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({ error: "Invalid or expired session" });
    return;
  }
  req.user = payload;
  next();
}

// ── Encryption helpers (AES-256-GCM) ────────────────────────────────────────
function encryptKey(plaintext: string): { encrypted: string; iv: string } {
  const iv = crypto.randomBytes(12); // 96-bit IV for GCM
  const cipher = crypto.createCipheriv("aes-256-gcm", ENC_KEY, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  // Store: encrypted data + 16-byte auth tag, concatenated
  const combined = Buffer.concat([encrypted, tag]);
  return {
    encrypted: combined.toString("base64"),
    iv: iv.toString("base64"),
  };
}

function decryptKey(encryptedB64: string, ivB64: string): string {
  const iv = Buffer.from(ivB64, "base64");
  const combined = Buffer.from(encryptedB64, "base64");
  // Last 16 bytes are the auth tag
  const tag = combined.subarray(combined.length - 16);
  const encrypted = combined.subarray(0, combined.length - 16);
  const decipher = crypto.createDecipheriv("aes-256-gcm", ENC_KEY, iv);
  decipher.setAuthTag(tag);
  return decipher.update(encrypted) + decipher.final("utf8");
}

// ── Routes ───────────────────────────────────────────────────────────────────

// POST /api/auth/login
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, name } = req.body as { email?: string; name?: string };
    if (!email || typeof email !== "string" || !email.includes("@")) {
      res.status(400).json({ error: "Valid email is required" });
      return;
    }

    const sql = getSql();
    const normalizedEmail = email.trim().toLowerCase();

    // Find or create user
    const existing = await sql`
      SELECT id, name FROM users WHERE id = ${normalizedEmail}
    `;

    let userName: string | null = null;

    if (existing.length === 0) {
      // Create new user
      userName = name?.trim() || null;
      await sql`
        INSERT INTO users (id, name, created_at)
        VALUES (${normalizedEmail}, ${userName}, NOW())
      `;
    } else {
      userName = existing[0].name as string | null;
      // Update name if provided and different
      if (name?.trim() && name.trim() !== userName) {
        userName = name.trim();
        await sql`UPDATE users SET name = ${userName} WHERE id = ${normalizedEmail}`;
      }
    }

    const token = signToken({ sub: normalizedEmail, name: userName });
    setAuthCookie(res, token);

    res.json({ user: { id: normalizedEmail, name: userName } });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Login failed" });
  }
});

// POST /api/auth/logout
app.post("/api/auth/logout", (_req, res) => {
  res.clearCookie("adhd_token", { path: "/" });
  res.json({ ok: true });
});

// GET /api/auth/me
app.get("/api/auth/me", requireAuth, (req: AuthRequest, res) => {
  res.json({ user: { id: req.user!.sub, name: req.user!.name } });
});

// POST /api/key — store encrypted API key
app.post("/api/key", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { key } = req.body as { key?: string };
    if (!key || typeof key !== "string" || !key.trim()) {
      res.status(400).json({ error: "API key is required" });
      return;
    }

    const { encrypted, iv } = encryptKey(key.trim());
    const sql = getSql();
    await sql`
      UPDATE users
      SET api_key_encrypted = ${encrypted}, api_key_iv = ${iv}
      WHERE id = ${req.user!.sub}
    `;

    res.json({ ok: true });
  } catch (err) {
    console.error("Key save error:", err);
    res.status(500).json({ error: "Failed to save API key" });
  }
});

// GET /api/key/status — check if user has a key stored
app.get("/api/key/status", requireAuth, async (req: AuthRequest, res) => {
  try {
    const sql = getSql();
    const rows = await sql`
      SELECT api_key_encrypted FROM users WHERE id = ${req.user!.sub}
    `;
    const hasKey = !!(rows[0]?.api_key_encrypted);
    res.json({ hasKey });
  } catch (err) {
    console.error("Key status error:", err);
    res.status(500).json({ error: "Failed to check key status" });
  }
});

// DELETE /api/key — remove stored API key
app.delete("/api/key", requireAuth, async (req: AuthRequest, res) => {
  try {
    const sql = getSql();
    await sql`
      UPDATE users SET api_key_encrypted = NULL, api_key_iv = NULL
      WHERE id = ${req.user!.sub}
    `;
    res.json({ ok: true });
  } catch (err) {
    console.error("Key delete error:", err);
    res.status(500).json({ error: "Failed to remove API key" });
  }
});

// POST /api/ai/complete — proxy to OpenAI using stored key
app.post("/api/ai/complete", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { systemPrompt, userMessage, model = "gpt-4o-mini" } = req.body as {
      systemPrompt?: string;
      userMessage?: string;
      model?: string;
    };

    if (!userMessage) {
      res.status(400).json({ error: "userMessage is required" });
      return;
    }

    // Fetch user's API key
    const sql = getSql();
    const rows = await sql`
      SELECT api_key_encrypted, api_key_iv FROM users WHERE id = ${req.user!.sub}
    `;

    if (!rows[0]?.api_key_encrypted || !rows[0]?.api_key_iv) {
      res.status(402).json({ error: "No API key configured. Add your OpenAI key in Settings." });
      return;
    }

    let apiKey: string;
    try {
      apiKey = decryptKey(
        rows[0].api_key_encrypted as string,
        rows[0].api_key_iv as string
      );
    } catch {
      res.status(500).json({ error: "Failed to decrypt API key. Please re-save your key." });
      return;
    }

    const openai = new OpenAI({ apiKey });

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];
    if (systemPrompt) {
      messages.push({ role: "system", content: systemPrompt });
    }
    messages.push({ role: "user", content: userMessage });

    const completion = await openai.chat.completions.create({
      model,
      messages,
      max_tokens: 1024,
    });

    const content = completion.choices[0]?.message?.content ?? "";
    res.json({ content });
  } catch (err: unknown) {
    console.error("AI complete error:", err);
    // Handle OpenAI-specific errors
    if (err && typeof err === "object" && "status" in err) {
      const status = (err as { status: number }).status;
      if (status === 401) {
        res.status(401).json({ error: "Invalid API key. Check your OpenAI key in Settings." });
        return;
      }
      if (status === 429) {
        res.status(429).json({ error: "Rate limit or quota exceeded on your OpenAI account." });
        return;
      }
    }
    res.status(500).json({ error: "AI request failed. Please try again." });
  }
});

// ── Export for Vercel (CommonJS compat) ─────────────────────────────────────
module.exports = app;
export default app;
