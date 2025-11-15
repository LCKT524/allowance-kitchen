import { db } from "../../lib/supabase.js";

export default async function handler(req, res) {
  if (req.method !== "GET") { res.status(405).json({ error: "method_not_allowed" }); return; }
  const id = typeof req.query.id === "string" ? req.query.id : "";
  if (!id) { res.status(400).json({ error: "missing_id" }); return; }
  const or = await db(`orders?id=eq.${id}`);
  if (!or.ok) { res.status(500).json({ error: "db_error" }); return; }
  const od = await or.json();
  const order = Array.isArray(od) && od.length ? od[0] : null;
  if (!order) { res.status(404).json({ error: "not_found" }); return; }
  const ir = await db(`order_items?order_id=eq.${id}`);
  const items = ir.ok ? await ir.json() : [];
  res.status(200).json({ order, items });
}