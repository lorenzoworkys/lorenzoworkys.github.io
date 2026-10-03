/* NeuralNet4, il cacciatore: le figure della pagina di processo.
   Tutto ciò che si vede è calcolato davvero, con la stessa matematica del codice Python. */
(function () {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (id) => document.getElementById(id);
  const ease = (t) => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); };
  const set = (n, a) => { for (const k in a) n.setAttribute(k, a[k]); };
  const it = (x, d) => x.toFixed(d).replace('.', ',').replace('-', '−');
  const sigmoide = (z) => 1 / (1 + Math.exp(-Math.max(-500, Math.min(500, z))));
  const SVGNS = 'http://www.w3.org/2000/svg';

  /* ---------- Il neurone, come in neuralnet4_corretto.py ---------- */
  const LARGHEZZA = 20, LR = 0.5, EPOCHE = 200;
  class Neurone {
    constructor(n) { this.pesi = Array.from({ length: n }, () => Math.random() * 2 - 1); this.bias = Math.random() * 2 - 1; }
    pensa(e) { let z = this.bias; for (let i = 0; i < this.pesi.length; i++) z += this.pesi[i] * e[i]; return sigmoide(z); }
    impara(e, v) {
      const errore = this.pensa(e) - v;
      for (let i = 0; i < this.pesi.length; i++) this.pesi[i] -= LR * errore * e[i];
      this.bias -= LR * errore;
      return errore;
    }
  }
  function creaEsempio() {
    const agente = Math.floor(Math.random() * LARGHEZZA);
    let cibo = Math.floor(Math.random() * LARGHEZZA);
    while (cibo === agente) cibo = Math.floor(Math.random() * LARGHEZZA);
    return [[agente / LARGHEZZA, cibo / LARGHEZZA], cibo > agente ? 1 : 0];
  }
  function precisione(n, ds) {
    let giusti = 0;
    for (const [e, v] of ds) if ((n.pensa(e) > 0.5 ? 1 : 0) === v) giusti++;
    return giusti / ds.length * 100;
  }
  function epoca(n, ds) {
    for (let i = ds.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [ds[i], ds[j]] = [ds[j], ds[i]]; }
    let tot = 0;
    for (const [e, v] of ds) tot += Math.abs(n.impara(e, v));
    return tot / ds.length;
  }
  function nuovoFood(agente, w) { let c; do { c = Math.floor(Math.random() * w); } while (c === agente); return c; }

  // Un cervello già allenato, usato dal mondo in apertura e dal terminale
  const allenato = new Neurone(2);
  { const ds = Array.from({ length: 500 }, creaEsempio); for (let k = 0; k < EPOCHE; k++) epoca(allenato, ds); }

  /* ---------- Orologio comune: anima solo le figure visibili ---------- */
  const figures = [];
  function figure(el, draw) { const f = { el, draw, visible: false }; figures.push(f); return f; }
  const io = 'IntersectionObserver' in window
    ? new IntersectionObserver((es) => es.forEach((e) => { const f = figures.find((x) => x.el === e.target); if (f) f.visible = e.isIntersecting; }), { rootMargin: '120px' })
    : null;

  /* ---------- Fig. 1: il mondo ---------- */
  (function () {
    const row = $('w-row'); if (!row) return;
    const cells = [];
    for (let i = 0; i < LARGHEZZA; i++) cells.push(row.appendChild(document.createElement('div')));
    let agente = 4, cibo = 15, last = 0, pausa = 0;
    function render() {
      cells.forEach((c, i) => { c.className = i === agente ? 'agent' : (i === cibo ? 'food' : ''); });
      const x1 = agente / LARGHEZZA, x2 = cibo / LARGHEZZA, p = allenato.pensa([x1, x2]);
      $('w-x1').textContent = it(x1, 2); $('w-x2').textContent = it(x2, 2);
      $('w-p').textContent = it(p, 3);
      $('w-dir').textContent = p > 0.5 ? 'destra' : 'sinistra';
    }
    render();
    figure($('fig-mondo'), (t) => {
      if (t - last < 0.75) return; last = t;
      if (pausa > 0) { pausa--; if (pausa === 0) cibo = nuovoFood(agente, LARGHEZZA); render(); return; }
      agente += allenato.pensa([agente / LARGHEZZA, cibo / LARGHEZZA]) > 0.5 ? 1 : -1;
      agente = Math.max(0, Math.min(LARGHEZZA - 1, agente));
      if (agente === cibo) pausa = 2;
      render();
    });
  })();

  /* ---------- Fig. 2: la sigmoide ---------- */
  (function () {
    const svg = $('sig-svg'); if (!svg) return;
    const X = (z) => 40 + (z + 7) / 14 * 500, Y = (s) => 240 - s * 200;
    let d = '';
    for (let i = 0; i <= 140; i++) { const z = -7 + i / 10; d += (i ? 'L' : 'M') + X(z).toFixed(1) + ' ' + Y(sigmoide(z)).toFixed(1) + ' '; }
    $('sig-curve').setAttribute('d', d);
    [[5, 'a'], [-5, 'b'], [0, 'c']].forEach(([z, k]) => set($('sig-m' + k), { cx: X(z).toFixed(1), cy: Y(sigmoide(z)).toFixed(1) }));
    const draw = (t) => {
      const z = reduce ? 2.4 : 6.2 * Math.sin(t * 0.32);
      const s = sigmoide(z);
      set($('sig-dot'), { cx: X(z).toFixed(1), cy: Y(s).toFixed(1) });
      $('sig-drop').setAttribute('d', 'M' + X(z).toFixed(1) + ' ' + Y(s).toFixed(1) + ' V240');
      $('sig-z').textContent = it(z, 2); $('sig-s').textContent = it(s, 3);
      $('sig-dir').textContent = s > 0.5 ? 'destra' : 'sinistra';
    };
    draw(0); figure($('fig-sigmoide'), draw);
  })();

  /* ---------- Fig. 3: un pensiero, fatto a mano ---------- */
  (function () {
    const rows = document.querySelectorAll('#calc-rows li'); if (!rows.length) return;
    const dots = document.querySelectorAll('#calc-dots button');
    const zs = ['—', '—', '0,1', '0,175', '0,025', '0,025'];
    const edges = [null, null, 'ce-b', 'ce-1', 'ce-2', 'ce-o'];
    let step = 0, last = 0;
    function show(k) {
      step = k;
      rows.forEach((r, i) => { r.classList.toggle('on', i === k); r.classList.toggle('done', i < k); });
      dots.forEach((b, i) => b.setAttribute('aria-current', i === k ? 'step' : 'false'));
      $('calc-z').textContent = zs[k];
      $('calc-p').textContent = k === 5 ? '0,50625' : '—';
      ['ce-b', 'ce-1', 'ce-2', 'ce-o'].forEach((id) => $(id).classList.toggle('lit', edges[k] === id));
      $('calc-in').classList.toggle('lit', k >= 1);
    }
    dots.forEach((b, i) => b.addEventListener('click', () => { show(i); last = performance.now() / 1000 + 4; }));
    show(reduce ? 5 : 0);
    if (!reduce) figure($('fig-calcolo'), (t) => { if (t - last > 2.6) { last = t; show((step + 1) % rows.length); } });
  })();

  /* ---------- Fig. 4: una correzione ---------- */
  (function () {
    const fig = $('fig-impara'); if (!fig) return;
    const knobs = [
      { id: 'k1', from: 0.3, to: 0.36171875 },
      { id: 'k2', from: -0.2, to: -0.01484375 },
      { id: 'kb', from: 0.1, to: 0.346875 }
    ];
    const KX = (v) => 8 + (v + 0.4) / 0.9 * 84; // percentuale lungo la barra, da −0,4 a 0,5
    const draw = (t) => {
      const k = reduce ? 9 : t % 10;
      const s = k < 1.6 ? 0 : (k < 4.6 ? ease((k - 1.6) / 3) : 1);
      const op = k < 9.2 ? 1 : 1 - (k - 9.2) / 0.8;
      knobs.forEach((n) => {
        const v = n.from + (n.to - n.from) * s;
        const m = $(n.id + '-m'); m.style.left = KX(v) + '%';
        $(n.id + '-v').textContent = it(v, 5);
        $(n.id + '-g').style.left = KX(n.from) + '%';
      });
      const p = 0.50625 + (0.60496 - 0.50625) * s;
      $('kp-m').style.left = (p * 100) + '%';
      $('kp-v').textContent = it(p, 3);
      $('kp-e').textContent = it(p - 1, 3);
      fig.querySelector('.knobs').style.opacity = op;
    };
    draw(0); figure(fig, draw);
  })();

  /* ---------- Fig. 5: il learning rate ---------- */
  (function () {
    const fig = $('fig-lr'); if (!fig) return;
    const TARGET = 0.9765, START = 0.9104;
    const X = (w) => 30 + (w - 0.84) / 0.2 * 500;
    const lanes = [
      { y: 50, lr: 0.12, id: 'l1' }, { y: 130, lr: 0.8, id: 'l2' }, { y: 210, lr: 2.35, id: 'l3' }
    ];
    lanes.forEach((l) => {
      l.trail = [];
      for (let i = 0; i < 10; i++) {
        const c = document.createElementNS(SVGNS, 'circle');
        set(c, { r: 3.5, cy: l.y, fill: '#141413', opacity: 0 });
        $(l.id + '-trail').appendChild(c); l.trail.push(c);
      }
    });
    $('lr-target').setAttribute('d', 'M' + X(TARGET).toFixed(1) + ' 20 V240');
    $('lr-target-l').setAttribute('x', (X(TARGET) + 6).toFixed(1));
    const draw = (t) => {
      const per = 0.85, n = reduce ? 9 : Math.floor((t % 10.5) / per), frac = reduce ? 1 : ease(((t % 10.5) % per) / 0.5);
      lanes.forEach((l) => {
        const pos = [START];
        for (let i = 0; i < 10; i++) pos.push(pos[i] - l.lr * (pos[i] - TARGET));
        const k = Math.min(n, 9);
        const cur = pos[k] + (pos[k + 1] - pos[k]) * (n >= 9 ? 0 : frac);
        const x = Math.max(-40, Math.min(600, X(cur)));
        set($(l.id + '-dot'), { cx: x.toFixed(1) });
        const out = X(cur) < 20 || X(cur) > 545;
        $(l.id + '-out').setAttribute('opacity', out ? 1 : 0);
        l.trail.forEach((c, i) => {
          const vis = i <= k;
          set(c, { cx: Math.max(-40, Math.min(600, X(pos[i]))).toFixed(1), opacity: vis ? (0.12 + 0.3 * i / 10).toFixed(2) : 0 });
        });
        $(l.id + '-v').textContent = Math.abs(cur) > 99 ? 'fuori scala' : it(cur, 4);
      });
    };
    draw(0); figure(fig, draw);
  })();

  /* ---------- Fig. 6: l'allenamento, dal vivo ---------- */
  (function () {
    const fig = $('fig-allena'); if (!fig) return;
    const X = (e) => 50 + e / EPOCHE * 480, Y = (m) => 230 - Math.min(m, 0.55) / 0.55 * 200;
    let n, ds, test, ep, hist, prima, last = 0, hold = 0;
    function reset() {
      n = new Neurone(2);
      ds = Array.from({ length: 500 }, creaEsempio);
      test = Array.from({ length: 200 }, creaEsempio);
      ep = 0; hist = []; hold = 0;
      prima = precisione(n, test);
      $('al-prima').textContent = it(prima, 1) + '%';
      $('al-path').setAttribute('d', '');
      update(null);
    }
    function update(m) {
      $('al-ep').textContent = ep;
      $('al-err').textContent = m == null ? '—' : it(m, 3);
      $('al-dopo').textContent = ep ? it(precisione(n, test), 1) + '%' : '—';
      $('al-w1').textContent = it(n.pesi[0], 2);
      $('al-w2').textContent = it(n.pesi[1], 2);
      $('al-b').textContent = it(n.bias, 2);
      let d = '';
      hist.forEach((v, i) => { d += (i ? 'L' : 'M') + X(i + 1).toFixed(1) + ' ' + Y(v).toFixed(1) + ' '; });
      $('al-path').setAttribute('d', d);
      if (hist.length) set($('al-dot'), { cx: X(hist.length).toFixed(1), cy: Y(hist[hist.length - 1]).toFixed(1), opacity: 1 });
      else $('al-dot').setAttribute('opacity', 0);
      $('al-rule').classList.toggle('on', ep >= EPOCHE);
    }
    reset();
    if (reduce) { while (ep < EPOCHE) { hist.push(epoca(n, ds)); ep++; } update(hist[hist.length - 1]); return; }
    figure(fig, (t) => {
      if (t - last < 0.06) return; last = t;
      if (ep < EPOCHE) { const m = epoca(n, ds); hist.push(m); ep++; update(m); }
      else if (++hold > 120) reset();
    });
  })();

  /* ---------- Fig. 7: il cacciatore nel terminale ---------- */
  (function () {
    const out = $('term-out'); if (!out) return;
    let agente = LARGHEZZA >> 1, cibo = nuovoFood(agente, LARGHEZZA), punti = 0, passo = 0, last = 0;
    function render() {
      let riga = '';
      for (let x = 0; x < LARGHEZZA; x++) riga += x === agente ? 'A' : (x === cibo ? '*' : '.');
      out.textContent = '';
      riga.split('').forEach((ch) => {
        const s = document.createElement('span'); s.textContent = ch;
        if (ch === 'A') s.className = 't-a'; else if (ch === '*') s.className = 't-f';
        out.appendChild(s);
      });
      $('term-score').textContent = 'punti: ' + punti + '  passi: ' + passo;
      $('term-w').textContent = 'pesi: [' + it(allenato.pesi[0], 2) + ', ' + it(allenato.pesi[1], 2) + ']  bias: ' + it(allenato.bias, 2);
    }
    render();
    figure($('fig-terminale'), (t) => {
      if (t - last < 0.45) return; last = t;
      if (passo >= 50) { agente = LARGHEZZA >> 1; cibo = nuovoFood(agente, LARGHEZZA); punti = 0; passo = 0; render(); return; }
      agente += allenato.pensa([agente / LARGHEZZA, cibo / LARGHEZZA]) > 0.5 ? 1 : -1;
      agente = Math.max(0, Math.min(LARGHEZZA - 1, agente));
      if (agente === cibo) { punti++; cibo = nuovoFood(agente, LARGHEZZA); }
      passo++; render();
    });
  })();

  /* ---------- Fig. 8: if invece di elif ---------- */
  (function () {
    const a = $('bug-ok'), b = $('bug-ko'); if (!a) return;
    const W = 30;
    let agente = 3, cibo = 22, last = 0, pausa = 0;
    function paint(el, chars) {
      el.textContent = '';
      chars.forEach((ch) => {
        const s = document.createElement('span'); s.textContent = ch;
        if (ch === 'W') s.className = 't-a'; else if (ch === '$') s.className = 't-f';
        el.appendChild(s);
      });
    }
    function render() {
      const ok = [], ko = [];
      for (let x = 0; x < W; x++) {
        ok.push(x === agente ? 'W' : (x === cibo ? '$' : '_'));
        if (x === agente) ko.push('W');
        ko.push(x === cibo ? '$' : '_'); // il secondo if: con l'else scrive "_" anche dove c'è già W
      }
      paint(a, ok); paint(b, ko);
      $('bug-ok-n').textContent = ok.length + ' caratteri';
      $('bug-ko-n').textContent = ko.length + ' caratteri';
    }
    render();
    figure($('fig-bug'), (t) => {
      if (t - last < 0.7) return; last = t;
      if (pausa > 0) { if (--pausa === 0) { cibo = nuovoFood(agente, W); } render(); return; }
      agente += cibo > agente ? 1 : -1;
      if (agente === cibo) pausa = 2;
      render();
    });
  })();

  /* ---------- Avvio ---------- */
  if (io) figures.forEach((f) => io.observe(f.el)); else figures.forEach((f) => { f.visible = true; });
  if (reduce) return;
  const start = performance.now();
  function frame(now) {
    const t = (now - start) / 1000;
    figures.forEach((f) => { if (f.visible) f.draw(t); });
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
