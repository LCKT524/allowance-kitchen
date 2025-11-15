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
  if (req.method !== "GET") { res.status(405).json({ error: "method_not_allowed" }); return; }
  const type = typeof req.query.type === "string" ? req.query.type : "mine";
  const status = typeof req.query.status === "string" ? req.query.status : undefined;
  const tk = parseToken(req);
  const openid = tk.openid || "";
  const uid = openid ? await getUserId(openid) : "";
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