## Проблем

След вчерашния security hardening публичната част на сайта спря да работи за нелогнати потребители (виждаш `permission denied for function has_role` в network таба, статус 401 за `/campaigns` и `/campaigns?status=eq.active`).

## Причина

Migration-ът `20260429094609` направи:
```sql
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
```

Но `has_role()` се извиква **вътре в RLS политиките** на множество таблици с публичен SELECT:
- `campaigns` → политика "Campaigns viewable by everyone" (`... OR has_role(auth.uid(), 'admin')`)
- `comments`, `comment_votes`, `update_votes`, `campaign_updates` (публични SELECT, но DELETE/UPDATE политики ползват `has_role`)
- `public_donations` view (security invoker → пада до `donations` RLS, която също вика `has_role`)

Когато `anon` отвори главната страница, Postgres изпълнява политиката, опитва да извика `has_role` → `42501 permission denied` → целият SELECT гърми с 401.

Затова не се виждат: активни кампании, завършени кампании, общо събрани средства, статистики, hero секцията.

## Решение

`has_role(uuid, app_role)` е `SECURITY DEFINER` функция, която приема `_user_id` и връща `boolean` от вътрешната таблица `user_roles`. Тя:
- НЕ приема свободен SQL вход
- НЕ връща чужди данни — само `true/false`
- За `anon` `auth.uid()` е `NULL` → винаги връща `false`
- Е стандартна Supabase best-practice функция, проектирана да е достъпна за RLS evaluation

Безопасно е да я върнем достъпна за `anon`. Това е стандартът, препоръчан от Supabase docs за role-based RLS.

## Стъпки

### 1. Нов migration: възстановяване на `EXECUTE` за `has_role`

```sql
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon, authenticated;
```

Това веднага оправя:
- Зареждането на кампании (активни/завършени) за нелогнати
- Статистиките на главната страница (общо събрани средства, брой кампании, брой дарения)
- Публичното виждане на коментари, updates, votes
- Дарения история (`public_donations`)

### 2. Verification чрез database linter

Стартираме `supabase--linter` след миграцията, за да потвърдим, че няма нови security warnings и че всичко друго от вчерашния hardening остава непроменено:
- Storage policies за `campaign-images`/`campaign-documents`/`campaign-videos` остават strict (owner-based)
- Internal trigger functions (`handle_new_user`, `check_campaign_spam`, `log_campaign_version`, `check_campaign_completion`) остават revoked от `anon`/`authenticated` — те се викат само от тригери и не трябва да се извикват директно
- Email queue functions остават `service_role`-only
- Error masking в Edge Functions остава непроменен

### 3. Обновяване на security memory

Документираме защо `has_role` ТРЯБВА да е достъпна за `anon`:
> `has_role(uuid, app_role)` е SECURITY DEFINER функция, използвана в RLS политики на публично четими таблици. ТРЯБВА да остане `EXECUTE` за `anon` и `authenticated` — иначе всеки публичен SELECT ще се проваля с 42501. Връща само boolean от `user_roles` и не разкрива чужди данни.

## Какво НЕ променяме

- Storage policies (campaign-images, documents, videos) — остават с owner validation
- Error masking в `create-checkout`, `create-subscription`, `cancel-subscription` — остава
- Revoke на internal trigger/email функции от `anon`/`authenticated` — остава
- RLS политики на която и да е таблица — без промяна

## Резултат

След прилагането на миграцията:
- Главна страница, /active, /completed, /campaign/:id зареждат за нелогнати потребители
- Статистиките (събрани средства, брой дарения) се виждат отново
- Публичната история на дарения работи
- Цялата сигурност от вчерашния hardening остава непокътната
