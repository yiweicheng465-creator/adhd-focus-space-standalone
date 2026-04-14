import { getSql } from "./_lib/db";
import { getUser } from "./_lib/token";
import { encrypt, decrypt } from "./_lib/crypto";

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", req.headers.origin ?? "*");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  if (req.method === "OPTIONS") { res.status(200).end(); return; }

  const user = getUser(req);
  if (!user) { res.status(401).json({ error: "Not authenticated" }); return; }

  const sql = getSql();

  // GET — return whether a key exists (never return the key itself)
  if (req.method === "GET") {
    try {
      const rows = await sql`SELECT api_key_encrypted FROM users WHERE id = ${user.sub}`;
      res.json({ hasKey: !!(rows[0]?.api_key_encrypted) });
    } catch (err) {
      console.error("Key status error:", err);
      res.status(500).json({ error: "Failed to check key status" });
    }
    return;
  }

  // POST — save encrypted API key
  if (req.method === "POST") {
    try {
      const { key } = req.body ?? {};
      if (!key || typeof key !== "string" || !key.startsWith("sk-")) {
        res.status(400).json({ error: "Invalid API key format" });
        return;
      }
      const { encrypted, iv } = encrypt(key.trim());
      await sql`
        UPDATE users SET api_key_encrypted = ${encrypted}, api_key_iv = ${iv}
        WHERE id = ${user.sub}
      `;
      res.json({ ok: true });
    } catch (err) {
      console.error("Save key error:", err);
      res.status(500).json({ error: "Failed to save API key" });
    }
    return;
  }

  // DELETE — remove API key
  if (req.method === "DELETE") {
    try {
      await sql`
        UPDATE users SET api_key_encrypted = NULL, api_key_iv = NULL
        WHERE id = ${user.sub}
      `;
      res.json({ ok: true });
    } catch (err) {
      console.error("Delete key error:", err);
      res.status(500).json({ error: "Failed to remove API key" });
    }
    return;
  }

  res.status(405).json({ error: "Method not allowed" });
}
