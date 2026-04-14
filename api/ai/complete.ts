import { getSql } from "../_lib/db.js";
import { getUser } from "../_lib/token.js";
import { decrypt } from "../_lib/crypto.js";
import OpenAI from "openai";

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", req.headers.origin ?? "*");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  if (req.method === "OPTIONS") { res.status(200).end(); return; }
  if (req.method !== "POST") { res.status(405).json({ error: "Method not allowed" }); return; }

  const user = await getUser(req);
  if (!user) { res.status(401).json({ error: "Not authenticated" }); return; }

  try {
    const sql = getSql();
    const rows = await sql`SELECT api_key_encrypted, api_key_iv FROM users WHERE id = ${user.sub}`;

    if (!rows[0]?.api_key_encrypted || !rows[0]?.api_key_iv) {
      res.status(402).json({ error: "No API key saved. Add your OpenAI key in Settings (bottom-left gear icon)." });
      return;
    }

    const apiKey = decrypt(rows[0].api_key_encrypted as string, rows[0].api_key_iv as string);
    const { systemPrompt, userMessage, model = "gpt-4o-mini" } = req.body ?? {};

    if (!userMessage) {
      res.status(400).json({ error: "userMessage is required" });
      return;
    }

    const openai = new OpenAI({ apiKey });
    const completion = await openai.chat.completions.create({
      model,
      messages: [
        ...(systemPrompt ? [{ role: "system" as const, content: systemPrompt }] : []),
        { role: "user" as const, content: userMessage },
      ],
      max_tokens: 1000,
    });

    res.json({ content: completion.choices[0]?.message?.content ?? "" });
  } catch (err: any) {
    console.error("AI error:", err);
    if (err?.status === 401) return res.status(401).json({ error: "Invalid OpenAI API key. Check your key in Settings." });
    if (err?.status === 429) return res.status(429).json({ error: "OpenAI rate limit or quota exceeded." });
    res.status(500).json({ error: "AI request failed: " + (err?.message ?? "unknown error") });
  }
}
