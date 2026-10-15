export async function onRequestPost({ request, env }) {
  const headers = {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  };

  // Diagnose deployment configuration without ever returning a secret value.
  if (!env.PUBLISH_SECRET) {
    return new Response(JSON.stringify({
      error: "publish_secret_missing",
      message: "PUBLISH_SECRET is not available to this Pages Function deployment. Check Settings > Variables and Secrets for the Production environment, then redeploy."
    }), { status: 500, headers });
  }

  const authorization = request.headers.get("Authorization") || "";
  if (authorization !== `Bearer ${env.PUBLISH_SECRET}`) {
    return new Response(JSON.stringify({
      error: "unauthorized",
      message: "The server has PUBLISH_SECRET configured, but the supplied credential does not match.",
      authorizationHeaderPresent: authorization.length > 0,
      bearerSchemePresent: authorization.startsWith("Bearer ")
    }), { status: 401, headers });
  }

  if (!env.LEAGUE_STATUS) {
    return new Response(JSON.stringify({
      error: "kv_not_configured",
      message: "Authentication succeeded, but LEAGUE_STATUS KV binding is missing from this deployment."
    }), { status: 500, headers });
  }

  let data;
  try {
    data = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "invalid_json" }), { status: 400, headers });
  }

  data.updatedAt = Date.now();
  await env.LEAGUE_STATUS.put("latest", JSON.stringify(data), { expirationTtl: 180 });
  return new Response(JSON.stringify({ ok: true }), { headers });
}
