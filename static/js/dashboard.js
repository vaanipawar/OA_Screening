(function () {
  const RISK_COLORS = {
    Normal: "#3E8E5D",
    Mild: "#B99A1E",
    Moderate: "#C8781F",
    Severe: "#AA3A32",
  };
  const RISK_ORDER = ["Normal", "Mild", "Moderate", "Severe"];
  const INK_SOFT = "#5B6259";
  const GRID_COLOR = "#E7E3D3";

  Chart.defaults.font.family = "'Work Sans', sans-serif";
  Chart.defaults.color = INK_SOFT;

  async function loadDashboard() {
    const res = await fetch("/api/dashboard");
    const data = await res.json();

    renderStatCards(data);
    renderRiskChart(data.by_risk);
    renderTrendChart(data.by_day);
    renderOccupationChart(data.by_occupation);
    renderRecent(data.recent);
  }

  function renderStatCards(data) {
    document.getElementById("stat-total").textContent = data.total || 0;
    const highRisk = (data.by_risk.Moderate || 0) + (data.by_risk.Severe || 0);
    document.getElementById("stat-highrisk").textContent = highRisk;
    const avg = data.averages || {};
    document.getElementById("stat-pain").textContent =
      avg.avg_pain != null ? avg.avg_pain.toFixed(1) : "—";
    document.getElementById("stat-mobility").textContent =
      avg.avg_mobility != null ? Math.round(avg.avg_mobility) : "—";
  }

  function renderRiskChart(byRisk) {
    const labels = RISK_ORDER.filter((r) => byRisk[r]);
    const values = labels.map((r) => byRisk[r]);
    const colors = labels.map((r) => RISK_COLORS[r]);

    if (!labels.length) {
      document.getElementById("risk-legend").innerHTML =
        '<p class="muted" style="font-size:13px;">No screenings recorded yet.</p>';
      return;
    }

    new Chart(document.getElementById("chart-risk"), {
      type: "doughnut",
      data: { labels, datasets: [{ data: values, backgroundColor: colors, borderWidth: 0 }] },
      options: {
        cutout: "68%",
        plugins: { legend: { display: false } },
      },
    });

    const total = values.reduce((a, b) => a + b, 0);
    document.getElementById("risk-legend").innerHTML = labels.map((r, i) => `
      <div class="legend-row">
        <div class="legend-key">
          <span class="legend-swatch" style="background:${colors[i]}"></span> ${r}
        </div>
        <span class="cell-mono">${values[i]} (${Math.round((values[i] / total) * 100)}%)</span>
      </div>
    `).join("");
  }

  function renderTrendChart(byDay) {
    const labels = byDay.map((d) => d.day.slice(5)); // MM-DD
    const values = byDay.map((d) => d.count);

    new Chart(document.getElementById("chart-trend"), {
      type: "line",
      data: {
        labels,
        datasets: [{
          data: values,
          borderColor: "#16443A",
          backgroundColor: "rgba(22,68,58,0.08)",
          fill: true,
          tension: 0.35,
          pointRadius: 3,
          pointBackgroundColor: "#16443A",
        }],
      },
      options: {
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, ticks: { precision: 0 }, grid: { color: GRID_COLOR } },
          x: { grid: { display: false } },
        },
      },
    });
  }

  function renderOccupationChart(byOccupation) {
    const labels = Object.keys(byOccupation);
    const values = Object.values(byOccupation);

    new Chart(document.getElementById("chart-occupation"), {
      type: "bar",
      data: {
        labels,
        datasets: [{
          data: values,
          backgroundColor: "#B8862B",
          borderRadius: 4,
          maxBarThickness: 46,
        }],
      },
      options: {
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, ticks: { precision: 0 }, grid: { color: GRID_COLOR } },
          x: { grid: { display: false } },
        },
      },
    });
  }

  function renderRecent(recent) {
    const list = document.getElementById("recent-list");
    if (!recent.length) {
      list.innerHTML = '<p class="muted" style="font-size:13px;">No screenings yet — run one from "New Screening".</p>';
      return;
    }
    list.innerHTML = recent.map((r) => `
      <div class="recent-row">
        <div>
          <div class="recent-name">${r.patient_name}</div>
          <div class="recent-meta">${r.facility || "No facility"}</div>
        </div>
        <span class="risk-chip risk-${r.risk_category}"><span class="risk-dot risk-${r.risk_category}"></span>${r.risk_category}</span>
      </div>
    `).join("");
  }

  loadDashboard();
})();
