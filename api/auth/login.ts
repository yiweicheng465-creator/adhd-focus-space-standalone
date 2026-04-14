import { getSql } from "../_lib/db";
import { sign, setCookie } from "../_lib/token";

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", req.headers.origin ?? "*");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  if (req.method === "OPTIONS") { res.status(200).end(); return; }
  if (req.method !== "POST") { res.status(405).json({ error: "Method not allowed" }); return; }

  try {
    const { email, name } = req.body ?? {};
    if (!email || typeof email !== "string" || !email.includes("@")) {
      res.status(400).json({ error: "Valid email is required" });
      return;
    }

    const sql = getSql();
    const id = email.trim().toLowerCase();
    const rows = await sql`SELECT id, name FROM users WHERE id = ${id}`;
    let userName: string | null = null;

    if (rows.length === 0) {
      userName = name?.trim() || null;
      await sql`INSERT INTO users (id, name) VALUES (${id}, ${userName})`;
    } else {
      userName = rows[0].name as string | null;
      if (name?.trim() && name.trim() !== userName) {
        userName = name.trim();
        await sql`UPDATE users SET name = ${userName} WHERE id = ${id}`;
      }
    }

    const token = sign({ sub: id, name: userName });
    setCookie(res, token);
    res.json({ user: { id, name: userName } });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Login failed. Please try again." });
  }
}
