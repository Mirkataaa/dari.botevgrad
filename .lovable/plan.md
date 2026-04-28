## Текущо състояние

**Добра новина: цялата email infrastructure за recovery вече е настроена и работи!**

- ✅ Домейн `daribotevgrad.notify.miroplayground.online` е верифициран
- ✅ `auth-email-hook` edge function е deploy-ната и enqueue-ва recovery имейли
- ✅ `recovery.tsx` шаблонът съществува (на български, brand styled)
- ✅ Страницата `/reset-password` вече е създадена и работи (`src/pages/ResetPassword.tsx`)
- ✅ Превод `auth.forgotPassword` = "Забравена парола?" вече е дефиниран

**Какво липсва:** Само UI входната точка — потребителят няма откъде да поиска email за нулиране на паролата. Текущата Login страница няма "Забравена парола?" линк.

## Какво ще направим

### 1. Нова страница `/forgot-password`
Създаване на `src/pages/ForgotPassword.tsx`:
- Форма с едно поле за email
- При submit извиква:
  ```ts
  supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`
  })
  ```
- Показва toast съобщение "Изпратихме ви имейл с линк за нулиране на паролата" (без значение дали имейлът съществува — за security)
- Линк обратно към `/login`
- Същият branded дизайн както Login/Register (Card, KeyRound icon)

### 2. Регистриране на route в `src/App.tsx`
Добавяне на:
```tsx
<Route element={<Layout><ForgotPassword /></Layout>} path="/forgot-password" />
```

### 3. "Забравена парола?" линк в Login страницата
В `src/pages/Login.tsx`, под полето за парола (вляво/вдясно от бутона "Вход"):
```tsx
<Link to="/forgot-password" className="text-sm text-primary hover:underline">
  {t("auth.forgotPassword")}
</Link>
```

### 4. Допълнителни преводи (BG/EN)
В `src/contexts/LanguageContext.tsx`:
- `auth.forgotTitle` — "Забравена парола"
- `auth.forgotDesc` — "Въведете имейла си, ще ви изпратим линк за нулиране"
- `auth.sendResetLink` — "Изпрати линк за нулиране"
- `auth.resetEmailSent` — "Изпратихме ви имейл с инструкции (ако акаунтът съществува)"
- `auth.backToLogin` — "Назад към вход"

## Как ще работи (end-to-end)

1. Потребител натиска "Забравена парола?" в Login → отива на `/forgot-password`
2. Въвежда email → `supabase.auth.resetPasswordForEmail()` се извиква
3. Supabase Auth тригерва `auth-email-hook` → enqueue в `auth_emails` queue
4. `process-email-queue` cron job (на 5 сек) → изпраща branded recovery имейл от `noreply@daribotevgrad.notify.miroplayground.online`
5. Потребителят натиска "Нулиране на парола" в имейла → отива на `/reset-password`
6. Въвежда нова парола → готово ✓

## Какво НЕ се променя
- Шаблоните за имейли (вече branded)
- Auth hook logic
- ResetPassword страницата (вече работи)
- Регистрация / Google login
- Друг UI или функционалност

## Файлове

**Нови:**
- `src/pages/ForgotPassword.tsx`

**Редактирани:**
- `src/App.tsx` (нов route)
- `src/pages/Login.tsx` (добавяне на линк)
- `src/contexts/LanguageContext.tsx` (нови преводи)

**От твоя страна не се изисква нищо** — не трябва да настройваш нищо в Stripe/Supabase/DNS. Всичко е готово, само трябва да одобриш плана.
