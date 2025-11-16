import fetch from "node-fetch";

const DEEPSEEK_URL = process.env.DEEPSEEK_URL || "https://api.deepseek.com/v1/chat/completions";
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || "";

function parseRecommendation(text) {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  let name = "";
  let ingredients = [];
  let steps = [];
  let method = "";
  for (const l of lines) {
    if (!name && /^菜名[:：]/.test(l)) name = l.replace(/^菜名[:：]\s*/, "");
    else if (/^食材[:：]/.test(l)) {
      const ing = l.replace(/^食材[:：]\s*/, "");
      ingredients = ing.split(/[、,，]/).map(s => s.trim()).filter(Boolean);
    } else if (/^(做法|步骤)[:：]/.test(l)) {
      // method header, do nothing
    } else if (/^第[一二三四五六七八九十]+步[:：]/.test(l)) {
      steps.push(l.replace(/^第[一二三四五六七八九十]+步[:：]\s*/, ""));
    } else {
      method += (method ? "\n" : "") + l;
    }
  }
  if (!name) {
    // fallback: first non-empty line
    name = lines[0] || "AI 菜品";
  }
  const catHint = (ingredients.join(" ") + " " + method + " " + name);
  const category = /牛|羊|猪|鸡|鸭|肉|虾|鱼/.test(catHint) ? "meat" : "vegetable";
  return { name, ingredients, steps, method: method || steps.join("\n"), category, raw: text };
}

export default async function handler(req, res) {
  if (req.method !== "POST") { res.status(405).json({ error: "method_not_allowed" }); return; }
  const { prompt, history } = req.body || {};
  if (!prompt) { res.status(400).json({ error: "missing_prompt" }); return; }
  const system = "你是餐饮点餐助手。严格使用如下格式输出：\n菜名：<菜名>\n食材：<用中文列出，使用顿号分隔>\n做法：\n第一步：<内容>；\n第二步：<内容>。可继续增加步骤。不要输出多余说明。";
  const msgs = [{ role: "system", content: system }];
  if (Array.isArray(history)) {
    for (const h of history) {
      if (h && h.role && h.content) msgs.push({ role: h.role, content: h.content });
    }
  }
  msgs.push({ role: "user", content: prompt });
  const r = await fetch(DEEPSEEK_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${DEEPSEEK_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "deepseek-chat", messages: msgs, temperature: 0.5 })
  });
  if (!r.ok) { const detail = await r.text(); res.status(502).json({ error: "ai_error", detail }); return; }
  const ai = await r.json();
  const text = ai?.choices?.[0]?.message?.content || "";
  const rec = parseRecommendation(text);
  res.status(200).json({ recommendation: rec });
}
