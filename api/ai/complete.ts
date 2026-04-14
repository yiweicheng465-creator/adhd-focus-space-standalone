import { getSql } from "../_lib/db";
import { getUser } from "../_lib/token";
import { decrypt } from "../_lib/crypto";
import OpenAI from "openai";

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", req.headers.origin ?? "*");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  if (req.method === "OPTIONS") { res.status(200).end(); return; }
  if (req.method !== "POST") { res.status(405).json({ error: "Method not allowed" }); return; }

  const user = getUser(req);
  if (!user) { res.status(401).json({ error: "Not authenticated" }); return; }

  try {
    // Fetch encrypted key from Neon
    const sql = getSql();
    const rows = await sql`
      SELECT api_key_encrypted, api_key_iv FROM users WHERE id = ${user.sub}
    `;

    if (!rows[0]?.api_key_encrypted || !rows[0]?.api_key_iv) {
      res.status(402).json({ error: "No API key saved. Add your OpenAI key in Settings." });
      return;
    }

    const apiKey = decrypt(
      rows[0].api_key_encrypted as string,
      rows[0].api_key_iv as string
    );

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

    const content = completion.choices[0]?.message?.content ?? "";
    res.json({ content });
  } catch (err: any) {
    console.error("AI error:", err);
    if (err?.status === 401) {
      res.status(401).json({ error: "Invalid API key. Check your OpenAI key in Settings." });
    } else if (err?.status === 429) {
      res.status(429).json({ error: "Rate limit exceeded on your OpenAI account." });
    } else {
      res.status(500).json({ error: "AI request failed. Please try again." });
    }
  }
}
