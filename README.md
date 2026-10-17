# IA, trabajo y negocios · Una mirada desde México

Charla **divulgativa**, no comercial, de Hendrik Martina y Jesús Lerma. Adapta la conferencia UTM a dueños, equipos y público general, con la identidad de Artesanos Digitales. 42 diapositivas: transformaciones industriales, agentes, aplicaciones, ciencia, contexto empresarial mexicano y mundial, productividad, costos, límites, aprendizaje y preguntas. Sin oferta de servicios ni llamado a contratar.

## Abrir

```bash
python3 -m http.server 8770 --bind 127.0.0.1
```

Visitar http://127.0.0.1:8770/. También puede abrirse `index.html` directamente manteniendo las carpetas de recursos. Fuentes, imágenes y animación son locales; los enlaces bibliográficos requieren internet.

- Flechas, espacio o PageDown/PageUp: revelar u ocultar un paso; después, cambiar de diapositiva.
- Home / End: primera / última diapositiva. F: pantalla completa.
- Esc: vista general con selección directa. B: pantalla negra y pausa.
- S: ventana del ponente con notas privadas, actual/siguiente, cronómetro y controles.
- Q / 0: ir a preguntas; repetir vuelve a la misma lámina y al mismo paso. 4: dominios. 5: síntesis.
- `?`: ayuda. Menú **Controles**: sonido opcional (apagado al inicio) y animación automática o iniciada con el siguiente avance.
- Clic en la mitad derecha / izquierda o deslizamiento horizontal: avanzar / regresar. Enlaces y controles no avanzan la presentación.
- `#14`, por ejemplo, abre la diapositiva 14. También se aceptan IDs como `#agentes`.
- En móvil, las láminas largas permiten desplazamiento vertical. Para proyectar, usar formato horizontal.
- La preferencia del sistema de movimiento reducido elimina animaciones, pero conserva los estados explicativos. Al imprimir, se muestran todos los pasos y se ocultan controles y notas.

## Contenido y evidencia

Editar `index.html`; colores y composición en `css/estilo.css`. Navegación, pasos y controles en `js/deck.js` y `css/movimiento.css`. Logo animado de la landing en `js/logo.js`.

Las seis escenas de `js/escenas.js` y `css/escenas.css` reutilizan el enfoque UTM y las retículas exactas del jarrón/greca de la landing: partículas → red (apertura y cierre), fuego → internet → agentes, escalera industrial/rampa hipotética, ciclo agéntico y jarrón → piezas → tejido. Three.js local y su licencia MIT están en `vendor/`. Solo se mantiene un renderer; se pausa fuera de pantalla, en la vista general o con la presentación detenida. Si WebGL no está disponible o pierde el contexto, permanece una explicación estática.

Las gráficas entran con perspectiva y terminan planas; las barras se revelan sin alterar valores ni la escala 0–100%. Las escenas 3D son metáforas y esquemas, no visualizaciones cuantitativas de impacto económico.

Los datos conservan año, población y límites. Referencias completas en [fuentes.md](fuentes.md). No comparar el censo mexicano de 2023 con la adopción OCDE de 2025 como si fueran el mismo universo. Los ejemplos de negocios son didácticos, no casos medidos.

## Revisión divulgativa · 16 oct 2026

Se sustituyeron las 14 láminas comerciales por 27 educativas. Se retiraron el catálogo, la invitación a contratar y las cifras secundarias no suficientemente trazables. Se incorporaron INEGI, Banco Mundial, OCDE, NBER y METR con sus límites. Se conservaron la foto, los títulos creativos de taller y el logo animado. Una gráfica por lámina, barras con escala 0–100%, texto oscuro sobre crema/amarillo y crema sobre verde; terracota oscuro para énfasis en fondos crema.

## Ampliación interactiva UTM · 16 oct 2026

Se amplió el hilo a 42 láminas, con distinción explícita entre la hipótesis de quinta revolución e Industria 5.0 de la Comisión Europea; aplicaciones por dominio, Nobel de Química 2024, ejemplo ficticio de cotización, medición completa de costos, límites físicos y aprendizaje. Se incorporaron escenas 3D, revelado reversible, transiciones, ruido/señal, gráficas animadas y herramientas del ponente. Se mantienen el enfoque divulgativo, la paleta Artesanos, las fuentes y el cierre en «Gracias»; sin QR ni oferta comercial.

Verificación en Chromium: recorrido de las 42 láminas a 1600×900 y 1280×720; revisión móvil a 390×844, sin desbordamiento horizontal ni colisión de fuentes. Se ejercitaron escenas y pasos, vista general, notas del ponente, pantalla completa, pausa, audio opcional, inicio manual, atajos de ida/vuelta, deslizamiento, movimiento reducido, pérdida de contexto WebGL e impresión.

Comprobación reproducible, sin dependencias: con el servidor activo, abrir http://127.0.0.1:8770/tests/navegacion.html. Ejecuta la presentación real en un iframe y comprueba límites de navegación, pasos reversibles, regreso desde preguntas y el orden de tablas con conclusiones explícitas. Resultado observado: **14 comprobaciones correctas**. Mantener esa pestaña visible durante la ejecución.

Publicación: https://hendrixmar.github.io/artesanos-charla-negocios/
