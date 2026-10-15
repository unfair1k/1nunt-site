
const RIOT_API_KEY = "RGAPI-3f218ba2-c829-49c2-94f2-8715953cbe78";

export async function onRequestGet({ request }) {
  const url = new URL(request.url);

  const gameName = url.searchParams.get("gameName");
  const tagLine = url.searchParams.get("tagLine");

  if (!gameName || !tagLine) {
    return Response.json(
      {
        error: "Parâmetros obrigatórios ausentes.",
        usage: "/api/riot/account?gameName=SEU_NOME&tagLine=SUA_TAG"
      },
      { status: 400 }
    );
  }

  if (RIOT_API_KEY === "SUA_CHAVE_DE_EXEMPLO") {
    return Response.json(
      {
        error: "Configure uma Riot API Key válida no código."
      },
      { status: 500 }
    );
  }

  try {
    const endpoint =
      "https://americas.api.riotgames.com/riot/account/v1/accounts/by-riot-id/" +
      `${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`;

    const response = await fetch(endpoint, {
      headers: {
        "X-Riot-Token": RIOT_API_KEY
      }
    });

    const data = await response.json();

    if (!response.ok) {
      return Response.json(
        {
          error: "A Riot API retornou um erro.",
          status: response.status,
          details: data
        },
        { status: response.status }
      );
    }

    return Response.json(data, {
      headers: {
        "Cache-Control": "no-store"
      }
    });
  } catch {
    return Response.json(
      { error: "Não foi possível conectar à Riot API." },
      { status: 502 }
    );
  }
}
