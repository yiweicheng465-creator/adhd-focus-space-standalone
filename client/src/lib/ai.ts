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

  return data.content as string;
}
