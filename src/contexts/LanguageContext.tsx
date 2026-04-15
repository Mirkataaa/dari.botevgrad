import { createContext, useContext, useState, useEffect, ReactNode } from "react";

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

  // Share
  "share.title": { bg: "Сподели кампанията", en: "Share Campaign" },
  "share.desc": { bg: "Изберете начин за споделяне на кампанията с приятели.", en: "Choose how to share the campaign with friends." },
  "share.linkCopied": { bg: "Линкът е копиран!", en: "Link copied!" },
  "share.embedCopied": { bg: "Embed кодът е копиран!", en: "Embed code copied!" },
  "share.embedLabel": { bg: "Embed код (iframe)", en: "Embed code (iframe)" },
  "share.instagramHint": { bg: "Линкът е копиран! Споделете го в Instagram.", en: "Link copied! Share it on Instagram." },
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
