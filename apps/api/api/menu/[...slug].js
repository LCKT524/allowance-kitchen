import { db } from "../../lib/supabase.js";

async function list(req, res) {
  const urlObj = new URL(req.url, "http://localhost");
  const category = urlObj.searchParams.get("category") || undefined;
  const name = urlObj.searchParams.get("name") || undefined;
  const params = new URLSearchParams();
  params.set("select", "*");
  if (category) params.set("category", `eq.${category}`);
  if (name) params.set("name", `eq.${name}`);
  const r = await db(`menus?${params.toString()}`);
  if (!r.ok) { const detail = await r.text(); res.status(500).json({ error: "db_error", status: r.status, detail }); return; }
  const data = await r.json();
  res.status(200).json({ items: data });
}

async function detail(req, res) {
  const urlObj = new URL(req.url, "http://localhost");
  const id = urlObj.searchParams.get("id") || "";
  if (!id) { res.status(400).json({ error: "missing_id" }); return; }
  const params = new URLSearchParams();
  params.set("select", "*");
  params.set("id", `eq.${id}`);
  const r = await db(`menus?${params.toString()}`);
  if (!r.ok) { res.status(500).json({ error: "db_error" }); return; }
  const data = await r.json();
  res.status(200).json({ item: Array.isArray(data) && data.length ? data[0] : null });
}

async function create(req, res) {
  if (req.method !== "POST") { res.status(405).json({ error: "method_not_allowed" }); return; }
  const { name, category, ingredients, method, source, created_by } = req.body || {};
  if (!name || !category) { res.status(400).json({ error: "missing_fields" }); return; }
  const r = await db("menus", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Prefer": "return=representation" },
    body: JSON.stringify({ name, category, ingredients, method, source, created_by }),
  });
  if (!r.ok) { res.status(500).json({ error: "db_error" }); return; }
  const data = await r.json();
  res.status(200).json({ item: Array.isArray(data) ? data[0] : data });
}

export default async function handler(req, res) {
  const urlObj = new URL(req.url, "http://localhost");
  const pathname = urlObj.pathname || "";
  if (pathname.endsWith("/menu/list") && req.method === "GET") return list(req, res);
  if (pathname.endsWith("/menu/detail") && req.method === "GET") return detail(req, res);
  if (pathname.endsWith("/menu/create")) return create(req, res);
  if (pathname.endsWith("/menu/delete")) return remove(req, res);
  if (pathname.endsWith("/menu/update")) return update(req, res);
  res.status(404).json({ error: "not_found" });
}

async function remove(req, res) {
  const urlObj = new URL(req.url, "http://localhost");
  const id = (req.method === "POST" ? (req.body && req.body.id) : urlObj.searchParams.get("id")) || "";
  if (!id) { res.status(400).json({ error: "missing_id" }); return; }
  const adminRequired = process.env.ADMIN_TOKEN || "";
  if (adminRequired) {
    const token = req.headers["x-admin-token"] || req.headers["X-Admin-Token"] || "";
    if (token !== adminRequired) { res.status(403).json({ error: "forbidden" }); return; }
  }
  const r = await db(`menus?id=eq.${id}`, { method: "DELETE", headers: { "Prefer": "return=minimal" } });
  if (!r.ok) { const detail = await r.text(); res.status(500).json({ error: "db_error", status: r.status, detail }); return; }
  res.status(200).json({ ok: true });
}

async function update(req, res) {
  if (req.method !== "PATCH" && req.method !== "POST") { res.status(405).json({ error: "method_not_allowed" }); return; }
  const { id, name, category, ingredients, method, source } = req.body || {};
  if (!id) { res.status(400).json({ error: "missing_id" }); return; }
  const adminRequired = process.env.ADMIN_TOKEN || "";
  if (adminRequired) {
    const token = req.headers["x-admin-token"] || req.headers["X-Admin-Token"] || "";
    if (token !== adminRequired) { res.status(403).json({ error: "forbidden" }); return; }
  }
  const patch = {};
  if (name !== undefined) patch.name = name;
  if (category !== undefined) patch.category = category;
  if (ingredients !== undefined) patch.ingredients = ingredients;
  if (method !== undefined) patch.method = method;
  if (source !== undefined) patch.source = source;
  if (!Object.keys(patch).length) { res.status(400).json({ error: "nothing_to_update" }); return; }
  const r = await db(`menus?id=eq.${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", "Prefer": "return=representation" },
    body: JSON.stringify(patch)
  });
  if (!r.ok) { const detail = await r.text(); res.status(500).json({ error: "db_error", status: r.status, detail }); return; }
  const d = await r.json();
  res.status(200).json({ item: Array.isArray(d) && d.length ? d[0] : d });
}
