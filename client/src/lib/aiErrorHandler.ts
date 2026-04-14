import { toast } from "sonner";

/**
 * Detects a NO_API_KEY error from tRPC.
 * Returns true if the error was a NO_API_KEY error, false otherwise.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isNoApiKeyError(err: any): boolean {
  if (err?.message === "NO_API_KEY") return true;
  if (err?.data?.code === "PRECONDITION_FAILED" && err?.message?.includes("NO_API_KEY")) return true;
  return false;
}

/**
 * Detects a quota exceeded / billing error from the LLM provider.
 * Fires when built-in Manus credits are exhausted OR user's OpenAI quota runs out.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isQuotaError(err: any): boolean {
  const msg: string = err?.message ?? "";
  return (
    msg.includes("insufficient_quota") ||
    msg.includes("quota") ||
    msg.includes("429") ||
    msg.includes("billing") ||
    msg.includes("RESOURCE_EXHAUSTED")
  );
}

/**
 * Handles an AI error with specific messages for common failure modes.
 *
 * New flow (built-in AI by default):
 * - Quota/credits exhausted: dispatch `aiCreditsExhausted` event (turns signal dot red),
 *   open SET panel so user can add their own OpenAI key as fallback.
 * - NO_API_KEY (no built-in key AND no user key): open ApiKeyDialog.
 * - Other errors: show a generic toast.
 *
 * @returns true if it was a NO_API_KEY error
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function handleAiError(
  err: any,
  fallbackMessage = "AI feature unavailable. Try again."
): boolean {
  if (isNoApiKeyError(err)) {
    window.dispatchEvent(new CustomEvent("openApiKeyDialog"));
    toast("AI unavailable — add an OpenAI key as backup.", { duration: 4000 });
    return true;
  }
  if (isQuotaError(err)) {
    // Signal that AI credits are exhausted → turns dot red in EffectsPanel
    window.dispatchEvent(new CustomEvent("aiCreditsExhausted"));
    // Open SET panel so user can add their own OpenAI key
    window.dispatchEvent(new CustomEvent("openFxPanel"));
    toast.error(
      "Built-in AI credits exhausted — add your own OpenAI key in Settings to continue.",
      { duration: 7000 }
    );
    return false;
  }
  toast.error(fallbackMessage, { duration: 3000 });
  return false;
}
