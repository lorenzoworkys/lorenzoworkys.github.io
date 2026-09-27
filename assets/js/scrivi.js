/* Scrivania: accesso con link via email e pubblicazione delle note. */
(function () {
  const $ = (id) => document.getElementById(id);
  let tag = 'ML', file = null;

  if (!Lab.db) { $('setup').hidden = false; return; }

  function show(session) {
    $('login').hidden = Boolean(session);
    $('desk').hidden = !session;
    $('logout').hidden = !session;
  }
  Lab.db.auth.getSession().then(({ data }) => show(data.session));
  Lab.db.auth.onAuthStateChange((_e, session) => show(session));
  $('logout').addEventListener('click', () => Lab.db.auth.signOut());

  $('login-form').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const email = $('l-email').value.trim(), msg = $('login-msg');
    if (!email) return;
    $('l-send').disabled = true;
    const { error } = await Lab.db.auth.signInWithOtp({
      email, options: { emailRedirectTo: location.origin + location.pathname, shouldCreateUser: false }
    });
    $('l-send').disabled = false;
    msg.hidden = false;
    msg.className = error ? 'notice err' : 'notice ok';
    msg.textContent = error
      ? 'Accesso non riuscito: ' + error.message
      : 'Controlla la posta: il link ti riporta qui già dentro.';
  });

  /* ---------- Anteprima dal vivo ---------- */
  function preview() {
    const t = $('p-title').value.trim(), d = $('p-dek').value.trim(), b = $('p-body').value.trim();
    $('v-title').textContent = t || 'Il titolo della nota'; $('v-title').classList.toggle('placeholder', !t);
    $('v-dek').textContent = d || 'Il sottotitolo in corsivo.'; $('v-dek').classList.toggle('placeholder', !d);
    $('v-body').textContent = b || 'Il testo apparirà qui mentre scrivi.'; $('v-body').classList.toggle('placeholder', !b);
    $('v-tag').textContent = tag;
  }
  ['p-title', 'p-dek', 'p-body'].forEach((i) => $(i).addEventListener('input', preview));
  document.querySelectorAll('.tag-btn').forEach((b) => b.addEventListener('click', () => {
    tag = b.dataset.tag;
    document.querySelectorAll('.tag-btn').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    preview();
  }));

  function pick(f) {
    if (!f) return;
    if (!/^image\//.test(f.type)) { $('drop-text').textContent = 'Serve un’immagine (png, jpg, webp o gif).'; return; }
    if (f.size > 8 * 1024 * 1024) { $('drop-text').textContent = 'Immagine troppo pesante: massimo 8 MB.'; return; }
    file = f;
    $('drop-text').textContent = f.name;
    const img = new Image(); img.src = URL.createObjectURL(f); img.alt = '';
    $('v-img').textContent = ''; $('v-img').appendChild(img);
  }
  $('p-image').addEventListener('change', (e) => pick(e.target.files[0]));
  const drop = $('drop');
  ['dragenter', 'dragover'].forEach((t) => drop.addEventListener(t, (e) => { e.preventDefault(); drop.classList.add('over'); }));
  ['dragleave', 'drop'].forEach((t) => drop.addEventListener(t, () => drop.classList.remove('over')));
  drop.addEventListener('drop', (e) => { e.preventDefault(); pick(e.dataTransfer.files[0]); });

  function slug(s) {
    return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) + '-' + Date.now().toString(36);
  }

  $('post-form').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const note = $('p-note'), send = $('p-send');
    const title = $('p-title').value.trim(), body = $('p-body').value.trim();
    if (!title || !body) { note.textContent = 'Servono almeno un titolo e un testo.'; return; }
    send.disabled = true;
    let image_url = null;
    if (file) {
      note.textContent = 'Carico l’immagine…';
      const path = Date.now() + '-' + file.name.replace(/[^\w.-]+/g, '_');
      const up = await Lab.db.storage.from('screenshots').upload(path, file, { cacheControl: '31536000', upsert: false });
      if (up.error) { send.disabled = false; note.textContent = 'Immagine non caricata: ' + up.error.message; return; }
      image_url = Lab.db.storage.from('screenshots').getPublicUrl(path).data.publicUrl;
    }
    note.textContent = 'Pubblico…';
    const id = slug(title);
    const { error } = await Lab.db.from('posts').insert({
      id, tag, title, body,
      dek: $('p-dek').value.trim() || null,
      image_url, image_caption: $('p-caption').value.trim() || null
    });
    send.disabled = false;
    if (error) { note.textContent = 'Nota non pubblicata: ' + error.message; return; }
    note.textContent = 'Nota pubblicata.';
    location.href = 'nota.html?id=' + encodeURIComponent(id);
  });
})();
