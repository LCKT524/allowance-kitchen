export default async function handler(req, res) {
  if (req.method !== "GET") { res.status(405).json({ status: "method_not_allowed" }); return; }
  const ok = !!process.env.SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY;
  res.status(200).json({ status: "ok", env: { supabase: ok, wechat: !!process.env.WECHAT_APPID && !!process.env.WECHAT_SECRET, deepseek: !!process.env.DEEPSEEK_API_KEY } });
}