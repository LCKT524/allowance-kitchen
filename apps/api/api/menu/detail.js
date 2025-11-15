import { db } from "../../lib/supabase.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }
  const id = req.query.id || "";
  if (!id) {
    res.status(400).json({ error: "missing_id" });
    return;
  }
  const params = new URLSearchParams();
  params.set("select", "*");
  params.set("id", `eq.${id}`);
  const r = await db(`menus?${params.toString()}`);
  if (!r.ok) {
    res.status(500).json({ error: "db_error" });
    return;
  }
  const data = await r.json();
  res.status(200).json({ item: Array.isArray(data) && data.length ? data[0] : null });
}