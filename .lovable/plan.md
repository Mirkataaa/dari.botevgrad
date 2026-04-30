## Цел

Да пуснеш `dari-botevgrad-vps` локално на Windows с празна база (без seed данни), Stripe в test mode и Resend за имейли. Без deploy, без домейн, без SSL.

## Какво ще намериш в пакета (вече подготвено)

- `docker-compose.yml` — вдига **само** Postgres 16 + Redis 7 (backend и frontend ги пускаш с `npm run dev`, не в контейнер — за да имаш hot reload)
- `backend/src/db/schema.sql` — авто-зарежда се при първото вдигане на Postgres контейнера (празна база с цялата схема)
- `backend/.env.example` и `frontend/.env.example` — шаблони

## Открити несъответствия (ще ги fix-ваме)

1. **Port mismatch**: `backend/.env.example` казва `PORT=3000`, но `frontend/.env.example` сочи към `:4000`. За локално ще уеднаквим на **4000**.
2. **Cookie settings**: `.env.example` е писан за production (`COOKIE_SECURE=true`, домейн `.dari.botevgrad.bg`). Локално трябват `COOKIE_SECURE=false` и празен `COOKIE_DOMAIN`, иначе login няма да работи на `http://localhost`.
3. **`UPLOAD_DIR=/var/www/uploads`** — Linux път. На Windows ще бъде `./uploads` (релативно към backend папката).
4. **Stripe webhook на localhost** — Stripe не може да хитне `http://localhost`. За тестване webhooks локално ще пуснем **Stripe CLI** (`stripe listen --forward-to localhost:4000/api/stripe/webhook`).

## Стъпки за първоначален setup

### 1. Подготовка
- Свали `dari-botevgrad-vps.zip` и го разархивирай (напр. `C:\dev\dari-botevgrad-vps`)
- Увери се че Docker Desktop работи и че имаш Node.js 20+ (`node -v`)
- Отвори PowerShell в папката на проекта

### 2. Вдигане на базата (Docker)
```powershell
docker compose up -d postgres redis
docker compose ps   # увери се че и двата са "healthy"/"running"
```
Това ще създаде празна база `dari_botevgrad` и ще изпълни `schema.sql` автоматично.

### 3. Backend setup
```powershell
cd backend
copy .env.example .env
npm install
```
След това отвори `backend/.env` и направи следните промени:
```
PORT=4000
DATABASE_URL=postgres://dari:dari_dev@localhost:5432/dari_botevgrad
REDIS_URL=redis://localhost:6379
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:4000
COOKIE_DOMAIN=
COOKIE_SECURE=false
JWT_ACCESS_SECRET=<генерирай със: node -e "console.log(require('crypto').randomBytes(64).toString('base64'))">
JWT_REFRESH_SECRET=<генерирай по същия начин, различен>
UPLOAD_DIR=./uploads
STRIPE_SECRET_KEY=sk_test_...        # от Stripe Dashboard → Developers → API keys (test mode)
STRIPE_WEBHOOK_SECRET=whsec_...      # ще го получиш от `stripe listen` в стъпка 6
RESEND_API_KEY=re_...                # от resend.com → API Keys
EMAIL_FROM_ADDRESS=onboarding@resend.dev   # за тест без верифициран домейн
EMAIL_FROM_NAME=dari.botevgrad (dev)
```

### 4. Стартиране на backend (3 паралелни PowerShell прозореца)
```powershell
# Прозорец 1 — API сървър
cd backend; npm run dev

# Прозорец 2 — email worker (BullMQ)
cd backend; npm run dev:worker
```

### 5. Frontend setup
```powershell
cd frontend
copy .env.example .env
npm install
npm run dev
```
В `frontend/.env` остави стойностите по подразбиране — те вече сочат към `localhost:4000`. Добави `VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...` от Stripe.

Frontend ще се отвори на **http://localhost:5173**.

### 6. Stripe (test mode + webhook locally)
- Влез в [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys), увери се че си в **Test mode** (тогъл горе вдясно)
- Копирай `sk_test_...` → `STRIPE_SECRET_KEY` в backend `.env`
- Копирай `pk_test_...` → `VITE_STRIPE_PUBLISHABLE_KEY` в frontend `.env`
- Инсталирай [Stripe CLI за Windows](https://docs.stripe.com/stripe-cli) (има и `scoop install stripe`)
- В нов терминал:
  ```powershell
  stripe login
  stripe listen --forward-to localhost:4000/api/stripe/webhook
  ```
  CLI-то ще принтира `whsec_...` — копирай го в `STRIPE_WEBHOOK_SECRET` и рестартирай backend.
- За тестово плащане ползвай карта `4242 4242 4242 4242`, всякаква валидна дата и CVC.

### 7. Resend (имейли)
- Регистрирай се на [resend.com](https://resend.com)
- Издай API key → копирай в `RESEND_API_KEY`
- За локално тестване **не** е нужно да верифицираш домейн — ползвай sender `onboarding@resend.dev`. Това позволява пращане **само до твоя собствен email** (този с който си регистриран в Resend). За пращане до други адреси по-късно ще верифицираш домейн.
- Webhook за bounces (`RESEND_WEBHOOK_SECRET`) можеш да оставиш празен локално.

### 8. Създаване на първи admin user (празна база)
След като signup-неш първия акаунт през UI-то на http://localhost:5173/register, ще трябва ръчно да си дадеш admin роля през psql:
```powershell
docker exec -it dari-botevgrad-vps-postgres-1 psql -U dari -d dari_botevgrad
```
```sql
-- Намери своя user_id:
SELECT id, email FROM users;
-- Дай си admin роля:
INSERT INTO user_roles (user_id, role) VALUES ('<твоя-uuid>', 'admin');
\q
```

## Какво НЕ работи локално (ограничения)

| Функционалност | Защо | Workaround |
|---|---|---|
| Google OAuth login | Нужен е реален callback URL регистриран в Google Console | Ползвай email/password регистрация |
| Production имейли към чужди адреси | Resend `onboarding@resend.dev` праща само до теб | Верифицирай домейн в Resend (по-късно) |
| Stripe webhook без CLI | Stripe не достига localhost | Stripe CLI (стъпка 6) |
| Realtime push на различни устройства | Socket.io работи само в твоята мрежа | Не е проблем за dev |

## Daily workflow (след първия setup)

```powershell
# Сутрин:
docker compose up -d
# Прозорец 1: cd backend; npm run dev
# Прозорец 2: cd backend; npm run dev:worker
# Прозорец 3: cd frontend; npm run dev
# Прозорец 4: stripe listen --forward-to localhost:4000/api/stripe/webhook

# Вечер:
docker compose stop   # БЕЗ -v, за да си запазиш данните!
```

За **пълно почистване и нова празна база**:
```powershell
docker compose down -v   # -v триене на volume-ите
```

## Какво ще направя в build mode

В рамките на следващия чат (build mode), ще:

1. **Поправя несъответствията в пакета**:
   - Уеднаквя порт `4000` в `backend/.env.example`
   - Добавя `LOCAL-DEV.md` в корена на пакета с тези стъпки на български
   - Добавя `docker-compose.override.yml` пример с правилни Windows volume пътища
   - Добавя малък скрипт `scripts/make-admin.sql` за лесно даване на admin роля
   - Поправя `UPLOAD_DIR` default в кода да приема релативни пътища на Windows
2. **Генерирам нов ZIP** `dari-botevgrad-vps-local.zip` готов за Windows
3. Не пипам Stripe/Resend интеграцията в кода — те вече са имплементирани и ще проработят щом сложиш ключовете в `.env`

След като одобриш, превключвам в build mode и правя промените.
