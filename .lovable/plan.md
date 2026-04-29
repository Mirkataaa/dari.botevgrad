# Самостоятелен VPS пакет — отделен от текущия Lovable проект

## Цел

Създаваме **напълно отделен deployable пакет** в `/mnt/documents/dari-botevgrad-vps/`, който можеш да свалиш като ZIP и да качиш на VPS-а. Текущият Lovable проект **остава непокътнат** и продължава да работи на `dari-botevgrad.lovable.app` като production / fallback / staging.

## Подход

Пакетът ще е **monorepo** с две приложения:

```text
dari-botevgrad-vps/
├── README.md                    # Пълни deploy инструкции на български
├── DEPLOYMENT.md                # Step-by-step VPS setup
├── docker-compose.yml           # (опционално) PostgreSQL + Redis за лесен start
│
├── backend/                     # Express + TypeScript API
│   ├── src/
│   │   ├── index.ts             # Express app entry
│   │   ├── config/              # env, db pool, redis
│   │   ├── db/
│   │   │   ├── schema.sql       # Consolidated initial schema
│   │   │   ├── migrations/      # node-pg-migrate files
│   │   │   └── seed.sql         # Тестови данни (опц.)
│   │   ├── middleware/          # auth, errorHandler, rateLimit, validate
│   │   ├── routes/              # auth, campaigns, donations, comments, admin, etc.
│   │   ├── services/            # stripe, email (Resend), uploads, realtime
│   │   ├── workers/             # email-queue worker (BullMQ)
│   │   ├── email-templates/     # Копия от текущите React Email темплейти
│   │   └── lib/                 # utils, validators (Zod schemas)
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example
│   └── ecosystem.config.js      # PM2 cluster config
│
├── frontend/                    # Копие на текущия React app, адаптиран
│   ├── src/                     # Същият UI код, без supabase imports
│   │   ├── lib/
│   │   │   ├── api-client.ts    # Заменя supabase клиента (typed fetch)
│   │   │   └── socket-client.ts # Socket.io client (заменя realtime)
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx  # Пренаписан да използва API
│   │   └── ... (всички UI компоненти, страници — копирани as-is)
│   ├── package.json
│   ├── vite.config.ts
│   └── .env.example
│
└── deploy/
    ├── nginx.conf               # SPA + /api proxy + websocket + SSL
    ├── systemd/                 # Service files (алтернатива на PM2)
    ├── scripts/
    │   ├── setup-vps.sh         # Първоначална инсталация
    │   ├── deploy.sh            # Pull + build + restart
    │   └── backup-db.sh         # Daily pg_dump cron
    └── certbot-setup.md         # Let's Encrypt инструкции
```

---

## Какво пишем в backend/

### 1. Database (`db/schema.sql`)
Извличам текущата схема от Supabase, премахвам Supabase-specific неща:
- `auth.users` → собствена `users` таблица (email, password_hash, email_verified_at, google_id)
- Премахвам всички RLS policies (заместени с Express middleware authorization)
- Премахвам `pgmq` (заместено с BullMQ + Redis)
- Запазвам всички триггери (`check_campaign_completion`, `check_campaign_spam`, `log_campaign_version`)
- Запазвам `has_role` функцията и `user_roles` таблицата

### 2. Express endpoints (огледално на текущата функционалност)

| Route | Заменя |
|---|---|
| `POST /api/auth/register`, `/login`, `/refresh`, `/logout` | `supabase.auth.*` |
| `GET /api/auth/google`, `/google/callback` | Google OAuth |
| `POST /api/auth/forgot-password`, `/reset-password` | Recovery emails |
| `POST /api/auth/verify-email` | Signup confirmation |
| `GET/POST/PATCH/DELETE /api/campaigns` | `supabase.from('campaigns')` |
| `GET/POST /api/campaigns/:id/comments` + votes | comments + comment_votes |
| `GET/POST /api/campaigns/:id/updates` + votes | campaign_updates |
| `POST /api/donations/checkout` | `create-checkout` edge function |
| `POST /api/subscriptions`, `DELETE /api/subscriptions/:id` | `create-subscription`, `cancel-subscription` |
| `POST /api/stripe/webhook` | `stripe-webhook` |
| `POST /api/uploads/:bucket` | `supabase.storage` |
| `GET /api/admin/*` | Admin pages |
| `POST /api/contact` | Contact form |
| `GET /api/stats/total-donations` | Public stats |
| `POST /api/webhooks/email-suppression` | `handle-email-suppression` |
| `GET/POST /api/unsubscribe` | `handle-email-unsubscribe` |
| `GET /og/:campaignId.png` | `og-image` |

### 3. Email система
- `services/email.ts` — Resend SDK wrapper
- `workers/email-queue.ts` — BullMQ worker (стартира със собствен PM2 process)
- React Email темплейтите се копират 1:1 от `supabase/functions/_shared/`
- Confirmation/recovery emails се пращат директно от auth routes (без webhook hop)

### 4. Realtime
- Socket.io attached към Express
- Channels: `campaign:{id}`, `admin:notifications`
- Backend emit-ва събития след всеки relevant write

### 5. File uploads
- Multer + sharp (resize за images)
- Storage: `/var/www/uploads/{bucket}/{user_id}/{uuid}.{ext}`
- Nginx serve-ва public buckets директно
- Private bucket (`campaign-documents`) минава през Express auth middleware

### 6. Authorization middleware (заменя RLS)
- `requireAuth`, `requireRole('admin')`, `requireOwnership(resource)`
- Всеки route проверява permissions преди query
- Pattern: same logic като RLS политиките, но в TypeScript

---

## Какво пишем в frontend/

**Копираме целия текущ `src/` без следните файлове:**
- `src/integrations/supabase/` — изтрит
- `src/integrations/lovable/` — изтрит

**Заменяме:**
- Нов `src/lib/api-client.ts` — typed fetch с auto-refresh на JWT
- Нов `src/lib/socket-client.ts` — Socket.io client
- Пренаписан `src/contexts/AuthContext.tsx` — използва `/api/auth/*`
- Пренаписан `src/hooks/useRealtimeSync.ts` — слуша Socket.io events

**Във всеки от 27-те файла, които използват `supabase`:**
- `supabase.from('table').select(...)` → `api.get('/api/table?...')`
- `supabase.from('table').insert(...)` → `api.post('/api/table', body)`
- `supabase.auth.*` → `auth.*` от новия context
- `supabase.storage.*` → `api.upload(file, bucket)`
- `supabase.channel(...)` → `socket.on(...)`

UI компонентите (Tailwind, shadcn, layouts, страници) **не се променят** — само data layer-ът.

---

## Технически избори по подразбиране

Освен ако не предпочиташ друго:
- **Express 4** (стандарт, най-много примери онлайн)
- **Drizzle ORM** (type-safe, близък до SQL, лесен за debug)
- **node-pg-migrate** за миграции
- **Passport.js** + **passport-google-oauth20**
- **bcrypt** (10 rounds) за пароли
- **jsonwebtoken** — access 15min + refresh 7d (httpOnly cookie)
- **Socket.io 4** за realtime
- **BullMQ** + **Redis 7** за email queue
- **Multer** + **sharp** за uploads
- **Zod** за валидация
- **Pino** за logging
- **PM2** cluster mode (1 web process per CPU + 1 worker process)
- **Nginx** като reverse proxy + SPA serve + SSL
- **PostgreSQL 16**

---

## Документация в пакета

### `README.md`
- Какво е проектът, архитектура диаграма
- Локален dev setup (docker-compose up + npm run dev)
- Линк към DEPLOYMENT.md

### `DEPLOYMENT.md` (на български)
Step-by-step за нулев VPS:
1. SSH + основна сигурност (ufw, fail2ban, SSH keys)
2. Инсталация: Node.js 20, PostgreSQL 16, Redis 7, Nginx, certbot, PM2
3. Създаване на DB user + import на `schema.sql`
4. Клониране на repo + `npm install` в backend и frontend
5. `.env` setup (с обяснение за всяка променлива)
6. Build на frontend (`npm run build` → `frontend/dist/`)
7. PM2 start + save + startup
8. Nginx конфиг (копиране от `deploy/nginx.conf`, замяна на домейн)
9. Certbot за SSL
10. Stripe webhook URL update в Stripe Dashboard
11. Resend domain verification (вече настроено)
12. Cron за backups
13. Migration на данни от Supabase (export → import script)

### `MIGRATION.md`
- Как да експортираш данните от текущия Supabase: `pg_dump` команди
- Как да ги импортираш в новата база
- Как да трансформираш Supabase auth users → новата `users` таблица (с password reset email до всички)
- Как да преместиш файловете от Supabase Storage към `/var/www/uploads/`

---

## Какво НЕ включваме (за да не се раздуе пакетът)

- Не пишем тестове (можеш да добавиш по-късно)
- Не правим Docker production setup (PM2 + native install е по-просто за VPS)
- Не правим CI/CD pipeline (можеш да добавиш GitHub Actions по-късно)
- Не правим admin dashboard за server monitoring (PM2 има вграден monit)

---

## Оценка

| Стъпка | Време |
|---|---|
| Backend boilerplate + auth + middleware | 1 ден |
| Schema export + Drizzle setup | 0.5 ден |
| Campaigns/donations/comments routes | 1 ден |
| Stripe + webhooks | 0.5 ден |
| Email service + worker | 0.5 ден |
| Uploads + Socket.io | 0.5 ден |
| Frontend api-client + AuthContext rewrite | 0.5 ден |
| Frontend file-by-file rewrite (27 файла) | 1.5 дни |
| Nginx/PM2/deploy scripts + docs | 0.5 ден |
| **Общо в Lovable build mode** | **~6 дни AI работа** |

Имай предвид: пакетът ще има **много код** (~5000-7000 реда). Lovable build mode може да го свърши, но ще искам да го направим на **части в няколко чата**, за да не претоварваме един context. Предлагам разбивка:

1. **Чат 1 ✅:** Backend skeleton + DB schema + auth + middleware
2. **Чат 2 ✅:** Campaigns + donations + comments + admin routes (+ Stripe webhook + Socket.io broadcast)
3. **Чат 3 ✅:** Email система (Resend + BullMQ + 7 React Email темплейти) + uploads (Multer + Sharp) + Resend webhook
4. **Чат 4 ✅:** Frontend skeleton — копиран целият `src/`, изтрити Supabase интеграции, нов `lib/api-client.ts` (auto-refresh JWT), `lib/socket-client.ts`, пренаписан `AuthContext` (REST + Google OAuth redirect), пренаписан `useRealtimeSync` (Socket.io rooms) + нов `useCampaignRealtime`. `package.json` обновен (`socket.io-client` добавен, `@supabase/supabase-js` премахнат). ZIP: `dari-botevgrad-vps-chat4.zip`
5. **Чат 5 ✅:** Frontend file-by-file rewrite (частично) — мигрирани **всички 6 hooks**, **7 components** (VoteButtons, CampaignCard/Comments/Documents/Updates/VersionHistory, DonateButton, ProfileRevisions), и **8 pages** (About, ForgotPassword, ResetPassword, Unsubscribe, CreateCampaign, AdminContacts, AdminDashboard, AdminDonations). Добавен `lib/uploads.ts` helper. Останалите **8 файла** са започнати от codemod (има `// TODO[VPS-migration]` header и cheat-sheet в `frontend/README.md`) — ще се довършат в Чат 6 заедно с deploy. ZIP: `dari-botevgrad-vps-chat5.zip`

### Чат 3 — какво е готово
- `services/email-queue.ts` — BullMQ queues (auth + standard) с idempotency
- `services/email-renderer.ts` — React Email → HTML/text
- `services/email-service.ts` — `sendTemplatedEmail()` API
- `email-templates/` — `_layout`, verify-email, password-reset, welcome, contact-confirmation, campaign-approved, campaign-rejected, donation-receipt + registry
- `workers/email-worker.ts` — пълен BullMQ worker с retry, suppressed_emails check, log
- `routes/uploads.ts` — Multer + Sharp; buckets: campaign-images (+thumbs), documents, videos, avatars
- `routes/resend-webhook.ts` — Svix signature verify, bounces/complaints → suppressed_emails
- Email triggers свързани в: contact form, admin approve/reject campaign, donations webhook (one-time + recurring receipt)
- `auth.ts` мигриран от стария `sendEmail` към `sendTemplatedEmail`
- `index.ts`: Resend webhook също mount-нат преди json parser
- ZIP: `dari-botevgrad-vps-chat3.zip`
4. **Чат 4:** Frontend api-client + AuthContext + realtime hook (Socket.io client)
5. **Чат 5:** Frontend file-by-file rewrite (страница по страница)
6. **Чат 6:** Deploy скриптове + Nginx + документация + финален ZIP

### Чат 2 — какво е готово
- `db/pool.ts` — pg Pool + transaction helper
- `lib/schemas.ts` — Zod валидация за всички routes
- `lib/realtime.ts` — Socket.io broadcast helper
- `middleware/validate.ts` — generic body/query валидатор
- Routes: `campaigns`, `comments`, `updates`, `donations`, `stripe-webhook`, `contact`, `admin`, `stats`, `profiles`
- Schema: добавена таблица `verified_organizations`
- `index.ts`: Stripe webhook mount-нат **преди** `express.json()` (raw body); Socket.io subscribe/unsubscribe на campaign rooms

### Чат 2 — функционални особености
- **Anti-spam**: trigger от schema-та връща 429 при >10 кампании за 24ч
- **RLS заместване**: всички "owner-or-admin" проверки са на ниво route handler
- **Idempotency**: donations имат UNIQUE индекс на `stripe_session_id` и `stripe_payment_id`
- **Recurring**: webhook създава subscription при checkout; всеки `invoice.paid` добавя donation
- **Drafts**: при approve копираме полета върху `campaigns`; trigger `trg_log_campaign_version` snapshot-ва старата версия
- **Status visibility**: pending/rejected/archived кампании се виждат само от собственика/админа

---

## Въпроси преди да започнем

1. **VPS specs?** (RAM/CPU/диск, OS — Ubuntu/Debian?). Влияе на дали препоръчвам Docker или native install.
2. **Домейн?** Имаш ли вече или ще регистрираш? (нужно за Nginx config + SSL + Stripe webhook)
3. **ORM избор:** Drizzle (препоръка), Kysely, или raw `pg`?
4. **Realtime приоритет:** наистина ли ти трябва (донации да се обновяват live)? Ако не — можем да пропуснем Socket.io и да правим polling, което е сериозно опростяване.

След като одобриш плана и отговориш, започвам **Чат 1** — backend skeleton с auth система и DB schema. Ще генерирам файловете в `/mnt/documents/dari-botevgrad-vps/` и ще ти дам ZIP за download в края на всеки чат.
