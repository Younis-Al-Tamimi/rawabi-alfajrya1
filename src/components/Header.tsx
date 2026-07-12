import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useLanguage } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'
import { useUI } from '../context/UIContext'
import { Logo } from './Logo'
import { LanguageToggle } from './LanguageToggle'
import { MenuIcon, CloseIcon, UserIcon } from './icons'

export function Header() {
  const { t, dir } = useLanguage()
  const { user, profile, signOut } = useAuth()
  const { openAuthModal } = useUI()
  const location = useLocation()
  const [scrolled, setScrolled] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const isAdmin = location.pathname.startsWith('/admin') || location.hash.startsWith('#/admin')

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => { setDrawerOpen(false); setUserMenuOpen(false) }, [location.pathname, location.hash])
  useEffect(() => { document.body.style.overflow = drawerOpen ? 'hidden' : ''; return () => { document.body.style.overflow = '' } }, [drawerOpen])
  useEffect(() => { const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') setDrawerOpen(false) }; window.addEventListener('keydown', onEsc); return () => window.removeEventListener('keydown', onEsc) }, [])

  if (isAdmin) return null

  const navLinks = [{ to: '/', label: t('home') }, { to: '/flowers', label: t('products') }]

  return (
    <>
      <motion.header initial={false} animate={{ backgroundColor: scrolled ? 'rgba(66, 22, 8, 0.92)' : 'rgba(66, 22, 8, 0.97)', backdropFilter: scrolled ? 'blur(16px)' : 'blur(0px)', boxShadow: scrolled ? '0 4px 20px rgba(94, 30, 13, 0.15)' : '0 0 0 rgba(0,0,0,0)' }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }} className="fixed top-0 left-0 right-0 z-[100] safe-top w-full overflow-visible">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <Link to="/" className="text-cream-50 shrink-0"><Logo className="text-cream-50" /></Link>
            <nav className="hidden md:flex items-center gap-8">
              {navLinks.map(link => (
                <Link key={link.to} to={link.to} className="relative text-cream-50 font-sans text-sm font-medium tracking-wide group py-2">
                  {link.label}
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-px bg-saffron-400 transition-all duration-300 group-hover:w-full" />
                </Link>
              ))}
            </nav>
            <div className="hidden md:flex items-center gap-3 overflow-visible">
              <LanguageToggle variant="dark" />
              <div className="relative z-[60]">
                {user ? (
                  <>
                    <button onClick={() => setUserMenuOpen(!userMenuOpen)} className="w-9 h-9 rounded-full bg-amber-gradient text-espresso-900 flex items-center justify-center font-serif text-sm font-semibold hover:shadow-amber transition-all" aria-label={t('account')}>{profile?.display_name?.charAt(0).toUpperCase() || 'U'}</button>
                    <AnimatePresence>
                      {userMenuOpen && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className={`fixed ${dir === 'rtl' ? 'left-4 sm:left-6' : 'right-4 sm:right-6'} top-[calc(4rem+env(safe-area-inset-top))] sm:top-[calc(5rem+env(safe-area-inset-top))] w-48 bg-cream-50 rounded-xl shadow-brand-lg border border-brand-100 py-2 z-[70]`}>
                          <div className="px-4 py-2 border-b border-brand-100"><p className="text-sm font-medium text-espresso-900 truncate">{profile?.display_name || 'User'}</p><p className="text-xs text-espresso-400 truncate">{user.email}</p></div>
                          <button onClick={() => { signOut(); setUserMenuOpen(false) }} className="w-full text-start px-4 py-2 text-sm text-brand-600 hover:bg-brand-50 transition-colors">{t('signOut')}</button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                ) : (
                  <button onClick={() => openAuthModal()} className="w-9 h-9 rounded-full text-cream-50 hover:bg-brand-700/50 flex items-center justify-center transition-colors" aria-label={t('signIn')}><UserIcon size={20} /></button>
                )}
              </div>
            </div>
            <button onClick={() => setDrawerOpen(true)} className="md:hidden text-cream-50 p-2" aria-label="Menu"><MenuIcon size={24} /></button>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="fixed inset-0 bg-brand-950/50 z-[105] md:hidden" onClick={() => setDrawerOpen(false)} />
            <motion.div initial={{ x: dir === 'rtl' ? '-100%' : '100%' }} animate={{ x: 0 }} exit={{ x: dir === 'rtl' ? '-100%' : '100%' }} transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }} className={`fixed top-0 ${dir === 'rtl' ? 'left-0' : 'right-0'} bottom-0 w-80 max-w-[90vw] bg-brand-800 z-[110] md:hidden overflow-y-auto safe-top safe-bottom`}>
              <div className="relative p-6 flex flex-col h-full">
                <div className="flex items-center justify-between mb-8"><Logo className="text-cream-50" /><button onClick={() => setDrawerOpen(false)} className="text-cream-50 p-2"><CloseIcon size={24} /></button></div>
                <nav className="flex flex-col gap-2">
                  {navLinks.map((link, i) => (
                    <motion.div key={link.to} initial={{ opacity: 0, x: dir === 'rtl' ? -20 : 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.05 }}>
                      <Link to={link.to} className="block text-cream-50 font-serif text-2xl py-3 border-b border-brand-700/50 hover:text-saffron-400 transition-colors">{link.label}</Link>
                    </motion.div>
                  ))}
                </nav>
                <div className="mt-auto pt-8 flex flex-col gap-4">
                  <LanguageToggle variant="dark" />
                  {user ? <button onClick={() => { signOut(); setDrawerOpen(false) }} className="text-cream-50 font-sans text-sm tracking-wide text-start py-2">{t('signOut')}</button> : <button onClick={() => { openAuthModal(); setDrawerOpen(false) }} className="text-cream-50 font-sans text-sm tracking-wide text-start py-2 flex items-center gap-2"><UserIcon size={18} />{t('signIn')}</button>}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
