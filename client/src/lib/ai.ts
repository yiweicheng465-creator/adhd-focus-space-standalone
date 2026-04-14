/**
 * AI client — proxies requests through our server (/api/ai/complete).
 * The server fetches the user's stored API key from Neon and calls OpenAI.
 * The key never touches the browser.
 */

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
    if (res.status === 402) throw new Error("Add your OpenAI key in Settings (bottom-left ⚙) to use AI features.");
    if (res.status === 401) throw new Error("Invalid API key. Re-check your OpenAI key in Settings.");
    if (res.status === 429) throw new Error("OpenAI quota exceeded. Check your account billing.");
    throw new Error(data.error ?? "AI request failed. Please try again.");
  }

  return data.content as string;
}
