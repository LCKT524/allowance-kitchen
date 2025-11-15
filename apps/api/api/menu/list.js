import { db } from "../../lib/supabase.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }
  const category = typeof req.query.category === "string" ? req.query.category : undefined;
  const params = new URLSearchParams();
  params.set("select", "*");
  if (category) params.set("category", `eq.${category}`);
  const r = await db(`menus?${params.toString()}`);
  if (!r.ok) {
    const detail = await r.text();
    res.status(500).json({ error: "db_error", status: r.status, detail });
    return;
  }
  const data = await r.json();
  res.status(200).json({ items: data });
}