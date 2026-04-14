export default function handler(_req: any, res: any) {
  res.json({ ok: true, time: new Date().toISOString() });
}
