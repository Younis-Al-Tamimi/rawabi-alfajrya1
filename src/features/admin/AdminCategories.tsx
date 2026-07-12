import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLanguage } from '../../context/LanguageContext'
import { useUI } from '../../context/UIContext'
import { fetchCategories, createCategory, updateCategory, deleteCategory } from '../../lib/data'
import { getCategoryName, slugify } from '../../lib/utils'
import { PlusIcon, EditIcon, TrashIcon, CloseIcon, UploadIcon } from '../../components/icons'
import { EmptyState } from '../../components/EmptyState'
import { supabase } from '../../lib/supabase'
import type { Category } from '../../lib/types'

export function AdminCategories() {
  const { t, lang } = useLanguage()
  const { showToast } = useUI()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Category | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [nameEn, setNameEn] = useState('')
  const [nameAr, setNameAr] = useState('')
  const [sortOrder, setSortOrder] = useState(0)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [uploading, setUploading] = useState(false)

  useEffect(() => { loadCategories() }, [])

  const loadCategories = async () => { try { const cats = await fetchCategories(); setCategories(cats) } catch { showToast(t('errorLoading'), 'error') } finally { setLoading(false) } }
  
  const openAdd = () => { setEditing(null); setNameEn(''); setNameAr(''); setSortOrder(categories.length); setImageFile(null); setImagePreview(''); setShowForm(true) }
  const openEdit = (cat: Category) => { setEditing(cat); setNameEn(cat.name_en); setNameAr(cat.name_ar); setSortOrder(cat.sort_order); setImageFile(null); setImagePreview(cat.image_url || ''); setShowForm(true) }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    setImageFile(file)
    const reader = new FileReader()
    reader.onload = (event) => setImagePreview(event.target?.result as string)
    reader.readAsDataURL(file)
  }

  const uploadCategoryImage = async (file: File, categoryId: string): Promise<string | null> => {
    try {
      const fileName = `category-${categoryId}-${Date.now()}.jpg`
      const { data, error } = await supabase.storage.from('flower-images').upload(fileName, file, { cacheControl: '3600', upsert: true })
      if (error) throw error
      const { data: publicUrlData } = supabase.storage.from('flower-images').getPublicUrl(fileName)
      return publicUrlData?.publicUrl || null
    } catch (error: any) { throw new Error(error?.message || 'Failed to upload image') }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nameEn || !nameAr) return
    try {
      setUploading(true)
      let imageUrl: string | undefined = imagePreview && !imageFile ? imagePreview : undefined
      if (editing) {
        if (imageFile) { const uploadedUrl = await uploadCategoryImage(imageFile, editing.id); imageUrl = uploadedUrl || undefined }
        await updateCategory(editing.id, { name_en: nameEn, name_ar: nameAr, sort_order: sortOrder, ...(imageUrl && { image_url: imageUrl }) })
      } else {
        const newCat = await createCategory({ name_en: nameEn, name_ar: nameAr, slug: slugify(nameEn), sort_order: sortOrder })
        if (imageFile) { const uploadedUrl = await uploadCategoryImage(imageFile, newCat.id); imageUrl = uploadedUrl || undefined; await updateCategory(newCat.id, { image_url: imageUrl }) }
      }
      showToast(t('categorySaved')); setShowForm(false); loadCategories()
    } catch (error: any) { showToast(error?.message || t('errorLoading'), 'error') } finally { setUploading(false) }
  }

  const handleDelete = async (cat: Category) => { if (!confirm(t('confirmDeleteCategory'))) return; try { await deleteCategory(cat.id); showToast(t('categoryDeleted')); loadCategories() } catch { showToast(t('errorLoading'), 'error') } }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between"><h1 className="font-sans text-3xl font-bold text-brand-800">{t('manageCategories')}</h1><button onClick={openAdd} className="btn-primary"><PlusIcon size={18} />{t('addCategory')}</button></div>
      {loading ? <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="card p-4 h-16 skeleton" />)}</div>
      : categories.length === 0 ? <EmptyState title={t('noCategories')} message="" />
      : (
        <div className="space-y-3">
          {categories.map((cat, i) => (
            <motion.div key={cat.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="card p-4 flex items-center gap-4">
              {cat.image_url && <img src={cat.image_url} alt={cat.name_en} className="w-16 h-16 rounded-lg object-cover" />}
              <div className="flex-1"><p className="font-sans font-medium text-brand-800">{getCategoryName(cat, lang)}</p><p className="text-sm text-espresso-400">{cat.name_en} / {cat.name_ar} · {cat.slug}</p></div>
              <span className="text-xs text-espresso-400">#{cat.sort_order}</span>
              <button onClick={() => openEdit(cat)} className="p-2 text-espresso-500 hover:bg-brand-50 rounded-lg transition-colors"><EditIcon size={18} /></button>
              <button onClick={() => handleDelete(cat)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"><TrashIcon size={18} /></button>
            </motion.div>
          ))}
        </div>
      )}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-brand-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} onClick={(e) => e.stopPropagation()} className="bg-cream-100 rounded-2xl shadow-brand-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4"><h2 className="font-sans text-xl font-semibold text-brand-800">{editing ? t('edit') : t('addCategory')}</h2><button onClick={() => setShowForm(false)} className="text-espresso-400 hover:text-brand-600"><CloseIcon size={20} /></button></div>
              <form onSubmit={handleSave} className="space-y-4">
                <div><label className="block text-xs tracking-wide text-espresso-500 mb-1.5">{t('categoryNameEn')}</label><input type="text" value={nameEn} onChange={(e) => setNameEn(e.target.value)} className="input-field" dir="ltr" required /></div>
                <div><label className="block text-xs tracking-wide text-espresso-500 mb-1.5">{t('categoryNameAr')}</label><input type="text" value={nameAr} onChange={(e) => setNameAr(e.target.value)} className="input-field" dir="rtl" required /></div>
                <div><label className="block text-xs tracking-wide text-espresso-500 mb-1.5">{t('categoryOrder')}</label><input type="number" value={sortOrder} onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)} className="input-field" /></div>
                <div>
                  <label className="block text-xs tracking-wide text-espresso-500 mb-1.5">Category Image</label>
                  {imagePreview && (
                    <div className="mb-3 relative">
                      <img src={imagePreview} alt="Preview" className="w-full h-32 object-cover rounded-lg" />
                      <button type="button" onClick={() => { setImageFile(null); setImagePreview('') }} className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"><CloseIcon size={16} /></button>
                    </div>
                  )}
                  <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-brand-200 rounded-lg cursor-pointer hover:border-brand-400 transition-colors">
                    <UploadIcon size={18} className="text-brand-400" />
                    <span className="text-sm text-espresso-600">Choose image</span>
                    <input type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
                  </label>
                </div>
                <button type="submit" disabled={uploading} className="btn-primary w-full">{uploading ? 'Uploading...' : t('saveCategory')}</button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
