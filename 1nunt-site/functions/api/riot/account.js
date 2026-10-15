
export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const gameName = url.searchParams.get("gameName");
  const tagLine = url.searchParams.get("tagLine");

  if (!gameName || !tagLine) {
    return Response.json(
      { error: "Informe gameName e tagLine." },
      { status: 400 }
    );
  }

  // A chave fica configurada como segredo no Cloudflare.
  if (!env.RIOT_API_KEY) {
    return Response.json(
      { error: "RIOT_API_KEY não está configurada no Cloudflare." },
      { status: 500 }
    );
  }

  const endpoint =
    "https://americas.api.riotgames.com/riot/account/v1/accounts/by-riot-id/" +
    `${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`;

  try {
    const response = await fetch(endpoint, {
      headers: {
        "X-Riot-Token": env.RIOT_API_KEY
      }
    });

    const data = await response.json();

    return Response.json(data, {
      status: response.status,
      headers: { "Cache-Control": "no-store" }
    });
  } catch {
    return Response.json(
      { error: "Não foi possível conectar à Riot API." },
      { status: 502 }
    );
  }
}
