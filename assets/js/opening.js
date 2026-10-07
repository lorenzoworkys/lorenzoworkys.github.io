/* Aperture da "lancio": una breve scena, poi il titolo, la data e l'indice.
   La scena resta ferma sullo schermo per un lungo tratto di scorrimento: scorrere la fa
   andare più svelta, ma per uscirne bisogna scendere davvero. In fondo sfuma nella pagina.
   Si vede per intero la prima volta; nella stessa sessione si parte già dal titolo. */
(function () {
  const op = document.querySelector('.opening');
  if (!op) return;
  const motion = document.documentElement.classList.contains('motion');
  const key = 'lore-intro:' + location.pathname;
  let seen = false;
  try { seen = sessionStorage.getItem(key) === '1'; sessionStorage.setItem(key, '1'); } catch (e) {}

  // tutta la scena dentro un contenitore che resta fermo mentre la pagina scorre
  const stage = document.createElement('div');
  stage.className = 'op-sticky';
  while (op.firstChild) stage.appendChild(op.firstChild);
  op.appendChild(stage);
  op.classList.add('wrapped');
  if (motion) op.classList.add('pinned');

  // i momenti dell'introduzione, in proporzione allo scorrimento dentro l'apertura
  const LIT = 0.04, TITLE = 0.14, DONE = 0.24, EXIT = 0.36;

  const timers = [];
  const at = (ms, fn) => timers.push(setTimeout(fn, ms));
  function lit() { op.classList.add('lit'); }
  function titled() { if (!op.classList.contains('titled')) { lit(); op.classList.add('titled'); scene.titled(); } }
  function done() { titled(); op.classList.add('done'); }
  function finish() { timers.forEach(clearTimeout); done(); }

  op.querySelector('.op-skip').addEventListener('click', () => {
    finish();
    const end = op.getBoundingClientRect().bottom + window.scrollY - window.innerHeight * 0.55;
    window.scrollTo({ top: end, behavior: motion ? 'smooth' : 'auto' });
  });

  // la scena si ferma quando non si vede
  let visible = true;
  if ('IntersectionObserver' in window) new IntersectionObserver((es) => { visible = es[0].isIntersecting; }).observe(op);

  const scene = op.classList.contains('opening-hunter') ? hunter() : collage();

  /* ---------- Scorrimento: accelera l'introduzione, poi guida l'uscita ---------- */
  let ticking = false;
  function onScroll() {
    ticking = false;
    const room = op.offsetHeight - stage.offsetHeight;
    if (room <= 0) return;
    const p = Math.max(0, Math.min(1, -op.getBoundingClientRect().top / room));
    if (p > LIT) lit();
    if (p > TITLE) titled();
    if (p > DONE) done();
    const x = Math.max(0, Math.min(1, (p - EXIT) / (1 - EXIT)));
    op.style.setProperty('--x', x.toFixed(3));
    scene.exit(x);
  }
  if (motion) {
    window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
    window.addEventListener('resize', onScroll);
  }

  if (!motion || seen) { finish(); onScroll(); return; }
  at(120, lit);
  scene.play();
  onScroll();

  /* ---------- Il cacciatore: venti caselle, un agente, il cibo ---------- */
  function hunter() {
    const row = stage.querySelector('.op-world');
    const W = 20, cells = [];
    for (let i = 0; i < W; i++) { const c = document.createElement('i'); c.style.setProperty('--i', i); cells.push(row.appendChild(c)); }
    let agent = -1, food = -1, every = 170, catches = 0, running = false;
    function draw() { cells.forEach((c, i) => { c.className = i === agent ? 'agent' : (i === food ? 'food' : ''); }); }
    function newFood() { let f; do { f = Math.floor(Math.random() * W); } while (Math.abs(f - agent) < 4); food = f; }
    function step() {
      if (visible) {
        if (agent === food) { catches++; newFood(); if (catches === 2) { titled(); at(2600, done); } }
        else agent += food > agent ? 1 : -1;
        draw();
      }
      setTimeout(step, every);
    }
    function start() { if (running) return; running = true; agent = 3; food = 15; draw(); setTimeout(step, 500); }
    return {
      play() { at(1500, start); at(6000, () => { titled(); at(2600, done); }); },
      titled() { every = 650; start(); },
      exit() {}
    };
  }

  /* ---------- Collage: fogli strappati che si aprono su un orizzonte ---------- */
  function collage() {
    stage.querySelectorAll('.op-strip').forEach((s, k) => {
      let seed = 7 + k * 13;
      const r = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
      const left = [], right = [];
      for (let y = 0; y <= 100; y += 2.5) { left.push((r() * 1.6).toFixed(2) + '% ' + y + '%'); right.push((98.4 + r() * 1.6).toFixed(2) + '% ' + y + '%'); }
      s.style.clipPath = 'polygon(' + left.concat(right.reverse()).join(', ') + ')';
    });
    const base = () => parseFloat(getComputedStyle(op).getPropertyValue('--w-base')) || 60;
    return {
      play() { at(1500, titled); at(4200, done); },
      titled() {},
      // uscendo, l'orizzonte si allarga e i fogli si fanno da parte
      exit(x) { const b = base(); op.style.setProperty('--w', (b + (100 - b) * x * x).toFixed(2)); }
    };
  }
})();
