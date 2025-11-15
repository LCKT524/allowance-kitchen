import { db } from "../../lib/supabase.js";

export default async function handler(req, res) {
  if (req.method !== "POST") { res.status(405).json({ error: "method_not_allowed" }); return; }
  const token = req.headers["x-admin-token"] || req.headers["X-Admin-Token"] || "";
  const required = process.env.ADMIN_TOKEN || "";
  if (required && token !== required) { res.status(403).json({ error: "forbidden" }); return; }
  const check = await db("menus?select=id,name&limit=1");
  const exists = check.ok ? await check.json() : [];
  if (Array.isArray(exists) && exists.length) { res.status(200).json({ ok: true, seeded: false }); return; }
  const items = [
    { name: "红烧肉", category: "meat", ingredients: {}, method: "做法：...", source: "system" },
    { name: "清炒菠菜", category: "vegetable", ingredients: {}, method: "做法：...", source: "system" }
  ];
  const r = await db("menus", { method: "POST", headers: { "Content-Type": "application/json", "Prefer": "return=representation" }, body: JSON.stringify(items) });
  if (!r.ok) { const detail = await r.text(); res.status(500).json({ error: "db_error", detail }); return; }
  const data = await r.json();
  res.status(200).json({ ok: true, seeded: true, items: data });
}