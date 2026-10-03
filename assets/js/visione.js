/* Visione: la scala di Kardashev, il cerchio di ciò che so, la linea dei giganti. */
(function () {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (id) => document.getElementById(id);
  const ease = (t) => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); };
  const it = (x, d) => x.toFixed(d).replace('.', ',').replace('-', '−');
  const SUP = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '-': '⁻' };
  const pow = (log) => { const e = Math.floor(log); const m = Math.pow(10, log - e); return it(m, 1) + ' · 10' + String(e).split('').map((c) => SUP[c]).join('') + ' W'; };

  const figs = [];
  const io = 'IntersectionObserver' in window ? new IntersectionObserver((es) => es.forEach((e) => {
    const f = figs.find((x) => x.el === e.target); if (!f) return;
    f.visible = e.isIntersecting;
    if (e.isIntersecting && f.onShow) { f.onShow(); f.onShow = null; }
  }), { rootMargin: '0px 0px -15% 0px' }) : null;

  /* ---------- Fig. 1: la scala di Kardashev ---------- */
  (function () {
    const fig = $('fig-scala'); if (!fig) return;
    const X = (k) => 60 + Math.max(-0.1, Math.min(3.1, k)) * 293.33;
    const HUMAN = 0.73;
    const range = $('ks-range');
    let shown = reduce ? 1 : 0, startT = null, youK = (parseFloat(range.value) - 6) / 10, youDraw = youK;
    function place(el, x, y) { el.setAttribute('transform', 'translate(' + x.toFixed(1) + ' ' + y + ')'); }
    function readout() {
      const log = parseFloat(range.value);
      youK = (log - 6) / 10;
      $('ks-p').textContent = pow(log);
      $('ks-k').textContent = it(youK, 2);
    }
    range.addEventListener('input', readout);
    fig.querySelectorAll('.ks-presets button').forEach((b) => b.addEventListener('click', () => { range.value = b.dataset.log; readout(); }));
    readout();
    function draw(t) {
      if (startT === null) startT = t;
      const s = reduce ? 1 : ease((t - startT) / 5);
      const k = HUMAN * s;
      place($('ks-hum'), X(k), 130);
      $('ks-gap').setAttribute('opacity', s >= 1 ? 1 : 0);
      $('ks-gap').style.transition = 'opacity 1.6s ease';
      $('ks-dir').setAttribute('d', 'M' + X(1).toFixed(1) + ' 130 H' + X(1 + 1.9 * s).toFixed(1));
      youDraw += (youK - youDraw) * (reduce ? 1 : 0.12);
      place($('ks-you'), X(youDraw), 130);
    }
    draw(reduce ? 99 : 0);
    figs.push({ el: fig, visible: false, draw });
  })();

  /* ---------- Fig. 2: il cerchio di ciò che so ---------- */
  (function () {
    const fig = $('fig-cerchio'); if (!fig) return;
    const R0 = 40, R1 = 150, CX = 500, CY = 180;
    function draw(t) {
      const k = reduce ? 9 : t % 18;
      const s = k < 1 ? 0 : (k < 12 ? ease((k - 1) / 11) : 1);
      const op = k < 15.5 ? 1 : 1 - ease((k - 15.5) / 2.5);
      const r = R0 + (R1 - R0) * s;
      $('kc-circle').setAttribute('r', r.toFixed(1));
      $('kc-group').setAttribute('opacity', (k < 0.6 ? ease(k / 0.6) : op).toFixed(3));
      const a = -Math.PI / 4, px = CX + r * Math.cos(a), py = CY + r * Math.sin(a);
      const lx = px + 60, ly = py - 34;
      $('kc-lead').setAttribute('d', 'M' + px.toFixed(1) + ' ' + py.toFixed(1) + ' L' + lx.toFixed(1) + ' ' + ly.toFixed(1) + ' H' + (lx + 14).toFixed(1));
      const lt = $('kc-lead-t'); lt.setAttribute('x', (lx + 20).toFixed(1)); lt.setAttribute('y', (ly + 5).toFixed(1));
      const g = r / R0;
      $('kc-r').textContent = it(g, 1);
      $('kc-a').textContent = '× ' + it(g * g, 1);
      $('kc-p').textContent = '× ' + it(g, 1);
    }
    draw(reduce ? 99 : 0);
    figs.push({ el: fig, visible: false, draw });
  })();

  /* ---------- Fig. 3: la linea dei giganti ---------- */
  (function () {
    const tl = $('timeline'); if (!tl) return;
    if (reduce || !io) { tl.classList.add('in'); return; }
    figs.push({ el: $('fig-giganti'), visible: false, draw: null, onShow: () => tl.classList.add('in') });
  })();

  if (io) figs.forEach((f) => io.observe(f.el)); else figs.forEach((f) => { f.visible = true; });
  if (reduce) return;
  const start = performance.now();
  (function frame(now) {
    const t = (now - start) / 1000;
    figs.forEach((f) => { if (f.visible && f.draw) f.draw(t); });
    requestAnimationFrame(frame);
  })(start);
})();
