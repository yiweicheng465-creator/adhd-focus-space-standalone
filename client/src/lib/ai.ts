/**
 * AI client — proxies requests through our server (/api/ai/complete).
 * The server fetches the user's stored API key from Neon.
 */

const NO_KEY_MSG = "Add your OpenAI key in Settings to use AI features.";

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

  const data = await res.json().catch(() => ({ error: "Invalid response from server" }));

  if (!res.ok) {
    // 402 = no API key configured
    if (res.status === 402) throw new Error(NO_KEY_MSG);
    // 401 = invalid key
    if (res.status === 401) throw new Error("Invalid API key. Re-check your OpenAI key in Settings.");
    // 429 = rate limit / quota
    if (res.status === 429) throw new Error("OpenAI quota exceeded. Check your account billing.");
    // 401 auth (not logged in)
    if (res.status === 401) throw new Error("Please log in to use AI features.");
    throw new Error(data.error ?? "AI request failed. Please try again.");
  }

  return data.content as string;
}
