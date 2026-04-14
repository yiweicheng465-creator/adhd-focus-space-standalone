/**
 * Auth client — talks to the server-side JWT auth endpoints.
 * All requests include credentials (httpOnly cookie).
 */

export interface User {
  id: string;
  name: string | null;
}

const BASE = "";

async function apiFetch(path: string, opts?: RequestInit): Promise<Response> {
  return fetch(`${BASE}${path}`, {
    ...opts,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(opts?.headers ?? {}),
    },
  });
}

/**
 * Log in (or create account) with just an email.
 * Returns the authenticated user.
 */
export async function login(email: string, name?: string): Promise<User> {
  const res = await apiFetch("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, name }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Login failed");
  return data.user as User;
}

/**
 * Clear the auth cookie.
 */
export async function logout(): Promise<void> {
  await apiFetch("/api/auth/logout", { method: "POST" });
}

/**
 * Return the current user from JWT cookie, or null if not authenticated.
 */
export async function getMe(): Promise<User | null> {
  try {
    const res = await apiFetch("/api/auth/me");
    if (!res.ok) return null;
    const data = await res.json();
    return data.user as User;
  } catch {
    return null;
  }
}
