/* Aperture da "lancio": una breve scena, poi il titolo, la data e l'indice.
   Si vede per intero la prima volta; nella stessa sessione si va dritti alla fine. */
(function () {
  const op = document.querySelector('.opening');
  if (!op) return;
  const motion = document.documentElement.classList.contains('motion');
  const key = 'lore-intro:' + location.pathname;
  let seen = false;
  try { seen = sessionStorage.getItem(key) === '1'; sessionStorage.setItem(key, '1'); } catch (e) {}

  const timers = [];
  const at = (ms, fn) => timers.push(setTimeout(fn, ms));
  let finished = false;
  function finish() {
    if (finished) return;
    finished = true;
    timers.forEach(clearTimeout);
    op.classList.add('lit', 'titled', 'done');
    scene.calm();
  }
  op.querySelector('.op-skip').addEventListener('click', finish);

  // la scena si ferma quando non si vede
  let visible = true;
  if ('IntersectionObserver' in window) new IntersectionObserver((es) => { visible = es[0].isIntersecting; }).observe(op);

  const scene = op.classList.contains('opening-hunter') ? hunter() : vision();

  if (!motion || seen) { finish(); return; }
  at(120, () => op.classList.add('lit'));
  scene.play();

  /* ---------- Il cacciatore: venti caselle, un agente, il cibo ---------- */
  function hunter() {
    const row = op.querySelector('.op-world');
    const W = 20, cells = [];
    for (let i = 0; i < W; i++) { const c = document.createElement('i'); c.style.setProperty('--i', i); cells.push(row.appendChild(c)); }
    let agent = -1, food = -1, every = 170, catches = 0, running = false;
    function draw() { cells.forEach((c, i) => { c.className = i === agent ? 'agent' : (i === food ? 'food' : ''); }); }
    function newFood() { let f; do { f = Math.floor(Math.random() * W); } while (Math.abs(f - agent) < 4); food = f; }
    function step() {
      if (visible) {
        if (agent === food) { catches++; newFood(); if (catches === 2 && !finished) title(); }
        else agent += food > agent ? 1 : -1;
        draw();
      }
      setTimeout(step, every);
    }
    function start() { if (running) return; running = true; agent = 3; food = 15; draw(); setTimeout(step, 600); }
    function title() {
      op.classList.add('titled');
      every = 650;
      at(2600, () => op.classList.add('done'));
      finishedSoon();
    }
    function finishedSoon() { at(2700, () => { finished = true; }); }
    return {
      play() { at(1500, start); at(6000, () => { if (!op.classList.contains("titled")) title(); }); },
      calm() { every = 650; start(); }
    };
  }

  /* ---------- Visione: fogli strappati che si aprono su un orizzonte ---------- */
  function vision() {
    // bordi strappati verticali, diversi per ogni foglio
    op.querySelectorAll('.op-strip').forEach((s, k) => {
      let seed = 7 + k * 13;
      const r = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
      const left = [], right = [];
      for (let y = 0; y <= 100; y += 2.5) { left.push((r() * 1.6).toFixed(2) + '% ' + y + '%'); right.push((98.4 + r() * 1.6).toFixed(2) + '% ' + y + '%'); }
      s.style.clipPath = 'polygon(' + left.concat(right.reverse()).join(', ') + ')';
    });
    // scorrendo, l'orizzonte si allarga e i fogli si fanno da parte
    const base = parseFloat(getComputedStyle(op).getPropertyValue("--w")) || 60;
    let ticking = false;
    function update() {
      ticking = false;
      const p = Math.max(0, Math.min(1, window.scrollY / (op.offsetHeight * 0.75)));
      op.style.setProperty('--w', (base + (100 - base) * p * p).toFixed(2));
    }
    if (motion) window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    return {
      play() { at(1500, () => op.classList.add('titled')); at(4200, () => { op.classList.add('done'); finished = true; }); },
      calm() {}
    };
  }
})();
