/* Presentación nativa: pasos reversibles, controles y notas fuera de la proyección. */
(function () {
  'use strict';
  const deck = document.querySelector('.deck');
  const slides = [...deck.querySelectorAll('.s')];
  if (!slides.length) return;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const animations = new Set();
  const states = slides.map(() => ({ step: 0, started: false }));
  const groups = slides.map((slide, index) => {
    slide.id ||= 'diapositiva-' + (index + 1);
    slide.tabIndex = -1;
    slide.setAttribute('role', 'group');
    slide.setAttribute('aria-roledescription', 'diapositiva');
    slide.setAttribute('aria-label', (index + 1) + ' de ' + slides.length);
    if (!slide.dataset.escena && slide.dataset.fragmentos !== 'off') {
      slide.querySelectorAll('.steps > li, .flow > li, .lista > li, .riesgos > div, .barras > div, tbody > tr, .contraste > div, .fila > div, .personas > div').forEach(el => {
        if (!el.closest('.notes,.fragment') && !el.querySelector('.fragment')) el.classList.add('fragment');
      });
    }
    const ordered = new Map();
    let next = 0;
    slide.querySelectorAll('.fragment').forEach(el => {
      if (el.closest('.notes')) return;
      const explicit = Number(el.dataset.fragmentIndex);
      const key = el.hasAttribute('data-fragment-index') && Number.isFinite(explicit) ? explicit : next;
      next = Math.max(next, key + 1);
      if (!ordered.has(key)) ordered.set(key, []);
      ordered.get(key).push(el);
    });
    return [...ordered.entries()].sort((a, b) => a[0] - b[0]).map(([, elements]) => elements);
  });
  let index = 0, manual = false, paused = false, printing = false, sound = false;
  let audio = null, speaker = null, speakerTimer = null;
  const jumpReturns = new Map();
  let logoActive = false, logoWait = null, suppressClickUntil = 0;
  const startedAt = Date.now();
  const logoCanvas = document.querySelector('#lienzo');
  const logo = logoCanvas && window.LogoTaller ? window.LogoTaller.armar(logoCanvas) : null;
  let staticLogo = null;
  if (logoCanvas) {
    staticLogo = document.createElement('span');
    staticLogo.className = 'marca logo-h deck-logo-estatico';
    staticLogo.setAttribute('role', 'img');
    staticLogo.setAttribute('aria-label', 'Artesanos Digitales');
    logoCanvas.after(staticLogo);
  }
  document.querySelector('.nav')?.setAttribute('hidden', '');
  document.body.classList.add('deck-ready');

  const ui = document.createElement('nav');
  ui.className = 'deck-ui';
  ui.setAttribute('aria-label', 'Controles de la presentación');
  ui.innerHTML = `<button type="button" data-action="previous" aria-label="Paso anterior" title="Paso anterior (←)"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14 6-6 6 6 6"/></svg></button>
    <output class="deck-position" aria-live="polite" aria-atomic="true"></output>
    <button type="button" data-action="next" aria-label="Paso siguiente" title="Paso siguiente (→)"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m10 6 6 6-6 6"/></svg></button>
    <details class="deck-menu"><summary>Controles</summary><div class="deck-menu-panel">
      <button type="button" data-action="overview">Vista general · Esc</button>
      <button type="button" data-action="fullscreen">Pantalla completa · F</button>
      <button type="button" data-action="pause">Pausar · B</button>
      <button type="button" data-action="speaker">Notas del ponente · S</button>
      <button type="button" data-action="questions">Preguntas / volver · Q</button>
      <button type="button" data-action="sound" aria-pressed="false">Sonido: apagado</button>
      <button type="button" data-action="motion" aria-pressed="false">Animación: al entrar</button>
      <button type="button" data-action="help">Ayuda de teclado · ?</button>
    </div></details>`;
  const progress = document.createElement('div');
  progress.className = 'deck-progress';
  progress.setAttribute('role', 'progressbar');
  progress.setAttribute('aria-label', 'Avance de la presentación');
  progress.setAttribute('aria-valuemin', '0');
  progress.setAttribute('aria-valuemax', '100');
  progress.innerHTML = '<span></span>';
  const announcement = document.createElement('p');
  announcement.className = 'deck-sr';
  announcement.setAttribute('role', 'status');
  const blackout = document.createElement('div');
  blackout.className = 'deck-blackout';
  blackout.hidden = true;
  blackout.innerHTML = '<button type="button">Reanudar presentación · B</button>';
  const overview = document.createElement('dialog');
  overview.className = 'deck-dialog deck-overview';
  overview.setAttribute('aria-labelledby', 'deck-overview-title');
  overview.innerHTML = '<header><h2 id="deck-overview-title">La conversación completa</h2><button type="button" data-close>Cerrar · Esc</button></header><div class="deck-overview-grid"></div>';
  const help = document.createElement('dialog');
  help.className = 'deck-dialog deck-help';
  help.setAttribute('aria-labelledby', 'deck-help-title');
  help.innerHTML = `<header><h2 id="deck-help-title">A tu ritmo.</h2><button type="button" data-close>Cerrar · Esc</button></header>
    <dl><dt>→ / Espacio / Av Pág</dt><dd>Mostrar el siguiente paso; después, avanzar.</dd>
    <dt>← / Retroceso / Re Pág</dt><dd>Ocultar el último paso; después, regresar.</dd>
    <dt>Inicio / Fin</dt><dd>Primera / última diapositiva.</dd>
    <dt>F</dt><dd>Entrar o salir de pantalla completa.</dd><dt>Esc</dt><dd>Abrir o cerrar la vista general.</dd>
    <dt>B</dt><dd>Pantalla negra y pausa; B vuelve a la charla.</dd><dt>S</dt><dd>Notas, siguiente diapositiva y cronómetro en otra ventana.</dd>
    <dt>Q / 0</dt><dd>Ir a preguntas; repetir devuelve al mismo paso.</dd><dt>4 / 5</dt><dd>Dominios / síntesis de la evidencia; repetir devuelve al mismo paso.</dd><dt>?</dt><dd>Abrir esta ayuda.</dd></dl>
    <p>También puedes deslizar horizontalmente o tocar la mitad derecha o izquierda. Los enlaces y el desplazamiento siguen funcionando.</p>
    <p>«Animación: con siguiente» reserva un paso para iniciar las escenas. El sonido está apagado por defecto. Se respeta la preferencia de movimiento reducido.</p>`;
  document.body.append(progress, ui, announcement, blackout, overview, help);
  const position = ui.querySelector('.deck-position');
  const menu = ui.querySelector('details');
  const button = action => ui.querySelector('[data-action="' + action + '"]');
  const plainText = element => [...element.childNodes].map(node => node.textContent).join(' ').replace(/\s+/g, ' ').trim();
  const title = slide => {
    const heading = slide?.querySelector('h1,h2');
    return heading ? plainText(heading) : 'Conversación';
  };
  const excerpt = slide => {
    if (!slide) return '';
    const elements = [...slide.querySelectorAll('.lead,.sub,.takeaway,.steps li,.flow li,.lista li,.barra-etq,tbody tr')].filter(el => !el.closest('.notes'));
    return elements.slice(0, 3).map(plainText).join(' · ');
  };
  const overviewButtons = slides.map((slide, n) => {
    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'deck-choice ' + (slide.dataset.lienzo || 'crema');
    const number = document.createElement('span');
    number.className = 'deck-choice-number';
    number.textContent = String(n + 1).padStart(2, '0');
    const heading = document.createElement('strong');
    heading.textContent = title(slide);
    const text = document.createElement('span');
    text.textContent = excerpt(slide);
    item.append(number, heading, text);
    item.addEventListener('click', () => { overview.close(); show(n, states[n].step, states[n].started); });
    overview.querySelector('.deck-overview-grid').append(item);
    return item;
  });
  [overview, help].forEach(dialog => {
    dialog.querySelector('[data-close]').addEventListener('click', () => dialog.close());
    dialog.addEventListener('close', environment);
  });

  function active() { return !document.hidden && !paused && !overview.open && !help.open && !printing; }
  function hasEntrance(slide) { return !!(slide.dataset.escena || slide.dataset.logo || slide.querySelector('.barras,table,[data-graf],.ruido')); }
  function pending() { return manual && hasEntrance(slides[index]) && !states[index].started; }
  function cancelAnimations() {
    animations.forEach(animation => animation.cancel());
    animations.clear();
    slides.forEach(slide => slide.classList.remove('leaving'));
  }
  function animate(element, frames, duration, done) {
    if (motion.matches || !active() || !element.animate) { done?.(); return; }
    const animation = element.animate(frames, { duration, easing: 'cubic-bezier(.16,1,.3,1)' });
    animations.add(animation);
    animation.onfinish = () => { animations.delete(animation); done?.(); };
  }
  function reveal(element) {
    animate(element, [{ opacity: .2, transform: 'translateY(12px)' }, { opacity: 1, transform: 'none' }], 300);
    element.querySelectorAll('.pista i').forEach(bar => animate(bar, [{ transform: 'scaleX(0)', transformOrigin: 'left' }, { transform: 'scaleX(1)', transformOrigin: 'left' }], 560));
  }
  function entrance() {
    if (pending()) return;
    slides[index].querySelectorAll('.barras,table,[data-graf]').forEach(chart => {
      // El plano vuelve a su geometría real; ninguna transformación queda en los datos.
      animate(chart, [{ transform: 'perspective(1400px) rotateX(7deg) rotateY(-5deg)', opacity: .65 }, { transform: 'none', opacity: 1 }], 560);
    });
    slides[index].querySelectorAll('.pista i').forEach(bar => {
      if (!bar.closest('.fragment:not(.visible)')) animate(bar, [{ transform: 'scaleX(0)', transformOrigin: 'left' }, { transform: 'scaleX(1)', transformOrigin: 'left' }], 560);
    });
  }
  function applyFragments() {
    groups[index].forEach((group, n) => group.forEach(element => {
      const visible = n < states[index].step;
      if (!visible && element.contains(document.activeElement)) slides[index].focus({ preventScroll: true });
      element.classList.toggle('visible', visible);
      element.setAttribute('aria-hidden', String(!visible));
      element.inert = !visible;
    }));
  }
  function environment() {
    const running = active();
    document.body.classList.toggle('deck-suspended', !running);
    document.body.classList.toggle('deck-reduced-motion', motion.matches);
    document.body.classList.toggle('deck-animation-pending', pending());
    deck.inert = paused;
    ui.inert = paused;
    if (!running || motion.matches) cancelAnimations();
    const slide = slides[index];
    const visible = [...slide.querySelectorAll('.fragment.visible[data-estado]')].map(el => Number(el.dataset.estado)).filter(Number.isFinite);
    window.Escenas?.set(running && !pending() ? slide : null, Math.max(0, ...visible));
    const playLogo = !!(logo && slide.dataset.logo && running && !pending() && !motion.matches);
    clearTimeout(logoWait);
    if (!playLogo) { logo?.stop(); logoActive = false; }
    if (logoCanvas) {
      const ready = window.LogoTaller?.listo();
      logoCanvas.hidden = !playLogo || !ready;
      staticLogo.hidden = playLogo && ready;
      if (playLogo && ready && !logoActive) { logoActive = true; logo.play(); }
      // No play() pendiente: evita arrancar el logo después de abandonar su diapositiva.
      if (playLogo && !ready) logoWait = setTimeout(environment, 100);
    }
    if (audio) {
      if (!running || !sound) audio.suspend().catch(() => {});
      else audio.resume().catch(() => { sound = false; updateSound(); });
    }
    syncSpeaker();
  }
  function refresh() {
    const state = states[index], total = groups[index].length;
    const label = String(index + 1).padStart(2, '0') + ' / ' + String(slides.length).padStart(2, '0');
    position.textContent = label + ' · ' + (pending() ? 'iniciar animación' : 'paso ' + state.step + ' / ' + total);
    button('previous').disabled = index === 0 && state.step === 0 && !(manual && state.started && hasEntrance(slides[index]));
    button('next').disabled = index === slides.length - 1 && state.step === total && !pending();
    const fraction = slides.length === 1 ? 1 : (index + (total ? state.step / (total + 1) : 0)) / slides.length;
    const percent = index === slides.length - 1 && state.step === total ? 100 : Math.round(fraction * 100);
    progress.style.setProperty('--progress', percent + '%');
    progress.setAttribute('aria-valuenow', String(percent));
    progress.setAttribute('aria-valuetext', label + ', paso ' + state.step + ' de ' + total);
    overviewButtons.forEach((item, n) => { if (n === index) item.setAttribute('aria-current', 'step'); else item.removeAttribute('aria-current'); });
    environment();
  }
  function show(next, step = 0, started = !manual) {
    next = Math.max(0, Math.min(slides.length - 1, next));
    const old = slides[index], changed = next !== index, direction = next >= index ? 1 : -1;
    const transferFocus = old.contains(document.activeElement);
    cancelAnimations();
    logo?.stop(); logoActive = false;
    index = next;
    states[index] = { step: Math.max(0, Math.min(groups[index].length, step)), started };
    slides.forEach((slide, n) => {
      slide.classList.toggle('on', n === index);
      slide.setAttribute('aria-hidden', String(n !== index));
      slide.inert = n !== index;
    });
    applyFragments();
    document.body.dataset.lienzo = slides[index].dataset.lienzo || 'crema';
    history.replaceState(null, '', '#' + (index + 1));
    if (changed) slides[index].scrollTop = 0;
    refresh();
    if (changed && active() && !motion.matches) {
      old.classList.add('leaving');
      animate(old, [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateX(' + (-direction * 48) + 'px)' }], 180, () => old.classList.remove('leaving'));
      animate(slides[index], [{ opacity: .2, transform: 'translateX(' + (direction * 64) + 'px)' }, { opacity: 1, transform: 'none' }], 360);
    }
    entrance();
    if (transferFocus) slides[index].focus({ preventScroll: true });
    if (changed) tone(false);
  }
  function advance(direction) {
    if (paused || overview.open || help.open) return;
    cancelAnimations();
    const state = states[index];
    if (direction > 0) {
      if (pending()) { state.started = true; refresh(); entrance(); tone(true); }
      else if (state.step < groups[index].length) {
        const group = groups[index][state.step++];
        applyFragments(); refresh(); group.forEach(reveal); tone(true);
      } else if (index < slides.length - 1) show(index + 1);
    } else if (state.step > 0) {
      state.step--; applyFragments(); refresh();
    } else if (manual && state.started && hasEntrance(slides[index])) {
      state.started = false; refresh();
    } else if (index > 0) show(index - 1, groups[index - 1].length, true);
  }
  function toggleOverview() {
    if (paused) return;
    if (help.open) help.close();
    if (overview.open) overview.close();
    else { overview.showModal(); environment(); overviewButtons[index].focus(); }
  }
  function togglePause() {
    if (overview.open) overview.close();
    if (help.open) help.close();
    paused = !paused;
    blackout.hidden = !paused;
    document.body.classList.toggle('deck-paused', paused);
    environment();
    if (paused) blackout.querySelector('button').focus();
    else button('next').focus();
  }
  function jump(selector) {
    const destination = slides.findIndex(slide => slide.matches(selector));
    if (destination < 0) return;
    if (index === destination && jumpReturns.has(destination)) {
      const previous = jumpReturns.get(destination); jumpReturns.delete(destination);
      show(previous.index, previous.step, previous.started);
    } else if (index !== destination) {
      jumpReturns.set(destination, { index, ...states[index] }); show(destination);
    }
  }
  function questions() { jump('#preguntas,[data-preguntas]'); }
  async function fullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen();
      else announcement.textContent = 'Pantalla completa no disponible en este navegador.';
    } catch { announcement.textContent = 'No se pudo abrir pantalla completa. Usa la opción de pantalla completa del navegador.'; }
  }
  function updateSound() {
    button('sound').setAttribute('aria-pressed', String(sound));
    button('sound').textContent = 'Sonido: ' + (sound ? 'encendido' : 'apagado');
  }
  async function toggleSound() {
    if (sound) { sound = false; updateSound(); environment(); return; }
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) { announcement.textContent = 'Este navegador no admite audio de la presentación.'; return; }
    button('sound').disabled = true;
    try { audio ||= new Audio(); await audio.resume(); sound = audio.state === 'running'; updateSound(); tone(true); }
    catch { sound = false; updateSound(); announcement.textContent = 'No se pudo activar el sonido. Puedes volver a intentarlo.'; }
    finally { button('sound').disabled = false; }
  }
  function tone(fragment) {
    if (!sound || !active() || audio?.state !== 'running') return;
    const now = audio.currentTime, oscillator = audio.createOscillator(), gain = audio.createGain();
    oscillator.type = 'sine'; oscillator.frequency.setValueAtTime(fragment ? 620 : 440, now);
    gain.gain.setValueAtTime(0, now); gain.gain.linearRampToValueAtTime(.025, now + .012); gain.gain.exponentialRampToValueAtTime(.0001, now + .1);
    oscillator.connect(gain); gain.connect(audio.destination); oscillator.start(now); oscillator.stop(now + .12);
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
  }
  function openSpeaker() {
    if (speaker && !speaker.closed) { speaker.focus(); return; }
    speaker = window.open('', 'artesanos-ponente', 'popup,width=1150,height=800');
    if (!speaker) { announcement.textContent = 'El navegador bloqueó las notas. Permite ventanas emergentes para este sitio y pulsa S de nuevo.'; return; }
    const doc = speaker.document;
    doc.open();
    doc.write('<!doctype html><html lang="es-MX"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Notas del ponente · Artesanos Digitales</title></head><body class="speaker-body"><header class="speaker-header"><h1>Vista del ponente</h1><output id="speaker-time" aria-label="Tiempo transcurrido"></output></header><p id="speaker-status"></p><div class="speaker-slides"><section><h2>Ahora</h2><h3 id="speaker-current-title"></h3><p id="speaker-current-text"></p><p id="speaker-step"></p></section><section><h2>Después</h2><h3 id="speaker-next-title"></h3><p id="speaker-next-text"></p></section></div><section class="speaker-notes"><h2>Notas privadas</h2><div id="speaker-notes"></div></section><nav class="speaker-controls" aria-label="Control de la proyección"><button type="button" id="speaker-previous">Anterior</button><button type="button" id="speaker-next">Siguiente</button><button type="button" id="speaker-pause">Pausa / reanudar · B</button><button type="button" id="speaker-questions">Preguntas / volver · Q</button></nav></body></html>');
    doc.close();
    ['css/estilo.css', 'css/movimiento.css'].forEach(path => { const link = doc.createElement('link'); link.rel = 'stylesheet'; link.href = new URL(path, document.baseURI).href; doc.head.append(link); });
    doc.getElementById('speaker-previous').onclick = () => advance(-1);
    doc.getElementById('speaker-next').onclick = () => advance(1);
    doc.getElementById('speaker-pause').onclick = togglePause;
    doc.getElementById('speaker-questions').onclick = questions;
    doc.addEventListener('keydown', keyboard);
    clearInterval(speakerTimer);
    speakerTimer = setInterval(() => {
      if (!speaker || speaker.closed) { clearInterval(speakerTimer); speaker = null; return; }
      updateTimer();
    }, 1000);
    syncSpeaker(); updateTimer();
  }
  function updateTimer() {
    if (!speaker || speaker.closed) return;
    const seconds = Math.floor((Date.now() - startedAt) / 1000);
    speaker.document.getElementById('speaker-time').textContent = String(Math.floor(seconds / 60)).padStart(2, '0') + ':' + String(seconds % 60).padStart(2, '0');
  }
  function syncSpeaker() {
    if (!speaker || speaker.closed) return;
    const doc = speaker.document, slide = slides[index], next = slides[index + 1];
    doc.getElementById('speaker-current-title').textContent = (index + 1) + '. ' + title(slide);
    doc.getElementById('speaker-current-text').textContent = excerpt(slide);
    doc.getElementById('speaker-next-title').textContent = next ? (index + 2) + '. ' + title(next) : 'Fin de la conversación';
    doc.getElementById('speaker-next-text').textContent = excerpt(next);
    doc.getElementById('speaker-step').textContent = position.textContent;
    doc.getElementById('speaker-status').textContent = paused ? 'Proyección en negro · B para reanudar' : overview.open ? 'Vista general abierta' : 'Notas privadas: no aparecen en la proyección.';
    const notes = doc.getElementById('speaker-notes');
    notes.replaceChildren();
    const source = slide.querySelector('.notes') || slide.querySelector('.fuente');
    if (source) [...source.childNodes].forEach(node => notes.append(doc.importNode(node, true)));
    else notes.textContent = 'Sin notas para esta diapositiva.';
    doc.getElementById('speaker-previous').disabled = button('previous').disabled;
    doc.getElementById('speaker-next').disabled = button('next').disabled;
  }
  function keyboard(event) {
    if (event.ctrlKey || event.metaKey || event.altKey || event.target.closest('input,textarea,select,[contenteditable="true"]')) return;
    const key = event.key.toLowerCase();
    if (event.repeat && !['arrowright', 'arrowleft', 'pagedown', 'pageup', ' ', 'backspace'].includes(key)) return;
    if (key === 'escape') {
      event.preventDefault();
      if (help.open) help.close();
      else if (overview.open) overview.close();
      else if (paused) togglePause();
      else toggleOverview();
      return;
    }
    if (help.open || overview.open) return;
    if (key === 'b') { event.preventDefault(); togglePause(); return; }
    if (paused) return;
    if (event.target.closest('button,a,summary') && [' ', 'enter'].includes(key)) return;
    const actions = { arrowright: () => advance(1), pagedown: () => advance(1), ' ': () => advance(1), arrowleft: () => advance(-1), pageup: () => advance(-1), backspace: () => advance(-1), home: () => show(0), end: () => show(slides.length - 1), f: fullscreen, s: openSpeaker, q: questions, '0': questions, '4': () => jump('#dominios'), '5': () => jump('.tesis-slide'), '?': () => { help.showModal(); environment(); } };
    if (actions[key]) { event.preventDefault(); actions[key](); }
  }
  ui.addEventListener('click', event => {
    const action = event.target.closest('[data-action]')?.dataset.action;
    if (!action) return;
    const actions = { previous: () => advance(-1), next: () => advance(1), overview: toggleOverview, fullscreen, pause: togglePause, speaker: openSpeaker, questions, sound: toggleSound, motion: () => {
      manual = !manual;
      button('motion').setAttribute('aria-pressed', String(manual));
      button('motion').textContent = manual ? 'Animación: con siguiente' : 'Animación: al entrar';
      states[index].started = !manual; cancelAnimations(); refresh(); if (!manual) entrance();
    }, help: () => { help.showModal(); environment(); } };
    actions[action]?.();
    if (!['sound', 'motion'].includes(action)) menu.open = false;
  });
  blackout.querySelector('button').addEventListener('click', togglePause);
  document.addEventListener('keydown', keyboard);
  const interactive = 'a,button,input,textarea,select,summary,label,[contenteditable],[data-no-nav]';
  let pointer = null;
  deck.addEventListener('pointerdown', event => {
    if (!event.isPrimary || event.button !== 0 || event.target.closest(interactive)) { pointer = null; return; }
    pointer = { x: event.clientX, y: event.clientY, time: Date.now(), scroll: slides[index].scrollTop };
  });
  deck.addEventListener('pointerup', event => {
    if (!pointer) return;
    const start = pointer; pointer = null;
    const x = event.clientX - start.x, y = event.clientY - start.y;
    const scrolled = Math.abs(slides[index].scrollTop - start.scroll) > 3;
    if (scrolled || Math.abs(x) > 12 || Math.abs(y) > 12 || Date.now() - start.time > 600) suppressClickUntil = Date.now() + 500;
    if (!scrolled && Math.abs(x) > 70 && Math.abs(x) > Math.abs(y) * 1.7 && Date.now() - start.time < 800 && !event.target.closest(interactive)) advance(x < 0 ? 1 : -1);
  });
  deck.addEventListener('pointercancel', () => { pointer = null; suppressClickUntil = Date.now() + 500; });
  deck.addEventListener('click', event => {
    if (Date.now() < suppressClickUntil || event.target.closest(interactive) || getSelection()?.toString() || event.clientX >= document.documentElement.clientWidth - 20) return;
    advance(event.clientX > innerWidth * .5 ? 1 : -1);
  });
  function hashIndex() {
    const hash = location.hash.slice(1);
    if (/^\d+$/.test(hash)) return Math.max(0, Math.min(slides.length - 1, Number(hash) - 1));
    return slides.findIndex(slide => slide.id === hash);
  }
  addEventListener('hashchange', () => { const target = hashIndex(); if (target >= 0 && target !== index) show(target); });
  document.addEventListener('visibilitychange', environment);
  motion.addEventListener('change', environment);
  addEventListener('beforeprint', () => { printing = true; environment(); slides.forEach(slide => { slide.inert = false; slide.removeAttribute('aria-hidden'); }); slides.forEach(slide => slide.querySelectorAll('.fragment').forEach(el => { el.inert = false; el.removeAttribute('aria-hidden'); })); });
  addEventListener('afterprint', () => { printing = false; slides.forEach((slide, n) => { slide.inert = n !== index; slide.setAttribute('aria-hidden', String(n !== index)); }); applyFragments(); environment(); });
  addEventListener('pagehide', () => { cancelAnimations(); clearTimeout(logoWait); logo?.stop(); window.Escenas?.set(null); audio?.suspend().catch(() => {}); });
  addEventListener('pageshow', environment);
  show(Math.max(0, hashIndex()));
})();
