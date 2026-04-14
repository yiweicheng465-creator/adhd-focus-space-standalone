import { getSql } from "../_lib/db.js";
import { sign, setCookie } from "../_lib/token.js";

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", req.headers.origin ?? "*");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  if (req.method === "OPTIONS") { res.status(200).end(); return; }
  if (req.method !== "POST") { res.status(405).json({ error: "Method not allowed" }); return; }

  try {
    const body = req.body ?? {};
    const { email, name } = body;
    if (!email || typeof email !== "string" || !email.includes("@")) {
      res.status(400).json({ error: "Valid email is required" });
      return;
    }

    const sql = getSql();
    const id = email.trim().toLowerCase();
    const rows = await sql`SELECT id, name FROM users WHERE id = ${id}`;
    let userName: string | null = null;

    if (rows.length === 0) {
      userName = (name as string | undefined)?.trim() || null;
      await sql`INSERT INTO users (id, name) VALUES (${id}, ${userName})`;
    } else {
      userName = rows[0].name as string | null;
      const newName = (name as string | undefined)?.trim();
      if (newName && newName !== userName) {
        userName = newName;
        await sql`UPDATE users SET name = ${userName} WHERE id = ${id}`;
      }
    }

    const token = await sign({ sub: id, name: userName });
    setCookie(res, token);
    res.json({ user: { id, name: userName } });
  } catch (err: any) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Login failed: " + (err?.message ?? "unknown error") });
  }
}
