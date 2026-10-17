/* Adaptado de conferencia-utm/slides/js/escenas.js y del voxel de la landing.
   Un renderer, una escena viva, sin GSAP. El texto sigue siendo el contenido. */
(function () {
  'use strict';
  const T = window.THREE;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const css = getComputedStyle(document.documentElement);
  const token = (name, fallback) => css.getPropertyValue(name).trim() || fallback;
  const palette = {
    cream: token('--crema', '#f9f5d2'), forest: token('--verde', '#1d2b22'),
    yellow: token('--amarillo', '#efe978'), clay: token('--terracota', '#c45b2d'),
    olive: token('--oliva', '#ccc665')
  };
  const captions = {
    titulo: ['Ideas dispersas → conexiones con propósito.', 'Una red conecta personas, información y herramientas.'],
    cierre: ['Del trabajo aislado a una red de colaboración.', 'La tecnología conecta; las personas deciden.'],
    fuego: ['Fuego · una herramienta amplía nuestra capacidad.', 'Internet · la información se conecta.', 'Agentes · herramientas coordinadas alrededor de un objetivo.'],
    revoluciones: ['Cinco transformaciones · no son una escala de superioridad.', '1 · Vapor: amplificar la fuerza.', '2 · Electricidad: distribuir la energía.', '3 · Computación: automatizar reglas.', '4 · Digital: conectar información y procesos.', '5 · Agentes: coordinar acciones con un objetivo.', 'Hipótesis, no pronóstico: la rampa no es una sexta revolución demostrada.'],
    agentes: ['Percibir → razonar → actuar → verificar → volver a observar.', '1 · Percibir: observar el estado real.', '2 · Razonar: proponer el siguiente paso.', '3 · Actuar: usar herramientas, con autorización humana cuando corresponde.', '4 · Verificar: revisar el resultado antes de repetir.'],
    telar: ['El jarrón · un oficio hecho de piezas concretas.', 'Separar las piezas para entender el proceso.', 'La greca · las mismas piezas, un proceso tejido.']
  };
  let renderer = null, current = null, section = null, host = null, state = 0;
  let failed = !T, raf = 0, time = 0, previous = 0, inView = true;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const smooth = t => t * t * (3 - 2 * t);
  function random(seed) {
    return () => {
      seed |= 0; seed = seed + 0x6d2b79f5 | 0;
      let n = Math.imul(seed ^ seed >>> 15, 1 | seed);
      n = n + Math.imul(n ^ n >>> 7, 61 | n) ^ n;
      return ((n ^ n >>> 14) >>> 0) / 4294967296;
    };
  }
  function base(width, height, lit = false) {
    const scene = new T.Scene();
    const camera = new T.OrthographicCamera(-width / 2, width / 2, height / 2, -height / 2, .1, 150);
    camera.position.set(0, 0, 35);
    const group = new T.Group(); scene.add(group);
    if (lit) {
      scene.add(new T.AmbientLight(palette.cream, .8));
      const key = new T.DirectionalLight(palette.cream, 1.2); key.position.set(4, 8, 12); scene.add(key);
      const fill = new T.DirectionalLight(palette.clay, .45); fill.position.set(-5, -2, 4); scene.add(fill);
    }
    return { scene, camera, group, width, height, set() {}, tick() {} };
  }
  function material(color, extra = {}) {
    return new T.MeshStandardMaterial({ color, roughness: .85, metalness: 0, ...extra });
  }
  function label(text, width = 3, color = palette.cream) {
    const canvas = document.createElement('canvas'); canvas.height = 112;
    const ctx = canvas.getContext('2d'), font = '500 46px Zalando, sans-serif';
    ctx.font = font; canvas.width = Math.ceil(ctx.measureText(text).width) + 32;
    ctx.font = font; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = color; ctx.fillText(text, canvas.width / 2, 56);
    const texture = new T.CanvasTexture(canvas); texture.minFilter = T.LinearFilter;
    const sprite = new T.Sprite(new T.SpriteMaterial({ map: texture, transparent: true, depthTest: false }));
    sprite.scale.set(width, width * 112 / canvas.width, 1); return sprite;
  }
  function lines(points, color = palette.olive, opacity = .4, dashed = false) {
    const geometry = new T.BufferGeometry().setFromPoints(points);
    const m = dashed ? new T.LineDashedMaterial({ color, transparent: true, opacity, dashSize: .14, gapSize: .1 })
      : new T.LineBasicMaterial({ color, transparent: true, opacity });
    const line = new T.Line(geometry, m);
    if (dashed) line.computeLineDistances();
    return line;
  }
  function circle(radius, z = 0, count = 96) {
    return Array.from({ length: count + 1 }, (_, i) => new T.Vector3(Math.cos(i / count * Math.PI * 2) * radius, Math.sin(i / count * Math.PI * 2) * radius, z));
  }
  function particles(count) {
    const geometry = new T.BufferGeometry();
    const from = new Float32Array(count * 3), to = new Float32Array(count * 3);
    const colorsA = new Float32Array(count * 3), colorsB = new Float32Array(count * 3);
    geometry.setAttribute('position', new T.BufferAttribute(from, 3));
    geometry.setAttribute('destination', new T.BufferAttribute(to, 3));
    geometry.setAttribute('colorA', new T.BufferAttribute(colorsA, 3));
    geometry.setAttribute('colorB', new T.BufferAttribute(colorsB, 3));
    const uniforms = { blend: { value: 1 }, clock: { value: 0 }, fire: { value: 0 }, pixel: { value: 1 } };
    const m = new T.ShaderMaterial({
      transparent: true, depthWrite: false, uniforms,
      vertexShader: `attribute vec3 destination, colorA, colorB;
        uniform float blend, clock, fire, pixel; varying vec3 tint;
        void main() {
          vec3 p = mix(position, destination, blend);
          p.x += fire * sin(clock * 2.2 + p.y * 2.5 + p.z) * .12;
          p.y += fire * sin(clock * 3.0 + p.x * 6.0) * .13;
          tint = mix(colorA, colorB, blend);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
          gl_PointSize = (3.1 + fire * 1.5) * pixel;
        }`,
      fragmentShader: `varying vec3 tint;
        void main() { float r = length(gl_PointCoord - .5); if (r > .5) discard;
          gl_FragColor = vec4(tint, (1.0 - smoothstep(.18, .5, r)) * .9); }`
    });
    const mesh = new T.Points(geometry, m); mesh.frustumCulled = false;
    let elapsed = 1, initialized = false;
    return {
      mesh,
      target(shape, colors, immediate) {
        const mix = uniforms.blend.value;
        for (let i = 0; i < from.length; i++) {
          from[i] = initialized ? from[i] + (to[i] - from[i]) * mix : shape[i];
          colorsA[i] = initialized ? colorsA[i] + (colorsB[i] - colorsA[i]) * mix : colors[i];
        }
        to.set(shape); colorsB.set(colors); initialized = true;
        elapsed = immediate ? 1 : 0; uniforms.blend.value = elapsed;
        Object.values(geometry.attributes).forEach(a => { a.needsUpdate = true; });
      },
      tick(t, dt, reduced, fire) {
        elapsed = reduced ? 1 : Math.min(1, elapsed + dt / 1.35);
        uniforms.blend.value = smooth(elapsed); uniforms.clock.value = reduced ? 0 : t;
        uniforms.fire.value = fire; uniforms.pixel.value = renderer.getPixelRatio();
      }
    };
  }
  function pointColors(count, choices, rnd) {
    const colors = choices.map(c => new T.Color(c)), values = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const color = colors[Math.floor(rnd() * colors.length)]; color.toArray(values, i * 3);
    }
    return values;
  }
  function titleScene() {
    const s = base(11.5, 8), rnd = random(83), count = 1400, p = particles(count);
    const cloud = new Float32Array(count * 3), network = new Float32Array(count * 3), nodes = [];
    for (let layer = 0; layer < 5; layer++) {
      for (let row = 0; row < 5; row++) nodes.push(new T.Vector3((layer - 2) * 1.8, (row - 2) * 1.1, Math.sin(row * 1.7 + layer) * .6));
    }
    const edgePoints = [];
    for (let i = 0; i < count; i++) {
      const a = rnd() * Math.PI * 2, y = rnd() * 2 - 1, r = Math.cbrt(rnd()) * 3.7;
      cloud.set([Math.cos(a) * Math.sqrt(1 - y * y) * r * 1.2, y * r * .8, Math.sin(a) * r * .5], i * 3);
      const layer = i % 4, start = nodes[layer * 5 + Math.floor(rnd() * 5)], end = nodes[(layer + 1) * 5 + Math.floor(rnd() * 5)];
      const mix = i % 4 === 0 ? 0 : rnd();
      network.set([start.x + (end.x - start.x) * mix, start.y + (end.y - start.y) * mix, start.z + (end.z - start.z) * mix], i * 3);
      if (i < 70) edgePoints.push(start, end);
    }
    const edges = new T.LineSegments(new T.BufferGeometry().setFromPoints(edgePoints), new T.LineBasicMaterial({ color: palette.olive, transparent: true, opacity: 0 }));
    s.group.add(edges, p.mesh);
    const colors = pointColors(count, [palette.cream, palette.yellow, palette.clay], rnd);
    let selected = 0, auto = false, age = 0;
    s.set = (next, immediate) => { selected = next; auto = false; age = 0; p.target(next ? network : cloud, colors, immediate); };
    s.tick = (t, dt, reduced) => {
      age += dt;
      if (!selected && !auto && !reduced && age > 2) { auto = true; p.target(network, colors, false); }
      p.tick(t, dt, reduced, 0);
      edges.material.opacity = selected || auto ? p.mesh.material.uniforms.blend.value * .2 : 0;
      s.group.rotation.y = reduced ? .12 : Math.sin(t * .18) * .18;
    };
    return s;
  }
  function fireScene() {
    const s = base(9, 8), rnd = random(412), count = 1500, p = particles(count);
    const shapes = [new Float32Array(count * 3), new Float32Array(count * 3), new Float32Array(count * 3)];
    const rotation = new T.Quaternion(), v = new T.Vector3();
    for (let i = 0; i < count; i++) {
      const h = rnd(), a = rnd() * Math.PI * 2, r = (1 - h) * Math.sqrt(rnd());
      shapes[0].set([Math.cos(a) * r * 1.45 + Math.sin(h * 6) * .2, h * 4.7 - 2.3, Math.sin(a) * r], i * 3);
      const y = 1 - 2 * (i + .5) / count, theta = i * Math.PI * (3 - Math.sqrt(5));
      shapes[1].set([Math.cos(theta) * Math.sqrt(1 - y * y) * 2.4, y * 2.4, Math.sin(theta) * Math.sqrt(1 - y * y) * 2.4], i * 3);
      const ring = i % 5;
      rotation.setFromEuler(new T.Euler(ring * .5, ring * .7, ring * .35));
      v.set(Math.cos(a) * 2.5, Math.sin(a) * 2.5, 0).applyQuaternion(rotation);
      v.toArray(shapes[2], i * 3);
    }
    const colors = [pointColors(count, [palette.clay, palette.yellow, palette.cream], rnd), pointColors(count, [palette.olive, palette.cream], rnd), pointColors(count, [palette.yellow, palette.clay, palette.cream], rnd)];
    const arcs = new T.Group();
    for (let i = 0; i < 12; i++) {
      const start = new T.Vector3().fromArray(shapes[1], i * 93 * 3);
      const end = new T.Vector3().fromArray(shapes[1], ((i * 127 + 310) % count) * 3);
      const mid = start.clone().add(end).normalize().multiplyScalar(3.3);
      arcs.add(lines(new T.QuadraticBezierCurve3(start, mid, end).getPoints(24), palette.yellow, .4));
    }
    const core = new T.Mesh(new T.IcosahedronGeometry(.55, 1), new T.MeshBasicMaterial({ color: palette.clay, wireframe: true }));
    s.group.add(p.mesh, arcs, core);
    let selected = 0;
    s.set = (next, immediate) => { selected = next; p.target(shapes[next], colors[next], immediate); arcs.visible = next === 1; core.visible = next === 2; };
    s.tick = (t, dt, reduced) => {
      p.tick(t, dt, reduced, selected === 0 ? 1 : 0);
      s.group.rotation.y = reduced || selected === 0 ? 0 : t * .12;
      core.rotation.x = reduced ? .3 : t * .3;
    };
    return s;
  }
  function revolutionScene() {
    const s = base(17, 11, true), blocks = [], labels = [], colors = [palette.clay, palette.cream, palette.olive, palette.yellow, palette.clay];
    const names = ['Vapor', 'Electricidad', 'Computación', 'Digital', 'Agentes'];
    s.group.rotation.y = -.24; s.group.rotation.x = .15; s.group.position.y = -.7;
    names.forEach((name, i) => {
      const height = .8 + i * .68;
      const box = new T.Mesh(new T.BoxGeometry(1.65, height, 1.7), material(colors[i], { transparent: true }));
      box.position.set(-5.5 + i * 2.15, height / 2 - 2, 0); s.group.add(box); blocks.push(box);
      const text = label(`${i + 1} · ${name}`, 2.4); text.position.set(box.position.x, height - 1.45 + (i % 2) * .25, 1); s.group.add(text); labels.push(text);
      const icon = new T.Mesh(i === 0 ? new T.TorusGeometry(.28, .09, 6, 16) : i === 1 ? new T.OctahedronGeometry(.34) : i === 2 ? new T.BoxGeometry(.6, .4, .15) : i === 3 ? new T.IcosahedronGeometry(.34, 0) : new T.TorusKnotGeometry(.22, .06, 36, 6), material(colors[i]));
      icon.position.set(box.position.x, height - .9, 0); s.group.add(icon);
    });
    const ramp = new T.Group(), points = [];
    for (let i = 0; i <= 50; i++) { const t = i / 50; points.push(new T.Vector3(4.1 + t * 3, 1.6 + t * t * 3.5, 0)); }
    ramp.add(lines(points, palette.yellow, .85, true));
    const hypothesis = label('¿Y después? · hipótesis', 3.6, palette.yellow); hypothesis.position.set(4.6, 4.9, 0); ramp.add(hypothesis); s.group.add(ramp);
    let selected = 0, focus = 0, zoom = 1;
    s.set = next => {
      selected = next; ramp.visible = next === 6;
      blocks.forEach((b, i) => { b.material.opacity = next === 0 || next === 6 || i + 1 === next ? 1 : .25; });
      labels.forEach((l, i) => { l.material.opacity = next === 0 || next === 6 || i + 1 === next ? 1 : .45; });
    };
    s.tick = (t, dt, reduced) => {
      const target = selected > 0 && selected < 6 ? -blocks[selected - 1].position.x * .18 : 0;
      const amount = reduced ? 1 : 1 - Math.exp(-dt * 5);
      focus += (target - focus) * amount; zoom += ((selected > 0 && selected < 6 ? 1.12 : 1) - zoom) * amount;
      s.group.position.x = focus; s.camera.zoom = zoom; s.camera.updateProjectionMatrix();
    };
    return s;
  }
  function agentScene() {
    const s = base(11, 12, true), radius = 2.8, nodes = [], names = ['Percibir', 'Razonar', 'Actuar', 'Verificar'];
    const path = lines(circle(radius), palette.olive, .6); s.group.add(path);
    names.forEach((name, i) => {
      const angle = Math.PI / 2 - i * Math.PI / 2;
      const node = new T.Mesh(new T.SphereGeometry(.25, 16, 12), material(palette.olive));
      node.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius, 0); nodes.push(node); s.group.add(node);
      const text = label(name, 2.15); text.position.set(Math.cos(angle) * 4.2, Math.sin(angle) * 3.65, .2); s.group.add(text);
      const arrowAngle = angle - Math.PI / 4;
      const arrow = new T.Mesh(new T.ConeGeometry(.12, .33, 3), new T.MeshBasicMaterial({ color: palette.olive }));
      arrow.position.set(Math.cos(arrowAngle) * radius, Math.sin(arrowAngle) * radius, 0); arrow.rotation.z = arrowAngle - Math.PI; s.group.add(arrow);
    });
    const center = label('Objetivo', 2.3, palette.yellow); s.group.add(center);
    const gate = lines([new T.Vector3(1.35, -2.8, .4), new T.Vector3(2.8, -1.35, .4)], palette.clay, 1);
    const approval = label('Aprobación humana', 3.5, palette.yellow); approval.position.set(1.7, -4.5, .2);
    s.group.add(gate, approval);
    const approvalLink = lines([new T.Vector3(1.7, -4.1, .1), new T.Vector3(2.1, -2.1, .1)], palette.clay, .7, true); s.group.add(approvalLink);
    const pulse = new T.Mesh(new T.SphereGeometry(.11, 12, 8), new T.MeshBasicMaterial({ color: palette.yellow })); s.group.add(pulse);
    let selected = 0;
    s.set = next => {
      selected = next;
      nodes.forEach((n, i) => { n.material.color.set(next === i + 1 ? palette.yellow : palette.olive); n.scale.setScalar(next === i + 1 ? 1.5 : 1); });
      gate.material.color.set(next === 3 ? palette.yellow : palette.clay);
      approval.material.opacity = next === 3 || next === 0 ? 1 : .65;
    };
    s.tick = (t, dt, reduced) => {
      // El pulso se detiene en la etapa revelada: nunca finge una autorización.
      const angle = selected ? Math.PI / 2 - (selected - 1) * Math.PI / 2 : Math.PI / 2;
      pulse.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius, .35);
      pulse.scale.setScalar(reduced ? 1 : 1 + Math.sin(t * 2) * .14);
    };
    return s;
  }
  // Retículas originales de la diseñadora: landing/src/scripts/animations/voxel.js.
  // No son una aproximación geométrica: son el jarrón y la greca de la marca.
  const JAR = [
    '.......t...........', '.......t.t.........', '........t..t.......', '...................',
    '..........t........', '......cc...cc......', '......aa...aa......', '......aat.taa......',
    '.....c..t.t..c.....', '...aa.........aa...', '...aa...t.....aa...', '..c.............aa.',
    'cc....ttttttt....aa', 'aa....tttttt.....aa', 'aa....ttttttt....aa', 'aa...tttttttt....aa',
    'aa..ttttttttttt..aa', 'aa..ttttttttttt..aa', 'aa..ttttttttttt..aa', 'aa...ttttttttt...aa',
    'aa....ttttttt....aa', 'aa....ttttttt....aa', 'aa....ttttttt....aa', 'aa.....ttttt.....aa',
    '.aaaaaatttttaaaaaa.', '..aaaaaaaaaaaaaaa..'
  ];
  const WEAVE = [
    '....v.v.v....', '.....v.v.....', '..v.v...v.v..', '...v..v..v...', 'v.v..vvv..v.v',
    '.v..vvtvv..v.', 'v..vvtvtvv..v', '.v..vvtvv..v.', 'v.v..vvv..v.v', '...v..v..v...',
    '..v.v...v.v..', '.....v.v.....', '....v.v.v....'
  ];
  function cells(grid) {
    const result = [];
    grid.forEach((row, y) => Array.from(row).forEach((color, x) => { if (color !== '.') result.push([x, y, color]); }));
    return result;
  }
  function loomScene() {
    const s = base(32, 35, true), source = cells(JAR), dest = cells(WEAVE), rnd = random(20260721);
    const colors = { a: new T.Color(palette.yellow), t: new T.Color(palette.clay), c: new T.Color(palette.cream), v: new T.Color(palette.olive) };
    const mesh = new T.InstancedMesh(new T.BoxGeometry(.92, .92, 1), material(0xffffff), source.length);
    mesh.instanceMatrix.setUsage(T.DynamicDrawUsage); mesh.frustumCulled = false; s.group.add(mesh);
    const shapes = [[], [], []], colorTargets = [[], [], []], rotations = [];
    source.forEach(([x, y, c], i) => {
      shapes[0].push(new T.Vector3(x - 9, 12.5 - y, 0));
      shapes[1].push(new T.Vector3((x - 9) * .8 + (rnd() - .5) * 9, (12.5 - y) * .7 + (rnd() - .5) * 9, (rnd() - .5) * 7));
      const [dx, dy, dc] = dest[i % dest.length];
      shapes[2].push(new T.Vector3((dx - 6) * 1.48, (6 - dy) * 1.48, [-.72, 0, .72, -1.15][Math.floor(i / dest.length)]));
      colorTargets[0].push(colors[c]); colorTargets[1].push(colors[c]); colorTargets[2].push(colors[dc]);
      rotations.push(new T.Vector3(rnd() * Math.PI, rnd() * Math.PI, rnd() * Math.PI));
    });
    const positions = shapes[0].map(v => v.clone()), from = positions.map(v => v.clone());
    const currentColors = colorTargets[0].map(c => c.clone()), fromColors = currentColors.map(c => c.clone());
    const dummy = new T.Object3D();
    let selected = 0, progress = 1, scatter = 0, fromScatter = 0, size = 1, fromSize = 1;
    s.set = (next, immediate) => {
      positions.forEach((p, i) => { from[i].copy(p); fromColors[i].copy(currentColors[i]); });
      fromScatter = scatter; fromSize = size; selected = next; progress = immediate ? 1 : 0;
    };
    s.tick = (t, dt, reduced) => {
      progress = reduced ? 1 : Math.min(1, progress + dt / 1.3);
      const mix = smooth(progress);
      scatter = fromScatter + ((selected === 1 ? 1 : 0) - fromScatter) * mix;
      size = fromSize + ((selected === 2 ? 1.48 : 1) - fromSize) * mix;
      for (let i = 0; i < source.length; i++) {
        positions[i].lerpVectors(from[i], shapes[selected][i], mix); dummy.position.copy(positions[i]);
        dummy.rotation.set(rotations[i].x * scatter, rotations[i].y * scatter, rotations[i].z * scatter);
        dummy.scale.set(size, size, selected === 2 ? .72 : 1.25); dummy.updateMatrix(); mesh.setMatrixAt(i, dummy.matrix);
        currentColors[i].copy(fromColors[i]).lerp(colorTargets[selected][i], mix); mesh.setColorAt(i, currentColors[i]);
      }
      mesh.instanceMatrix.needsUpdate = true; mesh.instanceColor.needsUpdate = true;
      mesh.rotation.y = reduced ? .14 : Math.sin(t * .42) * (selected === 2 ? .16 : .3);
      mesh.rotation.x = reduced ? .03 : Math.sin(t * .31) * .05;
    };
    return s;
  }
  const factories = { titulo: titleScene, cierre: titleScene, fuego: fireScene, revoluciones: revolutionScene, agentes: agentScene, telar: loomScene };
  function stop() { cancelAnimationFrame(raf); raf = 0; previous = 0; }
  function dispose() {
    if (!current) return;
    const geometries = new Set(), materials = new Set(), textures = new Set();
    current.scene.traverse(object => {
      if (object.geometry) geometries.add(object.geometry);
      if (object.material) (Array.isArray(object.material) ? object.material : [object.material]).forEach(m => { materials.add(m); if (m.map) textures.add(m.map); });
      if (object.isInstancedMesh && object.dispose) object.dispose();
    });
    textures.forEach(t => t.dispose()); materials.forEach(m => m.dispose()); geometries.forEach(g => g.dispose());
    current = null;
    if (renderer) renderer.renderLists.dispose();
  }
  function fallback() {
    failed = true; stop();
    if (host) delete host.dataset.sceneReady;
    if (renderer) renderer.domElement.hidden = true;
    dispose();
  }
  function initialize() {
    if (renderer || failed) return;
    try {
      renderer = new T.WebGLRenderer({ alpha: true, antialias: false, powerPreference: 'low-power' });
      renderer.domElement.className = 'escena-lienzo escena-render';
      renderer.domElement.setAttribute('aria-hidden', 'true');
      renderer.setClearColor(palette.forest, 0);
      renderer.outputEncoding = T.sRGBEncoding;
      renderer.domElement.addEventListener('webglcontextlost', event => { event.preventDefault(); fallback(); });
      renderer.domElement.addEventListener('webglcontextrestored', () => {
        renderer.dispose(); renderer.domElement.remove(); renderer = null; failed = false;
        if (section) { const saved = section; section = null; set(saved, state); }
      });
    } catch (error) { fallback(); }
  }
  function resize() {
    if (!renderer || !host || !current || failed) return;
    const width = host.clientWidth, height = host.clientHeight;
    if (width < 1 || height < 1) { stop(); return; }
    // Menos de 900k píxeles, incluso con un monitor de alta densidad.
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5, Math.sqrt(900000 / (width * height)));
    renderer.setPixelRatio(dpr); renderer.setSize(width, height, false);
    const aspect = width / height, span = Math.max(current.height, current.width / aspect);
    current.camera.left = -span * aspect / 2; current.camera.right = span * aspect / 2;
    current.camera.top = span / 2 - span * .06; current.camera.bottom = -span / 2 - span * .06;
    current.camera.updateProjectionMatrix();
    resume();
  }
  function draw(dt) {
    if (!current || failed || !host || document.hidden || !inView) return;
    current.tick(time, dt, motion.matches);
    renderer.render(current.scene, current.camera);
    host.dataset.sceneReady = '';
  }
  function frame(now) {
    raf = 0;
    if (!current || failed || document.hidden || !inView || motion.matches || !host.clientWidth || !host.clientHeight) return;
    const dt = previous ? Math.min((now - previous) / 1000, .06) : 0;
    previous = now; time += dt;
    draw(dt); raf = requestAnimationFrame(frame);
  }
  function resume() {
    stop();
    if (!current || failed || document.hidden || !inView || !host.clientWidth || !host.clientHeight) return;
    draw(0);
    if (!motion.matches) raf = requestAnimationFrame(frame);
  }
  const observer = typeof IntersectionObserver === 'function' ? new IntersectionObserver(entries => {
    const entry = entries.find(e => e.target === host);
    if (!entry) return;
    inView = entry.isIntersecting; resume();
  }) : null;
  const sizing = typeof ResizeObserver === 'function' ? new ResizeObserver(resize) : null;
  function set(next, requested = 0) {
    const name = next && next.dataset && next.dataset.escena;
    if (!Object.prototype.hasOwnProperty.call(factories, name)) next = null;
    if (!next) {
      stop(); observer?.disconnect(); sizing?.disconnect();
      if (host) delete host.dataset.sceneReady;
      if (renderer) renderer.domElement.remove();
      dispose(); section = null; host = null; return;
    }
    const nextHost = next.querySelector('[data-scene-host]');
    if (!nextHost) { set(null); return; }
    const nextState = clamp(Number.isFinite(requested) ? Math.floor(requested) : 0, 0, captions[name].length - 1);
    if (next === section && current && nextState === state) { resume(); return; }
    if (next !== section) {
      stop(); observer?.disconnect(); sizing?.disconnect();
      if (host) delete host.dataset.sceneReady;
      dispose(); time = 0; section = next; host = nextHost; inView = true;
      initialize();
      if (!failed) { host.appendChild(renderer.domElement); current = factories[name](); }
      observer?.observe(host); sizing?.observe(host);
    }
    state = nextState;
    let caption = host.querySelector('.escena-estado');
    if (!caption) { caption = document.createElement('p'); caption.className = 'escena-estado'; host.appendChild(caption); }
    caption.textContent = captions[name][state];
    host.dataset.sceneState = String(state);
    if (current) { current.set(state, motion.matches || time === 0); resize(); }
  }
  window.Escenas = {
    set, stop,
    get ok() { return !failed; },
    get status() { return { scene: section?.dataset.escena || null, state, running: Boolean(raf), reducedMotion: motion.matches, available: !failed, rendererCount: renderer ? 1 : 0 }; }
  };
  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', resume);
  motion.addEventListener('change', () => { if (current) current.set(state, true); resume(); });
  // Las etiquetas usan la tipografía de marca también si las fuentes llegan tarde.
  if (document.fonts) document.fonts.ready.then(() => {
    if (section && current) { const saved = section, savedState = state; set(null); set(saved, savedState); }
  });
})();
