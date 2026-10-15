export async function onRequestGet({ env }) {
  const headers = { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "Access-Control-Allow-Origin": "*" };
  if (!env.LEAGUE_STATUS) return new Response(JSON.stringify({ status: "offline", message: "League status storage is not configured." }), { headers });
  const raw = await env.LEAGUE_STATUS.get("latest");
  if (!raw) return new Response(JSON.stringify({ status: "offline", message: "Companion has not published status recently." }), { headers });
  let data;
  try { data = JSON.parse(raw); } catch { data = { status: "offline" }; }
  if (Date.now() - (data.updatedAt || 0) > 90000) data = { status: "offline", message: "Companion disconnected or PC offline." };
  return new Response(JSON.stringify(data), { headers });
}
