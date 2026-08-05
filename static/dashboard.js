"use strict";

const api = {
  summary: "/api/game/dashboard/summary",
  recent: "/api/game/dashboard/recent-runs?limit=20",
  leaderboard: "/api/game/leaderboard?limit=10",
};

const byId = (id) => document.getElementById(id);

function formatNumber(value, digits = 0) {
  return Number(value || 0).toLocaleString(undefined, {
    maximumFractionDigits: digits,
  });
}

function formatDuration(seconds) {
  const total = Math.max(0, Math.floor(Number(seconds || 0)));
  const minutes = Math.floor(total / 60);
  const remainder = total % 60;

  return `${minutes}:${String(remainder).padStart(2, "0")}`;
}

async function requestData(url) {
  const response = await fetch(url, {
    cache: "no-store",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  const payload = await response.json();

  if (payload.status !== "ok") {
    throw new Error("Unexpected API response");
  }

  return payload.data;
}

function renderSummary(summary) {
  byId("totalRuns").textContent =
    formatNumber(summary.total_runs);

  byId("completionRate").textContent =
    `${formatNumber(summary.completion_rate * 100, 1)}%`;

  byId("highestScore").textContent =
    formatNumber(summary.highest_score, 2);

  byId("averageFloor").textContent =
    formatNumber(summary.average_floor, 1);

  byId("deepestFloor").textContent =
    formatNumber(summary.deepest_floor);

  byId("oracleMutations").textContent =
    formatNumber(summary.oracle_mutations);
}

function renderRecentRuns(runs) {
  const table = byId("recentRunsTable");
  const body = byId("recentRunsBody");
  const cards = byId("recentRunCards");
  const empty = byId("emptyState");

  body.replaceChildren();
  cards.replaceChildren();

  const hasRuns = Array.isArray(runs) && runs.length > 0;

  table.hidden = !hasRuns;
  cards.hidden = !hasRuns;
  empty.hidden = hasRuns;

  for (const run of runs || []) {
    const row = document.createElement("tr");

    const values = [
      run.display_name || "Unknown Wanderer",
      formatNumber(run.score, 2),
      formatNumber(run.floor_reached),
      run.outcome || "unknown",
      formatDuration(run.survival_time),
      run.device_type || "unknown",
      formatNumber(run.oracle_mutations),
    ];

    values.forEach((value, index) => {
      const cell = document.createElement("td");
      cell.textContent = value;

      if (index === 3) {
        cell.className = `outcome-${run.outcome || "unknown"}`;
      }

      row.appendChild(cell);
    });

    body.appendChild(row);

    const card = document.createElement("article");
    const title = document.createElement("strong");
    const details = document.createElement("p");

    card.className = "run-card";
    title.textContent =
      run.display_name || "Unknown Wanderer";

    details.textContent =
      `Score ${formatNumber(run.score, 2)} | ` +
      `Floor ${formatNumber(run.floor_reached)} | ` +
      `${run.outcome || "unknown"} | ` +
      `${formatDuration(run.survival_time)}`;

    card.append(title, details);
    cards.appendChild(card);
  }
}

function renderLeaderboard(runs) {
  const list = byId("leaderboard");
  list.replaceChildren();

  if (!Array.isArray(runs) || runs.length === 0) {
    const item = document.createElement("li");
    item.textContent = "No leaderboard entries recorded.";
    list.appendChild(item);
    return;
  }

  runs.forEach((run, index) => {
    const item = document.createElement("li");
    const player = document.createElement("span");
    const score = document.createElement("strong");

    player.textContent =
      `${index + 1}. ${run.display_name || "Unknown Wanderer"}`;

    score.textContent = formatNumber(run.score, 2);

    item.append(player, score);
    list.appendChild(item);
  });
}

async function refreshDashboard() {
  const status = byId("status");
  const refreshButton = byId("refreshButton");

  refreshButton.disabled = true;
  status.className = "status";
  status.textContent = "Refreshing Oracle telemetry...";

  try {
    const [summary, recent, leaderboard] =
      await Promise.all([
        requestData(api.summary),
        requestData(api.recent),
        requestData(api.leaderboard),
      ]);

    renderSummary(summary);
    renderRecentRuns(recent);
    renderLeaderboard(leaderboard);

    status.textContent = "ORACLE ONLINE";

    byId("lastUpdated").textContent =
      `Updated ${new Date().toLocaleTimeString()}`;
  } catch (error) {
    console.error("Dashboard refresh failed:", error);
    status.className = "status status-error";
    status.textContent = "Dashboard connection failed";
  } finally {
    refreshButton.disabled = false;
  }
}

byId("refreshButton").addEventListener(
  "click",
  refreshDashboard
);

document.addEventListener("visibilitychange", () => {
  if (!document.hidden) {
    refreshDashboard();
  }
});

refreshDashboard();

window.setInterval(() => {
  if (!document.hidden) {
    refreshDashboard();
  }
}, 15000);

function renderRunContextBanner() {
  const params = new URLSearchParams(
    window.location.search
  );

  const score = params.get("score");
  const survival = params.get("survival");
  const floor = params.get("floor");
  const outcome = params.get("outcome");

  if (
    !score &&
    !survival &&
    !floor &&
    !outcome
  ) {
    return;
  }

  if (
    document.getElementById("runContextBanner")
  ) {
    return;
  }

  const banner =
    document.createElement("section");

  banner.id = "runContextBanner";
  banner.className = "run-context-banner";

  banner.innerHTML = `
    <h2>Latest Run Summary</h2>
    <p>
      Outcome: <strong>${outcome || "—"}</strong>
      • Score: <strong>${score || "—"}</strong>
      • Survival: <strong>${survival || "—"}s</strong>
      • Floor: <strong>${floor || "—"}</strong>
    </p>
  `;

  document.body.prepend(banner);
}

renderRunContextBanner();
