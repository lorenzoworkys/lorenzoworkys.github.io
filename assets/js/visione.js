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
    // Un campo di punti: tutto ciò che si potrebbe sapere. Il cerchio cresce; i punti che
    // contiene diventano noti, quelli sul bordo si accendono: sono le domande che ora so fare.
    const R0 = 40, R1 = 160, CX = 500, CY = 210, BAND = 9, NS = 'http://www.w3.org/2000/svg';
    const dots = [];
    let seed = 11;
    const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
    for (let y = 14; y < 420; y += 20) for (let x = 14; x < 1000; x += 20) {
      const px = x + (rnd() - 0.5) * 12, py = y + (rnd() - 0.5) * 12;
      const c = document.createElementNS(NS, 'circle');
      c.setAttribute('cx', px.toFixed(1)); c.setAttribute('cy', py.toFixed(1)); c.setAttribute('r', '1.6');
      c.setAttribute('class', 'kc-dot');
      $('kc-dots').appendChild(c);
      dots.push({ c, d: Math.hypot(px - CX, py - CY), state: '' });
    }
    const rings = $('kc-rings');
    let ringsDrawn = 0;
    function ring(r) {
      const c = document.createElementNS(NS, 'circle');
      c.setAttribute('cx', CX); c.setAttribute('cy', CY); c.setAttribute('r', r);
      rings.appendChild(c);
    }
    function draw(t) {
      const k = reduce ? 9 : t % 20;
      const s = k < 1.2 ? 0 : (k < 13 ? ease((k - 1.2) / 11.8) : 1);
      const fade = k < 17 ? 1 : 1 - ease((k - 17) / 3);
      const r = R0 + (R1 - R0) * s;
      // ogni raddoppio lascia un anello a matita, come gli anelli di un albero
      if (k < 1) { rings.textContent = ''; ringsDrawn = 0; }
      [R0, R0 * 2, R0 * 4].forEach((rr, i) => { if (r >= rr - 0.5 && ringsDrawn <= i) { ring(rr); ringsDrawn = i + 1; } });
      ['kc-fill', 'kc-edge'].forEach((id) => $(id).setAttribute('r', r.toFixed(1)));
      dots.forEach((p) => {
        const st = p.d < r - BAND ? 'known' : (Math.abs(p.d - r) <= BAND ? 'edge' : '');
        if (st !== p.state) { p.state = st; p.c.setAttribute('class', 'kc-dot ' + st); p.c.setAttribute('r', st === 'edge' ? '3.2' : (st === 'known' ? '2.2' : '1.6')); }
      });
      $('kc-svg').style.opacity = (k < 0.8 ? ease(k / 0.8) : fade).toFixed(3);
      $('kc-in').setAttribute('opacity', Math.max(0, Math.min(1, (r - 52) / 20)).toFixed(3));
      const a = -Math.PI / 4.6, px = CX + r * Math.cos(a), py = CY + r * Math.sin(a);
      const lx = px + 56, ly = py - 30;
      $('kc-lead').setAttribute('d', 'M' + px.toFixed(1) + ' ' + py.toFixed(1) + ' L' + lx.toFixed(1) + ' ' + ly.toFixed(1) + ' H' + (lx + 14).toFixed(1));
      const lt = $('kc-lead-t'); lt.setAttribute('x', (lx + 20).toFixed(1)); lt.setAttribute('y', (ly + 6).toFixed(1));
      const g = r / R0, max = (R1 / R0) * (R1 / R0);
      $('kc-r').textContent = it(g, 1);
      $('kc-a').textContent = '× ' + it(g * g, 1);
      $('kc-p').textContent = '× ' + it(g, 1);
      $('kc-ab').style.width = (g * g / max * 100).toFixed(2) + '%';
      $('kc-pb').style.width = (g / max * 100).toFixed(2) + '%';
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
