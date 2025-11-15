import { db } from "../../lib/supabase.js";

export default async function handler(req, res) {
  if (req.method !== "GET") { res.status(405).json({ error: "method_not_allowed" }); return; }
  const orderId = typeof req.query.orderId === "string" ? req.query.orderId : "";
  if (!orderId) { res.status(400).json({ error: "missing_orderId" }); return; }
  const params = new URLSearchParams();
  params.set("order", "created_at.asc");
  params.set("order_id", `eq.${orderId}`);
  const r = await db(`messages?${params.toString()}`);
  if (!r.ok) { res.status(500).json({ error: "db_error" }); return; }
  const d = await r.json();
  res.status(200).json({ items: d });
}