export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const headers = { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "Content-Type, Authorization", "Access-Control-Allow-Methods": "GET, POST, OPTIONS" };
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });
  if (url.pathname.endsWith("/publish") && request.method === "POST") {
    if (!env.PUBLISH_SECRET || request.headers.get("Authorization") !== `Bearer ${env.PUBLISH_SECRET}`) return new Response(JSON.stringify({error:"unauthorized"}), {status:401, headers});
    let data; try { data = await request.json(); } catch { return new Response(JSON.stringify({error:"invalid_json"}), {status:400,headers}); }
    data.updatedAt = Date.now();
    await env.LEAGUE_STATUS.put("latest", JSON.stringify(data), { expirationTtl: 180 });
    return new Response(JSON.stringify({ok:true}), {headers});
  }
  if (url.pathname.endsWith("/status") && request.method === "GET") {
    const raw = await env.LEAGUE_STATUS.get("latest");
    if (!raw) return new Response(JSON.stringify({status:"offline",message:"Companion não publicou status recentemente."}), {headers});
    let data; try { data = JSON.parse(raw); } catch { data = {status:"offline"}; }
    if (Date.now() - (data.updatedAt || 0) > 90000) data = {status:"offline",message:"Companion desconectado ou PC offline."};
    return new Response(JSON.stringify(data), {headers});
  }
  return new Response(JSON.stringify({error:"not_found"}), {status:404,headers});
}
