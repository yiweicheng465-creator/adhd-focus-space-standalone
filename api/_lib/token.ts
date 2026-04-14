import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET ?? "dev-secret-change-me";
export interface Payload { sub: string; name: string | null }

export function sign(p: Payload): string {
  return jwt.sign(p, SECRET, { expiresIn: "30d" });
}

export function verify(token: string): Payload | null {
  try { return jwt.verify(token, SECRET) as Payload; }
  catch { return null; }
}

export function fromCookies(header?: string): string | null {
  if (!header) return null;
  const m = header.split(";").find(c => c.trim().startsWith("adhd_token="));
  return m ? decodeURIComponent(m.trim().slice("adhd_token=".length)) : null;
}

export function setCookie(res: any, token: string) {
  const isProd = process.env.NODE_ENV === "production";
  const age = 30 * 24 * 3600;
  res.setHeader("Set-Cookie",
    `adhd_token=${token}; HttpOnly; Path=/; Max-Age=${age}; SameSite=Lax${isProd ? "; Secure" : ""}`);
}

export function clearCookie(res: any) {
  res.setHeader("Set-Cookie", "adhd_token=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax");
}

export function getUser(req: any): Payload | null {
  const token = fromCookies(req.headers?.cookie);
  return token ? verify(token) : null;
}
