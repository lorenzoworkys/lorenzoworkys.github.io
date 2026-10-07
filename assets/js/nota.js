/* Pagina di una singola nota, con i commenti. */
(function () {
  const $ = (id) => document.getElementById(id);
  const id = new URLSearchParams(location.search).get('id');
  const box = $('article');
  let isAuthor = false;

  function fail(msg) {
    box.textContent = '';
    box.appendChild(Lab.el('p', { class: 'empty', text: msg }));
    box.appendChild(Lab.el('a', { class: 'read-more', href: 'index.html#note', text: 'Torna alle note' }));
  }

  async function load() {
    if (!id) return fail('Questa nota non esiste. Scegline una dall’elenco.');
    let posts;
    try { posts = await Lab.allPosts(); } catch (e) { return fail('La nota non si è caricata. Ricarica la pagina tra qualche secondo.'); }
    const p = posts.find((x) => x.id === id);
    if (!p) return fail('Questa nota non esiste, o è stata rimossa.');

    document.title = p.title + ' — Lore';
    box.textContent = '';
    box.appendChild(Lab.el('div', { class: 'meta' }, [
      Lab.el('span', { class: 'tag', text: p.tag }), Lab.el('span', { text: p.num }), Lab.el('span', { text: Lab.formatDate(p.created_at) })
    ]));
    box.appendChild(Lab.el('h1', { text: p.title }));
    if (p.dek) box.appendChild(Lab.el('p', { class: 'dek', text: p.dek }));
    if (p.image_url && Lab.safeUrl(p.image_url)) {
      box.appendChild(Lab.el('figure', { class: 'article-figure' }, [
        Lab.el('img', { src: Lab.safeUrl(p.image_url), alt: p.image_caption || '' }),
        p.image_caption ? Lab.el('figcaption', { class: 'caption', text: p.image_caption }) : null
      ]));
    }
    const body = Lab.el('div', { class: 'article-body' });
    Lab.renderBlocks(body, p.body);
    box.appendChild(body);
    Lab.refresh(box.parentElement);

    $('comments').hidden = false;
    if (!Lab.db) { $('comments-off').hidden = false; return; }
    const { data } = await Lab.db.auth.getSession();
    isAuthor = Boolean(data && data.session);
    $('comment-form').hidden = false;
    loadComments();
  }

  async function loadComments() {
    const { data, error } = await Lab.db.from('comments').select('id,name,body,created_at').eq('post_id', id).order('created_at', { ascending: true });
    const list = $('comments-list');
    list.textContent = '';
    if (error) { list.appendChild(Lab.el('p', { class: 'empty', text: 'I commenti non si sono caricati. Riprova tra poco.' })); return; }
    $('comments-count').textContent = data.length === 1 ? '1 commento' : data.length + ' commenti';
    if (!data.length) {
      list.appendChild(Lab.el('p', { class: 'empty', text: 'Ancora nessun commento. Se hai un’idea, una correzione o una domanda, scrivila qui sotto.' }));
      return;
    }
    data.forEach((c) => {
      const who = Lab.el('div', { class: 'who' }, [
        Lab.el('strong', { text: c.name }),
        Lab.el('span', { class: 'muted', text: Lab.formatDate(c.created_at) })
      ]);
      if (isAuthor) {
        const del = Lab.el('button', { type: 'button', class: 'link-btn', text: 'Elimina' });
        del.addEventListener('click', async () => {
          if (!confirm('Eliminare questo commento?')) return;
          const { error: e } = await Lab.db.from('comments').delete().eq('id', c.id);
          if (e) alert('Non sono riuscito a eliminarlo: ' + e.message); else loadComments();
        });
        who.appendChild(del);
      }
      list.appendChild(Lab.el('div', { class: 'comment' }, [who, Lab.el('p', { text: c.body })]));
    });
  }

  $('comment-form').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const note = $('c-note'), send = $('c-send');
    if ($('c-site').value) return; // campo trappola per i bot
    const name = $('c-name').value.trim(), body = $('c-body').value.trim();
    if (!name || !body) { note.textContent = 'Scrivi un nome e un commento.'; return; }
    send.disabled = true; note.textContent = 'Pubblico…';
    const { error } = await Lab.db.from('comments').insert({ post_id: id, name, body });
    send.disabled = false;
    if (error) { note.textContent = 'Non pubblicato: ' + error.message; return; }
    $('c-body').value = '';
    note.textContent = 'Commento pubblicato.';
    try { localStorage.setItem('lab-name', name); } catch (e) {}
    loadComments();
  });
  try { $('c-name').value = localStorage.getItem('lab-name') || ''; } catch (e) {}

  load();
})();
