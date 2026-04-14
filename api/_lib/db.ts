import { neon } from "@neondatabase/serverless";

export function getSql() {
  // Vercel's Neon integration may set either of these
  const url =
    process.env.DATABASE_URL ??
    process.env.POSTGRES_URL ??
    process.env.DATABASE_URL_UNPOOLED ??
    process.env.POSTGRES_URL_NON_POOLING;

  if (!url) {
    throw new Error(
      "No database URL found. Set DATABASE_URL in Vercel environment variables."
    );
  }
  return neon(url);
}
