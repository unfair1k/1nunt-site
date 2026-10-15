export async function onRequestPost({ request, env }) {
  const headers = { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" };
  if (!env.PUBLISH_SECRET || request.headers.get("Authorization") !== `Bearer ${env.PUBLISH_SECRET}`) {
    return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers });
  }
  if (!env.LEAGUE_STATUS) {
    return new Response(JSON.stringify({ error: "kv_not_configured" }), { status: 500, headers });
  }
  let data;
  try { data = await request.json(); } catch {
    return new Response(JSON.stringify({ error: "invalid_json" }), { status: 400, headers });
  }
  data.updatedAt = Date.now();
  await env.LEAGUE_STATUS.put("latest", JSON.stringify(data), { expirationTtl: 180 });
  return new Response(JSON.stringify({ ok: true }), { headers });
}
