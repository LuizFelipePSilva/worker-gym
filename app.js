// ════════════════════════════════════════════
// STATE
// ════════════════════════════════════════════
let S = { days: [], sessions: [] };
let selDayId = null;
let curLog = null; // treino em andamento
let CH = {};

const LS_MAIN = "forja_v2";
const LS_CURLOG = "forja_curlog"; // ← NOVO: persiste o treino em andamento

function save() {
  localStorage.setItem(LS_MAIN, JSON.stringify(S));
}

function load() {
  try {
    const r = localStorage.getItem(LS_MAIN);
    if (r) S = JSON.parse(r);
  } catch (e) {}
}

// Persiste curLog separadamente a cada alteração
function saveCurLog() {
  if (curLog) {
    localStorage.setItem(LS_CURLOG, JSON.stringify(curLog));
  } else {
    localStorage.removeItem(LS_CURLOG);
  }
}

function loadCurLog() {
  try {
    const r = localStorage.getItem(LS_CURLOG);
    if (r) curLog = JSON.parse(r);
  } catch (e) {}
}

// ════════════════════════════════════════════
// NAV
// ════════════════════════════════════════════
const PAGES = ["planner", "log", "history", "charts"];

function go(name, btn, isMobile) {
  document
    .querySelectorAll(".page")
    .forEach((p) => p.classList.remove("active"));
  document
    .querySelectorAll(".bnav-btn")
    .forEach((b) => b.classList.remove("active"));
  document
    .querySelectorAll(".desktop-nav button")
    .forEach((b) => b.classList.remove("active"));
  document.getElementById("page-" + name).classList.add("active");
  const bi = document.getElementById("bn-" + name);
  if (bi) bi.classList.add("active");
  const idx = PAGES.indexOf(name);
  const di = document.querySelector(
    ".desktop-nav button:nth-child(" + (idx + 1) + ")",
  );
  if (di) di.classList.add("active");
  if (name === "log") initLog();
  if (name === "history") initHistory();
  if (name === "charts") initCharts();
}

// ════════════════════════════════════════════
// TOAST
// ════════════════════════════════════════════
function toast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2000);
}

// ════════════════════════════════════════════
// PLANNER
// ════════════════════════════════════════════
function addDay() {
  const inp = document.getElementById("new-day-input");
  const name = inp.value.trim().toUpperCase();
  if (!name) return;
  S.days.push({ id: uid(), name, exercises: [] });
  inp.value = "";
  save();
  renderDayChips();
}

function deleteCurDay() {
  if (!selDayId) return;
  if (!confirm("Deletar este dia?")) return;
  S.days = S.days.filter((d) => d.id !== selDayId);
  selDayId = null;
  save();
  renderDayChips();
  document.getElementById("planner-main").style.display = "none";
}

function selectDay(id) {
  selDayId = id;
  renderDayChips();
  renderExercises();
  const main = document.getElementById("planner-main");
  main.style.display = "block";
  const div = document.getElementById("planner-divider");
  if (div) div.style.display = window.innerWidth < 900 ? "block" : "none";
  document.getElementById("add-ex-drawer").classList.remove("open");
}

function toggleDrawer() {
  document.getElementById("add-ex-drawer").classList.toggle("open");
}

function addExercise() {
  const day = S.days.find((d) => d.id === selDayId);
  if (!day) return;
  const name = document.getElementById("ex-name").value.trim();
  if (!name) return;
  const sets = parseInt(document.getElementById("ex-sets").value) || 3;
  const reps = parseInt(document.getElementById("ex-reps").value) || 10;
  const muscle = document.getElementById("ex-muscle").value;
  day.exercises.push({ id: uid(), name, sets, reps, muscle });
  document.getElementById("ex-name").value = "";
  document.getElementById("ex-muscle").value = "";
  save();
  renderExercises();
  toast("✓ Adicionado");
}

function removeExercise(exId) {
  const day = S.days.find((d) => d.id === selDayId);
  if (!day) return;
  day.exercises = day.exercises.filter((e) => e.id !== exId);
  save();
  renderExercises();
}

function renderDayChips() {
  const el = document.getElementById("day-chips-list");
  if (!S.days.length) {
    el.innerHTML = "";
    return;
  }
  el.innerHTML = S.days
    .map(
      (d) => `
    <div class="day-chip ${d.id === selDayId ? "active" : ""}" onclick="selectDay('${d.id}')">
      ${d.name}<span class="chip-count">${d.exercises.length}</span>
    </div>
  `,
    )
    .join("");
}

function renderExercises() {
  const day = S.days.find((d) => d.id === selDayId);
  const el = document.getElementById("ex-list-body");
  const title = document.getElementById("sel-day-title");
  const placeholder = document.getElementById("planner-empty-state");
  if (placeholder) placeholder.style.display = "none";
  if (!day) return;
  title.textContent = day.name;
  if (!day.exercises.length) {
    el.innerHTML =
      '<div class="empty"><div class="empty-icon">🏋️</div><div class="empty-text">Nenhum exercício ainda</div></div>';
    return;
  }
  el.innerHTML = day.exercises
    .map(
      (e) => `
    <div class="ex-card" id="exc-${e.id}">
      <div class="ex-card-top">
        <div class="ex-card-name">${e.name}</div>
        <button class="btn-icon danger" onclick="removeExercise('${e.id}')">×</button>
      </div>
      <div class="ex-card-controls">
        <select class="field" style="flex:1;min-width:120px;padding:7px 30px 7px 10px;font-size:13px"
          onchange="updateExField('${e.id}','muscle',this.value)">
          <option value="">Músculo</option>
          ${[
            "Peito",
            "Costas",
            "Ombro",
            "Bíceps",
            "Tríceps",
            "Quadríceps",
            "Posterior",
            "Glúteo",
            "Panturrilha",
            "Abdômen",
          ]
            .map(
              (m) =>
                `<option value="${m}"${m === e.muscle ? " selected" : ""}>${m}</option>`,
            )
            .join("")}
        </select>
        <div>
          <div class="ex-spinner">
            <button onclick="spinEx('${e.id}','sets',-1)">−</button>
            <span class="spin-val" id="sv-sets-${e.id}">${e.sets}</span>
            <button onclick="spinEx('${e.id}','sets',1)">＋</button>
          </div>
          <div class="ex-spinner-label">séries</div>
        </div>
        <div>
          <div class="ex-spinner">
            <button onclick="spinEx('${e.id}','reps',-1)">−</button>
            <span class="spin-val" id="sv-reps-${e.id}">${e.reps}</span>
            <button onclick="spinEx('${e.id}','reps',1)">＋</button>
          </div>
          <div class="ex-spinner-label">reps</div>
        </div>
      </div>
    </div>
  `,
    )
    .join("");
}

function spinEx(exId, field, delta) {
  const day = S.days.find((d) => d.id === selDayId);
  if (!day) return;
  const ex = day.exercises.find((e) => e.id === exId);
  if (!ex) return;
  ex[field] = Math.max(1, (ex[field] || 1) + delta);
  document.getElementById(`sv-${field}-${exId}`).textContent = ex[field];
  save();
}

function updateExField(exId, field, val) {
  const day = S.days.find((d) => d.id === selDayId);
  if (!day) return;
  const ex = day.exercises.find((e) => e.id === exId);
  if (!ex) return;
  ex[field] = val;
  save();
}

// ════════════════════════════════════════════
// LOG  ← CORREÇÃO PRINCIPAL AQUI
// ════════════════════════════════════════════
function initLog() {
  const dp = document.getElementById("log-date");
  // Restaura data do curLog em andamento, senão usa hoje
  if (curLog && curLog.date) {
    dp.value = curLog.date;
  } else if (!dp.value) {
    dp.value = today();
  }

  // Atualiza data no curLog quando o picker muda
  dp.onchange = () => {
    if (curLog) {
      curLog.date = dp.value;
      saveCurLog();
    }
  };

  const sel = document.getElementById("log-day-sel");
  const prev = sel.value;
  sel.innerHTML =
    '<option value="">— Selecione o treino —</option>' +
    S.days.map((d) => `<option value="${d.id}">${d.name}</option>`).join("");

  // Restaura seleção do curLog em andamento
  if (curLog && curLog.dayId) {
    sel.value = curLog.dayId;
  } else if (prev) {
    sel.value = prev;
  }

  renderLog();
}

function loadLog() {
  const dayId = document.getElementById("log-day-sel").value;
  const day = S.days.find((d) => d.id === dayId);
  if (!day) {
    curLog = null;
    saveCurLog();
    renderLog();
    return;
  }

  // Se já existe um curLog para este mesmo dia, mantém — não sobrescreve
  if (curLog && curLog.dayId === dayId) {
    renderLog();
    return;
  }

  const date = document.getElementById("log-date").value || today();
  curLog = {
    dayId,
    dayName: day.name,
    date,
    exercises: day.exercises.map((e) => ({
      exId: e.id,
      name: e.name,
      plannedSets: e.sets,
      plannedReps: e.reps,
      sets: Array.from({ length: e.sets }, () => ({
        weight: "",
        reps: String(e.reps),
      })),
    })),
  };
  saveCurLog();
  renderLog();
}

function renderLog() {
  const el = document.getElementById("log-body");
  const bar = document.getElementById("save-bar");

  if (!curLog) {
    el.innerHTML =
      '<div class="empty"><div class="empty-icon">🔥</div><div class="empty-text">Selecione um dia<br>para começar</div></div>';
    bar.classList.remove("visible");
    return;
  }

  bar.classList.add("visible");

  // Banner indicando sessão em andamento
  const doneTotal = curLog.exercises.reduce(
    (acc, ex) =>
      acc + ex.sets.filter((s) => s.weight !== "" && s.reps !== "").length,
    0,
  );
  const totalSets = curLog.exercises.reduce(
    (acc, ex) => acc + ex.sets.length,
    0,
  );

  const banner =
    doneTotal > 0
      ? `<div class="log-resume-banner">
        <div>
          <div class="banner-text">🔄 Sessão em andamento</div>
          <div class="banner-sub">${doneTotal} de ${totalSets} séries preenchidas · ${curLog.dayName}</div>
        </div>
        <button class="btn-pill btn-danger-ghost" onclick="clearLog()" style="font-size:12px;padding:7px 14px">Limpar</button>
       </div>`
      : "";

  el.innerHTML =
    banner +
    curLog.exercises
      .map(
        (ex, ei) => `
    <div class="log-card">
      <div class="log-card-head">
        <div>
          <div class="log-card-title">${ex.name}</div>
          <div class="log-card-meta">${ex.plannedSets}× · ${ex.plannedReps} reps</div>
        </div>
        <div id="lcp-${ei}" style="font-family:'IBM Plex Mono',sans-serif;font-weight:800;font-size:22px;color:var(--muted)">
          ${ex.sets.filter((s) => s.weight !== "" && s.reps !== "").length}/${ex.sets.length}
        </div>
      </div>
      <div class="sets-labels">
        <div></div>
        <div style="text-align:center">PESO kg</div>
        <div style="text-align:center">REPS</div>
        <div></div>
      </div>
      <div class="sets-list" id="sets-${ei}">
        ${ex.sets.map((s, si) => setRowHTML(ei, si, s, ex.sets.length)).join("")}
      </div>
      <div class="add-set-row">
        <button class="btn-pill btn-ghost btn-full" style="font-size:13px;padding:10px" onclick="addSet(${ei})">＋ Série</button>
      </div>
    </div>
  `,
      )
      .join("");

  // Atualiza cores dos contadores
  curLog.exercises.forEach((ex, ei) => updateProgress(ei));
}

function setRowHTML(ei, si, s, total) {
  const done = s.weight !== "" && s.reps !== "";
  return `<div class="set-row">
    <div class="set-num-pill ${done ? "done" : ""}" id="sn-${ei}-${si}">${si + 1}</div>
    <input class="set-field" type="number" inputmode="decimal" placeholder="—"
      value="${s.weight}" min="0" step="0.5"
      oninput="upd(${ei},${si},'weight',this.value)" />
    <input class="set-field" type="number" inputmode="numeric" placeholder="—"
      value="${s.reps}" min="0"
      oninput="upd(${ei},${si},'reps',this.value)" />
    <button class="btn-icon danger" onclick="removeSet(${ei},${si})"
      ${total <= 1 ? 'style="opacity:.3;pointer-events:none"' : ""}>×</button>
  </div>`;
}

function upd(ei, si, field, val) {
  if (!curLog) return;
  curLog.exercises[ei].sets[si][field] =
    val === ""
      ? ""
      : field === "reps"
        ? parseInt(val) || ""
        : parseFloat(val) || "";

  const s = curLog.exercises[ei].sets[si];
  const done = s.weight !== "" && s.reps !== "";
  const pill = document.getElementById(`sn-${ei}-${si}`);
  if (pill) pill.className = "set-num-pill" + (done ? " done" : "");

  updateProgress(ei);
  saveCurLog(); // ← persiste a cada digitação
}

function updateProgress(ei) {
  if (!curLog) return;
  const ex = curLog.exercises[ei];
  const doneCount = ex.sets.filter(
    (x) => x.weight !== "" && x.reps !== "",
  ).length;
  const prog = document.getElementById(`lcp-${ei}`);
  if (prog) {
    prog.textContent = `${doneCount}/${ex.sets.length}`;
    prog.style.color =
      doneCount === ex.sets.length ? "var(--orange)" : "var(--muted)";
  }
}

function addSet(ei) {
  const ex = curLog.exercises[ei];
  const si = ex.sets.length;
  ex.sets.push({ weight: "", reps: String(ex.plannedReps) });
  const container = document.getElementById("sets-" + ei);
  const div = document.createElement("div");
  div.innerHTML = setRowHTML(ei, si, ex.sets[si], ex.sets.length);
  container.appendChild(div.firstElementChild);
  // desbloqueia todos os botões remover
  container.querySelectorAll(".btn-icon.danger").forEach((b) => {
    b.style.opacity = "1";
    b.style.pointerEvents = "auto";
  });
  updateProgress(ei);
  saveCurLog();
}

function removeSet(ei, si) {
  const ex = curLog.exercises[ei];
  if (ex.sets.length <= 1) return;
  ex.sets.splice(si, 1);
  const container = document.getElementById("sets-" + ei);
  container.innerHTML = ex.sets
    .map((s, i) => setRowHTML(ei, i, s, ex.sets.length))
    .join("");
  if (ex.sets.length <= 1) {
    container.querySelectorAll(".btn-icon.danger").forEach((b) => {
      b.style.opacity = "0.3";
      b.style.pointerEvents = "none";
    });
  }
  updateProgress(ei);
  saveCurLog();
}

function saveSession() {
  if (!curLog) return;
  const date = document.getElementById("log-date").value || today();
  const session = {
    id: uid(),
    date,
    dayId: curLog.dayId,
    dayName: curLog.dayName,
    exercises: curLog.exercises.map((ex) => ({
      exId: ex.exId,
      name: ex.name,
      sets: ex.sets.filter((s) => s.weight !== "" || s.reps !== ""),
    })),
  };
  // Remove sessão duplicada do mesmo dia+treino
  S.sessions = S.sessions.filter(
    (s) => !(s.date === date && s.dayId === curLog.dayId),
  );
  S.sessions.push(session);
  S.sessions.sort((a, b) => b.date.localeCompare(a.date));
  save();

  // Limpa o treino em andamento após salvar
  curLog = null;
  saveCurLog();
  document.getElementById("log-day-sel").value = "";
  renderLog();
  toast("✓ Sessão salva!");
}

function clearLog() {
  if (!confirm("Descartar o treino em andamento?")) return;
  curLog = null;
  saveCurLog();
  document.getElementById("log-day-sel").value = "";
  renderLog();
}

// ════════════════════════════════════════════
// HISTORY
// ════════════════════════════════════════════
function initHistory() {
  const sel = document.getElementById("hist-day-filter");
  sel.innerHTML =
    '<option value="">Todos</option>' +
    S.days.map((d) => `<option value="${d.id}">${d.name}</option>`).join("");
  renderHistory();
}

function renderHistory() {
  const q = document.getElementById("hist-search").value.toLowerCase();
  const df = document.getElementById("hist-day-filter").value;
  const sessions = S.sessions.filter((s) => {
    if (df && s.dayId !== df) return false;
    if (q && !s.exercises.some((e) => e.name.toLowerCase().includes(q)))
      return false;
    return true;
  });
  const el = document.getElementById("history-body");
  if (!sessions.length) {
    el.innerHTML =
      '<div class="empty"><div class="empty-icon">📭</div><div class="empty-text">Nenhuma sessão encontrada</div></div>';
    return;
  }
  el.innerHTML = sessions
    .map((s) => {
      const exs = s.exercises.filter(
        (e) => !q || e.name.toLowerCase().includes(q),
      );
      return `<div class="hist-session">
      <div class="hist-session-head">
        <div>
          <div class="hist-date">${fmtDate(s.date)}</div>
          <div class="hist-day-name">${s.dayName}</div>
        </div>
        <button class="btn-pill btn-danger-ghost" onclick="delSession('${s.id}')">Deletar</button>
      </div>
      <div class="hist-session-body">
        ${exs
          .map((ex) => {
            const pr = getPR(ex.name);
            const hasPR = ex.sets.some(
              (s) => parseFloat(s.weight) >= pr.max && pr.max > 0,
            );
            return `<div class="hist-ex">
            <div class="hist-ex-name">${ex.name}${hasPR ? '<span class="pr-badge">PR</span>' : ""}</div>
            <div class="set-pills">
              ${ex.sets.map((s) => `<div class="set-pill"><strong>${s.weight}kg</strong> × ${s.reps}</div>`).join("")}
            </div>
          </div>`;
          })
          .join("")}
      </div>
    </div>`;
    })
    .join("");
}

function delSession(id) {
  if (!confirm("Deletar sessão?")) return;
  S.sessions = S.sessions.filter((s) => s.id !== id);
  save();
  renderHistory();
}

// ════════════════════════════════════════════
// CHARTS
// ════════════════════════════════════════════
function initCharts() {
  const names = [
    ...new Set(S.sessions.flatMap((s) => s.exercises.map((e) => e.name))),
  ].sort();
  const sel = document.getElementById("chart-ex-sel");
  const prev = sel.value;
  sel.innerHTML =
    '<option value="">— Selecione exercício —</option>' +
    names.map((n) => `<option value="${n}">${n}</option>`).join("");
  if (prev) sel.value = prev;
  renderCharts();
}

function renderCharts() {
  const totalS = S.sessions.length;
  const totalSets = S.sessions.reduce(
    (a, s) => a + s.exercises.reduce((b, e) => b + e.sets.length, 0),
    0,
  );
  const exNames = [
    ...new Set(S.sessions.flatMap((s) => s.exercises.map((e) => e.name))),
  ];
  document.getElementById("stat-grid").innerHTML = `
    <div class="stat-tile"><div class="stat-num">${totalS}</div><div class="stat-lbl">Sessões</div></div>
    <div class="stat-tile"><div class="stat-num">${totalSets}</div><div class="stat-lbl">Séries</div></div>
    <div class="stat-tile"><div class="stat-num">${exNames.length}</div><div class="stat-lbl">Exercícios</div></div>
  `;
  const exName = document.getElementById("chart-ex-sel").value;
  const metric = document.getElementById("chart-metric").value;
  const el = document.getElementById("charts-body");
  if (!exName) {
    el.innerHTML =
      '<div class="empty"><div class="empty-icon">📊</div><div class="empty-text">Selecione um exercício<br>para ver a progressão</div></div>';
    return;
  }
  const pts = [];
  S.sessions.forEach((s) =>
    s.exercises.forEach((e) => {
      if (e.name !== exName) return;
      const ws = e.sets.map((x) => parseFloat(x.weight) || 0);
      const rs = e.sets.map((x) => parseInt(x.reps) || 0);
      const vol = e.sets.reduce(
        (a, x) => a + (parseFloat(x.weight) || 0) * (parseInt(x.reps) || 0),
        0,
      );
      const y =
        metric === "max"
          ? Math.max(...ws)
          : metric === "volume"
            ? vol
            : ws.reduce((a, b) => a + b, 0) / (ws.length || 1);
      pts.push({
        date: s.date,
        y: Math.round(y * 10) / 10,
        reps: rs.reduce((a, b) => a + b, 0),
      });
    }),
  );
  pts.sort((a, b) => a.date.localeCompare(b.date));
  const pr = getPR(exName);
  const labels = pts.map((p) => fmtShort(p.date));
  const data = pts.map((p) => p.y);
  const repsData = pts.map((p) => p.reps);
  const mLabel = {
    max: "Peso Máximo (kg)",
    volume: "Volume (kg×reps)",
    avg: "Peso Médio (kg)",
  }[metric];
  el.innerHTML = `
    <div class="stat-tile" style="margin-bottom:12px;display:flex;align-items:center;justify-content:space-between;padding:16px 20px;text-align:left">
      <div><div class="stat-lbl">PR — ${exName}</div><div class="stat-num">${pr.max}kg</div></div>
      ${pr.date ? `<div class="badge-green">${pr.date}</div>` : ""}
    </div>
    <div class="chart-card">
      <div class="chart-card-title">${mLabel}</div>
      <canvas id="c-main" height="90"></canvas>
    </div>
    <div class="chart-card">
      <div class="chart-card-title">Reps Totais</div>
      <canvas id="c-reps" height="70"></canvas>
    </div>
  `;
  Object.values(CH).forEach((c) => c.destroy());
  CH = {};
  const cOpts = () => ({
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#1c2330",
        borderColor: "rgba(255,255,255,0.08)",
        borderWidth: 1,
        titleColor: "#4f8ef7",
        bodyColor: "#e2e8f0",
        padding: 10,
        cornerRadius: 8,
        titleFont: { family: "IBM Plex Mono", size: 15, weight: "700" },
        bodyFont: { family: "JetBrains Mono", size: 12 },
      },
    },
    scales: {
      x: {
        ticks: {
          color: "rgba(240,230,211,0.3)",
          font: { family: "JetBrains Mono", size: 10 },
        },
        grid: { color: "rgba(255,255,255,0.04)" },
      },
      y: {
        ticks: {
          color: "rgba(240,230,211,0.3)",
          font: { family: "JetBrains Mono", size: 10 },
        },
        grid: { color: "rgba(255,255,255,0.04)" },
      },
    },
  });
  CH.main = new Chart(document.getElementById("c-main").getContext("2d"), {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          data,
          borderColor: "#4f8ef7",
          backgroundColor: "rgba(79,142,247,0.1)",
          pointBackgroundColor: "#4f8ef7",
          pointRadius: 5,
          pointHoverRadius: 8,
          tension: 0.35,
          fill: true,
        },
      ],
    },
    options: cOpts(),
  });
  CH.reps = new Chart(document.getElementById("c-reps").getContext("2d"), {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          data: repsData,
          backgroundColor: "rgba(240,230,211,0.1)",
          borderColor: "rgba(240,230,211,0.25)",
          borderWidth: 1,
          borderRadius: 4,
        },
      ],
    },
    options: cOpts(),
  });
}

// ════════════════════════════════════════════
// UTILS
// ════════════════════════════════════════════
function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
function today() {
  return new Date().toISOString().slice(0, 10);
}
function fmtDate(str) {
  if (!str) return "";
  const [y, m, d] = str.split("-");
  return `${d} ${["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"][parseInt(m) - 1]} ${y}`;
}
function fmtShort(str) {
  if (!str) return "";
  const [y, m, d] = str.split("-");
  return `${d}/${m}`;
}
function getPR(exName) {
  let max = 0,
    date = "";
  S.sessions.forEach((s) =>
    s.exercises.forEach((e) => {
      if (e.name !== exName) return;
      e.sets.forEach((set) => {
        const w = parseFloat(set.weight) || 0;
        if (w > max) {
          max = w;
          date = s.date;
        }
      });
    }),
  );
  return { max, date: date ? fmtShort(date) : "" };
}

// ════════════════════════════════════════════
// EXERCISE LIBRARY
// ════════════════════════════════════════════
const MUSCLES = [
  "Peito",
  "Costas",
  "Ombro",
  "Bíceps",
  "Tríceps",
  "Quadríceps",
  "Posterior",
  "Glúteo",
  "Panturrilha",
  "Abdômen",
];

const LIBRARY = [
  // Peito
  { name: "Supino Reto Barra", muscle: "Peito" },
  { name: "Supino Inclinado Barra", muscle: "Peito" },
  { name: "Supino Declinado Barra", muscle: "Peito" },
  { name: "Supino Reto Halteres", muscle: "Peito" },
  { name: "Supino Inclinado Halteres", muscle: "Peito" },
  { name: "Supino Inclinado Máquina", muscle: "Peito" },
  { name: "Supino Reto Máquina", muscle: "Peito" },
  { name: "Peck Deck", muscle: "Peito" },
  { name: "Voador Halteres", muscle: "Peito" },
  { name: "Voador Inclinado Halteres", muscle: "Peito" },
  { name: "Crossover Polia Alta", muscle: "Peito" },
  { name: "Crossover Polia Baixa", muscle: "Peito" },
  { name: "Flexão de Braço", muscle: "Peito" },
  { name: "Pullover Halter", muscle: "Peito" },
  { name: "Pullover Máquina", muscle: "Peito" },
  { name: "Supino 45° Smith", muscle: "Peito" },
  // Costas
  { name: "Remada Curvada Barra", muscle: "Costas" },
  { name: "Remada Curvada Halteres", muscle: "Costas" },
  { name: "Remada Máquina Pegada Pronada", muscle: "Costas" },
  { name: "Remada Máquina Pegada Supinada", muscle: "Costas" },
  { name: "Remada Unilateral Halter", muscle: "Costas" },
  { name: "Remada Cavalinho", muscle: "Costas" },
  { name: "Remada Baixa Polia", muscle: "Costas" },
  { name: "Puxada Alta Polia", muscle: "Costas" },
  { name: "Puxada Aberta Pronada", muscle: "Costas" },
  { name: "Puxada Fechada Supinada", muscle: "Costas" },
  { name: "Puxada Neutra", muscle: "Costas" },
  { name: "Pulldown Reto", muscle: "Costas" },
  { name: "Barra Fixa", muscle: "Costas" },
  { name: "Barra Fixa Supinada", muscle: "Costas" },
  { name: "Levantamento Terra", muscle: "Costas" },
  { name: "Hiperextensão", muscle: "Costas" },
  { name: "Puxada Baixa Máquina", muscle: "Costas" },
  // Ombro
  { name: "Desenvolvimento Barra", muscle: "Ombro" },
  { name: "Desenvolvimento Halteres", muscle: "Ombro" },
  { name: "Desenvolvimento Arnold", muscle: "Ombro" },
  { name: "Desenvolvimento Máquina", muscle: "Ombro" },
  { name: "Elevação Lateral Halteres", muscle: "Ombro" },
  { name: "Elevação Lateral Polia", muscle: "Ombro" },
  { name: "Elevação Lateral Máquina", muscle: "Ombro" },
  { name: "Elevação Frontal Barra", muscle: "Ombro" },
  { name: "Elevação Frontal Halteres", muscle: "Ombro" },
  { name: "Posterior de Ombro Máquina", muscle: "Ombro" },
  { name: "Posterior de Ombro Halteres", muscle: "Ombro" },
  { name: "Posterior de Ombro Polia", muscle: "Ombro" },
  { name: "Face Pull Polia", muscle: "Ombro" },
  { name: "Encolhimento Barra", muscle: "Ombro" },
  { name: "Encolhimento Halteres", muscle: "Ombro" },
  { name: "Encolhimento Máquina", muscle: "Ombro" },
  { name: "Upright Row Barra", muscle: "Ombro" },
  { name: "Upright Row Halteres", muscle: "Ombro" },
  // Bíceps
  { name: "Rosca Direta Barra", muscle: "Bíceps" },
  { name: "Rosca Direta Halteres", muscle: "Bíceps" },
  { name: "Rosca Barra W (EZ)", muscle: "Bíceps" },
  { name: "Rosca Alternada Halteres", muscle: "Bíceps" },
  { name: "Rosca Concentrada", muscle: "Bíceps" },
  { name: "Rosca Scott Barra", muscle: "Bíceps" },
  { name: "Rosca Scott Halteres", muscle: "Bíceps" },
  { name: "Rosca Martelo", muscle: "Bíceps" },
  { name: "Rosca Atrás do Tronco Polia", muscle: "Bíceps" },
  { name: "Rosca Polia Baixa", muscle: "Bíceps" },
  { name: "Rosca 21s", muscle: "Bíceps" },
  { name: "Rosca Inclinada Halteres", muscle: "Bíceps" },
  { name: "Rosca Inversa Barra", muscle: "Bíceps" },
  // Tríceps
  { name: "Tríceps Barra Polia Alta", muscle: "Tríceps" },
  { name: "Tríceps Corda Polia", muscle: "Tríceps" },
  { name: "Tríceps Atrás da Cabeça Polia", muscle: "Tríceps" },
  { name: "Tríceps Atrás da Cabeça Halter", muscle: "Tríceps" },
  { name: "Tríceps Paralelas", muscle: "Tríceps" },
  { name: "Tríceps Banco", muscle: "Tríceps" },
  { name: "Tríceps Francês Barra", muscle: "Tríceps" },
  { name: "Tríceps Francês Halteres", muscle: "Tríceps" },
  { name: "Tríceps Unilateral Polia", muscle: "Tríceps" },
  { name: "Tríceps Testa Barra", muscle: "Tríceps" },
  { name: "Tríceps Máquina", muscle: "Tríceps" },
  { name: "Tríceps Kickback Halter", muscle: "Tríceps" },
  { name: "Tríceps Mergulho", muscle: "Tríceps" },
  // Quadríceps
  { name: "Agachamento Livre", muscle: "Quadríceps" },
  { name: "Agachamento Smith", muscle: "Quadríceps" },
  { name: "Hack Machine", muscle: "Quadríceps" },
  { name: "Leg Press 45°", muscle: "Quadríceps" },
  { name: "Leg Press Horizontal", muscle: "Quadríceps" },
  { name: "Extensora", muscle: "Quadríceps" },
  { name: "Cadeira Extensora Unilateral", muscle: "Quadríceps" },
  { name: "Afundo Halteres", muscle: "Quadríceps" },
  { name: "Afundo Barra", muscle: "Quadríceps" },
  { name: "Passada Halteres", muscle: "Quadríceps" },
  { name: "Agachamento Sumô", muscle: "Quadríceps" },
  { name: "Agachamento Búlgaro", muscle: "Quadríceps" },
  { name: "Agachamento Goblet", muscle: "Quadríceps" },
  // Posterior
  { name: "Mesa Flexora", muscle: "Posterior" },
  { name: "Mesa Flexora Unilateral", muscle: "Posterior" },
  { name: "Stiff Barra", muscle: "Posterior" },
  { name: "Stiff Halteres", muscle: "Posterior" },
  { name: "Stiff Unilateral", muscle: "Posterior" },
  { name: "Levantamento Terra Romeno", muscle: "Posterior" },
  { name: "Flexora em Pé", muscle: "Posterior" },
  { name: "Good Morning", muscle: "Posterior" },
  { name: "Curl Nórdico", muscle: "Posterior" },
  { name: "Glute Ham Raise", muscle: "Posterior" },
  // Glúteo
  { name: "Hip Thrust Barra", muscle: "Glúteo" },
  { name: "Hip Thrust Máquina", muscle: "Glúteo" },
  { name: "Elevação Pélvica", muscle: "Glúteo" },
  { name: "Glúteo no Cabo", muscle: "Glúteo" },
  { name: "Kickback Máquina", muscle: "Glúteo" },
  { name: "Abdução de Quadril Máquina", muscle: "Glúteo" },
  { name: "Step Up Halteres", muscle: "Glúteo" },
  { name: "Donkey Kick", muscle: "Glúteo" },
  { name: "Fire Hydrant", muscle: "Glúteo" },
  { name: "Clamshell com Elástico", muscle: "Glúteo" },
  // Panturrilha
  { name: "Panturrilha em Pé Máquina", muscle: "Panturrilha" },
  { name: "Panturrilha Sentado Máquina", muscle: "Panturrilha" },
  { name: "Panturrilha no Leg Press", muscle: "Panturrilha" },
  { name: "Panturrilha Unilateral Livre", muscle: "Panturrilha" },
  { name: "Panturrilha Burro", muscle: "Panturrilha" },
  { name: "Panturrilha Smith", muscle: "Panturrilha" },
  { name: "Tibial Anterior", muscle: "Panturrilha" },
  // Abdômen
  { name: "Abdominal Supra", muscle: "Abdômen" },
  { name: "Abdominal Infra", muscle: "Abdômen" },
  { name: "Abdominal Máquina", muscle: "Abdômen" },
  { name: "Abdominal Cabo", muscle: "Abdômen" },
  { name: "Crunch Bicicleta", muscle: "Abdômen" },
  { name: "Prancha", muscle: "Abdômen" },
  { name: "Prancha Lateral", muscle: "Abdômen" },
  { name: "Russian Twist", muscle: "Abdômen" },
  { name: "Elevação de Pernas", muscle: "Abdômen" },
  { name: "Elevação de Joelhos", muscle: "Abdômen" },
  { name: "Dead Bug", muscle: "Abdômen" },
  { name: "Rollout Roda", muscle: "Abdômen" },
  { name: "Dragão Bandeira", muscle: "Abdômen" },
  { name: "Vacuum", muscle: "Abdômen" },
];

let libMuscleFilter = "Todos";
const libPending = {};

function openLibrary() {
  document.getElementById("lib-overlay").style.display = "block";
  document.getElementById("lib-search").value = "";
  libMuscleFilter = "Todos";
  renderMuscleChips();
  filterLibrary();
  setTimeout(() => document.getElementById("lib-search").focus(), 200);
}

function closeLibrary() {
  document.getElementById("lib-overlay").style.display = "none";
}

function renderMuscleChips() {
  const el = document.getElementById("muscle-filter-chips");
  const all = ["Todos", ...MUSCLES];
  el.innerHTML = all
    .map(
      (m) => `
    <div onclick="setMuscleFilter('${m}')" style="
      flex-shrink:0; padding:7px 16px; border-radius:100px;
      border:1.5px solid ${m === libMuscleFilter ? "var(--orange)" : "var(--border)"};
      background:${m === libMuscleFilter ? "var(--orange-dim)" : "transparent"};
      color:${m === libMuscleFilter ? "var(--orange)" : "var(--muted)"};
      font-family:'IBM Plex Mono',sans-serif; font-weight:700;
      font-size:14px; letter-spacing:1px; cursor:pointer;
      transition:all 0.15s; white-space:nowrap;
    ">${m}</div>
  `,
    )
    .join("");
}

function setMuscleFilter(m) {
  libMuscleFilter = m;
  renderMuscleChips();
  filterLibrary();
}

function filterLibrary() {
  const q = document.getElementById("lib-search").value.toLowerCase().trim();
  const el = document.getElementById("lib-list");
  let items = LIBRARY;
  if (libMuscleFilter !== "Todos")
    items = items.filter((e) => e.muscle === libMuscleFilter);
  if (q)
    items = items.filter(
      (e) =>
        e.name.toLowerCase().includes(q) || e.muscle.toLowerCase().includes(q),
    );
  if (!items.length) {
    el.innerHTML =
      '<div style="text-align:center;padding:32px;color:var(--muted);font-size:11px;letter-spacing:2px;text-transform:uppercase">Nenhum resultado</div>';
    return;
  }
  const groups = {};
  items.forEach((e) => {
    if (!groups[e.muscle]) groups[e.muscle] = [];
    groups[e.muscle].push(e);
  });
  el.innerHTML = Object.entries(groups)
    .map(
      ([muscle, exs]) => `
    <div style="margin-bottom:4px">
      <div style="font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--muted);padding:12px 0 6px">${muscle}</div>
      ${exs
        .map((e) => {
          const key = e.name;
          const p = libPending[key] || { sets: 3, reps: 10 };
          return `
        <div style="background:var(--card);border:1px solid var(--border);border-radius:14px;margin-bottom:8px;overflow:hidden">
          <div style="display:flex;align-items:center;justify-content:space-between;padding:13px 14px 10px">
            <span style="font-family:'IBM Plex Mono',sans-serif;font-weight:700;font-size:17px;flex:1">${e.name}</span>
            <button onclick="pickLibExercise('${e.name.replace(/'/g, "\\'")}','${e.muscle}')"
              style="background:var(--orange);border:none;color:#fff;border-radius:100px;padding:8px 18px;
                font-family:'IBM Plex Mono',sans-serif;font-weight:700;font-size:14px;letter-spacing:1px;cursor:pointer;
                box-shadow:0 2px 12px var(--orange-glow);flex-shrink:0">
              ADD ＋
            </button>
          </div>
          <div style="display:flex;gap:16px;padding:0 14px 12px;align-items:center">
            <div style="display:flex;align-items:center;gap:6px">
              <span style="font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--muted)">Séries</span>
              <div style="display:flex;align-items:center;background:var(--bg2);border:1.5px solid var(--border);border-radius:8px;overflow:hidden">
                <button onclick="libSpin('${key}','sets',-1)" style="background:none;border:none;color:var(--cream-dim);width:30px;height:30px;font-size:16px;cursor:pointer">−</button>
                <span id="lps-${key.replace(/ /g, "_")}" style="font-family:'IBM Plex Mono',sans-serif;font-weight:700;font-size:16px;color:var(--cream);min-width:22px;text-align:center">${p.sets}</span>
                <button onclick="libSpin('${key}','sets',1)" style="background:none;border:none;color:var(--cream-dim);width:30px;height:30px;font-size:16px;cursor:pointer">＋</button>
              </div>
            </div>
            <div style="display:flex;align-items:center;gap:6px">
              <span style="font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--muted)">Reps</span>
              <div style="display:flex;align-items:center;background:var(--bg2);border:1.5px solid var(--border);border-radius:8px;overflow:hidden">
                <button onclick="libSpin('${key}','reps',-1)" style="background:none;border:none;color:var(--cream-dim);width:30px;height:30px;font-size:16px;cursor:pointer">−</button>
                <span id="lpr-${key.replace(/ /g, "_")}" style="font-family:'IBM Plex Mono',sans-serif;font-weight:700;font-size:16px;color:var(--cream);min-width:22px;text-align:center">${p.reps}</span>
                <button onclick="libSpin('${key}','reps',1)" style="background:none;border:none;color:var(--cream-dim);width:30px;height:30px;font-size:16px;cursor:pointer">＋</button>
              </div>
            </div>
          </div>
        </div>`;
        })
        .join("")}
    </div>
  `,
    )
    .join("");
}

function libSpin(key, field, delta) {
  if (!libPending[key]) libPending[key] = { sets: 3, reps: 10 };
  libPending[key][field] = Math.max(1, (libPending[key][field] || 1) + delta);
  const safeKey = key.replace(/ /g, "_");
  const el = document.getElementById(
    field === "sets" ? `lps-${safeKey}` : `lpr-${safeKey}`,
  );
  if (el) el.textContent = libPending[key][field];
}

function pickLibExercise(name, muscle) {
  const day = S.days.find((d) => d.id === selDayId);
  if (!day) return;
  const p = libPending[name] || { sets: 3, reps: 10 };
  day.exercises.push({ id: uid(), name, sets: p.sets, reps: p.reps, muscle });
  save();
  renderExercises();
  toast(`✓ ${name}`);
}

// ════════════════════════════════════════════
// BOOT
// ════════════════════════════════════════════
load();
loadCurLog(); // ← restaura treino em andamento
renderDayChips();
document.getElementById("log-date").value = today();

// Se houver curLog persistido, mostra o ícone de treino em andamento no nav
if (curLog) {
  const btn = document.getElementById("bn-log");
  if (btn) btn.querySelector(".icon").textContent = "🔄";
}
