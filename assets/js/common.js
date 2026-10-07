/* Parti comuni a tutte le pagine: tema, database, note. */
(function () {
  const cfg = window.LAB_CONFIG || {};
  const configured = Boolean(cfg.supabaseUrl && cfg.supabaseAnonKey && window.supabase);
  const db = configured ? window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey) : null;

  /* ---------- Tema ---------- */
  function setTheme(theme) {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem('lab-theme', theme); } catch (e) {}
    document.querySelectorAll('.theme-toggle').forEach((b) => {
      const dark = theme === 'dark';
      b.querySelector('.label').textContent = dark ? 'Scuro' : 'Chiaro';
      b.setAttribute('aria-label', dark ? 'Passa al tema chiaro' : 'Passa al tema scuro');
    });
  }
  function initTheme() {
    setTheme(document.documentElement.dataset.theme === 'light' ? 'light' : 'dark');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.querySelectorAll('.theme-toggle').forEach((b) =>
      b.addEventListener('click', () => {
        const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
        // dissolvenza dell'intera pagina, dove il browser la supporta; altrimenti cambio netto
        if (document.startViewTransition && !reduce) document.startViewTransition(() => setTheme(next));
        else setTheme(next);
      }));
  }

  /* ---------- Note ---------- */
  let cache = null;
  async function allPosts() {
    if (cache) return cache;
    let rows = null;
    if (db) {
      // se il database non risponde (per esempio è in pausa) si usano le note salvate nel sito
      try {
        const { data, error } = await db.from('posts').select('*').order('created_at', { ascending: true });
        if (!error) rows = data;
      } catch (e) {}
    }
    if (!rows) {
      const res = await fetch('data/posts.json', { cache: 'no-store' });
      rows = (await res.json()).sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    }
    // numerazione dalla più vecchia: Nota 000, 001, ...
    cache = rows.map((p, i) => Object.assign({}, p, { num: 'Nota ' + String(i).padStart(3, '0') }));
    return cache;
  }

  function formatDate(iso) {
    return new Date(iso).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  function el(tag, attrs, children) {
    const n = document.createElement(tag);
    if (attrs) for (const k in attrs) {
      if (attrs[k] == null) continue;
      if (k === 'text') n.textContent = attrs[k];
      else if (k === 'class') n.className = attrs[k];
      else n.setAttribute(k, attrs[k]);
    }
    (children || []).forEach((c) => c && n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c));
    return n;
  }

  /* Il testo di una nota: paragrafi separati da una riga vuota.
     "> frase" diventa una citazione, "![didascalia](indirizzo)" un'immagine. */
  function blocks(body) {
    return String(body || '').split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean).map((b) => {
      const img = b.match(/^!\[([^\]]*)\]\(([^)\s]+)\)$/);
      if (img) return { type: 'img', alt: img[1], src: img[2] };
      if (b.startsWith('> ')) return { type: 'quote', text: b.replace(/^>\s?/gm, '') };
      return { type: 'p', text: b };
    });
  }
  function safeUrl(u) {
    return /^(https:\/\/|assets\/)/.test(u) ? u : '';
  }
  function renderBlocks(container, body) {
    blocks(body).forEach((b) => {
      if (b.type === 'p') container.appendChild(el('p', { text: b.text }));
      else if (b.type === 'quote') container.appendChild(el('blockquote', { text: b.text }));
      else if (safeUrl(b.src)) container.appendChild(el('figure', { class: 'article-figure' }, [
        el('img', { src: safeUrl(b.src), alt: b.alt, loading: 'lazy' }),
        b.alt ? el('figcaption', { class: 'caption', text: b.alt }) : null
      ]));
    });
  }
  function excerpt(body) {
    const first = blocks(body).find((b) => b.type === 'p');
    return first ? first.text : '';
  }

  /* ---------- Movimento ----------
     Due velocità soltanto: risposte rapide (0,2 s, nel CSS) e comparse lente (0,8 s, qui).
     Tutto parte solo se <html> ha la classe "motion", messa nell'intestazione di ogni pagina. */
  const motion = document.documentElement.classList.contains('motion');

  // Il titolo grande compare parola per parola, con ritardi un po' irregolari, come scritto a mano.
  function words(h) {
    if (!h || h.dataset.words) return;
    h.dataset.words = '1';
    const parts = [];
    Array.from(h.childNodes).forEach((n) => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach((t) => {
          if (!t) return;
          if (/^\s+$/.test(t)) { frag.appendChild(document.createTextNode(t)); return; }
          const s = el('span', { class: 'w', text: t });
          parts.push(s); frag.appendChild(s);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1) { n.classList.add('w'); parts.push(n); }
    });
    parts.forEach((s, i) => {
      const last = i === parts.length - 1 && s.classList.contains('dot');
      s.style.transitionDelay = Math.round(last ? i * 70 + 520 : 80 + i * 70 + Math.random() * 160) + 'ms';
    });
    requestAnimationFrame(() => requestAnimationFrame(() => h.classList.add('words-in')));
  }

  // Blocchi che salgono e si accendono la prima volta che entrano nello schermo.
  const REVEAL = [
    '.hero > p', '.quote', '.notes-bar', '.note', '.aside', '.section-head', '.research-text', '.figure',
    '.project-feature', '.cta-card', '.project-row', '.about-left', '.about-text',
    '.lf-hero .meta', '.lf-hero .dek', '.status-cards', '.toc', '.prose', '.code-pair',
    '.article > *', '.comments', '.desk-form', '.desk-preview', '.login'
  ].join(',');
  const revealIO = motion && 'IntersectionObserver' in window ? new IntersectionObserver((entries) => {
    entries.filter((e) => e.isIntersecting)
      .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
      .forEach((e, i) => {
        const n = e.target;
        revealIO.unobserve(n);
        const hero = n.closest('.hero, .lf-hero');
        n.style.transitionDelay = (hero ? 420 : 0) + Math.min(i, 5) * 90 + 'ms';
        n.classList.add('in');
        // a comparsa finita l'elemento torna com'era, con le sue transizioni di sempre
        n.addEventListener('transitionend', function done(ev) {
          if (ev.target !== n || ev.propertyName !== 'opacity') return;
          n.removeEventListener('transitionend', done);
          n.classList.remove('rv', 'in'); n.style.transitionDelay = '';
        });
      });
  }, { rootMargin: '0px 0px -8% 0px' }) : null;

  // Le curve disegnate partono quando le guardi, non al caricamento.
  const drawIO = motion && 'IntersectionObserver' in window ? new IntersectionObserver((entries) => entries.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add('play'); drawIO.unobserve(e.target); }
  }), { rootMargin: '0px 0px -12% 0px' }) : null;

  function reveal(root) {
    if (!revealIO) return;
    (root || document).querySelectorAll(REVEAL).forEach((n) => {
      if (n.dataset.rv) return;
      n.dataset.rv = '1';
      if (n.parentElement && n.parentElement.closest('[data-rv]')) return; // già dentro un blocco che compare
      n.classList.add('rv');
      revealIO.observe(n);
    });
    (root || document).querySelectorAll('.draw:not(.play)').forEach((n) => drawIO.observe(n));
  }

  // Le frecce dei link scivolano al passaggio del mouse.
  function arrows(root) {
    (root || document).querySelectorAll('.read-more, .back-cta').forEach((a) => {
      if (a.querySelector('.arrow') || !/→\s*$/.test(a.textContent)) return;
      a.textContent = a.textContent.replace(/\s*→\s*$/, ' ');
      a.appendChild(el('span', { class: 'arrow', 'aria-hidden': 'true', text: '→' }));
    });
  }

  // La testata resta in cima; scorrendo si assottiglia. Su telefono si nasconde mentre scendi.
  function masthead() {
    const m = document.querySelector('.masthead');
    if (!m) return;
    let lastY = window.scrollY, ticking = false;
    const opening = document.querySelector('.opening');
    if (opening) opening.style.setProperty('--mast-h', m.offsetHeight + 'px');
    function update() {
      ticking = false;
      const y = window.scrollY;
      m.classList.toggle('scrolled', y > 12);
      // sopra la scena scura d'apertura la testata diventa trasparente e chiara
      if (opening && opening.dataset.header !== 'solid') m.classList.toggle('on-dark', opening.getBoundingClientRect().bottom > m.offsetHeight);
      const phone = window.innerWidth <= 640;
      if (phone && y > 160 && y > lastY + 4) m.classList.add('tucked');
      else if (!phone || y < lastY - 4 || y <= 160) m.classList.remove('tucked');
      lastY = y;
    }
    window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    update();
  }

  // Inchiostro: bordi appena irregolari e piccoli vuoti, come una pagina stampata.
  // Safari applica male i filtri SVG al testo HTML, quindi lì i titoli restano puliti.
  function ink() {
    if (/^((?!chrome|android|crios|fxios).)*safari/i.test(navigator.userAgent)) return;
    const svg = '<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><filter id="lore-ink" x="-4%" y="-15%" width="108%" height="130%" color-interpolation-filters="sRGB">' +
      '<feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="4" result="n"/>' +
      '<feDisplacementMap in="SourceGraphic" in2="n" scale="0.7" xChannelSelector="R" yChannelSelector="G" result="rough"/>' +
      '<feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="2" seed="12" result="s"/>' +
      '<feColorMatrix in="s" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -8 0 0 0 7.3" result="holes"/>' +
      '<feComposite in="rough" in2="holes" operator="in"/></filter></svg>';
    document.body.insertAdjacentHTML('afterbegin', svg);
    document.documentElement.classList.add('ink');
  }

  // Barra a tacche sul bordo sinistro: una lineetta per sezione, quella corrente più lunga.
  function rail() {
    const heads = Array.from(document.querySelectorAll('.longform .prose h2'));
    if (heads.length < 4) return;
    const nav = el('nav', { class: 'rail', 'aria-label': 'Sezioni della pagina' });
    const links = heads.map((h, i) => {
      const sec = h.closest('[id]');
      if (!sec || !sec.id) { h.id = h.id || 'sezione-' + (i + 1); }
      const id = (sec && sec.id) || h.id;
      const a = el('a', { href: '#' + id, 'aria-label': h.textContent }, [el('span', { class: 'pill', text: h.textContent })]);
      nav.appendChild(a);
      return { a, h };
    });
    document.body.appendChild(nav);
    let ticking = false;
    function update() {
      ticking = false;
      const mark = window.innerHeight * 0.35;
      let cur = -1;
      links.forEach((l, i) => { if (l.h.getBoundingClientRect().top < mark) cur = i; });
      links.forEach((l, i) => l.a.classList.toggle('on', i === cur));
      nav.classList.toggle('show', heads[0].getBoundingClientRect().top < window.innerHeight);
    }
    window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    update();
  }

  // Citazioni a schede: si sceglie un nome, e la scheda successiva sbuca sfumata a destra.
  function qtabs() {
    document.querySelectorAll('.qtabs').forEach((box) => {
      const data = JSON.parse(box.querySelector('script[type="application/json"]').textContent);
      const nav = el('div', { class: 'qtabs-nav', role: 'tablist', 'aria-label': 'Citazioni' });
      const track = el('div', { class: 'qtabs-track' });
      box.appendChild(nav); box.appendChild(track);
      const card = (q, peek) => el('figure', { class: 'qcard' + (peek ? ' peek' : ''), role: peek ? null : 'tabpanel' }, [
        el('span', { class: 'q-label', text: 'Citazione' }),
        el('blockquote', { text: q.text }),
        el('figcaption', { class: 'q-foot' }, [
          el('div', {}, [el('span', { text: 'Chi' }), q.who]),
          el('div', {}, [el('span', { text: 'Dove e quando' }), q.where])
        ])
      ]);
      const buttons = data.map((q, i) => {
        const b = el('button', { type: 'button', role: 'tab', 'aria-selected': 'false', text: q.tab });
        b.addEventListener('click', () => show(i));
        nav.appendChild(b);
        return b;
      });
      let current = -1;
      function show(i) {
        if (i === current) return;
        current = i;
        buttons.forEach((b, k) => b.setAttribute('aria-selected', String(k === i)));
        track.textContent = '';
        const main = card(data[i]);
        if (motion) { main.classList.add('enter'); requestAnimationFrame(() => requestAnimationFrame(() => main.classList.remove('enter'))); }
        track.appendChild(main);
        const next = card(data[(i + 1) % data.length], true);
        next.setAttribute('aria-hidden', 'true');
        next.addEventListener('click', () => show((i + 1) % data.length));
        track.appendChild(next);
      }
      show(0);
    });
  }

  function refresh(root) { arrows(root); reveal(root); }

  window.Lab = { db, configured, initTheme, allPosts, formatDate, el, renderBlocks, excerpt, safeUrl, refresh };
  document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    ink();
    masthead();
    rail();
    qtabs();
    if (motion) document.querySelectorAll('.hero h1, .lf-hero h1').forEach(words);
    refresh();
  });
})();
