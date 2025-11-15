import { db } from "../../lib/supabase.js";

function parseToken(req) {
  const h = req.headers["authorization"] || req.headers["Authorization"] || "";
  const t = typeof h === "string" && h.startsWith("Bearer ") ? h.slice(7) : "";
  try { return JSON.parse(Buffer.from(t, "base64").toString("utf8")); } catch { return {}; }
}

async function ensureUser(openid) {
  const q = new URLSearchParams();
  q.set("select", "id");
  q.set("openid", `eq.${openid}`);
  q.set("limit", "1");
  const ur = await db(`users?${q.toString()}`);
  const ul = ur.ok ? await ur.json() : [];
  if (Array.isArray(ul) && ul.length) return ul[0].id;
  const cr = await db("users", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Prefer": "return=representation" },
    body: JSON.stringify({ openid })
  });
  const cd = cr.ok ? await cr.json() : [];
  return Array.isArray(cd) && cd.length ? cd[0].id : "";
}

export default async function handler(req, res) {
  if (req.method !== "POST") { res.status(405).json({ error: "method_not_allowed" }); return; }
  const { items } = req.body || {};
  const tk = parseToken(req);
  const openid = tk.openid || (req.body && req.body.customer_openid) || "";
  if (!openid || !Array.isArray(items) || !items.length) { res.status(400).json({ error: "missing_fields" }); return; }
  const customerId = await ensureUser(openid);
  const or = await db("orders", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Prefer": "return=representation" },
    body: JSON.stringify({ customer_id: customerId, status: "pending", total_price: 0 })
  });
  if (!or.ok) { res.status(500).json({ error: "order_create_failed" }); return; }
  const od = await or.json();
  const order = Array.isArray(od) && od.length ? od[0] : od;
  let total = 0;
  for (const it of items) {
    const mid = it.menu_id;
    const qty = Number(it.quantity || 1);
    const mp = new URLSearchParams();
    mp.set("select", "id,category,name");
    mp.set("id", `eq.${mid}`);
    const mr = await db(`menus?${mp.toString()}`);
    if (!mr.ok) { res.status(400).json({ error: "menu_not_found", menu_id: mid }); return; }
    const ml = await mr.json();
    const m = Array.isArray(ml) && ml.length ? ml[0] : null;
    if (!m) { res.status(400).json({ error: "menu_not_found", menu_id: mid }); return; }
    const unit = m.category === "meat" ? 3.0 : 1.5;
    total += unit * qty;
    const ir = await db("order_items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order_id: order.id, menu_id: mid, quantity: qty, unit_price: unit })
    });
    if (!ir.ok) { res.status(500).json({ error: "order_item_failed", menu_id: mid }); return; }
  }
  const ur = await db("orders?id=eq." + order.id, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", "Prefer": "return=representation" },
    body: JSON.stringify({ total_price: Number(total.toFixed(2)) })
  });
  if (!ur.ok) { res.status(500).json({ error: "order_update_failed" }); return; }
  const upd = await ur.json();
  const finalOrder = Array.isArray(upd) && upd.length ? upd[0] : upd;
  res.status(200).json({ order: finalOrder });
}