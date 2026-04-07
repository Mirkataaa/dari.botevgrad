

## Използване на `miroplayground.online` за имейл домейн

Да, `miroplayground.online` от GoDaddy ще свърши работа. Ето какво трябва да направиш:

### Вариант 1: Използвай `miroplayground.online` вместо `dari.botevgrad.bg`

1. **Изтрий текущия домейн** `notify.dari.botevgrad.bg` от **Cloud → Emails → Manage Domains** (той така и не се верифицира)
2. **Добави нов имейл домейн** през същата секция — например `notify.miroplayground.online`
3. Системата ще ти даде **3 DNS записа** (1 TXT + 2 NS) — подобни на тези, които имаше за `dari.botevgrad.bg`
4. **Влез в GoDaddy → DNS Management** за `miroplayground.online` и добави записите:
   - **TXT запис**: Name = `_lovable-email`, Value = `lovable_email_verify=...`
   - **NS запис**: Name = `notify`, Value = `ns3.lovable.cloud`
   - **NS запис**: Name = `notify`, Value = `ns4.lovable.cloud`
5. Изчакай верификацията (обикновено 5-30 минути при GoDaddy)

### Вариант 2: Запази `dari.botevgrad.bg`

Ако предпочиташ имейлите да идват от `dari.botevgrad.bg`, трябва да добавиш DNS записите при провайдъра, който управлява този домейн (не при GoDaddy).

### Стъпки в GoDaddy (ако избереш Вариант 1)

1. Влез в GoDaddy → **My Products** → `miroplayground.online` → **DNS**
2. Натисни **Add New Record**
3. За TXT записа: Type = TXT, Name = `_lovable-email`, Value = (копирай от Cloud)
4. За NS записите: Type = NS, Name = `notify`, Value = `ns3.lovable.cloud` (и втори за `ns4.lovable.cloud`)
5. Запази и изчакай

### Какво ще се случи след верификация

Имейлите от платформата (потвърждения за дарения, ресет на парола и т.н.) ще идват от `noreply@miroplayground.online` вместо от `dari.botevgrad.bg`.

### Техническа бележка

Няма нужда от промени в кода — след верификацията на новия домейн, Edge Functions ще бъдат обновени автоматично с новия sender domain.

