const placeSelect = document.getElementById("placeSelect");
const coordsFields = document.getElementById("coordsFields");
const latInput = document.getElementById("latInput");
const lonInput = document.getElementById("lonInput");
const customDateInput = document.getElementById("customDateInput");
const autoGround = document.getElementById("autoGround");
const tdInput = document.getElementById("tdInput");
const tInput = document.getElementById("tInput");
const generateBtn = document.getElementById("generateBtn");
const clearBtn = document.getElementById("clearBtn");
const output = document.getElementById("output");
const formError = document.getElementById("formError");
const engineStatus = document.getElementById("engineStatus");

let selectedDate = "hoy";
let engineReady = false;
let busy = false;
let requestId = 0;
const pending = new Map();

const worker = new Worker("worker.mjs", { type: "module" });

worker.addEventListener("message", (event) => {
  const msg = event.data || {};

  if (msg.type === "status") {
    engineStatus.textContent = msg.message;
    return;
  }

  if (msg.type === "ready") {
    engineReady = true;
    engineStatus.textContent = "Motor listo";
    engineStatus.classList.remove("loading", "error");
    engineStatus.classList.add("ready");
    output.textContent = "Elegí lugar, fecha y uno o varios horarios.";
    updateGenerateState();
    return;
  }

  if (msg.type === "fatal") {
    engineStatus.textContent = "Error de carga";
    engineStatus.classList.remove("loading", "ready");
    engineStatus.classList.add("error");
    output.textContent = `No se pudo iniciar el motor Python.\n\n${msg.error || "Error desconocido"}`;
    return;
  }

  if (typeof msg.id === "number" && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    if (msg.error) reject(new Error(msg.error));
    else resolve(msg.result ?? "");
  }
});

worker.addEventListener("error", (event) => {
  engineStatus.textContent = "Error de carga";
  engineStatus.classList.add("error");
  output.textContent = `Error al iniciar el motor: ${event.message || "sin detalle"}`;
});

function callWorker(payload) {
  const id = ++requestId;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    worker.postMessage({ type: "run", id, payload });
  });
}

function parseNumber(value) {
  const cleaned = String(value).trim().replace(/\s+/g, "").replace(",", ".");
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function selectedHours() {
  return [...document.querySelectorAll(".hour-btn.selected")]
    .map((btn) => Number(btn.dataset.hour))
    .sort((a, b) => a - b);
}

function localISODate(dateObj) {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, "0");
  const d = String(dateObj.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function dateForPython(isoDate) {
  const [y, m, d] = String(isoDate).split("-");
  if (!y || !m || !d) return null;
  return `${d}-${m}-${y}`;
}



function updateGenerateState() {
  generateBtn.disabled = !engineReady || busy;
}

function setBusy(value) {
  busy = value;
  updateGenerateState();
  generateBtn.textContent = value ? "GENERANDO…" : "GENERAR SONDEO";
}

placeSelect.addEventListener("change", () => {
  const custom = placeSelect.value === "custom";
  coordsFields.classList.toggle("hidden", !custom);
  coordsFields.setAttribute("aria-hidden", String(!custom));
});

document.querySelectorAll(".date-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".date-btn").forEach((b) => b.classList.remove("selected"));
    btn.classList.add("selected");
    customDateInput.value = "";
    customDateInput.classList.remove("selected-date");
    selectedDate = btn.dataset.date;
  });
});

customDateInput.addEventListener("change", () => {
  if (!customDateInput.value) return;

  const formatted = dateForPython(customDateInput.value);
  if (!formatted) {
    formError.textContent = "Elegí una fecha válida.";
    return;
  }

  document.querySelectorAll(".date-btn").forEach((b) => b.classList.remove("selected"));
  customDateInput.classList.add("selected-date");
  selectedDate = formatted;
  formError.textContent = "";
});

document.querySelectorAll(".hour-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    btn.classList.toggle("selected");
  });
});

autoGround.addEventListener("change", () => {
  const auto = autoGround.checked;
  tdInput.disabled = auto;
  tInput.disabled = auto;
  if (auto) {
    tdInput.value = "";
    tInput.value = "";
  }
});

clearBtn.addEventListener("click", () => {
  output.textContent = "";
  formError.textContent = "";
});

generateBtn.addEventListener("click", async () => {
  formError.textContent = "";

  const hours = selectedHours();
  if (hours.length === 0) {
    formError.textContent = "Elegí al menos un horario.";
    return;
  }

  const payload = {
    place: placeSelect.value === "custom" ? null : placeSelect.value,
    date: selectedDate,
    hours,
    automatic: autoGround.checked,
    lat: null,
    lon: null,
    td: null,
    t: null,
  };

  if (placeSelect.value === "custom") {
    const lat = parseNumber(latInput.value);
    const lon = parseNumber(lonInput.value);
    if (lat === null || lon === null || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      formError.textContent = "Ingresá latitud (-90 a 90) y longitud (-180 a 180) válidas.";
      return;
    }
    payload.lat = lat;
    payload.lon = lon;
  }

  if (!payload.automatic) {
    const td = parseNumber(tdInput.value);
    const t = parseNumber(tInput.value);
    if (td === null || t === null) {
      formError.textContent = "Para condiciones manuales completá Td y T.";
      return;
    }
    payload.td = td;
    payload.t = t;
  }

  setBusy(true);
  output.textContent = "Consultando modelos y generando sondeo…";

  try {
    const result = await callWorker(payload);
    output.textContent = result || "Sin salida.";
    output.scrollTop = 0;
    output.scrollLeft = 0;
  } catch (err) {
    output.textContent = `Error inesperado:\n${err.message || err}`;
  } finally {
    setBusy(false);
  }
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {
      // La app sigue funcionando aunque el service worker no pueda registrarse.
    });
  });
}
