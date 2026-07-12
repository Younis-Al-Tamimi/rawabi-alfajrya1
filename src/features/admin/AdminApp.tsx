import { Routes, Route, Navigate, useLocation, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import { Logo } from '../../components/Logo'
import { LanguageToggle } from '../../components/LanguageToggle'
import { PeonyIllustration, DashboardIcon, FlowerIcon, CategoryIcon, CommentIcon, SettingsIcon, MenuIcon, CloseIcon } from '../../components/icons'
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

  if (loading) return <div className="min-h-screen bg-forest-700 flex items-center justify-center"><div className="text-gold-400/60 animate-pulse"><PeonyIllustration size={80} /></div></div>
  if (!isAdmin || !adminUser) return <AdminLogin />

  const navItems = [
    { path: '/admin', label: t('dashboard'), icon: DashboardIcon, exact: true },
    { path: '/admin/flowers', label: t('manageFlowers'), icon: FlowerIcon },
    { path: '/admin/categories', label: t('manageCategories'), icon: CategoryIcon },
    { path: '/admin/comments', label: t('manageComments'), icon: CommentIcon },
    { path: '/admin/settings', label: t('settings'), icon: SettingsIcon },
  ]
  const isActive = (item: typeof navItems[0]) => item.exact ? location.pathname === '/admin' : location.pathname.startsWith(item.path)

  return (
    <div className="min-h-screen bg-ivory-200 flex" dir={dir}>
      <aside className="hidden lg:flex w-64 bg-forest-700 text-ivory-200 flex-col fixed inset-y-0">
        <div className="p-6 border-b border-forest-600/50"><Link to="/admin"><Logo className="text-ivory-200" /></Link></div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(item => { const Icon = item.icon; return <Link key={item.path} to={item.path} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-sans text-sm tracking-wide transition-all duration-300 ${isActive(item) ? 'bg-forest-600 text-ivory-200 shadow-forest-sm' : 'text-ivory-300/70 hover:bg-forest-600/50 hover:text-ivory-200'}`}><Icon size={18} />{item.label}</Link> })}
        </nav>
        <div className="p-4 border-t border-forest-600/50 space-y-3">
          <LanguageToggle variant="dark" />
          <Link to="/" className="flex items-center gap-3 px-4 py-3 rounded-xl text-ivory-300/70 hover:bg-forest-600/50 hover:text-ivory-200 font-sans text-sm transition-colors">← {t('home')}</Link>
          <button type="button" onClick={() => void signOut()} className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-ivory-300/70 hover:bg-forest-600/50 hover:text-ivory-200 font-sans text-sm transition-colors">↪ {t('signOut')}</button>
        </div>
      </aside>

      <div className="lg:hidden fixed top-0 inset-x-0 z-40 bg-forest-700 text-ivory-200 safe-top">
        <div className="flex items-center justify-between px-4 h-16"><Link to="/admin"><Logo className="text-ivory-200" showText={false} /></Link><button onClick={() => setDrawerOpen(true)} className="text-ivory-200 p-2"><MenuIcon size={24} /></button></div>
      </div>

      <AnimatePresence>
        {drawerOpen && (<>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-forest-950/50 z-50 lg:hidden" onClick={() => setDrawerOpen(false)} />
          <motion.div initial={{ x: dir === 'rtl' ? '-100%' : '100%' }} animate={{ x: 0 }} exit={{ x: dir === 'rtl' ? '-100%' : '100%' }} transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }} className={`fixed top-0 ${dir === 'rtl' ? 'left-0' : 'right-0'} bottom-0 w-72 max-w-[85vw] bg-forest-700 z-50 lg:hidden overflow-y-auto safe-top`}>
            <div className="p-6 flex items-center justify-between border-b border-forest-600/50"><Logo className="text-ivory-200" /><button onClick={() => setDrawerOpen(false)} className="text-ivory-200 p-2"><CloseIcon size={24} /></button></div>
            <nav className="p-4 space-y-1">
              {navItems.map(item => { const Icon = item.icon; return <Link key={item.path} to={item.path} onClick={() => setDrawerOpen(false)} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-sans text-sm transition-colors ${isActive(item) ? 'bg-forest-600 text-ivory-200' : 'text-ivory-300/70 hover:bg-forest-600/50'}`}><Icon size={18} />{item.label}</Link> })}
            </nav>
            <div className="p-4 border-t border-forest-600/50 space-y-3">
              <LanguageToggle variant="dark" />
              <Link to="/" onClick={() => setDrawerOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-ivory-300/70 hover:bg-forest-600/50 font-sans text-sm">← {t('home')}</Link>
              <button type="button" onClick={() => { setDrawerOpen(false); void signOut() }} className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-ivory-300/70 hover:bg-forest-600/50 font-sans text-sm">↪ {t('signOut')}</button>
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
