import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLanguage } from '../context/LanguageContext'
import { GlobeIcon } from './icons'

export function LanguageToggle({ variant = 'light' }: { variant?: 'light' | 'dark' }) {
  const { lang, setLang } = useLanguage()
  const [expanded, setExpanded] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setExpanded(false) }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const colorClass = variant === 'light' ? 'text-espresso-900 hover:bg-brand-100' : 'text-cream-50 hover:bg-cream-100/20 border border-cream-300/40'

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setExpanded(!expanded)} className={`flex items-center gap-1.5 px-3 py-2 rounded-full transition-all duration-300 ${colorClass}`} aria-label="Language toggle">
        <GlobeIcon size={18} />
        <AnimatePresence mode="wait">
          {expanded ? (
            <motion.div key="expanded" initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }} className="flex items-center gap-2 overflow-hidden">
              <button onClick={(e) => { e.stopPropagation(); setLang('en'); setExpanded(false) }} className={`text-xs tracking-wide px-2 py-0.5 rounded-full transition-colors ${lang === 'en' ? 'bg-saffron-400 text-espresso-900' : ''}`}>EN</button>
              <button onClick={(e) => { e.stopPropagation(); setLang('ar'); setExpanded(false) }} className={`text-xs tracking-wide px-2 py-0.5 rounded-full transition-colors ${lang === 'ar' ? 'bg-saffron-400 text-espresso-900' : ''}`}>ع</button>
            </motion.div>
          ) : (
            <motion.span key="collapsed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-xs tracking-wide font-medium">{lang === 'en' ? 'EN' : 'ع'}</motion.span>
          )}
        </AnimatePresence>
      </button>
    </div>
  )
}
