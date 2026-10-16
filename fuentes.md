# Fuentes y límites de la charla

Consulta: 16 de octubre de 2026. La fecha de consulta no es el año de los datos. Presentación divulgativa: los ejemplos de tienda, taller y despacho son didácticos, no casos de clientes ni promesas de resultados de Artesanos Digitales.

## Base: conferencia UTM

Adaptación de «La quinta revolución industrial: ¿la última hecha solo por humanos?», de Hendrik Martina: capacidad, agentes con herramientas y permisos, adopción, costo, contraargumentos y responsabilidad humana. «Quinta revolución» es una hipótesis del ponente, no clasificación histórica universal. No se trasladaron automáticamente los índices de modelos, cifras de GitHub o comparaciones históricas del deck original. La frase de apertura se conserva sin atribución: no se adjudica a Lenin ni se usa como evidencia.

## Capacidad: METR

- Página y metodología: https://metr.org/time-horizons/
- Datos TH 1.1: https://metr.org/assets/benchmark_results_1_1.yaml
- Última actualización declarada: 8 sep 2026; página ya no mantenida. No es una lista exhaustiva de los modelos más recientes.
- Campo `metrics.p50_horizon_length`, en minutos: GPT-4 (`gpt_4`), 3.987428, IC 1.932920–7.995283; Opus 4.5 (`claude_opus_4_5_inspect`), 292.994594, IC 161.717714–623.704698; Opus 4.6 (`claude_opus_4_6_inspect`), 718.806830, IC 316.685725–3633.786163. Se redondean y convierten a horas en la diapositiva.
- Mide la duración que necesitaría un experto humano para tareas con un 50% de éxito estimado del agente. No mide horas de autonomía sin fallar, jornadas laborales sustituidas ni productividad empresarial. Tareas de software, ML y ciberseguridad; no todas las ocupaciones. Estimaciones centrales superiores a 16 horas no son fiables con la batería actual. El intervalo de Opus 4.6 es particularmente amplio.

## México: INEGI, Censos Económicos 2024

Fuente primaria, resultados definitivos publicados el 24 jul 2025, archivo con cifras corregidas:
https://www.inegi.org.mx/contenidos/saladeprensa/boletines/2025/ce/CE2024_def_RR.pdf

Periodo de referencia: 2023. Universo usado: 5,468,180 unidades económicas del sector privado y empresas paraestatales. No equivale al universo completo de establecimientos ni a todo el empleo nacional.

- Página 7: microempresas (0–10 personas), 95.4% de las unidades y 41.4% del personal ocupado del universo estudiado.
- Página 16: unidades que usaron internet para realizar sus actividades: 18.9% en 2013, 20.7% en 2018 y 26.4% en 2023. No es disponibilidad de conectividad ni uso personal del propietario.
- Página 18: unidades que realizaron ventas por internet en 2023: micro, 4.4%; pymes (11–250 personas), 28.7%; grandes (más de 250), 33.0%. No son porcentajes de ingresos. Barras con base cero y escala común 0–100%.

Se retiraron las cifras secundarias de la versión comercial (8% de adopción en México, 0.1% de microempresas, WhatsApp, asociaciones con salarios/producción). No se presentan como hechos del censo sin una trazabilidad metodológica suficiente. Tampoco se convierte «no usó internet» en «no tiene internet».

## Contexto mundial: Banco Mundial

https://www.worldbank.org/ext/en/topic/competitiveness/small-and-medium-enterprises-smes-finance

Las pymes representan alrededor del 90% de los negocios y más del 50% del empleo mundial. Estimación general de contexto del Banco Mundial, no un censo mundial de 2026. Las definiciones de pyme varían entre países; no se compara directamente con la categoría micro del INEGI.

## Adopción internacional: OCDE

Comunicado de 28 ene 2026:
https://www.oecd.org/en/about/news/announcements/2026/01/ai-use-by-individuals-surges-across-the-oecd-as-adoption-by-firms-continues-to-expand.html

- Empresas que reportan usar IA: 8.7% (2023), 14.2% (2024), 20.2% (2025).
- Por tamaño en 2025: pequeñas, 17.4%; grandes, 52.0%.
- Se refieren a países y empresas cubiertos por las estadísticas disponibles de la OCDE, no a todo el mundo ni a todas las microempresas. No se infiere adopción mexicana de estas cifras. La cobertura estadística no se equipara al universo del INEGI.
- Barras con base cero y escala 0–100%. No representan ganancias ni intensidad de uso.
- Verificación: extractos indexados de la publicación primaria. La lectura directa del sitio devolvió HTTP 403; no se afirma haber descargado las tablas subyacentes ni homogeneizado la cobertura entre años.

## Productividad: NBER

Brynjolfsson, Li y Raymond, *Generative AI at Work*, Working Paper 31161, abril 2023, revisión noviembre 2023:
https://www.nber.org/papers/w31161

5,179 agentes de soporte; aumento medio de 14% en asuntos resueltos por hora, 34% para personal novato y de menor habilidad, impacto mínimo en personal experimentado y de mayor habilidad. Son las cifras del resumen de esa versión del working paper, no se mezclan con la publicación final de 2025. No mide utilidades ni prueba que cualquier negocio obtenga ese efecto.

## Contraargumento y actualización: METR

- Experimento histórico: https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev-study/
- Actualización: https://metr.org/blog/2026-02-24-uplift-update/

En el experimento de principios de 2025: 16 desarrolladores, 246 tareas de repositorios propios, 19% más tiempo con IA. METR advierte que ese resultado histórico ya no representa el impacto actual. La actualización de febrero de 2026 describe problemas de selección y medición que impiden estimar de forma fiable el nuevo efecto. Se incluyen ambos, no se vende el resultado antiguo como evidencia actual contra la IA.

## Recomendaciones y ejemplos

Costos de integración, revisión, capacitación, privacidad, permisos y comparación de tareas son criterios de análisis propuestos por los ponentes. No son estimaciones de impacto ni asesoría jurídica. Los ejemplos no prueban ahorro de tiempo, retorno financiero ni sustitución de puestos de trabajo.

## Identidad visual

Paleta, fuentes, greca, isotipos y piezas del logo proceden del repositorio de la landing de Artesanos Digitales. Se conserva la animación del jarrón y wordmark, sin sonido. Foto de Hendrik entregada por él para la charla; no se declara licencia abierta de la fotografía ni de los elementos de marca. Los nombres «maestro del telar» y «maestro alfarero» son títulos creativos para la presentación, no credenciales ni cargos legales.
