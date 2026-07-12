import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useLanguage } from '../../context/LanguageContext'
import { useUI } from '../../context/UIContext'
import { fetchFlowers, deleteFlower, fetchCategories } from '../../lib/data'
import { getFlowerName, getCategoryName, formatPrice, getPrimaryFlowerImage } from '../../lib/utils'
import { SearchIcon, EditIcon, EyeIcon, TrashIcon, PlusIcon, FlowerIcon, HeartIcon } from '../../components/icons'
import { EmptyState } from '../../components/EmptyState'
import type { Flower, Category } from '../../lib/types'

export function AdminFlowers() {
  const { t, lang } = useLanguage()
  const { showToast } = useUI()
  const [flowers, setFlowers] = useState<Flower[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')

  useEffect(() => {
    Promise.all([fetchFlowers({ includeHidden: true, limit: 200 }), fetchCategories()])
      .then(([f, c]) => { setFlowers(f); setCategories(c); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const handleDelete = async (flower: Flower) => {
    if (!confirm(t('confirmDeleteFlower'))) return
    try { await deleteFlower(flower.id); setFlowers(prev => prev.filter(f => f.id !== flower.id)); showToast(t('flowerDeleted')) } catch { showToast(t('errorLoading'), 'error') }
  }

  const filtered = flowers.filter(f => {
    const matchesSearch = !search || f.name_en.toLowerCase().includes(search.toLowerCase()) || f.name_ar.includes(search)
    const matchesCategory = categoryFilter === 'all' || (f.category?.slug === categoryFilter) || (categoryFilter === 'none' && !f.category_id)
    return matchesSearch && matchesCategory
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4"><h1 className="font-serif text-3xl text-forest-700">{t('manageFlowers')}</h1><Link to="/admin/flowers/new" className="btn-primary"><PlusIcon size={18} />{t('addFlower')}</Link></div>
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]"><SearchIcon size={18} className="absolute top-1/2 -translate-y-1/2 start-3 text-forest-400" /><input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('searchFlowers')} className="input-field ps-10" /></div>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="input-field w-auto"><option value="all">{t('filterAll')}</option><option value="none">{t('noCategory')}</option>{categories.map(c => <option key={c.id} value={c.slug}>{getCategoryName(c, lang)}</option>)}</select>
      </div>
      {loading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="card p-4"><div className="flex gap-4"><div className="w-16 h-16 skeleton rounded-lg" /><div className="flex-1 space-y-2"><div className="h-5 w-1/3 skeleton rounded" /><div className="h-4 w-1/4 skeleton rounded" /></div></div></div>)}</div>
      ) : filtered.length === 0 ? (
        <EmptyState title={t('noResultsTitle')} message={t('noResultsText')} />
      ) : (
        <div className="space-y-3">
          {filtered.map((flower, i) => (
            <motion.div key={flower.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03, duration: 0.3 }} className="card p-4">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="w-16 h-16 rounded-lg bg-forest-100 overflow-hidden shrink-0">{getPrimaryFlowerImage(flower.images)?.image_url ? <img src={getPrimaryFlowerImage(flower.images)?.image_url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-forest-300"><FlowerIcon size={20} /></div>}</div>
                <div className="flex-1 min-w-[150px]"><p className="font-serif text-forest-700">{getFlowerName(flower, lang)}</p><p className="text-sm text-forest-400">{flower.category ? getCategoryName(flower.category, lang) : t('noCategory')} · {formatPrice(flower.price)}</p></div>
                <div className="flex items-center gap-4 text-sm text-forest-500"><span className="flex items-center gap-1" title={t('statViews')}><EyeIcon size={16} /> {flower.view_count}</span><span className="flex items-center gap-1" title={t('statLikes')}><HeartIcon size={16} /> {flower.like_count}</span></div>
                <span className={`text-xs px-2 py-1 rounded-full ${flower.hidden ? 'bg-forest-100 text-forest-500' : 'bg-gold-100 text-gold-600'}`}>{flower.hidden ? t('flowerHidden') : t('flowerVisible')}</span>
                <div className="flex items-center gap-2">
                  <Link to={`/flower/${flower.slug}`} target="_blank" className="p-2 text-forest-500 hover:bg-forest-50 rounded-lg transition-colors" title={t('preview')}><EyeIcon size={18} /></Link>
                  <Link to={`/admin/flowers/${flower.id}`} className="p-2 text-forest-500 hover:bg-forest-50 rounded-lg transition-colors" title={t('edit')}><EditIcon size={18} /></Link>
                  <button onClick={() => handleDelete(flower)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title={t('delete')}><TrashIcon size={18} /></button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
