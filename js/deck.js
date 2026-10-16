(function () {
  const slides = [...document.querySelectorAll('.s')];
  const n = document.querySelector('.nav');
  let i = 0;
  const logo = window.LogoTaller.armar(document.querySelector('#lienzo'));
  function show(k) {
    i = Math.max(0, Math.min(slides.length - 1, k));
    slides.forEach((s, j) => s.classList.toggle('on', j === i));
    n.textContent = String(i + 1).padStart(2, '0') + ' / ' + String(slides.length).padStart(2, '0');
    document.body.dataset.lienzo = slides[i].dataset.lienzo || 'crema';
    if (slides[i].dataset.logo) logo.play();
    else logo.stop();
    history.replaceState(null, '', '#' + (i + 1));
  }
  addEventListener('keydown', (e) => {
    if (['ArrowRight', ' ', 'PageDown'].includes(e.key)) { e.preventDefault(); show(i + 1); }
    if (['ArrowLeft', 'PageUp', 'Backspace'].includes(e.key)) { e.preventDefault(); show(i - 1); }
    if (e.key === 'Home') show(0);
    if (e.key === 'End') show(slides.length - 1);
    if (e.key === 'f' || e.key === 'F') {
      if (!document.fullscreenElement) document.documentElement.requestFullscreen();
      else document.exitFullscreen();
    }
  });
  addEventListener('hashchange', () => {
    const h = parseInt(location.hash.slice(1), 10);
    if (Number.isFinite(h) && h - 1 !== i) show(h - 1);
  });
  document.querySelector('.deck').addEventListener('click', (e) => {
    if (e.target.closest('a')) return;
    show(i + (e.clientX > innerWidth * 0.5 ? 1 : -1));
  });
  const hash = parseInt(location.hash.slice(1), 10);
  show(Number.isFinite(hash) ? hash - 1 : 0);
})();
