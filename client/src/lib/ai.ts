/**
 * AI client — proxies through /api/ai/complete.
 * Server uses the user's own OpenAI key, or the owner's key (5 free requests).
 */
import { toast } from "sonner";

function openApiKeySettings() {
  window.dispatchEvent(new CustomEvent("openSettingsApiKey"));
}

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
    if (res.status === 402) {
      // No key / free limit exhausted — show actionable toast
      toast(data.error ?? "Add your OpenAI key to use AI features.", {
        duration: 8000,
        action: {
          label: "Add Key →",
          onClick: openApiKeySettings,
        },
      });
      throw new Error("no-key");
    }
    if (res.status === 401) {
      toast("Invalid API key. Check your key in Settings.", {
        duration: 6000,
        action: { label: "Settings →", onClick: openApiKeySettings },
      });
      throw new Error("invalid-key");
    }
    if (res.status === 429) throw new Error("OpenAI rate limit. Try again in a moment.");
    throw new Error(data.error ?? "AI request failed.");
  }

  // Warn user when approaching the free limit
  if (data.remaining !== undefined && data.remaining !== null) {
    if (data.remaining === 1) {
      toast("1 free AI request left.", {
        duration: 6000,
        action: { label: "Add Key →", onClick: openApiKeySettings },
      });
    } else if (data.remaining === 2) {
      toast(`${data.remaining} free AI requests remaining.`, {
        duration: 5000,
        action: { label: "Add Key →", onClick: openApiKeySettings },
      });
    }
  }

  // Track total API calls in localStorage
  try {
    const today = new Date().toDateString();
    const total = Number(localStorage.getItem("adhd-api-calls-total") ?? 0) + 1;
    const dayKey = `adhd-api-calls-${today}`;
    const todayCount = Number(localStorage.getItem(dayKey) ?? 0) + 1;
    localStorage.setItem("adhd-api-calls-total", String(total));
    localStorage.setItem(dayKey, String(todayCount));
    // Clean old daily keys (keep only last 7 days)
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith("adhd-api-calls-") && k !== dayKey && k !== "adhd-api-calls-total") {
        const d = new Date(k.replace("adhd-api-calls-", ""));
        if (!isNaN(d.getTime()) && Date.now() - d.getTime() > 7 * 86400000) {
          localStorage.removeItem(k); i--;
        }
      }
    }
  } catch {}

  return data.content as string;
}
