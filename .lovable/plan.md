## Проблем

`send-transactional-email` в момента приема валиден anon JWT (`verify_jwt = true`), което означава че всеки с публичния anon ключ (видим в браузър бъндъла) може да извика функцията и да изпрати имейл от нашия домейн до произволен адрес с фалшиви данни (`templateData.amount`, `campaignTitle` и т.н.). Това е вектор за phishing/spam и заплашва репутацията на изпращащия домейн.

## Решение

Функцията трябва да е извикваема **само от сървър-страна** (други edge функции като `stripe-webhook`, бъдещи DB тригери), никога от браузъра с anon ключ.

### Промени

**1. `supabase/functions/send-transactional-email/index.ts`**

В началото на handler-а (след CORS preflight) добавяме проверка че caller-ът има `service_role` JWT:

```ts
const authHeader = req.headers.get('Authorization') ?? ''
const token = authHeader.replace(/^Bearer\s+/i, '').trim()

// Decode JWT payload (middle segment) without verifying — verify_jwt=true
// already guaranteed signature validity at the gateway.
let role: string | undefined
try {
  const payload = JSON.parse(
    atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))
  )
  role = payload.role
} catch {
  // fall through
}

if (role !== 'service_role') {
  return new Response(JSON.stringify({ error: 'Forbidden' }), {
    status: 403,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
```

`verify_jwt = true` остава в `config.toml` — gateway-ът пак валидира подписа, а ние допълнително проверяваме че role-ът е `service_role`.

**2. Проверка на викащите**

Преглед на codebase-а показва един клиентски caller:
- `supabase-functions/stripe-webhook/index.ts` — извиква `send-transactional-email` чрез `supabase.functions.invoke()` със **service role клиент**, така че продължава да работи.

Трябва да потвърдя няма ли други `invoke('send-transactional-email')` от UI код. Ако има — те трябва или да минат през сървър-функция, или да бъдат премахнати. От бърз преглед: `donation-confirmation` се изпраща от `stripe-webhook` (server-side, OK).

**3. Без промени в `config.toml`** — `verify_jwt = true` остава.

## След имплементация

- Маркирам finding-а като fixed чрез scanner tool с обяснение.
- Обновявам security memory: send-transactional-email е server-only; никога не го викай от UI.

## Защо не премахваме функцията изцяло

Тя е централната точка за всички app emails (donation confirmation и бъдещи) и се вика от Stripe webhook след успешно дарение. Просто я заключваме за external callers.
