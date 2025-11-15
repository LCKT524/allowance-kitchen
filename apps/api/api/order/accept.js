import { db } from "../../lib/supabase.js";

function parseToken(req) {
  const h = req.headers["authorization"] || req.headers["Authorization"] || "";
  const t = typeof h === "string" && h.startsWith("Bearer ") ? h.slice(7) : "";
  try { return JSON.parse(Buffer.from(t, "base64").toString("utf8")); } catch { return {}; }
}

async function getUserId(openid) {
  const q = new URLSearchParams();
  q.set("select", "id");
  q.set("openid", `eq.${openid}`);
  q.set("limit", "1");
  const ur = await db(`users?${q.toString()}`);
  const ul = ur.ok ? await ur.json() : [];
  return Array.isArray(ul) && ul.length ? ul[0].id : "";
}

export default async function handler(req, res) {
  if (req.method !== "POST") { res.status(405).json({ error: "method_not_allowed" }); return; }
  const { orderId } = req.body || {};
  const tk = parseToken(req);
  const openid = tk.openid || "";
  if (!orderId || !openid) { res.status(400).json({ error: "missing_fields" }); return; }
  const uid = await getUserId(openid);
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