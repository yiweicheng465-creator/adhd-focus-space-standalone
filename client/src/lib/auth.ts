export interface User { id: string; name: string | null }

async function apiFetch(path: string, opts?: RequestInit): Promise<Response> {
  return fetch(path, {
    ...opts,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(opts?.headers ?? {}) },
  });
}

export async function login(email: string, name?: string): Promise<User> {
  const res = await apiFetch("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, name }),
  });
  const data = await res.json().catch(() => ({ error: "Server error" }));
  if (!res.ok) throw new Error(data.error ?? "Login failed");
  return data.user as User;
}

export async function logout(): Promise<void> {
  await apiFetch("/api/auth/logout", { method: "POST" });
  // Always clear local cached state even if request fails
}

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
