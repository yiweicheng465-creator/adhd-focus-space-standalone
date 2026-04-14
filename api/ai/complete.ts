import { getSql } from "../_lib/db.js";
import { getUser } from "../_lib/token.js";
import { decrypt } from "../_lib/crypto.js";
import OpenAI from "openai";

const FREE_LIMIT = 5;

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", req.headers.origin ?? "*");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  if (req.method === "OPTIONS") { res.status(200).end(); return; }
  if (req.method !== "POST") { res.status(405).json({ error: "Method not allowed" }); return; }

  const user = await getUser(req);
  if (!user) { res.status(401).json({ error: "Not authenticated" }); return; }

  const { systemPrompt, userMessage, model = "gpt-4o-mini" } = req.body ?? {};
  if (!userMessage) { res.status(400).json({ error: "userMessage is required" }); return; }

  try {
    const sql = getSql();
    const rows = await sql`
      SELECT api_key_encrypted, api_key_iv, ai_usage_count
      FROM users WHERE id = ${user.sub}
    `;
    const row = rows[0];

    let apiKey: string;
    let usingOwnerKey = false;

    if (row?.api_key_encrypted && row?.api_key_iv) {
      // User has their own key — use it, no limits
      apiKey = decrypt(row.api_key_encrypted as string, row.api_key_iv as string);
    } else {
      // No personal key — check free usage against owner's key
      const usageCount = Number(row?.ai_usage_count ?? 0);

      if (usageCount >= FREE_LIMIT) {
        res.status(402).json({
          error: `You've used your ${FREE_LIMIT} free AI requests. Add your own OpenAI key in Settings (⚙ bottom-left) to keep using AI features.`,
          usageCount,
          freeLimit: FREE_LIMIT,
        });
        return;
      }

      const ownerKey = process.env.OWNER_OPENAI_KEY;
      if (!ownerKey) {
        res.status(402).json({
          error: "No API key configured. Add your OpenAI key in Settings (⚙ bottom-left).",
        });
        return;
      }

      apiKey = ownerKey;
      usingOwnerKey = true;
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

    // Increment usage count only if we used the owner's key (and call succeeded)
    if (usingOwnerKey) {
      await sql`
        UPDATE users SET ai_usage_count = COALESCE(ai_usage_count, 0) + 1
        WHERE id = ${user.sub}
      `;
    }

    const newCount = usingOwnerKey ? Number(row?.ai_usage_count ?? 0) + 1 : null;
    res.json({
      content,
      ...(usingOwnerKey && {
        usageCount: newCount,
        freeLimit: FREE_LIMIT,
        remaining: FREE_LIMIT - (newCount ?? 0),
      }),
    });
  } catch (err: any) {
    console.error("AI error:", err);
    if (err?.status === 401) return res.status(401).json({ error: "Invalid OpenAI API key." });
    if (err?.status === 429) return res.status(429).json({ error: "OpenAI rate limit exceeded. Try again shortly." });
    res.status(500).json({ error: "AI request failed: " + (err?.message ?? "unknown error") });
  }
}
