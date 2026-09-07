# Compatibilidad mínima con la API de requests usada por prono_core.py.
# En Pyodide las peticiones HTTP las realiza el navegador mediante open_url.
import json
from urllib.parse import quote as _quote
from pyodide.http import open_url


class _Utils:
    quote = staticmethod(_quote)


utils = _Utils()


class Response:
    def __init__(self, status_code, text="", error=None):
        self.status_code = status_code
        self.text = text
        self.error = error

    def json(self):
        return json.loads(self.text)


def get(url, timeout=30):
    # timeout se conserva en la firma para no modificar la lógica original.
    # open_url usa XMLHttpRequest dentro del navegador.
    try:
        contenido = open_url(url).read()
        return Response(200, contenido)
    except Exception as exc:
        return Response(599, "", exc)
