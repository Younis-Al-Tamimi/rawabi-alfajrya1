import { useLanguage } from '../context/LanguageContext'
import { BRAND_NAME_AR, BRAND_NAME_EN } from '../lib/supabase'

export function Logo({ className = '', showText = true }: { className?: string; showText?: boolean }) {
  const { lang } = useLanguage()
  const brandName = lang === 'ar' ? BRAND_NAME_AR : BRAND_NAME_EN
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className="relative shrink-0">
        <img src="/images/brand/rawabi-alfajrya.jpeg" alt={brandName} className="h-10 w-10 md:h-12 md:w-12 rounded-full object-cover ring-2 ring-saffron-400/40" />
      </div>
      {showText && (
        <div className="flex flex-col leading-tight">
          <span className="font-serif text-lg md:text-xl font-bold tracking-tight">{brandName}</span>
          <span className="text-[9px] md:text-[10px] tracking-[0.18em] uppercase opacity-60 font-sans">Premium Boutique</span>
        </div>
      )}
    </div>
  )
}

export function LogoMark({ className = '' }: { className?: string }) {
  return (
    <div className={`relative shrink-0 ${className}`}>
      <img src="/images/brand/rawabi-alfajrya.jpeg" alt="Logo" className="h-12 w-12 rounded-full object-cover ring-2 ring-saffron-400/40" />
    </div>
  )
}
