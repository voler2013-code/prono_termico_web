PRONO TÉRMICO — PWA
===================

Qué hace esta versión
---------------------
- Conserva prono_core.py con la lógica Python actual.
- La interfaz solo arma las consultas y captura la salida de procesar_consulta().
- Permite elegir los lugares del código original: SJ, Cuchi, Merlo, Trasla, Ped, Alpina, Rioja y Tuc.
- También acepta coordenadas personalizadas.
- Fecha: Ayer / Hoy / Mañana.
- Horas múltiples: 09 a 18.
- Condiciones a nivel del suelo automáticas o Td/T manuales.
- El resultado se muestra en una caja monoespaciada tipo terminal.
- No necesita un servidor Python ni un VPS. El cálculo corre en el navegador del teléfono mediante Pyodide.
- Sí necesita Internet para consultar Open-Meteo y para cargar Pyodide.

IMPORTANTE SOBRE PWA
--------------------
Una PWA instalable no se puede abrir simplemente con file://. Chrome/Android exige que se sirva por HTTPS (o localhost para pruebas).
La forma más sencilla es alojar estos archivos como sitio ESTÁTICO en GitHub Pages. Eso NO ejecuta Python en un servidor: solo entrega los archivos al celular; el Python corre en el propio teléfono.

Pasos recomendados con GitHub Pages
------------------------------------
1. Crear una cuenta en GitHub si todavía no tenés una.
2. Crear un repositorio nuevo, por ejemplo: prono-termico.
3. Subir TODOS los archivos y la carpeta icons manteniendo esta estructura.
4. En GitHub entrar a Settings > Pages.
5. En Build and deployment seleccionar Deploy from a branch.
6. Elegir branch main y carpeta /(root), y guardar.
7. Esperar a que GitHub muestre la dirección https://...github.io/prono-termico/.
8. Abrir esa dirección en Chrome del celular.
9. Esperar a que arriba aparezca “Motor listo”. La primera carga puede tardar porque descarga Python/NumPy.
10. En Chrome usar menú ⋮ > Agregar a pantalla principal / Instalar app.
11. Desde ese momento se abre como una app independiente.

Prueba rápida
-------------
- Lugar: SJ
- Fecha: Hoy
- Horario: 12
- Condiciones: Automáticas
- Tocar GENERAR SONDEO.

Notas
-----
- La aplicación necesita conexión a Internet para obtener los datos meteorológicos de Open-Meteo.
- El motor Python queda en el navegador; no hay backend propio.
- Para horas múltiples, la interfaz invoca la misma procesar_consulta() una vez por hora. El cache de prono_core.py evita volver a descargar el mismo modelo/lugar/fecha innecesariamente.


CORRECCIÓN v2
- Se corrigió el error SyntaxError: unterminated string literal al generar varios bloques.
- Si ya habías publicado una versión anterior, reemplazá worker.mjs y sw.js (o todos los archivos) y luego recargá la página.
