import { createContext, useContext, useState, ReactNode } from "react";

type Language = "bg" | "en";

type Translations = Record<string, Record<Language, string>>;

const translations: Translations = {
  // Nav
  "nav.home": { bg: "Начало", en: "Home" },
  "nav.active": { bg: "Активни кампании", en: "Active Campaigns" },
  "nav.completed": { bg: "Приключили кампании", en: "Completed Campaigns" },
  "nav.about": { bg: "За нас", en: "About Us" },
  "nav.login": { bg: "Вход", en: "Login" },
  "nav.register": { bg: "Регистрация", en: "Register" },
  "nav.logout": { bg: "Изход", en: "Logout" },
  "nav.profile": { bg: "Моят профил", en: "My Profile" },
  "nav.admin": { bg: "Админ панел", en: "Admin Panel" },
  "nav.createCampaign": { bg: "Създай кампания", en: "Create Campaign" },
  "nav.platform": { bg: "Дарителска платформа", en: "Donation Platform" },

  // Auth
  "auth.login": { bg: "Вход", en: "Login" },
  "auth.register": { bg: "Регистрация", en: "Register" },
  "auth.loginTitle": { bg: "Вход", en: "Sign In" },
  "auth.registerTitle": { bg: "Регистрация", en: "Sign Up" },
  "auth.loginDesc": { bg: "Влезте в акаунта си, за да дарявате и коментирате", en: "Sign in to donate and comment" },
  "auth.registerDesc": { bg: "Създайте акаунт, за да подкрепяте каузи", en: "Create an account to support causes" },
  "auth.email": { bg: "Имейл", en: "Email" },
  "auth.password": { bg: "Парола", en: "Password" },
  "auth.confirmPassword": { bg: "Потвърдете паролата", en: "Confirm Password" },
  "auth.fullName": { bg: "Име и фамилия", en: "Full Name" },
  "auth.fullNamePlaceholder": { bg: "Иван Иванов", en: "John Doe" },
  "auth.emailPlaceholder": { bg: "вашият@имейл.бг", en: "your@email.com" },
  "auth.passwordPlaceholder": { bg: "Минимум 6 символа", en: "Minimum 6 characters" },
  "auth.repeatPassword": { bg: "Повторете паролата", en: "Repeat password" },
  "auth.loginBtn": { bg: "Вход", en: "Sign In" },
  "auth.registerBtn": { bg: "Регистрация", en: "Sign Up" },
  "auth.loggingIn": { bg: "Влизане...", en: "Signing in..." },
  "auth.registering": { bg: "Регистриране...", en: "Signing up..." },
  "auth.noAccount": { bg: "Нямате акаунт?", en: "Don't have an account?" },
  "auth.hasAccount": { bg: "Вече имате акаунт?", en: "Already have an account?" },
  "auth.registerLink": { bg: "Регистрирайте се", en: "Sign up" },
  "auth.loginLink": { bg: "Влезте", en: "Sign in" },
  "auth.or": { bg: "или", en: "or" },
  "auth.googleLogin": { bg: "Вход с Google", en: "Continue with Google" },
  "auth.googleLoggingIn": { bg: "Влизане...", en: "Signing in..." },
  "auth.loginError": { bg: "Грешка при вход", en: "Login error" },
  "auth.registerError": { bg: "Грешка при регистрация", en: "Registration error" },
  "auth.invalidCredentials": { bg: "Невалидни данни за вход. Проверете имейл и парола.", en: "Invalid credentials. Check your email and password." },
  "auth.emailNotConfirmed": { bg: "Имейлът не е потвърден. Проверете входящата си поща.", en: "Email not confirmed. Check your inbox." },
  "auth.loginSuccess": { bg: "Успешен вход!", en: "Login successful!" },
  "auth.welcomeBack": { bg: "Добре дошли обратно!", en: "Welcome back!" },
  "auth.registerSuccess": { bg: "Регистрацията е успешна!", en: "Registration successful!" },
  "auth.checkEmail": { bg: "Проверете имейла си за потвърждение.", en: "Check your email for confirmation." },
  "auth.passwordMismatch": { bg: "Паролите не съвпадат.", en: "Passwords don't match." },
  "auth.passwordTooShort": { bg: "Паролата трябва да е поне 6 символа.", en: "Password must be at least 6 characters." },
  "auth.error": { bg: "Грешка", en: "Error" },
  "auth.googleError": { bg: "Грешка при вход с Google", en: "Google sign-in error" },
  "auth.forgotPassword": { bg: "Забравена парола?", en: "Forgot password?" },
  "auth.forgotTitle": { bg: "Забравена парола", en: "Forgot password" },
  "auth.forgotDesc": { bg: "Въведете имейла си и ще ви изпратим линк за нулиране на паролата.", en: "Enter your email and we'll send you a password reset link." },
  "auth.sendResetLink": { bg: "Изпрати линк за нулиране", en: "Send reset link" },
  "auth.sending": { bg: "Изпращане...", en: "Sending..." },
  "auth.resetEmailSentTitle": { bg: "Проверете имейла си", en: "Check your email" },
  "auth.resetEmailSent": { bg: "Ако съществува акаунт с този имейл, ще получите линк за нулиране на паролата.", en: "If an account exists for this email, you'll receive a reset link shortly." },
  "auth.backToLogin": { bg: "Назад към вход", en: "Back to login" },

  // Share
  "share.title": { bg: "Сподели кампанията", en: "Share Campaign" },
  "share.desc": { bg: "Изберете начин за споделяне на кампанията с приятели.", en: "Choose how to share the campaign with friends." },
  "share.linkCopied": { bg: "Линкът е копиран!", en: "Link copied!" },
  "share.copyLink": { bg: "Копирай линка", en: "Copy link" },
  "share.embedCopied": { bg: "Embed кодът е копиран!", en: "Embed code copied!" },
  "share.embedLabel": { bg: "Embed код (iframe)", en: "Embed code (iframe)" },
  "share.instagramHint": { bg: "Линкът е копиран! Споделете го в Instagram.", en: "Link copied! Share it on Instagram." },
  "share.downloadStory": { bg: "Свали Story изображение", en: "Download Story image" },
  "share.storyReady": { bg: "Story изображението е готово!", en: "Story image ready!" },
  "share.storyDownloaded": { bg: "Story изображението е свалено", en: "Story image downloaded" },
  "share.storyDownloadedDesc": { bg: "Качете го като Story в Instagram. Линкът е копиран в клипборда.", en: "Upload it as an Instagram Story. The link has been copied to your clipboard." },
  "share.storyError": { bg: "Грешка при генериране на Story", en: "Failed to generate story image" },

  // Index / Home
  "index.heroTitle": { bg: "Заедно за Ботевград", en: "Together for Botevgrad" },
  "index.heroDesc": { bg: "Дарителска платформа на Община Ботевград. Подкрепете каузите, които правят нашия град по-добро място за живеене.", en: "Donation platform of Botevgrad Municipality. Support the causes that make our city a better place to live." },
  "index.browseCampaigns": { bg: "Разгледай кампании", en: "Browse Campaigns" },
  "index.campaigns": { bg: "Кампании", en: "Campaigns" },
  "index.donations": { bg: "Дарения", en: "Donations" },
  "index.raised": { bg: "Събрани средства", en: "Funds Raised" },
  "index.activeCampaigns": { bg: "Активни кампании", en: "Active Campaigns" },
  "index.activeCampaignsDesc": { bg: "Подкрепете кауза, която ви е близка", en: "Support a cause close to your heart" },
  "index.recommended": { bg: "Препоръчани кампании", en: "Recommended Campaigns" },
  "index.recommendedDesc": { bg: "Кампании, които се нуждаят от вашата помощ", en: "Campaigns that need your help" },
  "index.viewAll": { bg: "Виж всички", en: "View All" },
  "index.viewAllCampaigns": { bg: "Виж всички кампании", en: "View All Campaigns" },

  // Active / Completed campaigns
  "campaigns.active.title": { bg: "Активни кампании", en: "Active Campaigns" },
  "campaigns.active.desc": { bg: "Кампании, които в момента набират средства", en: "Campaigns currently raising funds" },
  "campaigns.completed.title": { bg: "Приключили кампании", en: "Completed Campaigns" },
  "campaigns.completed.desc": { bg: "Успешно завършени кампании", en: "Successfully completed campaigns" },
  "campaigns.noResults": { bg: "Няма намерени кампании", en: "No campaigns found" },

  // Categories
  "cat.all": { bg: "Всички", en: "All" },
  "cat.social": { bg: "Социални инициативи", en: "Social Initiatives" },
  "cat.healthcare": { bg: "Здравеопазване", en: "Healthcare" },
  "cat.education": { bg: "Образование и наука", en: "Education & Science" },
  "cat.culture": { bg: "Култура и традиции", en: "Culture & Traditions" },
  "cat.ecology": { bg: "Екология и животни", en: "Ecology & Animals" },
  "cat.infrastructure": { bg: "Инфраструктура", en: "Infrastructure" },
  "cat.sports": { bg: "Спорт", en: "Sports" },

  // Campaign type filters
  "filters.recurring": { bg: "Периодични", en: "Recurring" },
  "filters.allTypes": { bg: "Всички видове", en: "All types" },

  // Campaign card
  "card.completed": { bg: "Приключила", en: "Completed" },
  "card.pendingApproval": { bg: "Чака одобрение", en: "Pending Approval" },
  "card.pendingDraft": { bg: "Чакаща редакция", en: "Pending Edit" },
  "card.recurring": { bg: "Периодична кампания", en: "Recurring Campaign" },
  "card.collected": { bg: "събрани", en: "collected" },
  "card.donateNow": { bg: "Дари сега", en: "Donate Now" },
  "card.support": { bg: "Подкрепи", en: "Support" },

  // Campaign progress
  "progress.of": { bg: "от", en: "of" },

  // Campaign details
  "details.back": { bg: "Всички кампании", en: "All Campaigns" },
  "details.notFound": { bg: "Кампанията не е намерена", en: "Campaign not found" },
  "details.backBtn": { bg: "Обратно", en: "Back" },
  "details.edit": { bg: "Редактирай", en: "Edit" },
  "details.recurring": { bg: "Периодична", en: "Recurring" },
  "details.closed": { bg: "Затворена", en: "Closed" },
  "details.finished": { bg: "Приключила", en: "Completed" },
  "details.collectedSoFar": { bg: "Събрани до момента", en: "Collected so far" },
  "details.activeSub": { bg: "Активен абонамент", en: "Active Subscription" },
  "details.perMonth": { bg: "мес.", en: "mo." },
  "details.perYear": { bg: "год.", en: "yr." },
  "details.nextPayment": { bg: "Следващо плащане", en: "Next payment" },
  "details.cancelledEndOfPeriod": { bg: "Ще бъде спрян в края на текущия период.", en: "Will be cancelled at the end of the current period." },
  "details.cancelSub": { bg: "Откажи абонамент", en: "Cancel Subscription" },
  "details.donations": { bg: "Дарения", en: "Donations" },
  "details.noDonations": { bg: "Все още няма дарения", en: "No donations yet" },
  "details.anonymous": { bg: "Анонимен", en: "Anonymous" },
  "details.donor": { bg: "Дарител", en: "Donor" },
  "details.deadline": { bg: "Крайна дата", en: "Deadline" },
  "details.daysLeft": { bg: "Остават {n} дни", en: "{n} days left" },
  "details.dayLeft": { bg: "Остава 1 ден", en: "1 day left" },
  "details.lastDay": { bg: "Последен ден", en: "Last day" },
  "details.expired": { bg: "Изтекла кампания", en: "Campaign expired" },

  // Donate button
  "donate.title": { bg: "Дари за", en: "Donate for" },
  "donate.titleRecurring": { bg: "Месечна подкрепа за", en: "Monthly support for" },
  "donate.descRecurring": { bg: "Изберете сума за месечна подкрепа. Ще бъдете пренасочени към Stripe за абонамент.", en: "Choose an amount for monthly support. You will be redirected to Stripe for subscription." },
  "donate.desc": { bg: "Изберете сума за дарение. След това ще бъдете пренасочени към Stripe.", en: "Choose a donation amount. You will be redirected to Stripe." },
  "donate.otherAmount": { bg: "Друга сума (€)", en: "Other amount (€)" },
  "donate.enterAmount": { bg: "Въведете сума", en: "Enter amount" },
  "donate.paymentPeriod": { bg: "Период на плащане", en: "Payment period" },
  "donate.monthly": { bg: "Месечно", en: "Monthly" },
  "donate.yearly": { bg: "Годишно", en: "Yearly" },
  "donate.anonymous": { bg: "Дари анонимно", en: "Donate anonymously" },
  "donate.loginRequired": { bg: "Трябва да влезете в профила си за абонамент.", en: "You need to sign in for a subscription." },
  "donate.noAccountNeeded": { bg: "Може да дарите и без регистрация.", en: "You can donate without registration." },
  "donate.subscribe": { bg: "Абонирай се", en: "Subscribe" },
  "donate.for": { bg: "за", en: "for" },
  "donate.donate": { bg: "Дари", en: "Donate" },
  "donate.supportMonthly": { bg: "Подкрепи месечно", en: "Support Monthly" },
  "donate.invalidAmount": { bg: "Въведете валидна сума (мин. 1 €)", en: "Enter a valid amount (min. 1 €)" },
  "donate.loginForSub": { bg: "Трябва да влезете в профила си за абонамент", en: "You need to sign in for a subscription" },
  "donate.sessionExpired": { bg: "Сесията е изтекла. Моля, влезте отново.", en: "Session expired. Please sign in again." },
  "donate.error": { bg: "Грешка при създаване на плащане", en: "Error creating payment" },
  "donate.noLink": { bg: "Не беше получен линк за плащане", en: "No payment link received" },

  // Filters
  "filters.search": { bg: "Търсене по ключова дума...", en: "Search by keyword..." },

  // About
  "about.title": { bg: "За нас", en: "About Us" },
  "about.intro": { bg: "е дарителска платформа на Община Ботевград, създадена с цел да свърже хората с каузите, които имат значение за нашия град. Чрез прозрачност, доверие и общностен дух, ние правим даряването лесно и достъпно за всеки.", en: "is a donation platform of Botevgrad Municipality, created to connect people with the causes that matter for our city. Through transparency, trust and community spirit, we make donating easy and accessible for everyone." },
  "about.transparency": { bg: "Прозрачност", en: "Transparency" },
  "about.transparencyDesc": { bg: "Всяка дарена стотинка е проследима. Публикуваме редовни отчети за всяка кампания.", en: "Every donated cent is traceable. We publish regular reports for each campaign." },
  "about.trust": { bg: "Доверие", en: "Trust" },
  "about.trustDesc": { bg: "Платформата е създадена и управлявана от Община Ботевград с цел гарантиране на сигурността.", en: "The platform is created and managed by Botevgrad Municipality to ensure security." },
  "about.community": { bg: "Общност", en: "Community" },
  "about.communityDesc": { bg: "Вярваме, че заедно можем да постигнем повече. Всеки принос, голям или малък, има значение.", en: "We believe that together we can achieve more. Every contribution, big or small, matters." },
  "about.howItWorks": { bg: "Как работи платформата?", en: "How does the platform work?" },
  "about.fourSteps": { bg: "Четири прости стъпки до вашето дарение", en: "Four simple steps to your donation" },
  "about.step1Title": { bg: "Изберете кампания", en: "Choose a campaign" },
  "about.step1Desc": { bg: "Разгледайте активните кампании и изберете каузата, която ви вълнува.", en: "Browse active campaigns and choose the cause that inspires you." },
  "about.step2Title": { bg: "Направете дарение", en: "Make a donation" },
  "about.step2Desc": { bg: "Изберете сума и завършете плащането чрез сигурната система на Stripe.", en: "Choose an amount and complete payment through Stripe's secure system." },
  "about.step3Title": { bg: "Получете потвърждение", en: "Get confirmation" },
  "about.step3Desc": { bg: "Получавате имейл потвърждение и дарението се отразява в кампанията.", en: "You receive an email confirmation and the donation is reflected in the campaign." },
  "about.step4Title": { bg: "Следете напредъка", en: "Track progress" },
  "about.step4Desc": { bg: "Следете как се развива кампанията и какво е постигнато с вашата помощ.", en: "Follow the campaign's development and what has been achieved with your help." },
  "about.transparencySection": { bg: "Прозрачност", en: "Transparency" },
  "about.transparencyList1": { bg: "Всяко дарение се записва и е видимо в кампанията", en: "Every donation is recorded and visible in the campaign" },
  "about.transparencyList2": { bg: "Организаторите публикуват актуализации за напредъка", en: "Organizers publish progress updates" },
  "about.transparencyList3": { bg: "Община Ботевград наблюдава разпределението на средствата", en: "Botevgrad Municipality oversees the distribution of funds" },
  "about.transparencyList4": { bg: "Приключилите кампании остават видими с пълна история", en: "Completed campaigns remain visible with full history" },
  "about.feesTitle": { bg: "Такси и комисионни", en: "Fees & Commissions" },
  "about.feesList1": { bg: "Платформена комисионна: 0%", en: "Platform commission: 0%" },
  "about.feesNote": { bg: "ние не вземаме нищо", en: "we take nothing" },
  "about.feesList2": { bg: "Stripe такса: ~1.5% + 0.25€ (европейски карти)", en: "Stripe fee: ~1.5% + 0.25€ (European cards)" },
  "about.feesList3": { bg: "Stripe такса: ~2.9% + 0.25€ (международни карти)", en: "Stripe fee: ~2.9% + 0.25€ (international cards)" },
  "about.feesList4": { bg: "Цялата останала сума отива директно за каузата", en: "The entire remaining amount goes directly to the cause" },
  "about.securityTitle": { bg: "Сигурност на плащанията", en: "Payment Security" },
  "about.security1": { bg: "Плащанията се обработват от", en: "Payments are processed by" },
  "about.security1b": { bg: "глобален лидер в онлайн плащанията", en: "a global leader in online payments" },
  "about.security2": { bg: "PCI DSS Level 1 сертифициран (най-високо ниво на сигурност)", en: "PCI DSS Level 1 certified (highest level of security)" },
  "about.security3": { bg: "не съхраняваме", en: "do not store" },
  "about.security3b": { bg: "данни за вашата карта", en: "your card data" },
  "about.security4": { bg: "SSL криптиране на всички данни при предаване", en: "SSL encryption of all data in transit" },
  "about.faqTitle": { bg: "Често задавани въпроси", en: "Frequently Asked Questions" },
  "about.contactTitle": { bg: "Свържете се с нас", en: "Contact Us" },
  "about.contactDesc": { bg: "Имате въпроси или предложения? Пишете ни!", en: "Have questions or suggestions? Write to us!" },
  "about.nameLabel": { bg: "Име", en: "Name" },
  "about.namePlaceholder": { bg: "Вашето име", en: "Your name" },
  "about.emailLabel": { bg: "Имейл", en: "Email" },
  "about.phoneLabel": { bg: "Телефон", en: "Phone" },
  "about.optional": { bg: "по избор", en: "optional" },
  "about.messageLabel": { bg: "Съобщение", en: "Message" },
  "about.messagePlaceholder": { bg: "Вашето съобщение...", en: "Your message..." },
  "about.send": { bg: "Изпрати", en: "Send" },
  "about.fillAll": { bg: "Моля, попълнете всички полета", en: "Please fill in all fields" },
  "about.invalidEmail": { bg: "Невалиден имейл адрес", en: "Invalid email address" },
  "about.sent": { bg: "Съобщението е изпратено!", en: "Message sent!" },
  "about.sentDesc": { bg: "Ще се свържем с вас скоро.", en: "We will contact you soon." },
  // FAQ
  "faq.q1": { bg: "Как мога да направя дарение?", en: "How can I make a donation?" },
  "faq.a1": { bg: 'Изберете кампания, натиснете „Дари сега", въведете желаната сума и завършете плащането чрез Stripe. Приемаме дебитни и кредитни карти, Apple Pay и Google Pay.', en: 'Select a campaign, click "Donate Now", enter the desired amount and complete the payment through Stripe. We accept debit and credit cards, Apple Pay and Google Pay.' },
  "faq.q2": { bg: "Безопасно ли е да дарявам онлайн?", en: "Is it safe to donate online?" },
  "faq.a2": { bg: "Да. Всички плащания се обработват от Stripe — един от най-сигурните платежни процесори в света. Ние не съхраняваме данни за вашата карта.", en: "Yes. All payments are processed by Stripe — one of the most secure payment processors in the world. We do not store your card data." },
  "faq.q3": { bg: "Има ли комисионна за дарението?", en: "Is there a commission for the donation?" },
  "faq.a3": { bg: "Платформата dari.botevgrad.bg НЕ начислява комисионна. Stripe удържа стандартна такса от около 1.5% + 0.25€ за европейски карти. Цялата останала сума отива директно за каузата.", en: "The dari.botevgrad.bg platform does NOT charge a commission. Stripe deducts a standard fee of about 1.5% + 0.25€ for European cards. The entire remaining amount goes directly to the cause." },
  "faq.q4": { bg: "Мога ли да даря анонимно?", en: "Can I donate anonymously?" },
  "faq.a4": { bg: "Да. При дарение можете да изберете да останете анонимен/на — вашето име няма да бъде показано публично.", en: "Yes. When donating, you can choose to remain anonymous — your name will not be shown publicly." },
  "faq.q5": { bg: "Как мога да създам кампания?", en: "How can I create a campaign?" },
  "faq.a5": { bg: "Кампании могат да създават всички регистрирани потребители. Свържете се с нас чрез формата за контакт за повече информация.", en: "Campaigns can be created by any registered user. Contact us through the contact form for more information." },
  "faq.q6": { bg: "Къде отиват парите от дарението?", en: "Where does the donation money go?" },
  "faq.a6": { bg: "Средствата от всяка кампания се насочват директно към целта, описана в кампанията. Община Ботевград гарантира правилното разпределение на средствата.", en: "The funds from each campaign go directly to the goal described in the campaign. Botevgrad Municipality ensures the proper distribution of funds." },
  "faq.q7": { bg: "Мога ли да получа фактура за дарението си?", en: "Can I get an invoice for my donation?" },
  "faq.a7": { bg: "След успешно плащане получавате имейл потвърждение с детайли за транзакцията. За официална фактура, моля свържете се с нас.", en: "After a successful payment, you receive an email confirmation with transaction details. For an official invoice, please contact us." },

  // Profile
  "profile.title": { bg: "Моят профил", en: "My Profile" },
  "profile.personalInfo": { bg: "Лична информация", en: "Personal Information" },
  "profile.profilePhoto": { bg: "Профилна снимка", en: "Profile Photo" },
  "profile.uploadPhoto": { bg: "Качи снимка", en: "Upload Photo" },
  "profile.uploading": { bg: "Качване...", en: "Uploading..." },
  "profile.name": { bg: "Име", en: "Name" },
  "profile.saveChanges": { bg: "Запази промените", en: "Save Changes" },
  "profile.changePassword": { bg: "Промяна на парола", en: "Change Password" },
  "profile.currentPassword": { bg: "Текуща парола", en: "Current Password" },
  "profile.newPassword": { bg: "Нова парола", en: "New Password" },
  "profile.confirmPassword": { bg: "Потвърди парола", en: "Confirm Password" },
  "profile.changePasswordBtn": { bg: "Промени парола", en: "Change Password" },
  "profile.myCampaigns": { bg: "Моите кампании", en: "My Campaigns" },
  "profile.noCampaigns": { bg: "Все още нямате създадени кампании.", en: "You haven't created any campaigns yet." },
  "profile.view": { bg: "Виж", en: "View" },
  "profile.edit": { bg: "Редактирай", en: "Edit" },
  "profile.revisions": { bg: "Редакции / Одобрения", en: "Revisions / Approvals" },
  "profile.mySubscriptions": { bg: "Моите абонаменти", en: "My Subscriptions" },
  "profile.noSubscriptions": { bg: "Нямате активни абонаменти.", en: "You have no active subscriptions." },
  "profile.perMonth": { bg: "месец", en: "month" },
  "profile.perYear": { bg: "година", en: "year" },
  "profile.from": { bg: "От", en: "From" },
  "profile.nextPayment": { bg: "Следващо плащане", en: "Next payment" },
  "profile.cancelledNote": { bg: "Отменен (активен до края на периода)", en: "Cancelled (active until end of period)" },
  "profile.cancel": { bg: "Отмени", en: "Cancel" },
  "profile.donationHistory": { bg: "История на дарения", en: "Donation History" },
  "profile.noDonations": { bg: "Все още нямате дарения.", en: "You have no donations yet." },
  "profile.campaign": { bg: "Кампания", en: "Campaign" },
  "profile.amount": { bg: "Сума", en: "Amount" },
  "profile.date": { bg: "Дата", en: "Date" },
  "profile.status": { bg: "Статус", en: "Status" },
  "profile.statusCompleted": { bg: "Завършено", en: "Completed" },
  "profile.statusPending": { bg: "Чакащо", en: "Pending" },
  "profile.photoUploaded": { bg: "Снимката е качена успешно", en: "Photo uploaded successfully" },
  "profile.uploadError": { bg: "Грешка при качване", en: "Upload error" },
  "profile.selectImage": { bg: "Моля, изберете изображение", en: "Please select an image" },
  "profile.maxSize": { bg: "Максимален размер: 2MB", en: "Maximum size: 2MB" },
  "profile.profileUpdated": { bg: "Профилът е обновен", en: "Profile updated" },
  "profile.enterCurrentPw": { bg: "Въведете текущата парола", en: "Enter your current password" },
  "profile.newPwMin": { bg: "Новата парола трябва да е поне 6 символа", en: "New password must be at least 6 characters" },
  "profile.pwMismatch": { bg: "Паролите не съвпадат", en: "Passwords don't match" },
  "profile.wrongCurrentPw": { bg: "Грешна текуща парола", en: "Incorrect current password" },
  "profile.pwChanged": { bg: "Паролата е променена успешно", en: "Password changed successfully" },
  "profile.rejectedNotice": { bg: "отхвърлена кампания/редакция, изискващи вашето внимание.", en: "rejected campaign/edit requiring your attention." },
  "profile.rejectedNoticePlural": { bg: "отхвърлени кампании/редакции, изискващи вашето внимание.", en: "rejected campaigns/edits requiring your attention." },
  "profile.pendingDraft": { bg: "Чакаща редакция", en: "Pending Edit" },
  "profile.statusActive": { bg: "Активна", en: "Active" },
  "profile.statusRejected": { bg: "Отхвърлена", en: "Rejected" },
  "profile.statusStopped": { bg: "Спряна", en: "Stopped" },
  "profile.collected": { bg: "Събрани", en: "Collected" },

  // Common
  "common.error": { bg: "Грешка", en: "Error" },
  "common.loading": { bg: "Зареждане...", en: "Loading..." },

};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: "bg",
  setLanguage: () => {},
  t: (key) => key,
});

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem("app_language");
    return (saved === "en" || saved === "bg") ? saved : "bg";
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("app_language", lang);
  };

  const t = (key: string): string => {
    return translations[key]?.[language] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
