(function () {
  const tbody = document.getElementById("records-body");
  const emptyState = document.getElementById("empty-state");
  const searchInput = document.getElementById("search-input");
  const riskFilter = document.getElementById("risk-filter");
  const modalBackdrop = document.getElementById("modal-backdrop");
  const modalTitle = document.getElementById("modal-title");
  const modalSub = document.getElementById("modal-sub");
  const modalBody = document.getElementById("modal-body");
  const modalDelete = document.getElementById("modal-delete");

  let activeId = null;
  let debounceTimer = null;

  function fmtDate(iso) {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" }) +
      " · " + d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  }

  async function loadRecords() {
    const params = new URLSearchParams();
    if (searchInput.value.trim()) params.set("search", searchInput.value.trim());
    if (riskFilter.value !== "All") params.set("risk", riskFilter.value);

    const res = await fetch("/api/screenings?" + params.toString());
    const rows = await res.json();

    tbody.innerHTML = "";
    emptyState.style.display = rows.length ? "none" : "block";

    rows.forEach((r) => {
      const tr = document.createElement("tr");
      tr.className = "record-row";
      tr.addEventListener("click", () => openModal(r.id));
      tr.innerHTML = `
        <td><strong>${r.patient_name}</strong></td>
        <td class="cell-mono">${r.age} / ${r.sex}</td>
        <td>${r.facility || "—"}</td>
        <td class="cell-mono">${fmtDate(r.created_at)}</td>
        <td><span class="risk-chip risk-${r.risk_category}"><span class="risk-dot risk-${r.risk_category}"></span>${r.risk_category}</span></td>
        <td class="cell-mono">${Math.round(r.confidence * 100)}%</td>
      `;
      tbody.appendChild(tr);
    });
  }

  async function openModal(id) {
    activeId = id;
    const res = await fetch(`/api/screenings/${id}`);
    const r = await res.json();

    modalTitle.textContent = r.patient_name;
    modalSub.textContent = `${r.age} yrs · ${r.sex} · ${r.facility || "No facility recorded"} · ${fmtDate(r.created_at)}`;

    const affectedSideMap = { 0: "None", 1: "Left", 2: "Right", 3: "Both" };
    const stiffnessMap = { 0: "None", 1: "Mild", 2: "Moderate", 3: "Severe" };

    modalBody.innerHTML = `
      <div class="risk-chip risk-${r.risk_category}" style="font-size:13px; padding:6px 12px;">
        <span class="risk-dot risk-${r.risk_category}"></span>${r.risk_category} risk · ${Math.round(r.confidence * 100)}% confidence
      </div>
      <div class="detail-grid">
        <div class="detail-item"><span>BMI</span><span>${r.bmi}</span></div>
        <div class="detail-item"><span>Occupation</span><span>${r.occupation_intensity}</span></div>
        <div class="detail-item"><span>Pain score</span><span>${r.pain_score}/10</span></div>
        <div class="detail-item"><span>Stiffness</span><span>${stiffnessMap[r.stiffness]}</span></div>
        <div class="detail-item"><span>Knee ROM</span><span>${r.knee_rom}°</span></div>
        <div class="detail-item"><span>Walking speed</span><span>${r.walking_speed} m/s</span></div>
        <div class="detail-item"><span>Gait asymmetry</span><span>${r.gait_asymmetry}</span></div>
        <div class="detail-item"><span>Mobility score</span><span>${r.mobility_score}/100</span></div>
        <div class="detail-item"><span>Affected side</span><span>${affectedSideMap[r.affected_side]}</span></div>
        <div class="detail-item"><span>Family history</span><span>${r.family_history ? "Yes" : "No"}</span></div>
        <div class="detail-item"><span>Previous injury</span><span>${r.previous_injury ? "Yes" : "No"}</span></div>
        <div class="detail-item"><span>Symptom duration</span><span>${r.symptom_duration_months} mo</span></div>
        <div class="detail-item"><span>Crepitus</span><span>${r.crepitus ? "Yes" : "No"}</span></div>
        <div class="detail-item"><span>Swelling</span><span>${r.swelling ? "Yes" : "No"}</span></div>
        <div class="detail-item"><span>Screened by</span><span>${r.worker_name || "—"}</span></div>
      </div>
      <div style="margin-top:18px; padding-top:16px; border-top:1px solid var(--border);">
        <p class="section-label">Guidance given</p>
        <ul class="guidance-list">${(r.guidance.advice || []).map((a) => `<li>${a}</li>`).join("")}</ul>
      </div>
    `;
    modalBackdrop.classList.add("is-open");
  }

  function closeModal() {
    modalBackdrop.classList.remove("is-open");
    activeId = null;
  }

  document.getElementById("modal-close").addEventListener("click", closeModal);
  modalBackdrop.addEventListener("click", (e) => { if (e.target === modalBackdrop) closeModal(); });

  modalDelete.addEventListener("click", async () => {
    if (activeId == null) return;
    if (!confirm("Delete this screening record? This cannot be undone.")) return;
    await fetch(`/api/screenings/${activeId}`, { method: "DELETE" });
    closeModal();
    loadRecords();
  });

  searchInput.addEventListener("input", () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(loadRecords, 250);
  });
  riskFilter.addEventListener("change", loadRecords);

  loadRecords();
})();
