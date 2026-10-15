/* 1nunt — League UI enhancement. Leaves existing API and status logic intact. */
(() => {
  "use strict";
  function init() {
    const root = document.querySelector("#view-league .league-card");
    const history = document.getElementById("leagueHistory");
    const section = root && root.querySelector(".league-history");
    if (!root || !history || !section || document.getElementById("leagueInsights")) return;
    const panel = document.createElement("section");
    panel.className = "league-insights";
    panel.id = "leagueInsights";
    panel.hidden = true;
    panel.setAttribute("aria-label", "Resumo das partidas recentes");
    panel.innerHTML = '<div class="league-insights-head"><span class="league-insights-title">FORMA RECENTE</span><span class="league-insights-count" id="leagueInsightsCount">0 partidas</span></div><div class="league-metric-grid"><div class="league-metric"><span class="league-metric-label">Vitórias</span><strong class="league-metric-value is-positive" id="leagueWins">—</strong></div><div class="league-metric"><span class="league-metric-label">Derrotas</span><strong class="league-metric-value is-negative" id="leagueLosses">—</strong></div><div class="league-metric"><span class="league-metric-label">Win rate</span><strong class="league-metric-value" id="leagueWinRate">—</strong></div></div><div class="league-formline"><span class="league-form-label">ÚLTIMOS RESULTADOS</span><div class="league-form-dots" id="leagueFormDots" aria-label="Resultados recentes"></div></div>';
    root.insertBefore(panel, section);
    function update() {
      const rows = Array.from(history.querySelectorAll(":scope > .lh-row"));
      if (!rows.length) { panel.hidden = true; return; }
      const wins = rows.filter(row => row.classList.contains("win")).length;
      const losses = rows.filter(row => row.classList.contains("loss")).length;
      document.getElementById("leagueInsightsCount").textContent = rows.length + (rows.length === 1 ? " partida" : " partidas");
      document.getElementById("leagueWins").textContent = String(wins);
      document.getElementById("leagueLosses").textContent = String(losses);
      document.getElementById("leagueWinRate").textContent = Math.round(wins / rows.length * 100) + "%";
      const dots = document.getElementById("leagueFormDots");
      dots.replaceChildren();
      rows.slice(0, 7).forEach((row, i) => {
        const won = row.classList.contains("win");
        const dot = document.createElement("span");
        dot.className = "league-form-dot " + (won ? "win" : "loss");
        dot.textContent = won ? "W" : "L";
        dot.title = (won ? "Vitória" : "Derrota") + " · partida " + (i + 1);
        dots.appendChild(dot);
      });
      panel.hidden = false;
    }
    new MutationObserver(update).observe(history, {childList:true, subtree:true, attributes:true, attributeFilter:["class"]});
    update();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, {once:true});
  else init();
})();