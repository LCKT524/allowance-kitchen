import fetch from "node-fetch";

const url = process.env.SUPABASE_URL || "";
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

export async function db(path, init) {
  const r = await fetch(`${url}/rest/v1/${path}`, {
    ...(init || {}),
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      Accept: "application/json",
      ...(init && init.headers ? init.headers : {}),
    },
  });
  return r;
}