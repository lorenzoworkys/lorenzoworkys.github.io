-- Database del quaderno di Lore.
-- PRIMA DI ESEGUIRE: nella funzione is_author qui sotto sostituisci LA_TUA_EMAIL
-- con l'email con cui accederai alla scrivania. Poi incolla tutto in
-- Supabase → SQL Editor → New query → Run.

-- Chi è l'autore: l'unico che può pubblicare note, caricare immagini ed eliminare commenti.
create or replace function public.is_author()
returns boolean
language sql
stable
as $$
  select coalesce(lower(auth.jwt() ->> 'email') = lower('LA_TUA_EMAIL'), false)
$$;

-- Note
create table if not exists public.posts (
  id            text primary key,
  tag           text not null check (tag in ('ML', 'Web', 'Vita')),
  title         text not null check (char_length(title) between 1 and 200),
  dek           text check (char_length(dek) <= 300),
  body          text not null check (char_length(body) between 1 and 50000),
  image_url     text,
  image_caption text check (char_length(image_caption) <= 200),
  created_at    timestamptz not null default now()
);

-- Commenti
create table if not exists public.comments (
  id         uuid primary key default gen_random_uuid(),
  post_id    text not null references public.posts(id) on delete cascade,
  name       text not null check (char_length(btrim(name)) between 1 and 60),
  body       text not null check (char_length(btrim(body)) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index if not exists comments_post_idx on public.comments (post_id, created_at);

-- Regole di accesso (Row Level Security)
alter table public.posts    enable row level security;
alter table public.comments enable row level security;

grant usage on schema public to anon, authenticated;
grant select on public.posts to anon, authenticated;
grant insert, update, delete on public.posts to authenticated;
grant select, insert on public.comments to anon, authenticated;
grant delete on public.comments to authenticated;

drop policy if exists "chiunque legge le note" on public.posts;
create policy "chiunque legge le note" on public.posts
  for select using (true);

drop policy if exists "solo l'autore scrive note" on public.posts;
create policy "solo l'autore scrive note" on public.posts
  for insert to authenticated with check (public.is_author());

drop policy if exists "solo l'autore modifica note" on public.posts;
create policy "solo l'autore modifica note" on public.posts
  for update to authenticated using (public.is_author()) with check (public.is_author());

drop policy if exists "solo l'autore elimina note" on public.posts;
create policy "solo l'autore elimina note" on public.posts
  for delete to authenticated using (public.is_author());

drop policy if exists "chiunque legge i commenti" on public.comments;
create policy "chiunque legge i commenti" on public.comments
  for select using (true);

drop policy if exists "chiunque può commentare" on public.comments;
create policy "chiunque può commentare" on public.comments
  for insert to anon, authenticated with check (true);

drop policy if exists "solo l'autore elimina commenti" on public.comments;
create policy "solo l'autore elimina commenti" on public.comments
  for delete to authenticated using (public.is_author());

-- Immagini: cartella pubblica "screenshots", solo l'autore carica
insert into storage.buckets (id, name, public)
values ('screenshots', 'screenshots', true)
on conflict (id) do nothing;

drop policy if exists "solo l'autore carica immagini" on storage.objects;
create policy "solo l'autore carica immagini" on storage.objects
  for insert to authenticated with check (bucket_id = 'screenshots' and public.is_author());

drop policy if exists "solo l'autore elimina immagini" on storage.objects;
create policy "solo l'autore elimina immagini" on storage.objects
  for delete to authenticated using (bucket_id = 'screenshots' and public.is_author());

-- Le prime due note (le immagini sono già nel sito, in assets/img)
insert into public.posts (id, tag, title, dek, body, image_url, image_caption, created_at) values
  ('primo-neurone', 'ML', 'Guardando con attenzione il mio primo neurone', 'Ho scritto riga per riga cosa pensavo facesse il codice, prima di sapere se avevo ragione.', 'Il codice è NeuralNet3: un neurone con un solo peso, w, che parte da un valore casuale e deve scoprire da cinque esempi che la risposta è sempre il doppio dell’ingresso. Nessuno gli scrive la regola.

![Il codice di NeuralNet3 in VS Code.](assets/img/neuralnet3-codice.png)

La prima cosa che mi ha colpito sono gli esempi. La macchina non ragiona come un umano, non «collega i punti». Per lei la verità non è il 4: è la coppia 2 → 4. Senza l’ingresso, il 4 da solo non dice niente.

> La verità non è il numero. È la coppia.

Poi la riga che corregge il peso: w = w − lr · errore · x. Ho provato a tradurla a parole. Il learning rate dà l’intensità, l’errore la direzione, x quanto quel peso è responsabile dello sbaglio. Moltiplicati insieme diventano un’unica correzione. Solo dopo ho scoperto che è la struttura di una derivata.

Il risultato: dopo la prima epoca il peso valeva 1,3175, dopo dieci già 1,9984, dalla ventesima 2,0. Alla domanda «quanto fa 10?», un numero che non aveva mai visto, ha risposto 19,999999999999183. Non esattamente 20, perché i computer rappresentano i decimali con una piccolissima imprecisione. Ma la regola l’ha trovata da solo.', 'assets/img/neuralnet3-output.png', 'L’output nel terminale: w sale verso 2.', '2026-09-26T18:00:00+02:00'),
  ('quaderno-aperto', 'Web', 'Il quaderno è aperto', 'Un posto dove tenere traccia di cosa imparo e costruisco, un aggiornamento alla volta.', 'Ho deciso di costruirmi una pagina su internet che funzioni come un quaderno di laboratorio. Non un curriculum, ma un registro: cosa sto studiando, cosa ho capito, cosa non ha funzionato. I progetti arriveranno quando saranno veri, e ognuno avrà il suo spazio qui, funzionante.

Sotto ogni nota si può commentare: correzioni, domande e idee sono benvenute.', null, null, '2026-09-27T12:00:00+02:00')
on conflict (id) do nothing;
