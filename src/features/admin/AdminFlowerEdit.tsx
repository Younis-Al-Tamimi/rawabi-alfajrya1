import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useLanguage } from '../../context/LanguageContext'
import { useUI } from '../../context/UIContext'
import { fetchCategories, fetchFlowerById, fetchFlowerImages, createFlower, updateFlower, deleteFlowerImage, uploadFlowerImage, addFlowerImage, updateFlowerImageOrder } from '../../lib/data'
import { slugify } from '../../lib/utils'
import { UploadIcon, TrashIcon } from '../../components/icons'
import type { Category, FlowerImage, Flower } from '../../lib/types'

export function AdminFlowerEdit() {
  const { id } = useParams<{ id: string }>()
  const { t } = useLanguage()
  const { showToast } = useUI()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [nameEn, setNameEn] = useState('')
  const [nameAr, setNameAr] = useState('')
  const [descEn, setDescEn] = useState('')
  const [descAr, setDescAr] = useState('')
  const [price, setPrice] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [hidden, setHidden] = useState(false)
  const [images, setImages] = useState<FlowerImage[]>([])
  const [flowerId, setFlowerId] = useState<string | null>(null)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [touchDragIndex, setTouchDragIndex] = useState<number | null>(null)
  const [touchDragOverIndex, setTouchDragOverIndex] = useState<number | null>(null)

  const isEdit = !!id

  useEffect(() => {
    fetchCategories().then(setCategories).catch(() => {})
    if (isEdit && id) {
      (async () => {
        const flower = await fetchFlowerById(id)
        if (flower) {
          setFlowerId(flower.id); setNameEn(flower.name_en); setNameAr(flower.name_ar)
          setDescEn(flower.description_en || ''); setDescAr(flower.description_ar || '')
          setPrice(flower.price.toString()); setCategoryId(flower.category_id || ''); setHidden(flower.hidden)
          const imgs = await fetchFlowerImages(flower.id); setImages(imgs)
        }
        setLoading(false)
      })()
    } else { setLoading(false) }
  }, [id, isEdit])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nameEn || !nameAr || !price) { showToast('Please fill in all required fields', 'error'); return }
    setSaving(true)
    try {
      const flowerData = { 
        name_en: nameEn, 
        name_ar: nameAr, 
        description_en: descEn || null, 
        description_ar: descAr || null, 
        price: parseFloat(price), 
        category_id: categoryId && categoryId.trim() ? categoryId : null, 
        hidden 
      }

      if (flowerId) {
        console.log('Saving existing flower:', flowerId, flowerData)
        await updateFlower(flowerId, flowerData)
      } else {
        const slug = slugify(nameEn) + '-' + Date.now().toString().slice(-4)
        const newFlowerData = { ...flowerData, slug }
        console.log('Creating new flower:', newFlowerData)
        const created = await createFlower(newFlowerData as Partial<Flower>)
        setFlowerId(created.id)
      }

      showToast(t('flowerSaved'))
      navigate('/admin/flowers')
    } catch (error: any) {
      console.error('Save error:', error)
      const errorMsg = error?.message || 'Unknown error'
      showToast(errorMsg, 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleFileUploadFiles = async (files: File[]) => {
    if (!files.length) return

    setUploading(true)
    try {
      let currentFlowerId = flowerId

      // If no flower exists yet, create one with current or placeholder values
      if (!currentFlowerId) {
        const slug = slugify(nameEn || 'flower') + '-' + Date.now().toString().slice(-4)
        const flowerData = {
          slug,
          name_en: nameEn || 'Untitled Flower',
          name_ar: nameAr || 'زهرة بدون عنوان',
          description_en: descEn || null,
          description_ar: descAr || null,
          price: price ? parseFloat(price) : 0,
          category_id: categoryId && categoryId.trim() ? categoryId : null,
          hidden,
        }
        const created = await createFlower(flowerData as Partial<Flower>)
        setFlowerId(created.id)
        currentFlowerId = created.id
        showToast('Flower created, uploading images...')
      }

      for (const file of files) {
        const compressed = await compressImage(file, 1200, 0.82)
        const url = await uploadFlowerImage(compressed, currentFlowerId)
        const newImage = await addFlowerImage(currentFlowerId, url, images.length)
        setImages(prev => [...prev, newImage])
      }
      showToast('Images uploaded')
    } catch (error: any) {
      showToast(error?.message || t('uploadFailed'), 'error')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    await handleFileUploadFiles(files)
  }

  const handleDeleteImage = async (imageId: string) => { try { await deleteFlowerImage(imageId); setImages(prev => prev.filter(img => img.id !== imageId)) } catch { showToast(t('errorLoading'), 'error') } }

  const reorderImages = async (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return
    const newImages = [...images]
    const [moved] = newImages.splice(fromIndex, 1)
    newImages.splice(toIndex, 0, moved)
    setImages(newImages)
    setDraggedIndex(null)
    setTouchDragIndex(null)
    setTouchDragOverIndex(null)

    for (let i = 0; i < newImages.length; i++) {
      if (newImages[i].sort_order !== i) await updateFlowerImageOrder(newImages[i].id, i)
    }
  }

  const handleDragStart = (index: number) => setDraggedIndex(index)
  const handleDragOver = (e: React.DragEvent) => e.preventDefault()
  const handleDrop = async (index: number) => {
    if (draggedIndex === null || draggedIndex === index) return
    await reorderImages(draggedIndex, index)
  }

  const handleTouchStart = (index: number) => {
    setTouchDragIndex(index)
    setTouchDragOverIndex(index)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchDragIndex === null) return
    const touch = e.touches[0]
    const target = document.elementFromPoint(touch.clientX, touch.clientY) as HTMLElement | null
    const item = target?.closest('[data-image-index]') as HTMLElement | null
    if (!item) return
    const overIndex = Number(item.dataset.imageIndex)
    if (!Number.isNaN(overIndex) && overIndex !== touchDragOverIndex) {
      setTouchDragOverIndex(overIndex)
    }
  }

  const handleTouchEnd = async () => {
    if (touchDragIndex === null || touchDragOverIndex === null) {
      setTouchDragIndex(null)
      setTouchDragOverIndex(null)
      return
    }
    if (touchDragIndex !== touchDragOverIndex) {
      await reorderImages(touchDragIndex, touchDragOverIndex)
    } else {
      setTouchDragIndex(null)
      setTouchDragOverIndex(null)
    }
  }

  const handleDropZoneDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDropZoneDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const files = Array.from(e.dataTransfer?.files || []).filter(f => f.type.startsWith('image/'))
    if (files.length) {
      await handleFileUploadFiles(files)
    }
  }

  if (loading) return <div className="flex items-center justify-center py-20 text-forest-300">Loading…</div>

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between"><h1 className="font-serif text-3xl text-forest-700">{isEdit ? t('editFlower') : t('addFlower')}</h1><Link to="/admin/flowers" className="btn-ghost">← {t('manageFlowers')}</Link></div>
      <form onSubmit={handleSave} className="space-y-6">
        <div className="card p-6">
          <h2 className="font-serif text-lg text-forest-700 mb-4">English</h2>
          <div className="space-y-4">
            <div><label className="block text-xs tracking-wide text-forest-500 mb-1.5">{t('flowerNameEn')} *</label><input type="text" value={nameEn} onChange={(e) => setNameEn(e.target.value)} className="input-field" dir="ltr" required /></div>
            <div><label className="block text-xs tracking-wide text-forest-500 mb-1.5">{t('flowerDescEn')}</label><textarea value={descEn} onChange={(e) => setDescEn(e.target.value)} rows={3} className="input-field resize-none" dir="ltr" /></div>
          </div>
        </div>
        <div className="card p-6">
          <h2 className="font-serif text-lg text-forest-700 mb-4">العربية</h2>
          <div className="space-y-4">
            <div><label className="block text-xs tracking-wide text-forest-500 mb-1.5">{t('flowerNameAr')} *</label><input type="text" value={nameAr} onChange={(e) => setNameAr(e.target.value)} className="input-field" dir="rtl" required /></div>
            <div><label className="block text-xs tracking-wide text-forest-500 mb-1.5">{t('flowerDescAr')}</label><textarea value={descAr} onChange={(e) => setDescAr(e.target.value)} rows={3} className="input-field resize-none" dir="rtl" /></div>
          </div>
        </div>
        <div className="card p-6">
          <div className="grid sm:grid-cols-2 gap-4">
            <div><label className="block text-xs tracking-wide text-forest-500 mb-1.5">{t('flowerCategory')}</label><select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="input-field"><option value="">{t('noCategory')}</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name_en} / {c.name_ar}</option>)}</select></div>
            <div><label className="block text-xs tracking-wide text-forest-500 mb-1.5">{t('flowerPrice')} *</label><input type="number" step="0.001" min="0" value={price} onChange={(e) => setPrice(e.target.value)} className="input-field" placeholder="8.500" required /></div>
          </div>
          <div className="mt-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <button type="button" onClick={() => setHidden(!hidden)} className={`relative w-12 h-6 rounded-full transition-colors ${hidden ? 'bg-forest-300' : 'bg-forest-600'}`}><span className={`absolute top-0.5 w-5 h-5 rounded-full bg-ivory-50 transition-transform ${hidden ? 'start-0.5' : 'start-6'}`} /></button>
              <span className="text-sm text-forest-600">{hidden ? t('flowerHidden') : t('flowerVisible')}</span>
            </label>
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4"><h2 className="font-serif text-lg text-forest-700">{t('flowerImages')}</h2><p className="text-xs text-forest-400">{t('flowerImagesHint')}</p></div>
          {images.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              {images.map((img, i) => (
                <motion.div
                  key={img.id}
                  data-image-index={i}
                  draggable
                  onDragStart={() => handleDragStart(i)}
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(i)}
                  onTouchStart={() => handleTouchStart(i)}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  onTouchCancel={handleTouchEnd}
                  layout
                  whileTap={{ scale: 1.02 }}
                  whileHover={{ scale: 1.01 }}
                  transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                  className={`relative group aspect-square rounded-lg overflow-hidden bg-forest-100 cursor-grab touch-none ${draggedIndex === i || touchDragIndex === i ? 'ring-2 ring-gold-400 shadow-2xl z-20 opacity-90' : ''} ${touchDragOverIndex === i && touchDragIndex !== null && touchDragIndex !== i ? 'ring-2 ring-forest-500/60' : ''}`}
                >
                  <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                  {i === 0 && <span className="absolute top-1 start-1 text-xs bg-gold-400 text-forest-800 px-2 py-0.5 rounded-full">{t('primaryImage')}</span>}
                  <button type="button" onClick={() => handleDeleteImage(img.id)} className="absolute top-1 end-1 w-7 h-7 rounded-full bg-forest-950/60 text-ivory-200 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><TrashIcon size={14} /></button>
                </motion.div>
              ))}
            </div>
          )}
          <button type="button" onClick={() => fileInputRef.current?.click()} onDragOver={handleDropZoneDragOver} onDrop={handleDropZoneDrop} disabled={uploading} className="w-full border-2 border-dashed border-forest-200 rounded-xl p-8 text-center hover:border-forest-400 transition-colors disabled:opacity-50 cursor-pointer">
            <UploadIcon size={24} className="mx-auto text-forest-400 mb-2" />
            <p className="text-forest-500 text-sm">{uploading ? t('uploading') : t('uploadImages')}</p>
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileUpload} className="hidden" />
        </div>
        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? '…' : t('saveFlower')}</button>
          <Link to="/admin/flowers" className="btn-secondary">{t('cancel')}</Link>
        </div>
      </form>
    </div>
  )
}

async function compressImage(file: File, maxSize: number, quality: number): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        let { width, height } = img
        if (width > height) { if (width > maxSize) { height = (height * maxSize) / width; width = maxSize } } else { if (height > maxSize) { width = (width * maxSize) / height; height = maxSize } }
        const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) { resolve(file); return }
        ctx.drawImage(img, 0, 0, width, height)
        canvas.toBlob((blob) => { if (blob) { resolve(new File([blob], file.name, { type: 'image/jpeg' })) } else { resolve(file) } }, 'image/jpeg', quality)
      }
      img.onerror = reject; img.src = e.target?.result as string
    }
    reader.onerror = reject; reader.readAsDataURL(file)
  })
}
