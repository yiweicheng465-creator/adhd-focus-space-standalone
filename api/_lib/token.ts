import { SignJWT, jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "dev-secret-change-me"
);

export interface Payload { sub: string; name: string | null }

export async function sign(payload: Payload): Promise<string> {
  return new SignJWT({ sub: payload.sub, name: payload.name })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("30d")
    .sign(SECRET);
}

export async function verify(token: string): Promise<Payload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return { sub: payload.sub as string, name: (payload.name ?? null) as string | null };
  } catch {
    return null;
  }
}

export function parseCookies(header: string): Record<string, string> {
  return Object.fromEntries(
    header.split(";").map(c => c.trim().split("=").map(decodeURIComponent))
  );
}

export function setCookie(res: any, token: string) {
  const isProd = process.env.NODE_ENV === "production";
  const age = 30 * 24 * 3600;
  res.setHeader("Set-Cookie",
    `adhd_token=${token}; HttpOnly; Path=/; Max-Age=${age}; SameSite=Lax${isProd ? "; Secure" : ""}`);
}

export function clearCookie(res: any) {
  const isProd = process.env.NODE_ENV === "production";
  res.setHeader("Set-Cookie",
    `adhd_token=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax${isProd ? "; Secure" : ""}`);
}

export async function getUser(req: any): Promise<Payload | null> {
  const cookieHeader = req.headers?.cookie ?? "";
  if (!cookieHeader) return null;
  const cookies = parseCookies(cookieHeader);
  const token = cookies["adhd_token"];
  if (!token) return null;
  return verify(token);
}
