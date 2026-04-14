import { getSql } from "./_lib/db";

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  try {
    const sql = getSql();
    await sql`SELECT 1`;
    res.json({
      ok: true,
      db: "connected",
      env: {
        hasDatabaseUrl: !!(process.env.DATABASE_URL ?? process.env.POSTGRES_URL),
        hasJwtSecret: !!process.env.JWT_SECRET,
        hasEncryptionKey: !!process.env.ENCRYPTION_KEY,
      },
    });
  } catch (err: any) {
    res.status(500).json({
      ok: false,
      error: err?.message ?? String(err),
      env: {
        hasDatabaseUrl: !!(process.env.DATABASE_URL ?? process.env.POSTGRES_URL),
        hasJwtSecret: !!process.env.JWT_SECRET,
        hasEncryptionKey: !!process.env.ENCRYPTION_KEY,
      },
    });
  }
}
