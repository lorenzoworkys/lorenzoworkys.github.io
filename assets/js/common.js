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

  window.Lab = { db, configured, initTheme, allPosts, formatDate, el, renderBlocks, excerpt, safeUrl };
  document.addEventListener('DOMContentLoaded', initTheme);
})();
