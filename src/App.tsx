import { HashRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { lazy, Suspense } from 'react'
import { LanguageProvider } from './context/LanguageContext'
import { AuthProvider } from './context/AuthContext'
import { UIProvider } from './context/UIContext'
import { Header } from './components/Header'
import { Footer } from './components/Footer'
import { AuthModal } from './components/AuthModal'
import { HomePage } from './features/home/HomePage'
import { FlowersPage } from './features/flowers/FlowersPage'
import { FlowerDetailPage } from './features/flowers/FlowerDetailPage'
import { NotFoundPage } from './features/NotFoundPage'
import { PeonyIllustration } from './components/icons'

const AdminApp = lazy(() => import('./features/admin/AdminApp').then(m => ({ default: m.AdminApp })))

function AdminFallback() {
  return <div className="min-h-screen bg-forest-700 flex items-center justify-center"><div className="text-gold-400/60 animate-pulse"><PeonyIllustration size={80} /></div></div>
}

function AnimatedRoutes() {
  const location = useLocation()
  const isAdmin = location.pathname.startsWith('/admin')
  return (
    <>
      <AnimatePresence mode="wait">
        <motion.div key={location.pathname} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}>
          <Routes location={location}>
            <Route path="/" element={<HomePage />} />
            <Route path="/flowers" element={<FlowersPage />} />
            <Route path="/flower/:slug" element={<FlowerDetailPage />} />
            <Route path="/admin/*" element={<Suspense fallback={<AdminFallback />}><AdminApp /></Suspense>} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </motion.div>
      </AnimatePresence>
      {!isAdmin && <Footer />}
    </>
  )
}

export default function App() {
  return (
    <LanguageProvider><AuthProvider><UIProvider>
      <HashRouter>
        <div className="min-h-screen flex flex-col bg-ivory-200">
          <Header />
          <main className="flex-1 pt-16 sm:pt-20"><AnimatedRoutes /></main>
          <AuthModal />
        </div>
      </HashRouter>
    </UIProvider></AuthProvider></LanguageProvider>
  )
}
