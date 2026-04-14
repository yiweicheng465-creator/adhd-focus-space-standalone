import { clearCookie } from "../_lib/token";

export default function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", req.headers.origin ?? "*");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  if (req.method === "OPTIONS") { res.status(200).end(); return; }
  clearCookie(res);
  res.json({ ok: true });
}
