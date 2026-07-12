import { Link } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import { Logo } from './Logo'
import { LanguageToggle } from './LanguageToggle'
import { InstagramIcon, WhatsAppIcon, VineDivider } from './icons'
import { INSTAGRAM_URL, WHATSAPP_NUMBER, WHATSAPP_DISPLAY, INSTAGRAM_HANDLE } from '../lib/supabase'

export function Footer() {
  const { t } = useLanguage()
  const year = new Date().getFullYear()
  return (
    <footer className="relative bg-forest-700 text-ivory-200 overflow-hidden mt-auto">
      <div className="absolute -top-10 right-10 opacity-5 pointer-events-none">
        <svg width="300" height="300" viewBox="0 0 120 120" fill="none" stroke="currentColor" strokeWidth="0.5"><path d="M60 30 C50 20 35 22 30 35 C25 48 35 55 48 50 C55 47 58 40 55 33" /><path d="M60 30 C70 20 85 22 90 35 C95 48 85 55 72 50 C65 47 62 40 65 33" /><path d="M60 30 C55 18 60 10 60 5 C65 10 65 18 60 30" /><path d="M60 40 L60 100" /><path d="M60 60 C50 55 42 58 38 65" /><path d="M60 75 C70 70 78 73 82 80" /></svg>
      </div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="md:col-span-1"><Logo className="text-ivory-200 mb-4" /><p className="text-ivory-300/80 font-sans text-sm leading-relaxed max-w-xs">{t('footerTagline')}</p></div>
          <div><h3 className="font-sans text-xs tracking-[0.2em] uppercase text-gold-400 mb-4">{t('footerNav')}</h3><ul className="space-y-2"><li><Link to="/" className="text-ivory-300/80 hover:text-ivory-200 transition-colors text-sm">{t('home')}</Link></li><li><Link to="/flowers" className="text-ivory-300/80 hover:text-ivory-200 transition-colors text-sm">{t('flowers')}</Link></li></ul></div>
          <div>
            <h3 className="font-sans text-xs tracking-[0.2em] uppercase text-gold-400 mb-4">{t('footerContact')}</h3>
            <div className="space-y-3">
              <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-ivory-300/80 hover:text-ivory-200 transition-colors text-sm group"><span className="w-9 h-9 rounded-full bg-forest-600/50 flex items-center justify-center group-hover:bg-gold-400 group-hover:text-forest-800 transition-colors"><WhatsAppIcon size={16} /></span>{WHATSAPP_DISPLAY}</a>
              <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-ivory-300/80 hover:text-ivory-200 transition-colors text-sm group"><span className="w-9 h-9 rounded-full bg-forest-600/50 flex items-center justify-center group-hover:bg-gold-400 group-hover:text-forest-800 transition-colors"><InstagramIcon size={16} /></span>{INSTAGRAM_HANDLE}</a>
            </div>
          </div>
        </div>
        <div className="my-10 text-gold-400/40"><VineDivider className="w-full max-w-xs mx-auto" /></div>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-ivory-300/60 text-xs tracking-wide">© {year} F9 Flowers. {t('footerRights')}</p>
          <LanguageToggle variant="light" />
        </div>
      </div>
    </footer>
  )
}
