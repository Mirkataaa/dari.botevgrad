# Активиране на Stripe разписки (receipts)

## Каква е причината в момента

В кода за създаване на checkout sessions (`create-checkout` за еднократни дарения и `create-subscription` за абонаменти) **не е заявено** изпращане на receipt email от Stripe. Затова Stripe не изпраща нищо след успешно плащане.

Има два начина receipts да тръгнат — единият е настройка в Stripe Dashboard (за теб), другият е малка промяна в кода (от мен). Препоръчвам да направим **и двете**, за да сме сигурни.

---

## Какво трябва да направиш ти в Stripe (еднократно)

1. Влез в [dashboard.stripe.com](https://dashboard.stripe.com).
2. Отиди в **Settings → Emails** (или директно: Settings → Customer emails).
3. Включи опцията **"Successful payments"** — това кара Stripe автоматично да изпраща разписка след всяко успешно плащане.
4. Включи и **"Refunds"** (по желание) — за случаите на връщане на дарение.
5. По желание: качи лого и цвят в **Settings → Branding**, за да изглеждат разписките с твоя бранд.

⚠️ Важно: тези настройки са отделни за **Test mode** и **Live mode** (превключвателят горе вдясно в Stripe). Включи ги и в двата режима, ако тестваш с тестови карти.

---

## Какво ще променя аз в кода

За да гарантирам, че receipt-ът тръгва дори ако някоя настройка е изключена, ще добавя следните параметри:

### 1. `create-checkout/index.ts` (еднократни дарения)
Добавям в `stripe.checkout.sessions.create({...})`:
```ts
payment_intent_data: {
  receipt_email: user?.email || undefined,
},
```
- Ако дарителят е логнат → receipt отива на неговия email.
- Ако дарителят е анонимен/гост → Stripe Checkout вече събира email в самата форма и автоматично го използва за receipt (когато настройката от стъпка 1 е включена).

### 2. `create-subscription/index.ts` (абонаменти)
За абонаменти Stripe изпраща **invoice email** след всяко успешно плащане (не "receipt" в тесния смисъл). Добавям:
```ts
subscription_data: {
  metadata: { ... },
},
// нов параметр:
invoice_creation: {
  enabled: true, // не е нужно за subscription mode — invoices се създават автоматично
},
```
И за самия customer ще се уверя, че email-ът е винаги асоцииран (вече е, чрез `customers.create({ email })`).

Освен това в Stripe Dashboard → **Settings → Billing → Subscriptions and emails** трябва да включиш:
- **"Email customers about successful payments"** ✅
- **"Email customers about failed payments"** ✅ (препоръчително)

---

## Технически детайли (за справка)

- Файлове за промяна: `supabase/functions/create-checkout/index.ts`, `supabase/functions/create-subscription/index.ts`
- След промените edge functions се деплойват автоматично.
- Няма промени в база данни, UI или други функции.
- Не се променя никаква друга логика.

---

## Кратко обобщение

| Действие | Кой го прави |
|---|---|
| Включи "Successful payments" в Stripe → Settings → Emails | **Ти** |
| Включи "Email customers about successful payments" в Settings → Billing | **Ти** (за абонаменти) |
| Добави `receipt_email` в create-checkout | Аз |
| Уверя се, че subscription customer има email | Аз (вече е така, ще проверя) |

Кажи "давай" и ще направя промените в кода. Настройките в Stripe Dashboard трябва да ги включиш ти, защото нямам достъп до твоя Stripe акаунт.
