import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import { useUI } from '../../context/UIContext'
import { fetchSetting, updateSetting, fetchCategories } from '../../lib/data'
import { supabase } from '../../lib/supabase'
import { CloseIcon, UploadIcon } from '../../components/icons'
import { motion, AnimatePresence } from 'framer-motion'
import type { Category } from '../../lib/types'

export function AdminSettings() {
  const { t } = useLanguage()
  const { updatePassword } = useAuth()
  const { showToast } = useUI()
  const [newPasscode, setNewPasscode] = useState(['', '', '', ''])
  const [confirmPasscode, setConfirmPasscode] = useState(['', '', '', ''])
  const [loading, setLoading] = useState(false)
  const newPasscodeRefs = useRef<(HTMLInputElement | null)[]>([])
  const confirmPasscodeRefs = useRef<(HTMLInputElement | null)[]>([])
  
  // Hero image states
  const [heroImageUrl, setHeroImageUrl] = useState<string>('')
  const [heroImageFile, setHeroImageFile] = useState<File | null>(null)
  const [heroImagePreview, setHeroImagePreview] = useState<string>('')
  const [heroUploading, setHeroUploading] = useState(false)
  const [heroLoading, setHeroLoading] = useState(true)

  // Category visibility states
  const [categories, setCategories] = useState<Category[]>([])
  const [hiddenCategories, setHiddenCategories] = useState<string[]>([])
  const [categoryLoading, setCategoryLoading] = useState(true)
  const [categorySaving, setCategorySaving] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    loadHeroImage()
    loadCategorySettings()
  }, [])

  const loadHeroImage = async () => {
    try {
      const url = await fetchSetting('hero_image')
      setHeroImageUrl(url || '')
      setHeroImagePreview(url || '')
    } catch (error) {
      console.error('Failed to load hero image:', error)
    } finally {
      setHeroLoading(false)
    }
  }

  const loadCategorySettings = async () => {
    try {
      const [cats, hiddenSetting] = await Promise.all([
        fetchCategories(),
        fetchSetting('hidden_categories')
      ])
      setCategories(cats)
      setHiddenCategories(hiddenSetting ? JSON.parse(hiddenSetting) : [])
    } catch (error) {
      console.error('Failed to load category settings:', error)
    } finally {
      setCategoryLoading(false)
    }
  }

  const handleToggleCategory = (categoryId: string) => {
    setHiddenCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    )
  }

  const handleSaveCategories = async () => {
    try {
      setCategorySaving(true)
      await updateSetting('hidden_categories', JSON.stringify(hiddenCategories))
      showToast('Category visibility updated')
    } catch (error: any) {
      showToast(error?.message || 'Failed to update category settings', 'error')
    } finally {
      setCategorySaving(false)
    }
  }

  const handleHeroImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    setHeroImageFile(file)
    const reader = new FileReader()
    reader.onload = (event) => {
      setHeroImagePreview(event.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const uploadHeroImage = async (file: File): Promise<string | null> => {
    try {
      const fileName = `hero-image-${Date.now()}.jpg`
      const { data, error } = await supabase.storage
        .from('flower-images')
        .upload(fileName, file, { cacheControl: '3600', upsert: true })
      
      if (error) throw error
      
      const { data: publicUrlData } = supabase.storage
        .from('flower-images')
        .getPublicUrl(fileName)
      
      return publicUrlData?.publicUrl || null
    } catch (error: any) {
      console.error('Image upload failed:', error)
      throw new Error(error?.message || 'Failed to upload image')
    }
  }

  const handleSaveHeroImage = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setHeroUploading(true)
      let imageUrl = heroImagePreview && !heroImageFile ? heroImagePreview : ''

      if (heroImageFile) {
        const uploadedUrl = await uploadHeroImage(heroImageFile)
        imageUrl = uploadedUrl || ''
      }

      await updateSetting('hero_image', imageUrl || null)
      setHeroImageUrl(imageUrl)
      setHeroImageFile(null)
      showToast('Hero image updated successfully')
    } catch (error: any) {
      showToast(error?.message || 'Failed to update hero image', 'error')
    } finally {
      setHeroUploading(false)
    }
  }

  const handleRemoveHeroImage = async () => {
    try {
      setHeroUploading(true)
      await updateSetting('hero_image', null)
      setHeroImageUrl('')
      setHeroImagePreview('')
      setHeroImageFile(null)
      showToast('Hero image removed')
    } catch (error: any) {
      showToast(error?.message || 'Failed to remove hero image', 'error')
    } finally {
      setHeroUploading(false)
    }
  }

  const handlePasscodeChange = (
    index: number,
    value: string,
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    refs: React.MutableRefObject<(HTMLInputElement | null)[]>
  ) => {
    if (!/^[0-9]?$/.test(value)) return
    setter((prev) => {
      const next = [...prev]
      next[index] = value
      return next
    })

    if (value && index < 3) {
      refs.current[index + 1]?.focus()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const newCode = newPasscode.join('')
    const confirmCode = confirmPasscode.join('')
    if (newCode !== confirmCode || newCode.length < 4) {
      showToast(t('passcodeMismatch'), 'error')
      return
    }
    setLoading(true)
    const { error } = await updatePassword(newCode)
    setLoading(false)
    if (error) showToast(t('errorLoading'), 'error')
    else {
      showToast(t('passcodeChanged'))
      setNewPasscode(['', '', '', ''])
      setConfirmPasscode(['', '', '', ''])
    }
  }

  return (
    <div className="space-y-6">
      <div><h1 className="font-serif text-3xl text-forest-700 mb-1">{t('settingsTitle')}</h1><p className="text-forest-400 text-sm">{t('settingsSubtitle')}</p></div>
      
      {/* Hero Image Settings */}
      <div className="card p-6">
        <h2 className="font-serif text-xl text-forest-700 mb-4">{t('homePageHeroImage')}</h2>
        {heroLoading ? (
          <div className="h-40 skeleton rounded-lg" />
        ) : (
          <form onSubmit={handleSaveHeroImage} className="space-y-4">
            {heroImagePreview && (
              <div className="relative">
                <img src={heroImagePreview} alt="Hero Preview" className="w-full h-40 object-cover rounded-lg" />
                <button type="button" onClick={() => { setHeroImagePreview(''); setHeroImageFile(null); }} className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"><CloseIcon size={16} /></button>
              </div>
            )}
            <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-forest-200 rounded-lg cursor-pointer hover:border-forest-400 transition-colors">
              <UploadIcon size={18} className="text-forest-400" />
              <span className="text-sm text-forest-600">{t('chooseHeroImage')}</span>
              <input type="file" accept="image/*" onChange={handleHeroImageSelect} className="hidden" />
            </label>
            <div className="flex gap-2">
              <button type="submit" disabled={heroUploading || !heroImagePreview} className="btn-primary flex-1">{heroUploading ? t('uploading') : t('saveHeroImage')}</button>
              {heroImageUrl && (
                <button type="button" onClick={handleRemoveHeroImage} disabled={heroUploading} className="btn-secondary">{heroUploading ? '…' : t('remove')}</button>
              )}
            </div>
          </form>
        )}
      </div>

      {/* Category Visibility Settings */}
      <div className="card p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h2 className="font-serif text-xl text-forest-700 mb-1">{t('homePageCategories')}</h2>
            <p className="text-forest-500 font-sans text-sm">{t('homePageCategoriesDescription')}</p>
          </div>
          <button onClick={() => setModalOpen(true)} className="btn-primary whitespace-nowrap">{t('manageCategories')}</button>
        </div>
      </div>

      {/* Category Management Modal */}
      <AnimatePresence>
        {modalOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-forest-950/50 z-40" onClick={() => setModalOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ duration: 0.3 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"><div className="bg-ivory-50 rounded-2xl shadow-forest-lg border border-forest-100 w-full max-w-md max-h-[85vh] flex flex-col">
          <div className="sticky top-0 bg-ivory-50 border-b border-forest-100 p-4 sm:p-6 flex items-start justify-between flex-shrink-0">
                <div>
                    <h3 className="font-serif text-2xl text-forest-700">{t('categoriesModalTitle')}</h3>
                    <p className="text-forest-500 font-sans text-sm mt-1">{t('categoriesModalSubtitle')}</p>
                </div>
                <button onClick={() => setModalOpen(false)} className="text-forest-400 hover:text-forest-600 transition-colors flex-shrink-0 ml-4"><CloseIcon size={24} /></button>
              </div>

              <div className="flex-1 overflow-y-auto">
                {categoryLoading ? (
                  <div className="p-4 sm:p-6 space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-12 skeleton rounded-lg" />)}</div>
                ) : categories.length === 0 ? (
                  <div className="p-4 sm:p-6 text-center text-forest-400"><p className="font-sans text-sm">{t('noCategoriesFound')}</p></div>
                ) : (
                  <div className="p-4 sm:p-6 space-y-3">
                    {categories.map(cat => {
                      const isHidden = hiddenCategories.includes(cat.id)
                      return (
                        <button
                          key={cat.id}
                          onClick={() => handleToggleCategory(cat.id)}
                          className={`w-full flex items-center justify-between gap-3 p-3 sm:p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                            isHidden
                              ? 'border-forest-200 bg-ivory-100 hover:bg-ivory-50'
                              : 'border-gold-400 bg-gold-50 hover:bg-gold-100'
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                            <h4 className={`font-serif font-medium truncate ${isHidden ? 'text-forest-400' : 'text-forest-700'}`}>
                              {cat.name_en || cat.name_ar || 'Untitled'}
                            </h4>
                            <p className={`text-xs font-sans mt-1 ${isHidden ? 'text-forest-300' : 'text-gold-600'}`}>
                              {isHidden ? t('hiddenFromHomePage') : t('visibleOnHomePage')}
                            </p>
                          </div>
                          <div className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ml-3 ${
                            isHidden
                              ? 'border-forest-300 bg-white'
                              : 'border-gold-400 bg-gold-400'
                          }`}>
                            {!isHidden && (
                              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              <div className="sticky bottom-0 bg-ivory-50 border-t border-forest-100 p-4 sm:p-6 flex gap-3 flex-shrink-0">
                <button onClick={() => setModalOpen(false)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={async () => { await handleSaveCategories(); setModalOpen(false) }} disabled={categorySaving} className="btn-primary flex-1">{categorySaving ? 'Saving...' : 'Save Changes'}</button>
              </div>
            </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Passcode Settings */}
      <div className="card p-6">
        <h2 className="font-serif text-xl text-forest-700 mb-4">{t('adminPasscode')}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs tracking-wide text-forest-500 mb-1.5">{t('newPasscode')}</label>
            <div className="flex gap-2">
              {newPasscode.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { newPasscodeRefs.current[i] = el }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handlePasscodeChange(i, e.target.value, setNewPasscode, newPasscodeRefs)}
                  className="w-14 h-14 text-center text-lg rounded-xl bg-ivory-50 border border-forest-200 text-forest-800 focus:outline-none focus:border-gold-400 transition-colors"
                  aria-label={`${t('newPasscode')} ${i + 1}`}
                  required
                />
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs tracking-wide text-forest-500 mb-1.5">{t('confirmPasscode')}</label>
            <div className="flex gap-2">
              {confirmPasscode.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { confirmPasscodeRefs.current[i] = el }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handlePasscodeChange(i, e.target.value, setConfirmPasscode, confirmPasscodeRefs)}
                  className="w-14 h-14 text-center text-lg rounded-xl bg-ivory-50 border border-forest-200 text-forest-800 focus:outline-none focus:border-gold-400 transition-colors"
                  aria-label={`${t('confirmPasscode')} ${i + 1}`}
                  required
                />
              ))}
            </div>
          </div>
          <div className="p-3 bg-gold-50 rounded-xl text-sm text-gold-700">{t('passcodeWeak')}</div>
          <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? '…' : t('changePasscode')}</button>
        </form>
      </div>
    </div>
  )
}
