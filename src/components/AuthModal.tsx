import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLanguage } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'
import { useUI } from '../context/UIContext'
import { CloseIcon, PeonyIllustration } from './icons'
import { getSupabaseAuthSettings } from '../lib/supabase'
import type { TranslationKey } from '../lib/translations'

type Tab = 'signin' | 'signup' | 'forgot'

export function AuthModal() {
  const { t, dir } = useLanguage()
  const { authModalOpen, closeAuthModal, authReason } = useUI()
  const { signInWithEmail, signInWithGoogle, requestSignupOtp, requestPasswordResetOtp, verifyEmailOtp, setUserPassword, completeOtpSignUp } = useAuth()
  const [tab, setTab] = useState<Tab>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [googleProviderEnabled, setGoogleProviderEnabled] = useState<boolean | null>(null)
  const [otpStage, setOtpStage] = useState<'signup' | 'forgot' | null>(null)
  const [otpEmail, setOtpEmail] = useState('')
  const [otpCode, setOtpCode] = useState(['', '', '', ''])
  const [newPassword, setNewPassword] = useState('')
  const otpInputsRef = useRef<Array<HTMLInputElement | null>>([])
  const OTP_REQUEST_STORAGE_KEY = 'rawabi-otp-request'
  type OtpRequestData = { email: string; mode: 'signup' | 'forgot'; timestamp: number }
  const getOtpRequest = (): OtpRequestData | null => {
    try { const raw = localStorage.getItem(OTP_REQUEST_STORAGE_KEY); if (!raw) return null; return JSON.parse(raw) as OtpRequestData } catch { return null }
  }
  const setOtpRequest = (email: string, mode: 'signup' | 'forgot') => { const data: OtpRequestData = { email, mode, timestamp: Date.now() }; localStorage.setItem(OTP_REQUEST_STORAGE_KEY, JSON.stringify(data)) }
  const isRecentOtpRequest = (email: string, mode: 'signup' | 'forgot') => { const request = getOtpRequest(); return request?.email === email && request?.mode === mode && Date.now() - request.timestamp < 120_000 }

  useEffect(() => {
    let active = true
    const checkGoogleProvider = async () => { const settings = await getSupabaseAuthSettings(); if (active) setGoogleProviderEnabled(Boolean(settings?.external?.google)) }
    void checkGoogleProvider()
    return () => { active = false }
  }, [])

  const handleClose = () => {
    setEmail(''); setPassword(''); setDisplayName(''); setError(null); setTab('signin')
    setOtpStage(null); setOtpEmail(''); setOtpCode(['', '', '', '']); setNewPassword('')
    closeAuthModal()
  }

  const getOtpCode = () => otpCode.join('')
  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(0, 1)
    const nextCode = [...otpCode]; nextCode[index] = digit; setOtpCode(nextCode)
    if (digit && index < 3) otpInputsRef.current[index + 1]?.focus()
  }
  const handleOtpKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => { if (event.key === 'Backspace' && !otpCode[index] && index > 0) otpInputsRef.current[index - 1]?.focus() }
  const handleOtpPaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4).split('')
    if (!pasted.length) return
    const filled = [...pasted, '', '', '', ''].slice(0, 4)
    setOtpCode(filled)
    const nextIndex = Math.min(pasted.length, 3)
    setTimeout(() => otpInputsRef.current[nextIndex]?.focus(), 0)
  }

  const formatError = (err: unknown): string => {
    if (!err) return ''
    if (typeof err === 'string') {
      const knownKeys = ['invalidCredentials', 'emailInUse', 'authError', 'adminLoginError', 'googleProviderDisabled', 'resetSent', 'emailRateLimitExceeded', 'otpAlreadySent'] as const
      if (knownKeys.includes(err as any)) return t(err as TranslationKey)
      return err
    }
    if (err instanceof Error) return err.message || t('authError')
    if (typeof err === 'object' && err !== null) {
      const maybeMessage = (err as { message?: unknown }).message
      if (typeof maybeMessage === 'string' && maybeMessage.trim()) return maybeMessage
      const maybeError = (err as { error?: unknown }).error
      if (typeof maybeError === 'string' && maybeError.trim()) return maybeError
      if (typeof maybeError === 'object' && maybeError !== null) {
        const nestedMessage = (maybeError as { message?: unknown }).message
        if (typeof nestedMessage === 'string' && nestedMessage.trim()) return nestedMessage
      }
    }
    try { const json = JSON.stringify(err); return json && json !== '{}' ? json : t('authError') } catch { return t('authError') }
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError(null)
    const { error } = await signInWithEmail(email, password)
    setLoading(false)
    if (error) setError(t(error as TranslationKey))
    else handleClose()
  }
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError(null)
    if (isRecentOtpRequest(email, 'signup')) {
      setLoading(false); setOtpStage('signup'); setOtpEmail(email); setOtpCode(['', '', '', ''])
      setError(t('otpAlreadySent'))
      setTimeout(() => otpInputsRef.current[0]?.focus(), 50)
      return
    }
    const { error } = await requestSignupOtp(email, displayName)
    setLoading(false)
    if (error) {
      const normalizedError = error as string
      const knownKeys = ['invalidCredentials', 'emailInUse', 'authError', 'adminLoginError', 'emailRateLimitExceeded'] as const
      if (knownKeys.includes(normalizedError as any)) {
        if (normalizedError === 'emailRateLimitExceeded') {
          setOtpRequest(email, 'signup'); setOtpStage('signup'); setOtpEmail(email); setOtpCode(['', '', '', ''])
          setTimeout(() => otpInputsRef.current[0]?.focus(), 50)
        }
        setError(t(normalizedError as TranslationKey))
      } else { setError(formatError(normalizedError)) }
      return
    }
    setOtpRequest(email, 'signup'); setOtpStage('signup'); setOtpEmail(email); setOtpCode(['', '', '', ''])
    setTimeout(() => otpInputsRef.current[0]?.focus(), 50)
  }
  const handleGoogle = async () => { setLoading(true); const { error } = await signInWithGoogle(); if (error) { setError(t(error as TranslationKey)); setLoading(false) } }
  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError(null)
    if (isRecentOtpRequest(email, 'forgot')) {
      setLoading(false); setOtpStage('forgot'); setOtpEmail(email); setOtpCode(['', '', '', '']); setNewPassword('')
      setError(t('otpAlreadySent'))
      setTimeout(() => otpInputsRef.current[0]?.focus(), 50)
      return
    }
    const { error } = await requestPasswordResetOtp(email)
    setLoading(false)
    if (error) {
      const normalizedError = error as string
      const knownKeys = ['invalidCredentials', 'emailInUse', 'authError', 'adminLoginError', 'emailRateLimitExceeded'] as const
      if (knownKeys.includes(normalizedError as any)) {
        if (normalizedError === 'emailRateLimitExceeded') {
          setOtpRequest(email, 'forgot'); setOtpStage('forgot'); setOtpEmail(email); setOtpCode(['', '', '', '']); setNewPassword('')
          setTimeout(() => otpInputsRef.current[0]?.focus(), 50)
        }
        setError(t(normalizedError as TranslationKey))
      } else { setError(formatError(normalizedError)) }
      return
    }
    setOtpRequest(email, 'forgot'); setOtpStage('forgot'); setOtpEmail(email); setOtpCode(['', '', '', '']); setNewPassword('')
    setTimeout(() => otpInputsRef.current[0]?.focus(), 50)
  }
  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError(null)
    const code = getOtpCode()
    if (code.length !== 4) { setLoading(false); setError(t('authError')); return }
    const { error, user } = await verifyEmailOtp(otpEmail, code)
    if (error) { setLoading(false); setError(formatError(error)); return }
    if (otpStage === 'signup' && user) {
      const displayNameValue = displayName || otpEmail.split('@')[0]
      const completeResult = await completeOtpSignUp(user, displayNameValue, password)
      setLoading(false)
      if (completeResult.error) setError(formatError(completeResult.error))
      else handleClose()
      return
    }
    if (otpStage === 'forgot') {
      if (!newPassword) { setLoading(false); setError(t('authError')); return }
      const { error: updateError } = await setUserPassword(newPassword)
      setLoading(false)
      if (updateError) setError(formatError(updateError))
      else handleClose()
      return
    }
  }

  return (
    <AnimatePresence>
      {authModalOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} className="fixed inset-0 bg-brand-950/60 backdrop-blur-sm z-[90] flex items-center justify-center p-4" onClick={handleClose}>
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }} onClick={(e) => e.stopPropagation()} className="relative bg-cream-100 rounded-3xl shadow-brand-lg max-w-md w-full overflow-hidden" dir={dir}>
            <div className="relative bg-brand-800 px-8 pt-8 pb-6 text-center">
              <button onClick={handleClose} className="absolute top-4 end-4 text-cream-100/70 hover:text-cream-100 transition-colors" aria-label={t('closeLightbox')}><CloseIcon size={20} /></button>
              <div className="text-saffron-400/60 flex justify-center mb-3"><PeonyIllustration size={48} /></div>
              <h2 className="font-sans text-2xl font-bold text-cream-100 mb-1">{t('authWelcome')}</h2>
              <p className="text-cream-300/70 text-sm">{t('authSubtitle')}</p>
              {authReason && <p className="mt-3 text-saffron-400 text-sm italic">{authReason}</p>}
            </div>

            {otpStage ? (
              <div className="p-8">
                <form onSubmit={handleOtpSubmit} className="space-y-6">
                  <div className="text-center">
                    <p className="text-espresso-700 text-sm mb-6">{otpStage === 'signup' ? t('signupVerificationInstructions') : t('forgotVerificationInstructions')}</p>
                  </div>
                  <div>
                    <label className="block text-xs tracking-wide text-espresso-500 mb-3 text-center">{t('enterVerificationCode')}</label>
                    <div className="flex justify-center gap-3" onPaste={handleOtpPaste}>
                      {otpCode.map((digit, i) => (
                        <input key={i} ref={(el) => { otpInputsRef.current[i] = el }} type="text" inputMode="numeric" maxLength={1} value={digit} onChange={(e) => handleOtpChange(i, e.target.value)} onKeyDown={(e) => handleOtpKeyDown(i, e)} disabled={loading} className="w-14 h-16 text-center font-serif text-2xl rounded-xl bg-cream-50 border-2 border-brand-200 text-espresso-900 focus:outline-none focus:border-saffron-400 transition-colors" aria-label={`${t('enterVerificationCode')} ${i + 1}`} />
                      ))}
                    </div>
                  </div>
                  {otpStage === 'forgot' && (
                    <div>
                      <label className="block text-xs tracking-wide text-espresso-500 mb-1.5">{t('newPassword')}</label>
                      <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="input-field" required minLength={6} />
                    </div>
                  )}
                  {error && <p className="text-red-600 text-sm text-center">{formatError(error)}</p>}
                  <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? '…' : t('verifyCode')}</button>
                  <button type="button" onClick={() => { setOtpStage(null); setError(null) }} className="w-full text-center text-sm text-brand-600 hover:text-brand-700 transition-colors">{t('backToSignIn')}</button>
                </form>
              </div>
            ) : (
              <>
                {tab !== 'forgot' && (
                  <div className="flex border-b border-brand-100">
                    <button onClick={() => { setTab('signin'); setError(null) }} className={`flex-1 py-3 font-sans text-sm font-medium tracking-wide transition-colors ${tab === 'signin' ? 'text-brand-800 border-b-2 border-saffron-400' : 'text-espresso-400'}`}>{t('authSignInTab')}</button>
                    <button onClick={() => { setTab('signup'); setError(null) }} className={`flex-1 py-3 font-sans text-sm font-medium tracking-wide transition-colors ${tab === 'signup' ? 'text-brand-800 border-b-2 border-saffron-400' : 'text-espresso-400'}`}>{t('authSignUpTab')}</button>
                  </div>
                )}
                <div className="p-8">
                  {tab === 'forgot' && (
                    <div className="mb-4">
                      <button onClick={() => { setTab('signin'); setError(null) }} className="text-sm text-brand-600 hover:text-brand-700 transition-colors">← {t('backToSignIn')}</button>
                    </div>
                  )}
                  {tab === 'signin' && (
                    <form onSubmit={handleSignIn} className="space-y-4">
                      <div><label className="block text-xs tracking-wide text-espresso-500 mb-1.5">{t('email')}</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" required /></div>
                      <div><label className="block text-xs tracking-wide text-espresso-500 mb-1.5">{t('password')}</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input-field" required /></div>
                      {error && <p className="text-red-600 text-sm text-center">{formatError(error)}</p>}
                      <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? '…' : t('signInCta')}</button>
                      <button type="button" onClick={() => { setTab('forgot'); setError(null) }} className="w-full text-center text-sm text-brand-600 hover:text-brand-700 transition-colors">{t('forgotPassword')}</button>
                    </form>
                  )}
                  {tab === 'signup' && (
                    <form onSubmit={handleSignUp} className="space-y-4">
                      <div><label className="block text-xs tracking-wide text-espresso-500 mb-1.5">{t('displayName')}</label><input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="input-field" required /></div>
                      <div><label className="block text-xs tracking-wide text-espresso-500 mb-1.5">{t('email')}</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" required /></div>
                      <div><label className="block text-xs tracking-wide text-espresso-500 mb-1.5">{t('password')}</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input-field" required minLength={6} /></div>
                      {error && <p className="text-red-600 text-sm text-center">{formatError(error)}</p>}
                      <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? '…' : t('createAccount')}</button>
                    </form>
                  )}
                  {tab === 'forgot' && (
                    <form onSubmit={handleReset} className="space-y-4">
                      <div><label className="block text-xs tracking-wide text-espresso-500 mb-1.5">{t('email')}</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" required /></div>
                      {error && <p className="text-red-600 text-sm text-center">{formatError(error)}</p>}
                      <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? '…' : t('resetPassword')}</button>
                    </form>
                  )}

                  {googleProviderEnabled && (
                    <div className="mt-6 pt-6 border-t border-brand-100">
                      <p className="text-center text-sm text-espresso-400 mb-4">{t('orContinue')}</p>
                      <button onClick={handleGoogle} disabled={loading} className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-brand-200 rounded-xl text-espresso-900 font-sans text-sm hover:bg-brand-50 transition-colors disabled:opacity-50">
                        <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                        {t('continueWithGoogle')}
                      </button>
                    </div>
                  )}
                  {!googleProviderEnabled && googleProviderEnabled !== null && (
                    <p className="mt-6 text-sm text-espresso-400 text-center">{t('googleProviderDisabled')}</p>
                  )}

                  <div className="mt-6 text-center">
                    {tab === 'signin' && <p className="text-sm text-espresso-500">{t('noAccount')} <button onClick={() => { setTab('signup'); setError(null) }} className="text-brand-600 font-medium hover:text-brand-700 transition-colors">{t('createAccount')}</button></p>}
                    {tab === 'signup' && <p className="text-sm text-espresso-500">{t('haveAccount')} <button onClick={() => { setTab('signin'); setError(null) }} className="text-brand-600 font-medium hover:text-brand-700 transition-colors">{t('signInCta')}</button></p>}
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
