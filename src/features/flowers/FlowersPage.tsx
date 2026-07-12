import { useEffect, useState, useCallback, useRef, type WheelEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useLanguage } from '../../context/LanguageContext'
import { FlowerCard } from '../../components/FlowerCard'
import { EmptyState } from '../../components/EmptyState'
import { VineDivider, ChevronLeftIcon, ChevronRightIcon } from '../../components/icons'
import { fetchCategories, fetchFlowers } from '../../lib/data'
import { getCategoryName } from '../../lib/utils'
import type { Category, Flower } from '../../lib/types'

const PAGE_SIZE = 12

export function FlowersPage() {
  const { t, lang } = useLanguage()
  const [searchParams, setSearchParams] = useSearchParams()
  const [categories, setCategories] = useState<Category[]>([])
  const [flowers, setFlowers] = useState<Flower[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [sort, setSort] = useState<'newest' | 'liked'>('newest')
  const [showCategoryArrows, setShowCategoryArrows] = useState(false)
  const activeCategory = searchParams.get('category') || 'all'
  const [offset, setOffset] = useState(0)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const categoriesRef = useRef<HTMLDivElement>(null)

  const handleCategoriesWheel = (event: WheelEvent<HTMLDivElement>) => {
    if (!categoriesRef.current) return
    if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) {
      return
    }
    event.preventDefault()
    categoriesRef.current.scrollLeft += event.deltaY
  }

  const scrollCategories = (offsetX: number) => {
    if (!categoriesRef.current) return
    categoriesRef.current.scrollBy({ left: offsetX, behavior: 'smooth' })
  }

  const updateCategoryArrows = useCallback(() => {
    if (!categoriesRef.current) {
      setShowCategoryArrows(false)
      return
    }
    setShowCategoryArrows(categoriesRef.current.scrollWidth > categoriesRef.current.clientWidth + 1)
  }, [])

  useEffect(() => {
    fetchCategories().then(setCategories).catch(() => {})
  }, [])

  useEffect(() => {
    updateCategoryArrows()
    window.addEventListener('resize', updateCategoryArrows)
    return () => window.removeEventListener('resize', updateCategoryArrows)
  }, [categories, updateCategoryArrows])

  const loadFlowers = useCallback(async (reset = false) => {
    if (reset) { setLoading(true); setOffset(0); setHasMore(true) } else { setLoadingMore(true) }
    try {
      const newFlowers = await fetchFlowers({ categorySlug: activeCategory, sort, limit: PAGE_SIZE, offset: reset ? 0 : offset })
      if (reset) setFlowers(newFlowers); else setFlowers(prev => [...prev, ...newFlowers])
      setHasMore(newFlowers.length === PAGE_SIZE)
      setOffset(prev => prev + newFlowers.length)
    } catch (err) { console.error(err) } finally { setLoading(false); setLoadingMore(false) }
  }, [activeCategory, sort, offset])

  useEffect(() => { loadFlowers(true) }, [activeCategory, sort])

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting && hasMore && !loadingMore && !loading) loadFlowers(false) }, { rootMargin: '200px' })
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasMore, loadingMore, loading, loadFlowers])

  const setCategory = (slug: string) => { if (slug === 'all') searchParams.delete('category'); else searchParams.set('category', slug); setSearchParams(searchParams) }

  return (
    <div className="pt-20 sm:pt-24">
      <section className="section-pad pb-8 bg-ivory-200">
        <div className="container-narrow text-center">
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }} className="font-serif text-forest-700 mb-3" style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}>{t('catalogueTitle')}</motion.h1>
          <p className="text-forest-500 font-sans text-sm md:text-base">{t('catalogueSubtitle')}</p>
        </div>
      </section>

      <section className="sticky top-16 sm:top-20 z-30 bg-ivory-200/95 backdrop-blur-md border-y border-forest-100 py-4 overflow-x-hidden">
        <div className="container-narrow px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 w-full">
              {showCategoryArrows && (
                <button type="button" onClick={() => scrollCategories(-240)} className="hidden lg:inline-flex items-center justify-center w-10 h-10 rounded-full bg-ivory-50 border border-forest-200 text-forest-700 hover:bg-forest-100 transition-colors">
                  <ChevronLeftIcon size={20} />
                </button>
              )}
              <div ref={categoriesRef} onWheel={handleCategoriesWheel} className="flex flex-nowrap gap-2 overflow-x-auto pb-2 flex-1 min-w-0 scroll-smooth snap-x snap-mandatory scrollbar-hide">
                <button onClick={() => setCategory('all')} className={`snap-start px-4 py-2 rounded-full font-sans text-sm tracking-wide transition-all duration-300 shrink-0 ${activeCategory === 'all' ? 'bg-forest-600 text-ivory-200' : 'bg-ivory-50 text-forest-600 hover:bg-forest-100'}`}>{t('filterAll')}</button>
                {categories.map(cat => <button key={cat.id} onClick={() => setCategory(cat.slug)} className={`snap-start px-4 py-2 rounded-full font-sans text-sm tracking-wide transition-all duration-300 shrink-0 ${activeCategory === cat.slug ? 'bg-forest-600 text-ivory-200' : 'bg-ivory-50 text-forest-600 hover:bg-forest-100'}`}>{getCategoryName(cat, lang)}</button>)}
              </div>
              {showCategoryArrows && (
                <button type="button" onClick={() => scrollCategories(240)} className="hidden lg:inline-flex items-center justify-center w-10 h-10 rounded-full bg-ivory-50 border border-forest-200 text-forest-700 hover:bg-forest-100 transition-colors">
                  <ChevronRightIcon size={20} />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-forest-400 text-xs tracking-wide hidden sm:inline">{t('sortBy')}:</span>
              <select value={sort} onChange={(e) => setSort(e.target.value as 'newest' | 'liked')} className="px-3 py-2 rounded-full bg-ivory-50 border border-forest-200 text-forest-700 font-sans text-sm focus:outline-none focus:border-forest-500 flex-1 sm:flex-none"><option value="newest">{t('sortNewest')}</option><option value="liked">{t('sortMostLiked')}</option></select>
            </div>
          </div>
        </div>
      </section>

      <section className="section-pad bg-ivory-200">
        <div className="container-narrow">
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">{[...Array(8)].map((_, i) => (<div key={i} className="card"><div className="aspect-[4/5] skeleton" /><div className="p-4"><div className="h-5 w-3/4 skeleton rounded mb-2" /><div className="h-4 w-1/3 skeleton rounded" /></div></div>))}</div>
          ) : flowers.length === 0 ? (
            <EmptyState title={t('noFlowersTitle')} message={t('noFlowersText')} />
          ) : (
            <AnimatePresence mode="popLayout">
              <motion.div key={`${activeCategory}-${sort}`} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">{flowers.map((flower, i) => <FlowerCard key={flower.id} flower={flower} index={i} />)}</motion.div>
            </AnimatePresence>
          )}
          <div ref={sentinelRef} className="h-20 flex items-center justify-center mt-8">
            {loadingMore && <div className="flex gap-2">{[...Array(3)].map((_, i) => <motion.div key={i} animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }} className="w-2 h-2 rounded-full bg-forest-400" />)}</div>}
          </div>
          {!loading && flowers.length > 0 && <div className="mt-12 text-forest-300"><VineDivider className="w-full max-w-xs mx-auto" /></div>}
        </div>
      </section>
    </div>
  )
}
