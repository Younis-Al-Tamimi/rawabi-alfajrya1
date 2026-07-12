import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useLanguage } from './LanguageContext'
import type { TranslationKey } from '../lib/translations'

interface Toast { id: string; message: string; type: 'success' | 'error' | 'info' }

interface UIContextValue {
  showToast: (message: string | TranslationKey, type?: 'success' | 'error' | 'info') => void
  openAuthModal: (reason?: string) => void
  closeAuthModal: () => void
  authModalOpen: boolean
  authReason: string | null
}

const UIContext = createContext<UIContextValue | null>(null)

export function UIProvider({ children }: { children: ReactNode }) {
  const { t } = useLanguage()
  const [toasts, setToasts] = useState<Toast[]>([])
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authReason, setAuthReason] = useState<string | null>(null)

  const showToast = useCallback((message: string | TranslationKey, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).slice(2)
    const text = typeof message === 'string' && t.hasOwnProperty(message) ? t(message as TranslationKey) : message as string
    setToasts(prev => [...prev, { id, message: text, type }])
    setTimeout(() => setToasts(prev => prev.filter(toast => toast.id !== id)), 3500)
  }, [t])

  const openAuthModal = useCallback((reason?: string) => { setAuthReason(reason || null); setAuthModalOpen(true) }, [])
  const closeAuthModal = useCallback(() => { setAuthModalOpen(false); setAuthReason(null) }, [])

  return (
    <UIContext.Provider value={{ showToast, openAuthModal, closeAuthModal, authModalOpen, authReason }}>
      {children}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 items-center safe-bottom">
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div key={toast.id} initial={{ opacity: 0, y: 20, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.9 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className={`px-5 py-3 rounded-full shadow-forest-lg font-sans text-sm tracking-wide backdrop-blur-md ${toast.type === 'success' ? 'bg-forest-700/95 text-ivory-200' : toast.type === 'error' ? 'bg-red-800/95 text-ivory-200' : 'bg-forest-600/95 text-ivory-200'}`}>
              {toast.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </UIContext.Provider>
  )
}

export function useUI() {
  const ctx = useContext(UIContext)
  if (!ctx) throw new Error('useUI must be used within UIProvider')
  return ctx
}
