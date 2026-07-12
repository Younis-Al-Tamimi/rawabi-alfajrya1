import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Language, translations, TranslationKey } from '../lib/translations'

interface LanguageContextValue {
  lang: Language
  setLang: (lang: Language) => void
  t: (key: TranslationKey) => string
  dir: 'ltr' | 'rtl'
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(() => {
    const stored = localStorage.getItem('f9-lang') as Language | null
    return stored === 'ar' ? 'ar' : 'en'
  })
  const dir = lang === 'ar' ? 'rtl' : 'ltr'

  useEffect(() => {
    document.documentElement.lang = lang
    document.documentElement.dir = dir
    localStorage.setItem('f9-lang', lang)
  }, [lang, dir])

  const setLang = (newLang: Language) => setLangState(newLang)
  const t = (key: TranslationKey) => {
    const langTranslations = translations[lang] as Record<TranslationKey, string>
    return langTranslations[key] || translations.en[key] || key
  }

  return <LanguageContext.Provider value={{ lang, setLang, t, dir }}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider')
  return ctx
}
