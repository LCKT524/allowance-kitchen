import fetch from "node-fetch";
import { db } from "../../lib/supabase.js";

const DEEPSEEK_URL = process.env.DEEPSEEK_URL || "https://api.deepseek.com/v1/chat/completions";
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || "";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }
  const { prompt, created_by } = req.body || {};
  if (!prompt) {
    res.status(400).json({ error: "missing_prompt" });
    return;
  }
  const r = await fetch(DEEPSEEK_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7
    })
  });
  if (!r.ok) {
    res.status(502).json({ error: "ai_error" });
    return;
  }
  const ai = await r.json();
  const text = ai && ai.choices && ai.choices[0] && ai.choices[0].message && ai.choices[0].message.content ? ai.choices[0].message.content : "";
  const name = text.split("\n")[0] || "AI 菜品";
  const category = text.includes("荤") ? "meat" : "vegetable";
  const ingredients = { generated: text };
  const method = text;
  const resp = await db("menus", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, category, ingredients, method, source: "ai", created_by })
  });
  if (!resp.ok) {
    res.status(500).json({ error: "db_error" });
    return;
  }
  const item = await resp.json();
  res.status(200).json({ item: Array.isArray(item) ? item[0] : item });
}