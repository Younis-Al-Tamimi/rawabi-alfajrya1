import { Routes, Route, Navigate, useLocation, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import { Logo } from '../../components/Logo'
import { LanguageToggle } from '../../components/LanguageToggle'
import { PeonyIllustration, DashboardIcon, ProductIcon, CategoryIcon, CommentIcon, SettingsIcon, MenuIcon, CloseIcon } from '../../components/icons'
import { AdminLogin } from './AdminLogin'
import { AdminDashboard } from './AdminDashboard'
import { AdminFlowers } from './AdminFlowers'
import { AdminFlowerEdit } from './AdminFlowerEdit'
import { AdminCategories } from './AdminCategories'
import { AdminComments } from './AdminComments'
import { AdminSettings } from './AdminSettings'

export function AdminApp() {
  const { adminUser, isAdmin, loading, signOut } = useAuth()
  const { t, dir } = useLanguage()
  const location = useLocation()
  const [drawerOpen, setDrawerOpen] = useState(false)

  if (loading) return <div className="min-h-screen bg-brand-800 flex items-center justify-center"><div className="text-saffron-400/60 animate-pulse"><PeonyIllustration size={80} /></div></div>
  if (!isAdmin || !adminUser) return <AdminLogin />

  const navItems = [
    { path: '/admin', label: t('dashboard'), icon: DashboardIcon, exact: true },
    { path: '/admin/flowers', label: t('manageProducts'), icon: ProductIcon },
    { path: '/admin/categories', label: t('manageCategories'), icon: CategoryIcon },
    { path: '/admin/comments', label: t('manageComments'), icon: CommentIcon },
    { path: '/admin/settings', label: t('settings'), icon: SettingsIcon },
  ]
  const isActive = (item: typeof navItems[0]) => item.exact ? location.pathname === '/admin' : location.pathname.startsWith(item.path)

  return (
    <div className="min-h-screen bg-cream-200 flex" dir={dir}>
      <aside className="hidden lg:flex w-64 bg-brand-800 text-cream-100 flex-col fixed inset-y-0">
        <div className="p-6 border-b border-brand-700/50"><Link to="/admin"><Logo className="text-cream-100" /></Link></div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(item => { const Icon = item.icon; return <Link key={item.path} to={item.path} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-sans text-sm font-medium tracking-wide transition-all duration-300 ${isActive(item) ? 'bg-brand-600 text-cream-100 shadow-brand-sm' : 'text-cream-300/70 hover:bg-brand-700/50 hover:text-cream-100'}`}><Icon size={18} />{item.label}</Link> })}
        </nav>
        <div className="p-4 border-t border-brand-700/50 space-y-3">
          <LanguageToggle variant="dark" />
          <Link to="/" className="flex items-center gap-3 px-4 py-3 rounded-xl text-cream-300/70 hover:bg-brand-700/50 hover:text-cream-100 font-sans text-sm transition-colors">← {t('home')}</Link>
          <button type="button" onClick={() => void signOut()} className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-cream-300/70 hover:bg-brand-700/50 hover:text-cream-100 font-sans text-sm transition-colors">↪ {t('signOut')}</button>
        </div>
      </aside>

      <div className="lg:hidden fixed top-0 inset-x-0 z-40 bg-brand-800 text-cream-100 safe-top">
        <div className="flex items-center justify-between px-4 h-16"><Link to="/admin"><Logo className="text-cream-100" showText={false} /></Link><button onClick={() => setDrawerOpen(true)} className="text-cream-100 p-2"><MenuIcon size={24} /></button></div>
      </div>

      <AnimatePresence>
        {drawerOpen && (<>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-brand-950/50 z-50 lg:hidden" onClick={() => setDrawerOpen(false)} />
          <motion.div initial={{ x: dir === 'rtl' ? '-100%' : '100%' }} animate={{ x: 0 }} exit={{ x: dir === 'rtl' ? '-100%' : '100%' }} transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }} className={`fixed top-0 ${dir === 'rtl' ? 'left-0' : 'right-0'} bottom-0 w-72 max-w-[85vw] bg-brand-800 z-50 lg:hidden overflow-y-auto safe-top`}>
            <div className="p-6 flex items-center justify-between border-b border-brand-700/50"><Logo className="text-cream-100" /><button onClick={() => setDrawerOpen(false)} className="text-cream-100 p-2"><CloseIcon size={24} /></button></div>
            <nav className="p-4 space-y-1">
              {navItems.map(item => { const Icon = item.icon; return <Link key={item.path} to={item.path} onClick={() => setDrawerOpen(false)} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-sans text-sm font-medium transition-colors ${isActive(item) ? 'bg-brand-600 text-cream-100' : 'text-cream-300/70 hover:bg-brand-700/50'}`}><Icon size={18} />{item.label}</Link> })}
            </nav>
            <div className="p-4 border-t border-brand-700/50 space-y-3">
              <LanguageToggle variant="dark" />
              <Link to="/" onClick={() => setDrawerOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-cream-300/70 hover:bg-brand-700/50 font-sans text-sm">← {t('home')}</Link>
              <button type="button" onClick={() => { setDrawerOpen(false); void signOut() }} className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-cream-300/70 hover:bg-brand-700/50 font-sans text-sm">↪ {t('signOut')}</button>
            </div>
          </motion.div>
        </>)}
      </AnimatePresence>

      <main className="flex-1 lg:ms-64 pt-16 lg:pt-0">
        <div className="p-4 sm:p-6 lg:p-8">
          <Routes>
            <Route path="/" element={<AdminDashboard />} />
            <Route path="/flowers" element={<AdminFlowers />} />
            <Route path="/flowers/new" element={<AdminFlowerEdit />} />
            <Route path="/flowers/:id" element={<AdminFlowerEdit />} />
            <Route path="/categories" element={<AdminCategories />} />
            <Route path="/comments" element={<AdminComments />} />
            <Route path="/settings" element={<AdminSettings />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  )
}
