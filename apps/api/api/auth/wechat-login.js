import fetch from "node-fetch";
import { db } from "../../lib/supabase.js";

const appid = process.env.WECHAT_APPID || "";
const secret = process.env.WECHAT_SECRET || "";
const fakeOpenid = process.env.WECHAT_DEV_FAKE_OPENID || "";

export default async function handler(req, res) {
  const urlObj = new URL(req.url, "http://localhost");
  const dev = urlObj.searchParams.get("dev");
  const qOpenid = urlObj.searchParams.get("openid") || "";

  if (req.method === "GET" && (dev === "1" || qOpenid)) {
    const oid = qOpenid || fakeOpenid;
    if (!oid) { res.status(500).json({ error: "missing_wechat_env" }); return; }
    const token = Buffer.from(JSON.stringify({ openid: oid })).toString("base64");
    res.status(200).json({ token, user: { id: "", openid: oid } });
    return;
  }
  if (req.method !== "POST") {
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }
  const { code } = req.body || {};
  if (!code) {
    res.status(400).json({ error: "missing_code" });
    return;
  }
  if (!appid || !secret) {
    if (fakeOpenid) {
      const token = Buffer.from(JSON.stringify({ openid: fakeOpenid })).toString("base64");
      res.status(200).json({ token, user: { id: "", openid: fakeOpenid } });
      return;
    }
    res.status(500).json({ error: "missing_wechat_env" });
    return;
  }
  try {
    const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${appid}&secret=${secret}&js_code=${code}&grant_type=authorization_code`;
    const r = await fetch(url);
    const data = await r.json();
    if (!data.openid) {
      if (fakeOpenid) {
        const token = Buffer.from(JSON.stringify({ openid: fakeOpenid })).toString("base64");
        res.status(200).json({ token, user: { id: "", openid: fakeOpenid } });
        return;
      }
      res.status(401).json({ error: "wechat_auth_failed", detail: data });
      return;
    }
    let userId = "";
    const q = new URLSearchParams();
    q.set("select", "id");
    q.set("openid", `eq.${data.openid}`);
    q.set("limit", "1");
    const ur = await db(`users?${q.toString()}`);
    const ul = ur.ok ? await ur.json() : [];
    if (Array.isArray(ul) && ul.length) {
      userId = ul[0].id;
    } else {
      const cr = await db("users", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Prefer": "return=representation" },
        body: JSON.stringify({ openid: data.openid })
      });
      const cd = cr.ok ? await cr.json() : [];
      userId = Array.isArray(cd) && cd.length ? cd[0].id : "";
    }
    const token = Buffer.from(JSON.stringify({ openid: data.openid })).toString("base64");
    res.status(200).json({ token, user: { id: userId, openid: data.openid } });
  } catch (err) {
    if (fakeOpenid) {
      const token = Buffer.from(JSON.stringify({ openid: fakeOpenid })).toString("base64");
      res.status(200).json({ token, user: { id: "", openid: fakeOpenid } });
      return;
    }
    res.status(500).json({ error: "wechat_request_failed" });
  }
}