import { getSql } from "./_lib/db.js";

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  const env = {
    hasDatabaseUrl: !!(process.env.DATABASE_URL ?? process.env.POSTGRES_URL ?? process.env.DATABASE_URL_UNPOOLED),
    hasJwtSecret: !!process.env.JWT_SECRET,
    hasEncryptionKey: !!process.env.ENCRYPTION_KEY,
  };
  try {
    const sql = getSql();
    await sql`SELECT 1 AS ok`;
    res.json({ ok: true, db: "connected", env });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err?.message ?? String(err), env });
  }
}
