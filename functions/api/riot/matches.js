
export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const gameName = url.searchParams.get("gameName");
  const tagLine = url.searchParams.get("tagLine");
  const count = Math.min(
    Math.max(Number(url.searchParams.get("count")) || 10, 1),
    20
  );

  if (!gameName || !tagLine) {
    return Response.json(
      { error: "Informe gameName e tagLine." },
      { status: 400 }
    );
  }

  if (!env.RIOT_API_KEY) {
    return Response.json(
      { error: "RIOT_API_KEY não está configurada." },
      { status: 500 }
    );
  }

  const headers = { "X-Riot-Token": env.RIOT_API_KEY };

  try {
    const accountUrl =
      "https://americas.api.riotgames.com/riot/account/v1/accounts/by-riot-id/" +
      `${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`;

    const accountResponse = await fetch(accountUrl, { headers });
    const account = await accountResponse.json();

    if (!accountResponse.ok) {
      return Response.json(account, { status: accountResponse.status });
    }

    const matchesUrl =
      "https://americas.api.riotgames.com/lol/match/v5/matches/by-puuid/" +
      `${encodeURIComponent(account.puuid)}/ids?start=0&count=${count}`;

    const matchesResponse = await fetch(matchesUrl, { headers });
    const matchIds = await matchesResponse.json();

    if (!matchesResponse.ok) {
      return Response.json(matchIds, { status: matchesResponse.status });
    }

    const matches = await Promise.all(
      matchIds.map(async (id) => {
        const response = await fetch(
          `https://americas.api.riotgames.com/lol/match/v5/matches/${encodeURIComponent(id)}`,
          { headers }
        );

        const data = await response.json();

        if (!response.ok) {
          return { matchId: id, error: data.status?.message || "Falha ao buscar partida" };
        }

        const info = data.info;
        const participant = info.participants.find(
          (p) => p.puuid === account.puuid
        );

        if (!participant) return { matchId: id, error: "Jogador não encontrado" };

        return {
          matchId: id,
          champion: participant.championName,
          win: participant.win,
          kills: participant.kills,
          deaths: participant.deaths,
          assists: participant.assists,
          kda: `${participant.kills}/${participant.deaths}/${participant.assists}`,
          gameDuration: info.gameDuration,
          gameMode: info.gameMode,
          gameCreation: info.gameCreation,
          participants: info.participants.map((p) => ({
            champion: p.championName,
            teamId: p.teamId,
            win: p.win
          }))
        };
      })
    );

    return Response.json(
      { gameName: account.gameName, tagLine: account.tagLine, matches },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return Response.json(
      { error: "Não foi possível consultar o histórico da Riot API." },
      { status: 502 }
    );
  }
}
