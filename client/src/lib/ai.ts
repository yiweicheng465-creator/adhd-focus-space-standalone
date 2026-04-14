/**
 * AI client — proxies through /api/ai/complete.
 * Server uses the user's own OpenAI key, or the owner's key (5 free requests).
 * The key never touches the browser.
 */
import { toast } from "sonner";

export async function callAI(
  systemPrompt: string,
  userMessage: string,
  model = "gpt-4o-mini"
): Promise<string> {
  const res = await fetch("/api/ai/complete", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ systemPrompt, userMessage, model }),
  });

  const data = await res.json().catch(() => ({ error: "Server returned non-JSON response" }));

  if (!res.ok) {
    if (res.status === 402) throw new Error(data.error ?? "Add your OpenAI key in Settings to use AI.");
    if (res.status === 401) throw new Error("Invalid API key. Re-check your key in Settings (⚙).");
    if (res.status === 429) throw new Error("OpenAI rate limit. Try again in a moment.");
    throw new Error(data.error ?? "AI request failed.");
  }

  // Warn user when approaching the free limit
  if (data.remaining !== undefined && data.remaining !== null) {
    if (data.remaining === 1) {
      toast("1 free AI request left — add your OpenAI key in Settings (⚙) to keep going.", {
        duration: 6000,
      });
    } else if (data.remaining === 2) {
      toast(`${data.remaining} free AI requests remaining. Add your own key in Settings (⚙) soon.`, {
        duration: 5000,
      });
    }
  }

  return data.content as string;
}
