import { getUser } from "../_lib/token.js";

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", req.headers.origin ?? "*");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  if (req.method === "OPTIONS") { res.status(200).end(); return; }

  const user = await getUser(req);
  if (!user) { res.status(401).json({ error: "Not authenticated" }); return; }
  res.json({ user: { id: user.sub, name: user.name } });
}
