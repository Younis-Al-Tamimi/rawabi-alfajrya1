import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react'
import { supabase, ADMIN_EMAIL, getSupabaseAuthSettings } from '../lib/supabase'
import { fetchSetting, updateSetting } from '../lib/data'
import type { Profile } from '../lib/types'

const DEFAULT_ADMIN_PASSCODE = '1234'
const ADMIN_SESSION_STORAGE_KEY = 'f9-flowers-admin-session'
const GUEST_PROFILE_ID_STORAGE_KEY = 'f9-flowers-guest-profile-id'
const ADMIN_SESSION_TIMEOUT_MS = 10 * 60 * 1000

interface AdminSessionData {
  authenticated: boolean
  createdAt: string
  lastActiveAt: string
  expiresAt: string
}

interface AuthContextValue {
  user: any | null
  profile: Profile | null
  adminUser: any | null
  adminProfile: Profile | null
  isAdmin: boolean
  loading: boolean
  signInWithEmail: (email: string, password: string) => Promise<{ error: string | null }>
  requestSignupOtp: (email: string, displayName: string) => Promise<{ error: string | null }>
  signUpWithEmail: (email: string, password: string, displayName?: string) => Promise<{ error: string | null }>
  registerProfile: (email: string, password: string, displayName: string) => Promise<{ error: string | null }>
  loginProfile: (email: string, password: string) => Promise<{ error: string | null }>
  signInWithGoogle: () => Promise<{ error: string | null }>
  signInAdmin: (passcode: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: string | null }>
  updatePassword: (newPassword: string) => Promise<{ error: string | null }>
  requestEmailOtp: (email: string) => Promise<{ error: string | null }>
  requestPasswordResetOtp: (email: string) => Promise<{ error: string | null }>
  resetProfilePassword: (email: string, newPassword: string) => Promise<{ error: string | null }>
  verifyEmailOtp: (email: string, code: string) => Promise<{ error: string | null; user?: any | null }>
  setUserPassword: (newPassword: string) => Promise<{ error: string | null }>
  completeOtpSignUp: (user: any, displayName: string, password: string) => Promise<{ error: string | null }>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [regularUser, setRegularUser] = useState<any | null>(null)
  const [regularProfile, setRegularProfile] = useState<Profile | null>(null)
  const [adminUser, setAdminUser] = useState<any | null>(null)
  const [adminProfile, setAdminProfile] = useState<Profile | null>(null)
  const [adminSessionActive, setAdminSessionActive] = useState(false)
  const [loading, setLoading] = useState(true)
  const timeoutRef = useRef<number | null>(null)

  const user = regularUser
  const profile = regularProfile

  const fetchRegularProfile = async (uid: string) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', uid).maybeSingle()
    setRegularProfile(data as Profile | null)
  }

  const ensureProfile = async (id: string, displayName: string, isAdmin = false) => {
    await supabase.from('profiles').upsert({ id, display_name: displayName, is_admin: isAdmin })
  }

  const getOrCreateGuestProfileId = async () => {
    let guestId = localStorage.getItem(GUEST_PROFILE_ID_STORAGE_KEY)
    if (!guestId) {
      guestId = crypto.randomUUID()
      localStorage.setItem(GUEST_PROFILE_ID_STORAGE_KEY, guestId)
    }
    return guestId
  }

  const readAdminSession = (): AdminSessionData | null => {
    try {
      const raw = localStorage.getItem(ADMIN_SESSION_STORAGE_KEY)
      if (!raw) return null
      const parsed = JSON.parse(raw) as AdminSessionData
      if (!parsed?.authenticated) return null
      return parsed
    } catch {
      return null
    }
  }

  const writeAdminSession = (lastActiveAt = new Date().toISOString()) => {
    const now = new Date()
    const session: AdminSessionData = {
      authenticated: true,
      createdAt: lastActiveAt,
      lastActiveAt,
      expiresAt: new Date(now.getTime() + ADMIN_SESSION_TIMEOUT_MS).toISOString(),
    }
    localStorage.setItem(ADMIN_SESSION_STORAGE_KEY, JSON.stringify(session))
  }

  const clearAdminSession = () => {
    localStorage.removeItem(ADMIN_SESSION_STORAGE_KEY)
  }

  const refreshAdminSession = () => {
    const session = readAdminSession()
    if (!session?.authenticated) return
    writeAdminSession(new Date().toISOString())
  }

  const expireAdminSession = async () => {
    clearAdminSession()
    setAdminUser(null)
    setAdminProfile(null)
    setAdminSessionActive(false)
  }

  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      const savedAdminSession = readAdminSession()
      if (savedAdminSession?.authenticated) {
        const expiresAt = Date.parse(savedAdminSession.expiresAt)
        if (expiresAt > Date.now()) {
          if (!mounted) return
          const profileId = await getOrCreateGuestProfileId()
          await ensureProfile(profileId, 'Admin', true)
          if (!mounted) return
          setAdminSessionActive(true)
          setAdminUser({ id: profileId, email: ADMIN_EMAIL })
          setAdminProfile({ id: profileId, display_name: 'Admin', avatar_url: null, is_admin: true, created_at: new Date().toISOString() })
        } else {
          clearAdminSession()
          setAdminSessionActive(false)
          setAdminUser(null)
          setAdminProfile(null)
        }
      } else {
        setAdminSessionActive(false)
        setAdminUser(null)
        setAdminProfile(null)
      }

      const { data: { session } } = await supabase.auth.getSession()
      if (!mounted) return
      if (session?.user) {
        setRegularUser(session.user)
        await fetchRegularProfile(session.user.id)
      } else {
        setRegularUser(null)
        setRegularProfile(null)
      }

      setLoading(false)
    }

    initializeAuth()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return

      if (session?.user) {
        setRegularUser(session.user)
        void fetchRegularProfile(session.user.id)
      } else {
        setRegularUser(null)
        setRegularProfile(null)
      }

      setLoading(false)
    })
    return () => { mounted = false; subscription.unsubscribe() }
  }, [])

  useEffect(() => {
    if (!adminSessionActive) {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
      return
    }

    const handleActivity = () => {
      refreshAdminSession()
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current)
      timeoutRef.current = window.setTimeout(() => {
        void expireAdminSession()
      }, ADMIN_SESSION_TIMEOUT_MS)
    }

    const activityEvents = ['mousemove', 'keydown', 'scroll', 'click', 'touchstart'] as const
    activityEvents.forEach((eventName) => window.addEventListener(eventName, handleActivity, { passive: true }))
    window.addEventListener('focus', handleActivity)

    const session = readAdminSession()
    if (session?.authenticated) {
      const remaining = Date.parse(session.expiresAt) - Date.now()
      if (remaining > 0) {
        if (timeoutRef.current) window.clearTimeout(timeoutRef.current)
        timeoutRef.current = window.setTimeout(() => {
          void expireAdminSession()
        }, remaining)
      } else {
        void expireAdminSession()
      }
    }

    return () => {
      activityEvents.forEach((eventName) => window.removeEventListener(eventName, handleActivity))
      window.removeEventListener('focus', handleActivity)
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }
  }, [adminSessionActive])

  const signInWithEmail = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: error.message.includes('Invalid login') ? 'invalidCredentials' : 'authError' }
    setRegularUser(data.user)
    await fetchRegularProfile(data.user.id)
    return { error: null }
  }
  const signUpWithEmail = async (email: string, password: string, displayName?: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) {
        console.error('signUpWithEmail error', error)
        return { error: error.message || 'authError' }
      }
      // try to sign in immediately to establish session (if allowed)
      try {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password })
        if (signInError) {
          console.error('signUpWithEmail signin error', signInError)
        } else if (signInData?.user) {
          setRegularUser(signInData.user)
          await fetchRegularProfile(signInData.user.id)
        }
      } catch (siErr) {
        console.error('signUpWithEmail signin unexpected', siErr)
      }
      return { error: null }
    } catch (err) {
      console.error('signUpWithEmail unexpected', err)
      return { error: 'authError' }
    }
  }
  const hashPassword = async (password: string) => {
    const enc = new TextEncoder()
    const hashBuffer = await crypto.subtle.digest('SHA-256', enc.encode(password))
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }

  const registerProfile = async (email: string, password: string, displayName: string) => {
    try {
      // check existing email
      const { data: existing, error: selectError } = await supabase.from('profiles').select('id').eq('email', email).maybeSingle()
      if (selectError) {
        console.error('registerProfile select error', selectError)
        // Try fallback signup via Supabase Auth if the direct profile lookup is blocked
        try {
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ email, password })
          if (signUpError) {
            console.error('registerProfile signup fallback error (select path)', signUpError)
            return { error: signUpError.message || 'authError' }
          }
          const userId = signUpData?.user?.id
          // Attempt to sign in the newly created user so the app has a session
          try {
            const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password })
            if (!signInError && signInData?.user) {
              setRegularUser(signInData.user)
              await fetchRegularProfile(signInData.user.id)
            }
          } catch (siErr) {
            console.error('registerProfile signin after signup unexpected', siErr)
          }
          if (userId) {
            const { data: profileRow } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
            if (profileRow) {
              setRegularUser({ id: profileRow.id, email })
              setRegularProfile(profileRow as Profile)
            }
          }
          return { error: null }
        } catch (signupErr) {
          console.error('registerProfile signup fallback unexpected (select path)', signupErr)
          return { error: 'authError' }
        }
      }
      if (existing) {
        return { error: 'emailInUse' }
      }
      const password_hash = await hashPassword(password)
      const { data, error } = await supabase.from('profiles').insert({ display_name: displayName || email.split('@')[0], email, password_hash }).select().maybeSingle()
      if (error) {
        console.error('registerProfile insert error', error)
        // Fallback: try creating via Supabase Auth signup which will create profile via trigger
        try {
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ email, password })
          if (signUpError) {
            console.error('registerProfile signup fallback error', signUpError)
            return { error: signUpError.message || 'authError' }
          }
          // Attempt to sign in so the app has a session
          try {
            const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password })
            if (!signInError && signInData?.user) {
              setRegularUser(signInData.user)
              await fetchRegularProfile(signInData.user.id)
            }
          } catch (siErr) {
            console.error('registerProfile signin after signup unexpected (insert path)', siErr)
          }
          const userId = signUpData?.user?.id
          if (userId) {
            const { data: profileRow } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
            if (profileRow) {
              setRegularUser({ id: profileRow.id, email })
              setRegularProfile(profileRow as Profile)
            }
          }
          return { error: null }
        } catch (signupErr) {
          console.error('registerProfile signup fallback unexpected (insert path)', signupErr)
          return { error: 'authError' }
        }
      }
      if (data) {
        setRegularUser({ id: data.id, email })
        setRegularProfile(data as Profile)
      }
      return { error: null }
    } catch (err) {
      console.error('registerProfile unexpected', err)
      return { error: 'authError' }
    }
  }

  const loginProfile = async (email: string, password: string) => {
    try {
      const password_hash = await hashPassword(password)
      const { data, error } = await supabase.from('profiles').select('*').eq('email', email).eq('password_hash', password_hash).maybeSingle()
      if (error) {
        console.error('loginProfile error', error)
        return { error: 'authError' }
      }
      if (!data) return { error: 'invalidCredentials' }
      setRegularUser({ id: data.id, email })
      setRegularProfile(data as Profile)
      return { error: null }
    } catch (err) {
      console.error('loginProfile unexpected', err)
      return { error: 'authError' }
    }
  }
  const extractAuthMessage = (error: unknown): string => {
    if (!error) return 'authError'
    if (typeof error === 'string') return error
    if (error instanceof Error) return error.message || 'authError'
    if (typeof error === 'object' && error !== null) {
      const maybeMessage = (error as { message?: unknown }).message
      const maybeCode = (error as { code?: unknown }).code
      if (typeof maybeMessage === 'string' && maybeMessage.trim()) {
        if (typeof maybeCode === 'string' && maybeCode.trim()) {
          return `${maybeMessage} (${maybeCode})`
        }
        return maybeMessage
      }
      const maybeError = (error as { error?: unknown }).error
      if (typeof maybeError === 'string' && maybeError.trim()) return maybeError
      const maybeDescription = (error as { description?: unknown }).description
      if (typeof maybeDescription === 'string' && maybeDescription.trim()) return maybeDescription
      const maybeHint = (error as { hint?: unknown }).hint
      if (typeof maybeHint === 'string' && maybeHint.trim()) return maybeHint
      const serialized = JSON.stringify(error)
      if (serialized && serialized !== '{}') return serialized
    }
    return 'authError'
  }

  const normalizeAuthError = (message: string) => {
    const lower = message.toLowerCase()
    if (lower.includes('email rate limit') || lower.includes('too many verification emails') || lower.includes('rate limit')) return 'emailRateLimitExceeded'
    if (lower.includes('duplicate email') || lower.includes('already exists')) return 'emailInUse'
    if (lower.includes('invalid login')) return 'invalidCredentials'
    if (!message || message === '{}' || message === 'authError') return 'authError'
    return message
  }

  const requestSignupOtp = async (email: string, displayName: string) => {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: true, data: { display_name: displayName } },
      })
      if (error) {
        const message = extractAuthMessage(error)
        console.error('requestSignupOtp error', error)
        return { error: normalizeAuthError(message) }
      }
      return { error: null }
    } catch (err) {
      console.error('requestSignupOtp unexpected', err)
      return { error: normalizeAuthError(extractAuthMessage(err)) }
    }
  }
  const signInWithGoogle = async () => {
    const settings = await getSupabaseAuthSettings()
    if (!settings?.external?.google) {
      return { error: 'googleProviderDisabled' }
    }

    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } })
    return { error: error ? 'authError' : null }
  }
  const requestEmailOtp = async (email: string) => {
    try {
      const { error } = await supabase.auth.signInWithOtp({ email })
      if (error) {
        console.error('requestEmailOtp error', error)
        return { error: error.message || 'authError' }
      }
      return { error: null }
    } catch (err) {
      console.error('requestEmailOtp unexpected', err)
      return { error: err instanceof Error ? err.message : 'authError' }
    }
  }
  const requestPasswordResetOtp = async (email: string) => {
    try {
      const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false } })
      if (error) {
        console.error('requestPasswordResetOtp error', error)
        return { error: normalizeAuthError(error.message || 'authError') }
      }
      return { error: null }
    } catch (err) {
      console.error('requestPasswordResetOtp unexpected', err)
      return { error: err instanceof Error ? normalizeAuthError(err.message) : 'authError' }
    }
  }
  const resetProfilePassword = async (email: string, newPassword: string) => {
    try {
      const password_hash = await hashPassword(newPassword)
      const { error } = await supabase.from('profiles').update({ password_hash }).eq('email', email)
      if (error) {
        console.error('resetProfilePassword error', error)
        return { error: 'authError' }
      }
      return { error: null }
    } catch (err) {
      console.error('resetProfilePassword unexpected', err)
      return { error: 'authError' }
    }
  }
  const verifyEmailOtp = async (email: string, code: string) => {
    try {
      const { data, error } = await supabase.auth.verifyOtp({ email, token: code, type: 'email' })
      if (error) {
        console.error('verifyEmailOtp error', error)
        return { error: error.message || 'authError', user: null }
      }
      if (data?.user) {
        setRegularUser(data.user)
        await fetchRegularProfile(data.user.id)
      }
      return { error: null, user: data?.user ?? null }
    } catch (err) {
      console.error('verifyEmailOtp unexpected', err)
      return { error: err instanceof Error ? err.message : 'authError', user: null }
    }
  }
  const setUserPassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    return { error: error ? error.message || 'authError' : null }
  }

  const fetchAdminPasscode = async () => {
    try {
      const storedPasscode = await fetchSetting('admin_passcode')
      return storedPasscode || DEFAULT_ADMIN_PASSCODE
    } catch (error) {
      console.error('Failed to fetch admin passcode:', error)
      return DEFAULT_ADMIN_PASSCODE
    }
  }

  const updateAdminPasscode = async (newPassword: string) => {
    if (!/^[0-9]{4}$/.test(newPassword)) {
      return { error: 'authError' }
    }
    try {
      await updateSetting('admin_passcode', newPassword)
      return { error: null }
    } catch (error: any) {
      console.error('updateAdminPasscode error', error)
      return { error: 'authError' }
    }
  }

  const completeOtpSignUp = async (user: any, displayName: string, password: string) => {
    if (!user) return { error: 'authError' }
    if (!password) return { error: 'authError' }
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password, data: { display_name: displayName } })
      if (updateError) {
        console.error('completeOtpSignUp updateUser error', updateError)
        return { error: updateError.message || 'authError' }
      }
      const { error: profileError } = await supabase.from('profiles').upsert({ id: user.id, display_name: displayName, email: user.email, is_admin: false })
      if (profileError) {
        console.error('completeOtpSignUp profile upsert error', profileError)
        return { error: profileError.message || 'authError' }
      }
      setRegularUser(user)
      setRegularProfile({ id: user.id, display_name: displayName, email: user.email } as Profile)
      return { error: null }
    } catch (err) {
      console.error('completeOtpSignUp unexpected', err)
      return { error: err instanceof Error ? err.message : 'authError' }
    }
  }
  const signInAdmin = async (passcode: string) => {
    const adminPasscode = await fetchAdminPasscode()
    if (passcode !== adminPasscode) {
      return { error: 'adminLoginError' }
    }

    writeAdminSession(new Date().toISOString())
    const profileId = await getOrCreateGuestProfileId()
    await ensureProfile(profileId, 'Admin', true)
    setAdminSessionActive(true)
    setAdminUser({ id: profileId, email: ADMIN_EMAIL })
    setAdminProfile({ id: profileId, display_name: 'Admin', avatar_url: null, is_admin: true, created_at: new Date().toISOString() })
    return { error: null }
  }
  const signOut = async () => {
    clearAdminSession()
    await supabase.auth.signOut().catch(() => undefined)
    setRegularUser(null)
    setRegularProfile(null)
    setAdminUser(null)
    setAdminProfile(null)
    setAdminSessionActive(false)
  }
  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/#/admin` })
    return { error: error ? 'authError' : null }
  }
  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    return { error: error ? 'authError' : null }
  }

  return <AuthContext.Provider value={{ user, profile, adminUser, adminProfile, isAdmin: adminSessionActive, loading, signInWithEmail, signUpWithEmail, registerProfile, loginProfile, signInWithGoogle, signInAdmin, signOut, resetPassword, updatePassword: updateAdminPasscode, requestEmailOtp, requestPasswordResetOtp, requestSignupOtp, resetProfilePassword, verifyEmailOtp, setUserPassword, completeOtpSignUp }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
