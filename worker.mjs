import { loadPyodide } from "https://cdn.jsdelivr.net/pyodide/v0.28.3/full/pyodide.mjs";

let pyodide = null;

const readyPromise = (async () => {
  self.postMessage({ type: "status", message: "Cargando Python…" });
  pyodide = await loadPyodide({
    indexURL: "https://cdn.jsdelivr.net/pyodide/v0.28.3/full/",
  });

  self.postMessage({ type: "status", message: "Cargando NumPy…" });
  await pyodide.loadPackage("numpy");

  self.postMessage({ type: "status", message: "Cargando pronóstico…" });
  const [shimResp, coreResp] = await Promise.all([
    fetch(new URL("./requests.py", import.meta.url)),
    fetch(new URL("./prono_core.py", import.meta.url)),
  ]);

  if (!shimResp.ok || !coreResp.ok) {
    throw new Error("No se pudieron cargar los archivos Python de la aplicación.");
  }

  const [shimText, coreText] = await Promise.all([shimResp.text(), coreResp.text()]);
  pyodide.FS.writeFile("/requests.py", shimText, { encoding: "utf8" });
  pyodide.FS.writeFile("/prono_core.py", coreText, { encoding: "utf8" });

  await pyodide.runPythonAsync(`
import sys
if "/" not in sys.path:
    sys.path.insert(0, "/")
import prono_core
`);

  self.postMessage({ type: "ready" });
})();

readyPromise.catch((error) => {
  self.postMessage({ type: "fatal", error: String(error?.message || error) });
});

self.addEventListener("message", async (event) => {
  const msg = event.data || {};
  if (msg.type !== "run") return;

  const { id, payload } = msg;

  try {
    await readyPromise;
    pyodide.globals.set("_pwa_payload_json", JSON.stringify(payload));

    const result = await pyodide.runPythonAsync(`
import json
import io
import contextlib
import prono_core

_p = json.loads(_pwa_payload_json)
_bloques = []

for _hora in sorted(set(int(h) for h in _p["hours"])):
    if _p.get("place"):
        _partes = [_p["place"], _p["date"], f"{_hora:02d}hs"]
    else:
        _partes = [
            _p["date"],
            f"{_hora:02d}hs",
            str(_p["lat"]),
            str(_p["lon"]),
        ]

    if not _p.get("automatic", True):
        _partes.extend([str(_p["td"]), str(_p["t"])])

    _consulta = "; ".join(_partes)
    _buf = io.StringIO()
    with contextlib.redirect_stdout(_buf):
        prono_core.procesar_consulta(_consulta)
    _bloques.append(_buf.getvalue().rstrip())

"\\n\\n".join(_bloques).strip()
`);

    self.postMessage({ id, result: String(result ?? "") });
  } catch (error) {
    self.postMessage({ id, error: String(error?.message || error) });
  }
});
