1NUNT — site pessoal
====================

Arquivos: index.html, style.css, script.js, bg.jpg, bio.jpg, avatar.gif

Como editar
- Nome, bio, lista da aba música e vídeos: no começo do script.js (PROFILE, TOP, YT).
- Links das redes: no index.html (procure por "tile").
- Música de fundo (Glaive aleatório): coloque os .mp3 numa pasta "musicas" e preencha
  o campo src de cada faixa em INTRO_TRACKS (ex.: "musicas/astrid.mp3").
  Depois troque PREVIA para false no script.js.
- Fundo: troque o bg.jpg (ou use BG_MEDIA no script.js para GIF/vídeo).
- Tela inicial: "click to start" e depois a escolha ♀ / ♂. Quem escolhe ♀ e toca numa rede
  social vê a transição dramática (frase em BLOCK_MSG no script.js) e o link não abre;
  quem escolhe ♂ abre os links normalmente.
- Foto da transição dramática (ao tocar na bio): troque o bio.jpg. O som da transição
  pode ser desligado com REVEAL.sound = false e o volume ajustado em REVEAL.volume
  (0 a 1.5), no fim do script.js.
- Last.fm ao vivo (opcional): crie uma chave gratuita em last.fm/api e coloque em LASTFM.apiKey.

Para testar
- Os vídeos do YouTube NÃO carregam abrindo o index.html direto do computador
  (aparece erro de incorporação). Hospede o site, ou rode um servidor local
  (por exemplo, na pasta: python3 -m http.server) e abra http://localhost:8000.
- As fontes e os vídeos precisam de internet.

Hospedagem gratuita
Cloudflare Pages, Netlify, Vercel ou GitHub Pages: é só arrastar a pasta.

AJUSTES RECENTES
- Os @/nomes de usuário não aparecem mais nos botões das redes.
- Nova aba League com status e cartão de partida (campeão, runas, modo e matchup).
- Riot ID configurado como joji#mandy, região BR.

STATUS AUTOMÁTICO DO LEAGUE — CONFIGURAÇÃO LOCAL
A aba League agora consulta automaticamente o companion local a cada 15 segundos. Para mostrar fila, seleção de campeão e partida em tempo real, é necessário executar o companion no MESMO computador em que o cliente do LoL está aberto.

Windows:
1. Instale Python 3 em https://www.python.org/downloads/ (marque “Add Python to PATH” durante a instalação).
2. Extraia esta pasta do ZIP.
3. Abra a pasta no Explorador de Arquivos, clique na barra de endereço, digite cmd e pressione Enter.
4. Execute: py league-companion.py
5. Mantenha a janela do terminal aberta enquanto joga. O companion só escuta em 127.0.0.1 (seu próprio computador) e é somente leitura.
6. Abra o site no mesmo computador. Na aba League, clique em “atualizar status” se quiser consultar imediatamente.

O companion lê o estado do cliente local do League. Durante a partida, tenta obter campeão e dados de jogadores/runa pelo Live Client Data API. Alguns detalhes, como runas ou matchup exato de rota, podem não estar disponíveis em todos os estados/partidas; nesse caso o cartão informa que não conseguiu detectá-los. A seleção de campeão pode mostrar a escolha atual, mas não promete runas antes de elas serem disponibilizadas pelo cliente.

Limites importantes:
- O companion precisa estar rodando no computador onde o jogo está aberto. Um visitante que abrir o site em outro computador não verá o seu status local.
- O status online/fila/seleção de campeão não pode ser inferido com precisão só pelo perfil público ou por trackers públicos.
- Não coloque uma Riot API key no script.js. Nenhuma chave é necessária para este companion.
- Se o cliente estiver instalado num caminho incomum, defina a variável de ambiente LEAGUE_LOCKFILE com o caminho completo do arquivo lockfile do cliente do League.
- Se o navegador bloquear a conexão local ao abrir o site por HTTPS, use a mesma origem de hospedagem e permita a conexão local quando o navegador solicitar; o companion não abre portas para a rede, apenas para 127.0.0.1.

Endpoint local de diagnóstico: http://127.0.0.1:8788/status
Perfil externo: https://op.gg/pt/lol/summoners/br/joji-MANDY


HOSPEDAGEM CLOUDFLARE PAGES + STATUS PUBLICO AO VIVO
====================================================
O pacote inclui uma Pages Function em functions/api/league/status.js. Ela lê/grava status em Cloudflare KV. O companion local publica o estado ao Worker usando um segredo; visitantes consultam /api/league/status.

IMPORTANTE: não publique o companion com segredo dentro do código do site. Configure as variáveis no Windows (PowerShell) apenas no seu PC:
  $env:LEAGUE_STATUS_PUBLISH_URL = "https://SEU-PROJETO.pages.dev/api/league/publish"
  $env:LEAGUE_STATUS_SECRET = "UM_SEGREDO_LONGO_ALEATORIO"
  py league-companion.py

CONFIGURAR CLOUDFLARE:
1. Crie um projeto Pages com integração Git (recomendado para Functions) ou use Wrangler CLI. Direct Upload pelo painel não compila a pasta functions.
2. Crie um namespace Workers KV chamado, por exemplo, LEAGUE_STATUS. Copie o ID para wrangler.toml.
3. Configure a binding LEAGUE_STATUS no projeto Pages (Settings > Bindings > KV namespace) e faça redeploy.
4. Em Settings > Variables and Secrets, crie o secret PUBLISH_SECRET com o mesmo valor usado em LEAGUE_STATUS_SECRET no PC. Não use um segredo curto ou compartilhado.
5. Faça deploy incluindo a pasta functions/. A API estará em /api/league/status e /api/league/publish.
6. No Windows, abra PowerShell na pasta do site e execute os comandos acima substituindo o domínio e o segredo. Mantenha o companion aberto enquanto jogar.

STATUS DE SEGURANÇA: o endpoint público de leitura expõe somente o status de jogo e detalhes da partida; qualquer visitante pode consultar isso. O endpoint de publicação exige segredo. Não compartilhe o segredo nem o coloque em script.js. KV expira os dados após 3 minutos e o endpoint retorna offline se não houver atualização em 90 segundos.

Deploy direto por arrastar ZIP no dashboard não processa Pages Functions. Use Git integration ou Wrangler conforme documentação oficial: https://developers.cloudflare.com/pages/get-started/direct-upload/ e https://developers.cloudflare.com/pages/functions/


CORRECAO PARA STATUS PUBLICO NO CLOUDFLARE PAGES
================================================
A rota de leitura e /api/league/status e a rota de envio e /api/league/publish.
A Pages Function de publicacao fica em functions/api/league/publish.js.
No painel Pages, configure a binding KV chamada LEAGUE_STATUS e o secret PUBLISH_SECRET.
O ID do KV deve ser associado no painel, nao coloque segredos neste repositorio publico.
No PowerShell, substitua o dominio e o segredo reais:
  $env:LEAGUE_STATUS_PUBLISH_URL = "https://1nunt-site.pages.dev/api/league/publish"
  $env:LEAGUE_STATUS_SECRET = "COLOQUE_AQUI_O_MESMO_SEGREDO_CONFIGURADO_NO_CLOUDFLARE"
  py league-companion.py
Nao publique o segredo no GitHub.
