export default async function handler(req, res) {
  if (req.method !== "GET") { res.status(405).json({ error: "method_not_allowed" }); return; }
  const required = process.env.ADMIN_TOKEN || "";
  if (!required) { res.status(200).json({ ok: false, configured: false }); return; }
  const token = req.headers["x-admin-token"] || req.headers["X-Admin-Token"] || "";
  if (token !== required) { res.status(403).json({ ok: false, configured: true }); return; }
  res.status(200).json({ ok: true, configured: true });
}
