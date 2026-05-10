# План: Експорт на auth.users от Lovable Cloud

В базата има **8 потребителя**. Целта: безопасно ги извличаме като JSON (с bcrypt хешовете на паролите), сваляш файла, после ще ги import-нем в self-hosted Supabase.

---

## Стъпка 1 — Временен edge function `export-auth-users`

Създавам нов edge function `supabase/functions/export-auth-users/index.ts` със следната логика:

- **Authentication**: Приема Bearer token, проверява че идва от **service_role** (както направихме за `send-transactional-email`). Никой друг не може да го извика.
- **Допълнителна защита**: Изисква и custom header `X-Export-Secret` с произволна стойност, която ще зададеш в secrets (`AUTH_EXPORT_SECRET`). Двоен ключ — service_role key + наш секрет.
- **Логика**: Чете директно от `auth.users` през service-role клиент с такъв SQL (през RPC функция, защото SDK-то не дава достъп до auth схемата):

```sql
-- SECURITY DEFINER функция в public схемата
CREATE FUNCTION public.export_auth_users_admin()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE result jsonb;
BEGIN
  -- Само service_role може да я вика
  IF auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  SELECT jsonb_agg(to_jsonb(u)) INTO result
  FROM (
    SELECT id, email, encrypted_password, email_confirmed_at,
           raw_user_meta_data, raw_app_meta_data,
           created_at, updated_at, last_sign_in_at,
           confirmation_token, recovery_token,
           email_change, email_change_token_new,
           phone, phone_confirmed_at,
           is_sso_user, role, aud, instance_id
    FROM auth.users
  ) u;

  RETURN result;
END;
$$;
```

- Edge function-ът извиква `supabase.rpc('export_auth_users_admin')` и връща JSON-а.
- Връща и `auth.identities` записите (за OAuth провайдъри ако има).

---

## Стъпка 2 — Добавяне на secret `AUTH_EXPORT_SECRET`

Чрез secrets tool ще те помоля да въведеш произволен дълъг низ (генерирай си с `openssl rand -hex 32` или просто измисли). Това е допълнителна защита освен service role key-а.

---

## Стъпка 3 — Извикване и сваляне

След deploy ще ти дам curl команда за теб (с твоя service role key + секрета):

```bash
curl -X POST 'https://zjzyybdvbgovnvftnfod.supabase.co/functions/v1/export-auth-users' \
  -H "Authorization: Bearer <SERVICE_ROLE_KEY>" \
  -H "X-Export-Secret: <твоя AUTH_EXPORT_SECRET>" \
  -o auth_users_export.json
```

Резултат: файл `auth_users_export.json` с всичките 8 потребителя + identities.

Алтернативно мога да го извикам аз през тестовия tool и да ти запиша файла в `/mnt/documents/` за директно сваляне.

---

## Стъпка 4 — Import скрипт за новата инстанция

Подготвям втори скрипт `import-auth-users.mjs` (Node.js, ще го пускаш на VM-то), който:
1. Чете `auth_users_export.json`
2. Свързва се директно към PostgreSQL на self-hosted Supabase
3. Прави `INSERT ... ON CONFLICT (id) DO NOTHING` в `auth.users` и `auth.identities`
4. **Запазва същите UUID-та** → всички FK-и в `public.profiles`, `public.campaigns.created_by`, `public.donations.donor_id`, `public.user_roles.user_id` ще работят без промяна
5. Запазва оригиналните `encrypted_password` хешове → потребителите се логват със старите пароли

---

## Стъпка 5 — Cleanup (важно!)

След успешен import:
- Изтриваме edge function-а `export-auth-users`
- DROP-ваме `public.export_auth_users_admin()` функцията
- Премахваме secret-а `AUTH_EXPORT_SECRET`

Това е чувствителен код — не остава в продукцията.

---

## Какво се прави сега

При одобрение на плана (Implement) ще:
1. Създам миграция за `export_auth_users_admin()` функцията
2. Поискам от теб secret `AUTH_EXPORT_SECRET`
3. Създам и deploy-на edge function-а
4. Извикам го и ти запазя файла в `/mnt/documents/auth_users_export.json` за директно сваляне
5. Подготвя `import-auth-users.mjs` за VM-то

---

## Какво НЕ влиза в този план (отделни сесии)

- Restore на `full.dump` в Coolify Postgres (вече го обсъждахме)
- Storage файлове (rclone S3→S3)
- Edge functions deploy към новата инстанция
- Secrets и auth config в Coolify

Ще ги направим един по един в отделни заявки.