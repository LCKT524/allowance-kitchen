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

async function create(req, res) {
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

async function accept(req, res) {
  const { orderId } = req.body || {};
  const tk = parseToken(req);
  const openid = tk.openid || "";
  if (!orderId || !openid) { res.status(400).json({ error: "missing_fields" }); return; }
  const uid = await ensureUser(openid);
  if (!uid) { res.status(401).json({ error: "user_not_found" }); return; }
  const ur = await db("orders?id=eq." + orderId, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", "Prefer": "return=representation" },
    body: JSON.stringify({ accepted_by: uid, status: "accepted" })
  });
  if (!ur.ok) { res.status(500).json({ error: "order_accept_failed" }); return; }
  const d = await ur.json();
  res.status(200).json({ order: Array.isArray(d) && d.length ? d[0] : d });
}

async function detail(req, res, query) {
  const id = typeof query.get("id") === "string" ? query.get("id") : query.get("id");
  if (!id) { res.status(400).json({ error: "missing_id" }); return; }
  const or = await db(`orders?id=eq.${id}`);
  if (!or.ok) { res.status(500).json({ error: "db_error" }); return; }
  const od = await or.json();
  const order = Array.isArray(od) && od.length ? od[0] : null;
  if (!order) { res.status(404).json({ error: "not_found" }); return; }
  const ir = await db(`order_items?order_id=eq.${id}`);
  const items = ir.ok ? await ir.json() : [];
  const menuIds = Array.from(new Set(items.map(i => i.menu_id))).filter(Boolean);
  let menusMap = {};
  if (menuIds.length) {
    const params = new URLSearchParams();
    params.set("select", "id,name,category");
    params.set("id", `in.(${menuIds.join(',')})`);
    const mr = await db(`menus?${params.toString()}`);
    const ml = mr.ok ? await mr.json() : [];
    for (const m of ml) menusMap[m.id] = { name: m.name, category: m.category };
  }
  const itemsEnriched = items.map(i => ({ ...i, menu_name: menusMap[i.menu_id]?.name || "", menu_category: menusMap[i.menu_id]?.category || "" }));
  res.status(200).json({ order, items: itemsEnriched });
}

async function messagesSend(req, res) {
  const { orderId, content } = req.body || {};
  const tk = parseToken(req);
  const openid = tk.openid || "";
  if (!orderId || !content || !openid) { res.status(400).json({ error: "missing_fields" }); return; }
  const uid = await ensureUser(openid);
  if (!uid) { res.status(401).json({ error: "user_not_found" }); return; }
  const r = await db("messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Prefer": "return=representation" },
    body: JSON.stringify({ order_id: orderId, sender_id: uid, content })
  });
  if (!r.ok) { res.status(500).json({ error: "message_send_failed" }); return; }
  const d = await r.json();
  res.status(200).json({ message: Array.isArray(d) && d.length ? d[0] : d });
}

async function messagesList(req, res, query) {
  const orderId = typeof query.get("orderId") === "string" ? query.get("orderId") : query.get("orderId");
  if (!orderId) { res.status(400).json({ error: "missing_orderId" }); return; }
  const params = new URLSearchParams();
  params.set("order", "created_at.asc");
  params.set("order_id", `eq.${orderId}`);
  const r = await db(`messages?${params.toString()}`);
  if (!r.ok) { res.status(500).json({ error: "db_error" }); return; }
  const d = await r.json();
  res.status(200).json({ items: d });
}

async function list(req, res, query) {
  const type = query.get("type") || "mine";
  const status = query.get("status") || undefined;
  const tk = parseToken(req);
  const openid = tk.openid || "";
  let uid = "";
  if (openid) {
    const q = new URLSearchParams();
    q.set("select", "id");
    q.set("openid", `eq.${openid}`);
    q.set("limit", "1");
    const ur = await db(`users?${q.toString()}`);
    const ul = ur.ok ? await ur.json() : [];
    uid = Array.isArray(ul) && ul.length ? ul[0].id : "";
  }
  const params = new URLSearchParams();
  params.set("order", "updated_at.desc");
  if (status) params.set("status", `eq.${status}`);
  if (type === "available") {
    params.set("accepted_by", "is.null");
    params.set("status", "eq.pending");
  } else if (uid) {
    params.set("or", `(customer_id.eq.${uid},accepted_by.eq.${uid})`);
  }
  const r = await db(`orders?${params.toString()}`);
  if (!r.ok) { res.status(500).json({ error: "db_error" }); return; }
  const d = await r.json();
  res.status(200).json({ items: d });
}

export default async function handler(req, res) {
  const urlObj = new URL(req.url, "http://localhost");
  const pathname = urlObj.pathname || "";
  const query = urlObj.searchParams;
  if (pathname.endsWith("/order/create") && req.method === "POST") return create(req, res);
  if (pathname.endsWith("/order/accept") && req.method === "POST") return accept(req, res);
  if (pathname.endsWith("/order/start") && req.method === "POST") return start(req, res);
  if (pathname.endsWith("/order/complete") && req.method === "POST") return complete(req, res);
  if (pathname.endsWith("/order/cancel") && req.method === "POST") return cancel(req, res);
  if (pathname.endsWith("/order/detail") && req.method === "GET") return detail(req, res, query);
  if (pathname.endsWith("/order/messages/send") && req.method === "POST") return messagesSend(req, res);
  if (pathname.endsWith("/order/messages/list") && req.method === "GET") return messagesList(req, res, query);
  if (pathname.endsWith("/order/list") && req.method === "GET") return list(req, res, query);
  res.status(404).json({ error: "not_found" });
}