import fetch from "node-fetch";

const appid = process.env.WECHAT_APPID || "";
const secret = process.env.WECHAT_SECRET || "";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }
  const { code } = req.body || {};
  if (!code) {
    res.status(400).json({ error: "missing_code" });
    return;
  }
  const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${appid}&secret=${secret}&js_code=${code}&grant_type=authorization_code`;
  const r = await fetch(url);
  const data = await r.json();
  if (!data.openid) {
    res.status(401).json({ error: "wechat_auth_failed", detail: data });
    return;
  }
  const token = Buffer.from(JSON.stringify({ openid: data.openid })).toString("base64");
  res.status(200).json({ token, user: { openid: data.openid } });
}