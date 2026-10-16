/* Misma pieza que la intro de artesanosdigitales.tech: el jarrón se desarma
   en puntadas y se rearma; el wordmark entra con un barrido. Sin sonido. */
(function () {
  const L = { potW: 774, potH: 900, wmX: 939, wmY: 296, wmW: 2625, wmH: 605, totalW: 3563, totalH: 901 };
  const COLS = 15, FILAS = 17;
  const T = { quieto: 380, caida: 760, asiento: 1200, rearmeIni: 1360, rearmeFin: 2640, logoIni: 2820, logoFin: 3780, fin: 4300 };
  const MS_FILA = (T.rearmeFin - T.rearmeIni) / FILAS;
  const entra = (t) => t * t;
  const sale = (t) => 1 - Math.pow(1 - t, 3);
  const entraSale = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;

  function tenir(img) {
    const c = document.createElement('canvas');
    c.width = img.width; c.height = img.height;
    const x = c.getContext('2d');
    x.drawImage(img, 0, 0);
    x.globalCompositeOperation = 'source-in';
    x.fillStyle = '#f9f5d2';
    x.fillRect(0, 0, c.width, c.height);
    return c;
  }
  function cargar(src) {
    return new Promise((ok, falla) => {
      const i = new Image();
      i.onload = () => ok(i);
      i.onerror = falla;
      i.src = src;
    });
  }

  let jarron, logo, listo = false;
  const carga = Promise.all([
    cargar('marca/intro/jarron.png'),
    cargar('marca/intro/wordmark.png')
  ]).then(([j, w]) => { jarron = tenir(j); logo = tenir(w); listo = true; });

  function armar(canvas) {
    const ctx = canvas.getContext('2d');
    let piezas = [], caja = null, raf = 0, inicio = 0;
    function medir() {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      const w = canvas.clientWidth, h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const s = Math.min((w * 0.86) / L.totalW, (h * 0.82) / L.totalH);
      const ox = (w - L.totalW * s) / 2;
      const oy = (h - L.totalH * s) / 2;
      const j = { x: ox, y: oy, w: L.potW * s, h: L.potH * s };
      caja = {
        w, h, jarron: j,
        logo: { x: ox + L.wmX * s, y: oy + L.wmY * s, w: L.wmW * s, h: L.wmH * s },
        suelo: oy + L.potH * s + h * 0.04
      };
      const ancho = j.w / COLS, alto = j.h / FILAS, sw = jarron.width / COLS, sh = jarron.height / FILAS;
      const sonda = document.createElement('canvas');
      sonda.width = jarron.width; sonda.height = jarron.height;
      const px = sonda.getContext('2d', { willReadFrequently: true });
      px.drawImage(jarron, 0, 0);
      piezas = [];
      for (let f = 0; f < FILAS; f++) for (let c = 0; c < COLS; c++) {
        const d = px.getImageData(Math.floor(c * sw) + 2, Math.floor(f * sh) + 2, Math.max(1, Math.floor(sw) - 4), Math.max(1, Math.floor(sh) - 4)).data;
        let llenos = 0;
        for (let i = 3; i < d.length; i += 4) if (d[i] > 60) llenos++;
        if (llenos < (d.length / 4) * 0.35) continue;
        const cx = j.x + c * ancho, cy = j.y + f * alto;
        const lado = (c - (COLS - 1) / 2) / ((COLS - 1) / 2);
        piezas.push({
          f, tw: ancho, th: alto, sx: c * sw, sy: f * sh, sw, sh, hx: cx, hy: cy,
          bx: Math.min(Math.max(cx + lado * j.w * 1.1, ancho), w - ancho * 2),
          by: caja.suelo - alto * (0.4 + Math.random() * 2.2),
          espera: Math.random() * 160
        });
      }
    }
    function pieza(p, x, y) {
      ctx.drawImage(jarron, p.sx, p.sy, p.sw, p.sh, Math.round(x), Math.round(y), Math.ceil(p.tw) + 1, Math.ceil(p.th) + 1);
    }
    function pintar(e) {
      if (!caja) return;
      const { w, h, jarron: j, logo: lg } = caja;
      ctx.clearRect(0, 0, w, h);
      if (e < T.caida) {
        const p = e < T.quieto ? 0 : entra(Math.min(1, (e - T.quieto) / (T.caida - T.quieto)));
        const alza = Math.min(j.h * 0.3, Math.max(0, j.y));
        ctx.drawImage(jarron, j.x, j.y - alza + alza * p, j.w, j.h);
      } else if (e < T.rearmeIni) {
        const p = Math.min(1, (e - T.caida) / (T.asiento - T.caida));
        const total = T.asiento - T.caida;
        piezas.forEach((pz) => {
          const q = Math.max(0, Math.min(1, (p * total - pz.espera) / (total - pz.espera)));
          const k = sale(q);
          pieza(pz, pz.hx + (pz.bx - pz.hx) * k, pz.hy + (pz.by - pz.hy) * (k * k * 0.55 + k * 0.45));
        });
      } else if (e < T.rearmeFin + 60) {
        piezas.forEach((pz) => {
          const arranque = T.rearmeIni + (FILAS - 1 - pz.f) * MS_FILA;
          const q = Math.max(0, Math.min(1, (e - arranque) / (MS_FILA * 2.1)));
          const k = entraSale(q);
          const paso = pz.tw * 0.5;
          const x = Math.round((pz.bx + (pz.hx - pz.bx) * k) / paso) * paso;
          const y = Math.round((pz.by + (pz.hy - pz.by) * k) / paso) * paso;
          pieza(pz, k >= 1 ? pz.hx : x, k >= 1 ? pz.hy : y);
        });
      } else ctx.drawImage(jarron, j.x, j.y, j.w, j.h);
      if (e > T.logoIni && logo) {
        const p = Math.min(1, (e - T.logoIni) / (T.logoFin - T.logoIni));
        const k = sale(p);
        const off = document.createElement('canvas');
        off.width = Math.max(1, Math.ceil(lg.w)); off.height = Math.max(1, Math.ceil(lg.h));
        const o = off.getContext('2d');
        o.drawImage(logo, 0, 0, off.width, off.height);
        o.globalCompositeOperation = 'destination-in';
        const borde = off.width * 0.22;
        const cabeza = -borde + k * (off.width + borde * 2);
        const g = o.createLinearGradient(cabeza - borde, 0, cabeza, 0);
        g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
        o.fillStyle = g; o.fillRect(0, 0, off.width, off.height);
        ctx.globalAlpha = 0.25 + 0.75 * k;
        ctx.drawImage(off, lg.x, lg.y + (1 - k) * lg.h * 0.1, lg.w, lg.h);
        ctx.globalAlpha = 1;
      }
    }
    function frame(t) {
      if (!inicio) inicio = t;
      const e = quieto ? T.fin : Math.min(T.fin, t - inicio);
      pintar(e);
      if (e < T.fin) raf = requestAnimationFrame(frame);
    }
    return {
      play() {
        cancelAnimationFrame(raf);
        carga.then(() => { medir(); inicio = 0; raf = requestAnimationFrame(frame); });
      },
      stop() { cancelAnimationFrame(raf); }
    };
  }
  window.LogoTaller = { armar, listo: () => listo };
})();
