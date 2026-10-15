/* ============================================================
   CONFIGURAÇÃO: edite aqui
   ------------------------------------------------------------
   PREVIA   = true mostra avisos de "sem áudio". Troque por false no final.
   BG_MEDIA = opcional: troca o fundo (floresta) por outro arquivo, seja imagem,
              GIF, .mp4 ou .webm. Ex.: "fundo.jpg". Deixe "" para manter a floresta.
   src      = caminho do áudio de cada faixa (ex.: "musicas/astrid.mp3").
   ============================================================ */
const PREVIA = true;
const BG_MEDIA = "";

const PROFILE = {
  name:   "1nunt",
  handle: "",
  bio:    "eu amo minha namorada"
};


/* ---------- aba "música" (Last.fm: ludibrio) ----------
   Esta prévia não consegue ler o Last.fm sozinha, então há dois caminhos:
   1) Lista manual: preencha TOP com as faixas de cada período (copie do Last.fm).
   2) Ao vivo: crie uma chave de API gratuita em last.fm/api e coloque em
      LASTFM.apiKey (funciona quando o site estiver hospedado fora desta prévia).
   YT liga cada faixa a um vídeo: "artista - música" (minúsculas) -> ID ou link do YouTube. */
const LASTFM = { user: "ludibrio", apiKey: "" };
const PERIODS = [
  ["overall", "sempre"], ["12month", "12 meses"], ["6month", "6 meses"],
  ["3month", "3 meses"], ["1month", "1 mês"], ["7day", "7 dias"]
];
const TOP = {
  overall: [
    { title: "Feel Good Inc.",        artist: "Gorillaz",       plays: 112 },
    { title: "Become the Warm Jets",  artist: "Current Joys",   plays: 104 },
    { title: "the prom",              artist: "glaive",         plays: 103 },
    { title: "Headlock",              artist: "Imogen Heap",    plays: 103 },
    { title: "Avalon",                artist: "$uicideboy$",    plays: 102 },
    { title: "Drama",                 artist: "aespa",          plays: 101 },
    { title: "Clint Eastwood",        artist: "Gorillaz",       plays: 101 },
    { title: "EVIL J0RDAN",           artist: "Playboi Carti",  plays: 100 },
    { title: "Armageddon",            artist: "aespa",          plays: 95 },
    { title: "Supernova",             artist: "aespa",          plays: 95 }
  ]
  // "12month": [ ... ], "6month": [ ... ], "3month": [ ... ], "1month": [ ... ], "7day": [ ... ]
};
const YT = {
  "gorillaz - feel good inc.":           "HyHNuVaZJ-k",
  "current joys - become the warm jets": "YxwKap-1RBw",
  "glaive - the prom":                   "M-2YVBCayq4",
  "imogen heap - headlock":              "roPiy2JydwA",
  "$uicideboy$ - avalon":                "wFmAafUTJn0",
  "aespa - drama":                       "D8VEhcPeSlc",
  "gorillaz - clint eastwood":           "1V_xRb0x9aw",
  "playboi carti - evil j0rdan":         "RKUuIN5Fa_o",
  "aespa - armageddon":                  "nFYwcndNuOY",
  "aespa - supernova":                   "phuiiNCxRMg"
};
const SAMPLE = [
  { title: "astrid",         artist: "glaive" },
  { title: "detest me",      artist: "glaive" },
  { title: "bastard",        artist: "glaive" },
  { title: "nome da música", artist: "artista" },
  { title: "nome da música", artist: "artista" },
  { title: "nome da música", artist: "artista" },
  { title: "nome da música", artist: "artista" },
  { title: "nome da música", artist: "artista" }
];

/* ============================================================
/* ============================================================
   HELPERS
   ============================================================ */
const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const intro = $("#intro"), home = $("#home");
let entered = false;

/* ---------- fundo (imagem embutida; BG_MEDIA troca por outro) ---------- */
const scene = $("#scene"), sceneImg = $("#sceneImg");
if (BG_MEDIA) {
  if (/\.(mp4|webm)$/i.test(BG_MEDIA)) {
    const v = document.createElement("video");
    v.className = "scene-img"; v.src = BG_MEDIA; v.autoplay = true; v.loop = true; v.muted = true; v.playsInline = true;
    sceneImg.replaceWith(v);
  } else { sceneImg.src = BG_MEDIA; }
}

/* ---------- canvas: vagalumes flutuando ---------- */
const cv = $("#bg"), ctx = cv.getContext("2d");
let W, H, flies = [], px = 0, py = 0, tx = 0, ty = 0;
function spawn(init) {
  return {
    x: Math.random() * W, y: init ? Math.random() * H : H + 12, z: Math.random() * 0.8 + 0.2,
    r: Math.random() * 1.6 + 0.7, t: Math.random() * 6.28, s: Math.random() * 0.02 + 0.007,
    vx: (Math.random() - 0.5) * 0.18, vy: -(Math.random() * 0.2 + 0.04),
    hue: Math.random() < 0.65 ? "236, 255, 224" : "255, 246, 196"
  };
}
function resize() {
  const dpr = Math.min(devicePixelRatio || 1, 2);
  W = innerWidth; H = innerHeight;
  cv.width = W * dpr; cv.height = H * dpr;
  cv.style.width = W + "px"; cv.style.height = H + "px";
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  flies = Array.from({ length: Math.max(26, Math.round((W * H) / 19000)) }, () => spawn(true));
}
function draw() {
  ctx.clearRect(0, 0, W, H);
  px += (tx - px) * 0.05; py += (ty - py) * 0.05;
  scene.style.transform = `translate3d(${(-px * 18).toFixed(2)}px, ${(-py * 11).toFixed(2)}px, 0)`;
  for (const f of flies) {
    f.t += f.s;
    f.x += f.vx + Math.sin(f.t * 0.7) * 0.25 * f.z;
    f.y += f.vy * f.z;
    if (f.y < -14 || f.x < -24 || f.x > W + 24) { Object.assign(f, spawn(false)); }
    const a = (0.25 + 0.75 * (0.5 + 0.5 * Math.sin(f.t))) * (0.4 + 0.6 * f.z);
    const x = f.x + px * f.z * 22, y = f.y + py * f.z * 22, rad = f.r * 7;
    const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
    g.addColorStop(0, `rgba(${f.hue}, ${a.toFixed(3)})`);
    g.addColorStop(0.18, `rgba(${f.hue}, ${(a * 0.5).toFixed(3)})`);
    g.addColorStop(1, `rgba(${f.hue}, 0)`);
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, rad, 0, 6.283); ctx.fill();
  }
  if (!reduceMotion && !document.hidden) requestAnimationFrame(draw);
}
addEventListener("resize", resize);
resize();
requestAnimationFrame(draw);
document.addEventListener("visibilitychange", () => { if (!document.hidden && !reduceMotion) requestAnimationFrame(draw); });

/* ---------- ponteiro: parallax, brilho do cursor, inclinação do vidro ---------- */
addEventListener("pointermove", (e) => {
  tx = (e.clientX / innerWidth - 0.5) * 2; ty = (e.clientY / innerHeight - 0.5) * 2;
});
function bindSpot(el, tilt) {
  el.addEventListener("pointermove", (e) => {
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
    el.style.setProperty("--mx", (x * 100).toFixed(1) + "%");
    el.style.setProperty("--my", (y * 100).toFixed(1) + "%");
    if (tilt && e.pointerType === "mouse") {
      el.style.setProperty("--rx", ((0.5 - y) * 7).toFixed(2) + "deg");
      el.style.setProperty("--ry", ((x - 0.5) * 9).toFixed(2) + "deg");
    }
  });
  if (tilt) el.addEventListener("pointerleave", () => { el.style.setProperty("--rx", "0deg"); el.style.setProperty("--ry", "0deg"); });
}
$$(".tilt").forEach(el => bindSpot(el, true));

/* ---------- perfil ---------- */
$("#handle").textContent = PROFILE.handle;
const nameEl = $("#name");
nameEl.setAttribute("aria-label", PROFILE.name);
[...PROFILE.name].forEach((c, i) => {
  const s = document.createElement("span");
  s.className = "ch"; s.style.setProperty("--i", i);
  s.textContent = c === " " ? "\u00A0" : c; s.setAttribute("aria-hidden", "true");
  nameEl.appendChild(s);
});
function typeBio() {
  const el = $("#bio"); let i = 0;
  if (reduceMotion) { el.textContent = PROFILE.bio; return; }
  (function step() { el.textContent = PROFILE.bio.slice(0, ++i); if (i < PROFILE.bio.length) setTimeout(step, 34); })();
}

/* ---------- aba música: períodos + lista + player do YouTube ---------- */
const list = $("#tracklist");
const esc = (s) => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const ytKey = (t) => (t.artist + " - " + t.title).toLowerCase();
const ytSearch = (t) => "https://www.youtube.com/results?search_query=" + encodeURIComponent(t.artist + " " + t.title);
function ytId(v) {
  if (!v) return "";
  const m = String(v).match(/(?:v=|youtu\.be\/|embed\/)([\w-]{11})/);
  return m ? m[1] : (/^[\w-]{11}$/.test(String(v)) ? String(v) : "");
}

async function getTracks(p) {
  if (LASTFM.apiKey) {
    try {
      const url = "https://ws.audioscrobbler.com/2.0/?method=user.gettoptracks&user=" + encodeURIComponent(LASTFM.user) +
        "&period=" + p + "&limit=10&api_key=" + LASTFM.apiKey + "&format=json";
      const j = await (await fetch(url)).json();
      const arr = j.toptracks.track.map(x => ({ title: x.name, artist: x.artist.name, plays: +x.playcount }));
      if (arr.length) return { tracks: arr, note: "ao vivo do last.fm" };
    } catch (e) { /* sem acesso: usa a lista manual */ }
  }
  if (TOP[p] && TOP[p].length) return { tracks: TOP[p], note: "lista do last.fm" };
  if (!Object.keys(TOP).length && PREVIA) {
    const idx = PERIODS.findIndex(x => x[0] === p);
    const rot = SAMPLE.map((_, i) => SAMPLE[(i + idx) % SAMPLE.length]);
    return { tracks: rot.map((t, i) => ({ ...t, plays: 300 - i * 24 - idx * 7 })), note: "dados de exemplo · aguardando sua lista do last.fm" };
  }
  return { tracks: [], note: "" };
}

function closeItem(x) {
  x.classList.remove("open");
  x.querySelector(".track").setAttribute("aria-expanded", "false");
  setTimeout(() => { if (!x.classList.contains("open")) x.querySelector(".ytslot").innerHTML = ""; }, 650);
}
function toggleItem(li, t) {
  const opening = !li.classList.contains("open");
  $$(".item.open").forEach(closeItem);
  if (!opening) return;
  li.classList.add("open");
  li.querySelector(".track").setAttribute("aria-expanded", "true");
  const id = ytId(YT[ytKey(t)] || t.yt);
  const slot = li.querySelector(".ytslot");
  const link = '<a class="yt-open" href="' + (id ? "https://www.youtube.com/watch?v=" + id : ytSearch(t)) + '" target="_blank" rel="noopener">' + (id ? "abrir no YouTube" : "buscar no YouTube") + " ↗</a>";
  if (id) {
    slot.innerHTML = '<div class="yt"><iframe src="https://www.youtube-nocookie.com/embed/' + id + '?rel=0&modestbranding=1&playsinline=1" title="' + esc(t.artist + " - " + t.title) + '" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe></div><div class="yt-actions">' + link + "</div>";
  } else {
    slot.innerHTML = '<div class="yt-empty"><span>vídeo ainda não adicionado para esta faixa.</span>' + link + "</div>";
  }
}

async function showPeriod(p) {
  $$("#periods .period").forEach(b => b.setAttribute("aria-selected", String(b.dataset.p === p)));
  const { tracks, note } = await getTracks(p);
  $("#musicNote").textContent = note;
  list.innerHTML = "";
  if (!tracks.length) {
    list.innerHTML = '<li class="empty mono">sem dados para este período</li>';
  }
  const max = Math.max(...tracks.map(t => t.plays || 0), 1);
  tracks.forEach((t, i) => {
    const li = document.createElement("li");
    li.className = "item";
    li.innerHTML = '<button class="track" style="--i:' + i + '" aria-expanded="false">' +
      '<span class="bar" style="--w:' + Math.round(((t.plays || 0) / max) * 100) + '%"></span>' +
      '<span class="rank">' + String(i + 1).padStart(2, "0") + "</span>" +
      '<span class="meta"><b>' + esc(t.title) + "</b><span>" + esc(t.artist) + "</span></span>" +
      '<span class="plays mono">' + (t.plays || "") + "</span>" +
      '</button>' +
      '<div class="ytbox"><div><div class="ytslot"></div></div></div>';
    li.querySelector(".track").addEventListener("click", () => toggleItem(li, t));
    list.appendChild(li);
  });
  list.classList.remove("swap"); void list.offsetWidth; list.classList.add("swap");
}
const periodsEl = $("#periods");
// só mostra os períodos que têm dados (ou todos, se a chave do Last.fm estiver ativa)
const avail = PERIODS.filter(([id]) => LASTFM.apiKey || TOP[id] || !Object.keys(TOP).length);
avail.forEach(([id, label]) => {
  const b = document.createElement("button");
  b.className = "period"; b.dataset.p = id; b.setAttribute("role", "tab"); b.textContent = label;
  b.addEventListener("click", () => showPeriod(id));
  periodsEl.appendChild(b);
});
if (avail.length < 2) periodsEl.style.display = "none";
showPeriod(avail[0][0]);

/* ---------- chip "ouvindo" (texto fixo, sem player) ---------- */
$("#chipText").textContent = "ouvindo: astrid · glaive";

/* ---------- League of Legends status ----------
   Companion local opcional: execute league-companion.py no PC onde o LoL está aberto.
   A API Riot pública não informa fila/champ select; esses estados vêm do cliente local.
*/
const LEAGUE_LOCAL_URL = "http://127.0.0.1:8788/status";
const LEAGUE_STATUS_URL = "/api/league/status"; // Cloudflare Pages Function publica o status para visitantes.
const leagueStatus = $("#leagueStatus"), leagueStatusText = $("#leagueStatusText"), leagueMatch = $("#leagueMatch");
function renderLeague(data) {
  const labels = { offline: "offline", ingame: "em partida", queue: "em fila", champselect: "seleção de campeão", unknown: "status não verificado" };
  const status = labels[data?.status] ? data.status : "unknown";
  leagueStatus.dataset.status = status;
  leagueStatusText.textContent = labels[status];
  if (status !== "ingame" && status !== "champselect" && status !== "queue") {
    const copy = data?.message || "Abra o cliente do League e inicie o companion local para consultar o status.";
    leagueMatch.innerHTML = '<div class="league-empty">' + esc(copy) + '</div>';
    return;
  }
  const m = data.match || {};
  const champ = m.champion || (status === "queue" ? "Aguardando partida" : "Campeão não detectado");
  const image = m.championImage || "";
  const runes = Array.isArray(m.runes) ? m.runes : [];
  const escAttr = (v) => esc(String(v || ""));
  const renderTeam = (title, players, side) => {
    if (!Array.isArray(players) || !players.length) return '';
    return '<section class="league-team league-team-' + side + '"><h4>' + title + '</h4><div class="league-team-list">' + players.map((p, i) => {
      const name = p.champion || 'Escolhendo campeão';
      const portrait = p.championImage || '';
      const player = p.player || '';
      return '<div class="league-player">' + (portrait ? '<img src="' + escAttr(portrait) + '" alt="' + escAttr(name) + '" loading="lazy">' : '<div class="league-player-placeholder">?</div>') + '<div class="league-player-info"><span class="league-player-champ">' + esc(name) + '</span>' + (player ? '<span class="league-player-name">' + esc(player) + '</span>' : '<span class="league-player-name">Jogador ' + (i + 1) + '</span>') + '</div></div>';
    }).join('') + '</div></section>';
  };
  const teamMarkup = renderTeam('ALIADOS', m.allies, 'allies') + renderTeam('INIMIGOS', m.enemies, 'enemies');
  leagueMatch.innerHTML = '<div class="league-match-grid">' + (image ? '<img class="league-champ" src="' + escAttr(image) + '" alt="' + escAttr(champ) + '">' : '<div class="league-champ"></div>') + '<div><h3>' + esc(champ) + '</h3><div class="league-meta">' + esc(m.queue || (status === "queue" ? "Fila" : status === "champselect" ? "Seleção de campeão" : "Modo não informado")) + '</div><div class="league-runes">' + runes.map(r => r.image ? '<img class="league-rune" src="' + escAttr(r.image) + '" alt="runa" title="' + escAttr(r.name || "Runa") + '">' : '<span class="mono">' + esc(r.name || r) + '</span>').join("") + '</div></div></div>' + (teamMarkup ? '<div class="league-teams">' + teamMarkup + '</div>' : '<div class="league-empty league-composition-empty">A composição dos times aparecerá na seleção de campeões ou durante a partida.</div>');
}
async function refreshLeague() {
  leagueStatusText.textContent = "consultando…";
  for (const url of [LEAGUE_LOCAL_URL, LEAGUE_STATUS_URL].filter(Boolean)) {
    try {
      const response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(2500) });
      if (!response.ok) throw new Error("status");
      renderLeague(await response.json()); return;
    } catch (_) { /* tenta próxima fonte */ }
  }
  renderLeague({ status: "unknown", message: "Para status automático, execute league-companion.py neste PC. A página sozinha não consegue ler o cliente local." });
}
$("#refreshLeague").addEventListener("click", refreshLeague);
refreshLeague();
setInterval(refreshLeague, 15000);

/* ---------- abas ---------- */
const tabs = $("#tabs");
tabs.addEventListener("click", (e) => {
  const b = e.target.closest(".tab"); if (!b) return;
  const name = b.dataset.tab;
  tabs.dataset.active = name;
  tabs.querySelectorAll(".tab").forEach(x => x.setAttribute("aria-selected", String(x === b)));
  $$(".view").forEach(v => v.classList.toggle("active", v.id === "view-" + name));
  home.scrollTo({ top: 0, behavior: "smooth" });
});

/* ---------- transição: intro -> perfil (gota d'água + fade) ---------- */
function enter(e) {
  if (entered) return; entered = true;
  const x = e && e.clientX != null ? e.clientX : innerWidth / 2;
  const y = e && e.clientY != null ? e.clientY : innerHeight / 2;

  const splash = () => {
    // ondas se expandindo na "água", com fade
    const r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    const scale = (r * 2) / 20;
    const ease = "cubic-bezier(.22,1,.36,1)";
    [
      { s: 1, o: 0.9, d: 1500, dl: 0 },
      { s: 0.7, o: 0.6, d: 1350, dl: 150 },
      { s: 0.45, o: 0.45, d: 1200, dl: 300 }
    ].forEach(({ s, o, d, dl }) => {
      const ring = document.createElement("div");
      ring.className = "ripple";
      ring.style.left = x + "px"; ring.style.top = y + "px";
      document.body.appendChild(ring);
      ring.animate(
        [{ transform: "scale(0)", opacity: o }, { transform: `scale(${scale * s})`, opacity: 0 }],
        { duration: d, delay: dl, easing: ease }
      ).onfinish = () => ring.remove();
    });

    intro.classList.add("leaving");
    document.body.classList.add("entered");
    setTimeout(() => home.classList.add("show"), 350);
    setTimeout(typeBio, 1700);
    setTimeout(() => intro.classList.add("gone"), 1300);
  };

  if (reduceMotion) { splash(); return; }

  // a gota cai do topo até o ponto do toque, esticando na queda
  const drop = document.createElement("div");
  drop.className = "drop";
  drop.style.left = x + "px";
  document.body.appendChild(drop);
  drop.animate(
    [
      { transform: "translate(-50%, -60px) scaleY(1.1)", opacity: 0 },
      { transform: "translate(-50%, -60px) scaleY(1.1)", opacity: 1, offset: 0.15 },
      { transform: `translate(-50%, ${y - 10}px) scaleY(1.7)`, opacity: 1, offset: 0.96 },
      { transform: `translate(-50%, ${y}px) scaleY(0.3) scaleX(1.8)`, opacity: 0 }
    ],
    { duration: 620, easing: "cubic-bezier(.55,.06,.68,.19)", fill: "forwards" }
  ).onfinish = () => { drop.remove(); splash(); };
}
/* ---------- início: click to start -> escolha ♀ / ♂ ---------- */
// frase da transição dramática para quem escolhe ♀ e toca numa rede social
const BLOCK_MSG = "tá cega?";
let visitorGender = null, introStep = 1;

function lockSocialLinks() {
  $$(".tile").forEach(a => {
    a.removeAttribute("href"); a.removeAttribute("target");
    a.setAttribute("role", "button"); a.tabIndex = 0;
    a.addEventListener("click", (e) => { e.preventDefault(); openReveal(BLOCK_MSG, true); });
    a.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openReveal(BLOCK_MSG, true); } });
  });
}
function chooseGender(g, e) {
  visitorGender = g;
  document.body.dataset.gender = g;
  if (g === "f") lockSocialLinks();   // ♂: os links abrem normalmente
  enter(e);
}
intro.addEventListener("click", (e) => {
  if (entered) return;
  const g = e.target.closest(".gbtn");
  if (g) { chooseGender(g.dataset.g, e); return; }
  if (introStep === 1) {
    introStep = 2;
    intro.classList.add("step2");
    $("#gender").setAttribute("aria-hidden", "false");
  }
});
document.addEventListener("keydown", (e) => {
  if (!entered && introStep === 1 && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); intro.click(); }
});



/* ---------- bio: toque para a transição dramática ---------- */
const REVEAL = { sound: true, volume: 1.0 };   // sound: false = sem som | volume: 0 a 1.5
const reveal = $("#reveal");
let rvCtx = null, rvMaster = null;
function revealSound() {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const c = new AC(); rvCtx = c;
    const t0 = c.currentTime;

    // limitador: sobe o volume sem estourar
    const comp = c.createDynamicsCompressor();
    comp.threshold.value = -14; comp.knee.value = 10; comp.ratio.value = 8; comp.attack.value = 0.003; comp.release.value = 0.25;
    const master = c.createGain(); master.gain.value = REVEAL.volume; rvMaster = master;
    master.connect(comp); comp.connect(c.destination);

    // distorção: dá corpo e deixa as batidas audíveis até em caixinha de celular
    const curve = new Float32Array(256);
    for (let i = 0; i < 256; i++) { const x = i / 128 - 1; curve[i] = Math.tanh(x * 4); }
    const shaper = c.createWaveShaper(); shaper.curve = curve; shaper.connect(master);

    const thud = (at, vol, f0) => {
      const o = c.createOscillator(), g = c.createGain();
      o.type = "sine";
      o.frequency.setValueAtTime(f0, t0 + at);
      o.frequency.exponentialRampToValueAtTime(34, t0 + at + 0.5);
      g.gain.setValueAtTime(0.0001, t0 + at);
      g.gain.exponentialRampToValueAtTime(vol, t0 + at + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + at + 1.2);
      o.connect(g); g.connect(shaper);
      o.start(t0 + at); o.stop(t0 + at + 1.3);
      // "toc" seco por cima, mais fácil de ouvir
      const k = c.createOscillator(), kg = c.createGain();
      k.type = "triangle";
      k.frequency.setValueAtTime(f0 * 2.2, t0 + at);
      k.frequency.exponentialRampToValueAtTime(60, t0 + at + 0.18);
      kg.gain.setValueAtTime(0.0001, t0 + at);
      kg.gain.exponentialRampToValueAtTime(vol * 0.7, t0 + at + 0.01);
      kg.gain.exponentialRampToValueAtTime(0.0001, t0 + at + 0.22);
      k.connect(kg); kg.connect(shaper);
      k.start(t0 + at); k.stop(t0 + at + 0.3);
    };

    // batimento cardíaco que continua enquanto a foto estiver aberta
    for (let n = 0; n < 24; n++) { const at = 0.45 + n * 1.5; thud(at, 0.95, 100); thud(at + 0.33, 0.6, 84); }

    // impacto no momento do flash: ruído que despenca
    const nb = c.createBuffer(1, Math.floor(c.sampleRate * 1.4), c.sampleRate);
    const d = nb.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 2);
    const ns = c.createBufferSource(); ns.buffer = nb;
    const lp = c.createBiquadFilter(); lp.type = "lowpass";
    lp.frequency.setValueAtTime(3000, t0 + 0.45);
    lp.frequency.exponentialRampToValueAtTime(110, t0 + 1.8);
    const ng = c.createGain(); ng.gain.value = 0.8;
    ns.connect(lp); lp.connect(ng); ng.connect(master); ns.start(t0 + 0.45);

    // zumbido grave e dissonante (trítono + semitom), descendo devagar
    const dg = c.createGain();
    dg.gain.setValueAtTime(0.0001, t0 + 0.6);
    dg.gain.linearRampToValueAtTime(0.3, t0 + 4);
    const dl = c.createBiquadFilter(); dl.type = "lowpass"; dl.frequency.value = 280;
    dg.connect(dl); dl.connect(master);
    [55, 58.27, 77.78].forEach((f) => {
      const o = c.createOscillator(); o.type = "sawtooth";
      o.frequency.setValueAtTime(f, t0 + 0.6);
      o.frequency.linearRampToValueAtTime(f * 0.93, t0 + 30);
      o.connect(dg); o.start(t0 + 0.6); o.stop(t0 + 36);
    });
  } catch (e) { /* sem som */ }
}
function stopRevealSound() {
  if (!rvCtx) return;
  const c = rvCtx, m = rvMaster; rvCtx = null;
  try {
    m.gain.cancelScheduledValues(c.currentTime);
    m.gain.setValueAtTime(m.gain.value, c.currentTime);
    m.gain.linearRampToValueAtTime(0.0001, c.currentTime + 0.6);
  } catch (e) {}
  setTimeout(() => { c.close().catch(() => {}); }, 800);
}
function openReveal(text, warn) {
  if (reveal.classList.contains("on")) return;
  $("#rvCap").textContent = text || PROFILE.bio;
  $("#rvCap").classList.toggle("warn", !!warn);
  document.body.classList.add("zooming");
  reveal.classList.add("on");
  reveal.setAttribute("aria-hidden", "false");
  if (REVEAL.sound && !reduceMotion) revealSound();
}
function closeReveal() {
  if (!reveal.classList.contains("on") || reveal.classList.contains("closing")) return;
  reveal.classList.add("closing");
  stopRevealSound();
  document.body.classList.remove("zooming");
  setTimeout(() => { reveal.classList.remove("on", "closing"); reveal.setAttribute("aria-hidden", "true"); }, 950);
}
$("#bioBtn").addEventListener("click", () => openReveal());
$("#bioBtn").addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openReveal(); } });
reveal.addEventListener("click", closeReveal);
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeReveal(); });

/* ---------- rastro fino do mouse ---------- */
(() => {
  if (matchMedia("(pointer: coarse)").matches) return;
  const c = document.createElement("canvas"); c.id = "trail"; document.body.appendChild(c);
  const x = c.getContext("2d"); let pts = [], w, h;
  const fit = () => { const d = Math.min(devicePixelRatio || 1, 2); w = innerWidth; h = innerHeight; c.width = w * d; c.height = h * d; x.setTransform(d, 0, 0, d, 0, 0); };
  fit(); addEventListener("resize", fit);
  addEventListener("pointermove", (e) => { pts.push({ x: e.clientX, y: e.clientY, t: performance.now() }); });
  (function loop() {
    const now = performance.now(); pts = pts.filter(p => now - p.t < 380);
    x.clearRect(0, 0, w, h); x.lineCap = "round";
    for (let i = 1; i < pts.length; i++) {
      const k = 1 - (now - pts[i].t) / 380;
      x.strokeStyle = `rgba(255,255,255,${(k * .7).toFixed(3)})`; x.lineWidth = .4 + k * .9;
      x.beginPath(); x.moveTo(pts[i - 1].x, pts[i - 1].y); x.lineTo(pts[i].x, pts[i].y); x.stroke();
    }
    requestAnimationFrame(loop);
  })();
})();
