import { db } from "../../lib/supabase.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }
  const { name, category, ingredients, method, source, created_by } = req.body || {};
  if (!name || !category) {
    res.status(400).json({ error: "missing_fields" });
    return;
  }
  const r = await db("menus", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Prefer": "return=representation" },
    body: JSON.stringify({ name, category, ingredients, method, source, created_by }),
  });
  if (!r.ok) {
    res.status(500).json({ error: "db_error" });
    return;
  }
  const data = await r.json();
  res.status(200).json({ item: Array.isArray(data) ? data[0] : data });
}