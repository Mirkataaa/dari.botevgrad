# План: Миграция на Storage файлове към self-hosted Supabase

## Ситуация

- **71 файла** общо в 4 бъкета — малък обем, не е нужен rclone
- Lovable Cloud **няма** exposed S3 credentials за директен S3→S3 transfer
- Решение: **Node.js скрипт на VM-то**, който трансферира през Supabase SDK (download → upload)

---

## Бъкети и файлове

| Бъкет | Брой | Public |
|---|---|---|
| `avatars` | 3 | да |
| `campaign-documents` | 3 | не |
| `campaign-images` | 63 | да |
| `campaign-videos` | 2 | да |

---

## Стъпка 1 — SQL за self-hosted (бъкети + policies)

След като `full.dump` е възстановен, изпълняваш на новата база:

```sql
-- Бъкети
insert into storage.buckets (id, name, public) values
  ('avatars','avatars',true),
  ('campaign-documents','campaign-documents',false),
  ('campaign-images','campaign-images',true),
  ('campaign-videos','campaign-videos',true)
on conflict (id) do nothing;

-- Policies (create them after the app_role enum and has_role function exist)
-- Full policy definitions provided in the script file
```

Всички policies са за `storage.objects` и проверяват `bucket_id`, `auth.uid()` и `has_role()`.

---

## Стъпка 2 — Node.js transfer скрипт (`migrate-storage.mjs`)

Скриптът ще бъде записан в `/mnt/documents/migrate-storage.mjs` за сваляне.

**Какво прави:**
1. Приема 4 env vars: `SOURCE_URL`, `SOURCE_KEY`, `DEST_URL`, `DEST_KEY`
2. Свързва два Supabase клиента (източник и цел)
3. Листва файловете във всеки бъкет от източника
4. За всеки файл:
   - `download()` от източника (stream в Buffer)
   - `upload()` в целта със същия `path`
5. Принтира прогрес

**Необходимо на VM-то:**
```bash
npm install @supabase/supabase-js
```

**Изпълнение:**
```bash
SOURCE_URL="https://zjzyybdvbgovnvftnfod.supabase.co" \
SOURCE_KEY="<LOVABLE_SERVICE_ROLE_KEY>" \
DEST_URL="http://supabasekong-rjbn9gf5ip45go17p62pd6dn.84.22.5.28.sslip.io" \
DEST_KEY="<SELFHOST_SERVICE_ROLE_KEY>" \
node migrate-storage.mjs
```

---

## Стъпка 3 — Обновяване на URL-ите в базата

След успешен transfer, старите URL-и в `campaigns.images`, `campaigns.documents`, `campaigns.videos`, `profiles.avatar_url` сочат към Lovable Cloud. SQL за replace:

```sql
-- campaigns.images
update public.campaigns
set images = array(
  select replace(x, 'https://zjzyybdvbgovnvftnfod.supabase.co', 'http://supabasekong-rjbn9gf5ip45go17p62pd6dn.84.22.5.28.sslip.io')
  from unnest(images) x
)
where images is not null and array_length(images, 1) > 0;

-- campaigns.documents
update public.campaigns
set documents = array(
  select replace(x, 'https://zjzyybdvbgovnvftnfod.supabase.co', 'http://supabasekong-rjbn9gf5ip45go17p62pd6dn.84.22.5.28.sslip.io')
  from unnest(documents) x
)
where documents is not null and array_length(documents, 1) > 0;

-- campaigns.videos (ако има storage URLs)
update public.campaigns
set videos = array(
  select replace(x, 'https://zjzyybdvbgovnvftnfod.supabase.co', 'http://supabasekong-rjbn9gf5ip45go17p62pd6dn.84.22.5.28.sslip.io')
  from unnest(videos) x
)
where videos is not null and array_length(videos, 1) > 0;

-- profiles.avatar_url
update public.profiles
set avatar_url = replace(avatar_url, 'https://zjzyybdvbgovnvftnfod.supabase.co', 'http://supabasekong-rjbn9gf5ip45go17p62pd6dn.84.22.5.28.sslip.io')
where avatar_url like 'https://zjzyybdvbgovnvftnfod.supabase.co%';
```

---

## Какво се прави сега

При одобрение ще:
1. Запиша `migrate-storage.mjs` в `/mnt/documents/` за сваляне
2. Запиша `storage-policies.sql` за създаване на бъкети + policies на self-hosted
3. Запиша `update-urls.sql` за replace на домейните
4. Дам точните инструкции за изпълнение на VM-то

---

## Какво ти трябва от self-hosted

- `SUPABASE_SERVICE_ROLE_KEY` на self-hosted инстанцията (от `.env` или Kong/Studio)
- `SUPABASE_URL` — вече знаем: `http://supabasekong-rjbn9gf5ip45go17p62pd6dn.84.22.5.28.sslip.io`

## Какво давам аз от Lovable Cloud

- `SUPABASE_SERVICE_ROLE_KEY` — вече имаме в secrets, ще го включа в инструкциите
- `SUPABASE_URL` — `https://zjzyybdvbgovnvftnfod.supabase.co`
