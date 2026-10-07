/* Pagina principale: note, figure animate, anteprima del cacciatore. */
(function () {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (id) => document.getElementById(id);
  const ease = (t) => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); };
  const set = (node, attrs) => { for (const k in attrs) node.setAttribute(k, attrs[k]); };

  /* ---------- Contatti dal file di configurazione ---------- */
  const cfg = window.LAB_CONFIG || {};
  if (cfg.email) $('mail-link').href = 'mailto:' + cfg.email; else $('mail-link').hidden = true;
  if (cfg.github) $('gh-link').href = 'https://github.com/' + cfg.github; else $('gh-link').hidden = true;

  /* ---------- Note ---------- */
  let posts = [];
  let filter = 'Tutte';
  function renderNotes() {
    const list = $('notes-list');
    list.textContent = '';
    const shown = posts.slice().reverse().filter((p) => filter === 'Tutte' || p.tag === filter);
    if (!shown.length) { list.appendChild(Lab.el('p', { class: 'empty', text: 'Nessuna nota in questa sezione, per ora.' })); return; }
    shown.forEach((p) => {
      const href = 'nota.html?id=' + encodeURIComponent(p.id);
      list.appendChild(Lab.el('article', { class: 'note' }, [
        Lab.el('div', { class: 'meta' }, [
          Lab.el('span', { class: 'tag', text: p.tag }), Lab.el('span', { text: p.num }), Lab.el('span', { text: Lab.formatDate(p.created_at) })
        ]),
        Lab.el('h3', {}, [Lab.el('a', { href, text: p.title })]),
        p.dek ? Lab.el('p', { class: 'dek', text: p.dek }) : null,
        Lab.el('p', { class: 'dropcap', text: Lab.excerpt(p.body) }),
        Lab.el('a', { class: 'read-more', href, text: 'Leggi la nota e i commenti →' })
      ]));
    });
    Lab.refresh(list);
  }
  document.querySelectorAll('.filter').forEach((b) => b.addEventListener('click', () => {
    filter = b.dataset.tag;
    document.querySelectorAll('.filter').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    renderNotes();
  }));
  Lab.allPosts().then((rows) => {
    posts = rows;
    if (rows.length) {
      const last = rows[rows.length - 1];
      $('issue').textContent = 'Numero ' + last.num.replace('Nota ', '') + ' · ' + Lab.formatDate(last.created_at);
    }
    renderNotes();
  }).catch(() => {
    $('notes-list').textContent = '';
    $('notes-list').appendChild(Lab.el('p', { class: 'empty', text: 'Le note non si sono caricate. Ricarica la pagina tra qualche secondo.' }));
  });

  /* ---------- Fig. 1: discesa del gradiente ---------- */
  const f = (x) => 0.08 * x ** 4 - 0.6 * x * x + 0.35 * x + 2;
  const grad = (x) => 0.32 * x ** 3 - 1.2 * x + 0.35;
  const sx = (x) => 20 + (x + 3.2) / 6.4 * 520;
  const sy = (y) => 260 - y / 5.6 * 230;
  let d = '';
  for (let i = 0; i <= 120; i++) { const x = -3.2 + i / 120 * 6.4; d += (i ? 'L' : 'M') + sx(x).toFixed(1) + ' ' + sy(f(x)).toFixed(1) + ' '; }
  $('f1-curve').setAttribute('d', d);
  const g1 = { x: 2.9, v: 0, step: 0, fade: 0, disp: f(2.9) };
  function stepGD() {
    if (g1.fade > 0) {
      g1.fade += 1;
      if (g1.fade === 16) { g1.x = (Math.random() < 0.5 ? -1 : 1) * (2.6 + Math.random() * 0.5); g1.v = 0; g1.step = 0; }
      if (g1.fade > 30) g1.fade = 0;
    } else {
      g1.step += 1;
      g1.v = 0.92 * g1.v - 0.005 * grad(g1.x) + (Math.random() - 0.5) * 0.003;
      g1.x = Math.max(-3.2, Math.min(3.2, g1.x + g1.v));
      if (g1.step > 620) g1.fade = 1;
    }
    g1.disp += (f(g1.x) - g1.disp) * 0.035;
  }
  function drawGD() {
    const op = g1.fade === 0 ? 1 : (g1.fade <= 15 ? 1 - g1.fade / 15 : (g1.fade - 15) / 15);
    set($('f1-ball'), { cx: sx(g1.x).toFixed(1), cy: (sy(f(g1.x)) - 11).toFixed(1), opacity: op.toFixed(3) });
    $('f1-loss').textContent = g1.disp.toFixed(2).replace('.', ',');
    const settled = g1.fade === 0 && g1.step > 140 && Math.abs(g1.v) < 0.002;
    const status = settled ? (g1.x < 0 ? 'minimo globale' : 'fermo in un minimo locale') : 'in discesa';
    const st = $('f1-status');
    if (st.textContent !== status) st.textContent = status;
    st.style.opacity = g1.fade === 0 ? 1 : 0;
  }

  /* ---------- Fig. 2: addestramento contro validazione ---------- */
  const X2 = (u) => 48 + 472 * u;
  const T2 = (u) => 232 - 182 * Math.exp(-4.2 * u);
  const V2 = (u) => 62 + 150 * (1 - Math.exp(-5 * u)) - 260 * Math.max(0, u - 0.42) ** 2;
  let umin = 0, best = -1;
  for (let i = 0; i <= 400; i++) { const u = i / 400; if (V2(u) > best) { best = V2(u); umin = u; } }
  const path2 = (fn, end) => {
    let s = ''; const n = Math.max(2, Math.round(100 * end));
    for (let i = 0; i <= n; i++) { const u = end * i / n; s += (i ? 'L' : 'M') + X2(u).toFixed(1) + ' ' + fn(u).toFixed(1) + ' '; }
    return s;
  };
  $('f2-train-full').setAttribute('d', path2(T2, 1));
  $('f2-val-full').setAttribute('d', path2(V2, 1));
  const mx = X2(umin), my = V2(umin);
  $('f2-stop').setAttribute('d', 'M' + mx.toFixed(1) + ' ' + my.toFixed(1) + ' V250');
  set($('f2-m'), { cx: mx.toFixed(1), cy: my.toFixed(1) });
  set($('f2-label'), { x: (mx + 12).toFixed(1), y: (my - 12).toFixed(1) });
  function drawF2(t) {
    const period = 15, k = (t % period);
    const u = reduce ? 1 : ease(k / 10);
    const op = reduce ? 1 : (k < 12.75 ? 1 : 1 - (k - 12.75) / 2.25);
    const cur = reduce ? 0 : (u < 1 ? 1 : Math.max(0, 1 - (k - 10) / 1));
    const e = Math.max(0.001, u);
    $('f2-train').setAttribute('d', path2(T2, e));
    $('f2-val').setAttribute('d', path2(V2, e));
    $('f2-group').setAttribute('opacity', op.toFixed(3));
    $('f2-cursor').setAttribute('d', 'M' + X2(u).toFixed(1) + ' 30 V250');
    $('f2-cursor').setAttribute('opacity', cur.toFixed(3));
    set($('f2-ht'), { cx: X2(u).toFixed(1), cy: T2(u).toFixed(1), opacity: cur.toFixed(3) });
    set($('f2-hv'), { cx: X2(u).toFixed(1), cy: V2(u).toFixed(1), opacity: cur.toFixed(3) });
    $('f2-mark').setAttribute('opacity', Math.max(0, Math.min(1, (u - umin) * 8)).toFixed(3));
  }

  /* ---------- Fig. 3: il segnale attraversa un neurone ---------- */
  const acts = document.querySelectorAll('.f3-act');
  const dots = document.querySelectorAll('.f3-dot');
  const src = [[104, 60], [104, 140], [104, 220]], dst = [[250, 132], [250, 140], [250, 148]];
  let a3 = [0.8, 0.4, 0.6], lastCycle = -1;
  function drawF3(t) {
    if (reduce) return;
    const period = 8.5, cycle = Math.floor(t / period), q = (t % period) / period;
    if (cycle !== lastCycle) { lastCycle = cycle; a3 = [0, 1, 2].map(() => 0.25 + Math.random() * 0.75); }
    const L = (a, b, s) => a + (b - a) * s;
    const tin = ease(q / 0.32), ring = ease((q - 0.3) / 0.2), tout = ease((q - 0.48) / 0.26);
    const aOp = q < 0.06 ? ease(q / 0.06) : (q > 0.9 ? 1 - ease((q - 0.9) / 0.1) : 1);
    acts.forEach((c, i) => c.setAttribute('opacity', (a3[i] * 0.75 * aOp).toFixed(3)));
    dots.forEach((c, i) => set(c, {
      cx: L(src[i][0], dst[i][0], tin).toFixed(1), cy: L(src[i][1], dst[i][1], tin).toFixed(1),
      r: (3 + 4 * a3[i]).toFixed(1), opacity: q > 0.02 && q < 0.33 ? 1 : 0
    }));
    set($('f3-ring'), { r: (44 + 22 * ring).toFixed(1), opacity: (q > 0.3 && q < 0.52 ? 1 - ring : 0).toFixed(3) });
    set($('f3-out'), { cx: L(338, 502, tout).toFixed(1), opacity: q > 0.48 && q < 0.75 ? 1 : 0 });
    const yg = q < 0.72 ? 0 : (q < 0.8 ? ease((q - 0.72) / 0.08) : 1 - ease((q - 0.88) / 0.12));
    $('f3-y').setAttribute('opacity', yg.toFixed(3));
  }

  /* ---------- Il peso di NeuralNet3, calcolato davvero ---------- */
  (function spark() {
    let w = 0, n = 0, s = 'M10 100 ';
    const ex = [[1, 2], [2, 4], [3, 6], [4, 8], [5, 10]];
    for (let ep = 0; ep < 50; ep++) for (const [x, y] of ex) {
      w = w - 0.01 * (w * x - y) * x; n += 1;
      s += 'L' + (10 + n / 250 * 500).toFixed(1) + ' ' + (100 - w / 2.2 * 88).toFixed(1) + ' ';
    }
    const y2 = 100 - 2 / 2.2 * 88;
    $('spark').setAttribute('d', s);
    $('spark-2').setAttribute('d', 'M10 ' + y2.toFixed(1) + ' H510');
    $('spark-label').setAttribute('y', (y2 - 8).toFixed(1));
  })();

  /* ---------- Anteprima del cacciatore ---------- */
  const world = $('world');
  const cells = [];
  for (let i = 0; i < 20; i++) cells.push(world.appendChild(document.createElement('div')));
  let agent = 3, food = 15;
  function drawWorld() { cells.forEach((c, i) => { c.className = i === agent ? 'agent' : (i === food ? 'food' : ''); }); }
  function stepWorld() {
    if (agent === food) { do { food = Math.floor(Math.random() * 20); } while (food === agent); }
    else agent += food > agent ? 1 : -1;
    drawWorld();
  }
  drawWorld();

  /* ---------- Un solo orologio per tutte le animazioni ---------- */
  if (reduce) {
    for (let i = 0; i < 700; i++) stepGD();
    g1.disp = f(g1.x); drawGD(); drawF2(0);
    return;
  }
  // Si anima solo ciò che è sullo schermo; se non si vede nessuna figura, l'orologio si ferma.
  const vis = { gd: true, f2: true, f3: true, world: true };
  const watched = { gd: $('f1-curve'), f2: $('f2-group'), f3: $('f3-ring'), world: world };
  let acc = 0, worldAcc = 0, prev = performance.now(), start = prev, running = false;
  function frame(now) {
    const dt = Math.min(0.1, (now - prev) / 1000); prev = now;
    const t = (now - start) / 1000;
    if (vis.gd) { acc += dt; while (acc >= 0.05) { stepGD(); acc -= 0.05; } drawGD(); }
    if (vis.world) { worldAcc += dt; if (worldAcc >= 0.6) { stepWorld(); worldAcc = 0; } }
    if (vis.f2) drawF2(t);
    if (vis.f3) drawF3(t);
    if (vis.gd || vis.f2 || vis.f3 || vis.world) requestAnimationFrame(frame); else running = false;
  }
  function wake() { if (!running) { running = true; prev = performance.now(); requestAnimationFrame(frame); } }
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((es) => {
      es.forEach((e) => { for (const k in watched) if (watched[k].closest('.tile') === e.target) vis[k] = e.isIntersecting; });
      wake();
    }, { rootMargin: '120px' });
    for (const k in watched) io.observe(watched[k].closest('.tile'));
  }
  wake();
})();
