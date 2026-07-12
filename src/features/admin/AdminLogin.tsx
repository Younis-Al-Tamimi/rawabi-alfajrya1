import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import { PeonyIllustration } from '../../components/icons'
import { LogoMark } from '../../components/Logo'

export function AdminLogin() {
  const { t, dir } = useLanguage()
  const { signInAdmin } = useAuth()
  const navigate = useNavigate()
  const [passcode, setPasscode] = useState(['', '', '', ''])
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => { inputRefs.current[0]?.focus() }, [])

  const submitPasscode = async (code: string) => {
    if (code.length !== 4) return
    setLoading(true); setError(false)
    const { error } = await signInAdmin(code)
    setLoading(false)
    if (error) { setError(true); setPasscode(['', '', '', '']); setTimeout(() => inputRefs.current[0]?.focus(), 100) }
    else navigate('/admin')
  }

  const handleChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return
    const newPasscode = [...passcode]; newPasscode[index] = value; setPasscode(newPasscode); setError(false)
    if (value && index < 3) inputRefs.current[index + 1]?.focus()
    if (value && index === 3) submitPasscode(newPasscode.join(''))
  }
  const handleKeyDown = (index: number, e: React.KeyboardEvent) => { if (e.key === 'Backspace' && !passcode[index] && index > 0) inputRefs.current[index - 1]?.focus() }
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').slice(0, 4)
    if (/^\d{1,4}$/.test(pasted)) { const newPasscode = ['', '', '', '']; pasted.split('').forEach((digit, i) => { newPasscode[i] = digit }); setPasscode(newPasscode); if (pasted.length === 4) submitPasscode(pasted); else inputRefs.current[pasted.length]?.focus() }
  }
  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); submitPasscode(passcode.join('')) }

  return (
    <div className="min-h-screen bg-brand-800 flex items-center justify-center p-4" dir={dir}>
      <div className="absolute inset-0 flex items-center justify-center opacity-5 text-cream-100 pointer-events-none"><PeonyIllustration size={400} /></div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }} className="relative w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-cream-100 flex justify-center mb-4"><LogoMark className="h-16 w-16" /></div>
          <h1 className="font-sans text-2xl font-bold text-cream-100 mb-2">{t('adminLogin')}</h1>
          <p className="text-cream-300/70 text-sm">{t('adminLoginSubtitle')}</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="flex justify-center gap-3 mb-6">
            {passcode.map((digit, i) => (
              <motion.input key={i} ref={(el) => { inputRefs.current[i] = el }} type="text" inputMode="numeric" maxLength={1} value={digit} onChange={(e) => handleChange(i, e.target.value)} onKeyDown={(e) => handleKeyDown(i, e)} onPaste={handlePaste} disabled={loading} animate={error ? { x: [0, -8, 8, -8, 8, 0] } : {}} transition={{ duration: 0.4 }} className={`w-14 h-16 text-center font-serif text-2xl rounded-xl bg-brand-700/50 border-2 text-cream-100 focus:outline-none transition-colors ${error ? 'border-red-400' : 'border-brand-600 focus:border-saffron-400'}`} aria-label={`${t('adminPasscode')} ${i + 1}`} />
            ))}
          </div>
          {error && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-300 text-sm text-center mb-4">{t('adminLoginError')}</motion.p>}
          <button type="submit" disabled={loading || passcode.some(d => !d)} className="w-full py-3 bg-saffron-400 text-brand-900 font-sans text-sm font-semibold tracking-wide rounded-full hover:bg-saffron-500 hover:text-cream-100 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed">{loading ? '…' : t('signIn')}</button>
        </form>
        <p className="text-cream-300/40 text-xs text-center mt-6">Rawabi Al Fajrya Admin</p>
      </motion.div>
    </div>
  )
}
