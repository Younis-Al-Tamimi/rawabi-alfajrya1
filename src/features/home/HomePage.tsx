import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useLanguage } from '../../context/LanguageContext'
import { ScrollReveal } from '../../components/ScrollReveal'
import { FlowerCard } from '../../components/FlowerCard'
import { EmptyState } from '../../components/EmptyState'
import { PeonyIllustration, ArrowDownIcon, WhatsAppIcon, VineDivider } from '../../components/icons'
import { fetchCategories, fetchFlowers, fetchRecentPublicComments, fetchSetting } from '../../lib/data'
import { getCategoryName, timeAgo, getFlowerName, getPrimaryFlowerImage } from '../../lib/utils'
import { WHATSAPP_NUMBER } from '../../lib/supabase'
import type { Category, Flower, Comment } from '../../lib/types'

export function HomePage() {
  const { t, lang } = useLanguage()
  const [categories, setCategories] = useState<Category[]>([])
  const [featured, setFeatured] = useState<Flower[]>([])
  const [recentComments, setRecentComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [heroFlowers, setHeroFlowers] = useState<Flower[]>([])
  const [heroImage, setHeroImage] = useState<string>('')

  useEffect(() => {
    Promise.all([
      fetchCategories(),
      fetchFlowers({ sort: 'newest', limit: 8 }),
      fetchRecentPublicComments(4),
      fetchFlowers({ sort: 'liked', limit: 2 }),
      fetchSetting('hero_image').catch(() => null),
      fetchSetting('hidden_categories').catch(() => null)
    ])
      .then(([cats, feat, comments, hero, heroImageUrl, hiddenCategoriesSetting]) => {
        const hidden = hiddenCategoriesSetting ? JSON.parse(hiddenCategoriesSetting) : []
        const visibleCategories = cats.filter(cat => !hidden.includes(cat.id))
        setCategories(visibleCategories)
        setFeatured(feat)
        setRecentComments(comments)
        setHeroFlowers(hero)
        setHeroImage(heroImageUrl || '')
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div className="relative">

      <section className="relative h-screen min-h-[600px] flex items-center justify-center overflow-hidden">
        {heroImage ? (
          <div className="absolute inset-0">
            <img src={heroImage} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-forest-950/70 via-forest-900/50 to-forest-950/70" />
          </div>
        ) : <div className="absolute inset-0 bg-gradient-to-b from-forest-800 via-forest-700 to-forest-900" />}
        <div className="absolute inset-0 flex items-center justify-center opacity-10 text-ivory-200 pointer-events-none"><PeonyIllustration size={400} /></div>
        <div className="relative z-10 text-center px-4 max-w-4xl">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>
            <h1 className="font-serif text-ivory-200 mb-6" style={{ fontSize: 'clamp(2.5rem, 8vw, 5rem)', lineHeight: 1.1 }}>{t('heroTitle')}</h1>
            <p className="text-ivory-300/90 font-sans text-lg md:text-xl leading-relaxed max-w-2xl mx-auto mb-10 text-balance">{t('heroSubtitle')}</p>
            <Link to="/flowers" className="inline-flex items-center gap-2 px-8 py-4 bg-ivory-200 text-forest-700 font-sans text-sm tracking-wide rounded-full hover:bg-gold-400 hover:text-forest-800 transition-all duration-300 hover:shadow-forest-lg active:scale-[0.97]">{t('heroCta')}<ArrowDownIcon size={18} /></Link>
          </motion.div>
        </div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }} className="absolute bottom-8 left-1/2 -translate-x-1/2 text-ivory-300/60 text-xs tracking-[0.2em] uppercase">{t('scrollHint')}</motion.div>
      </section>

      <section id="vine-section-about" className="section-pad bg-ivory-200">
        <div className="container-narrow grid md:grid-cols-2 gap-12 items-center">
          <ScrollReveal><div className="text-forest-300 mb-6"><PeonyIllustration size={100} /></div></ScrollReveal>
          <ScrollReveal delay={0.1}>
            <h2 className="font-serif text-3xl md:text-4xl text-forest-700 mb-6" style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)' }}>{t('aboutTitle')}</h2>
            <p className="text-forest-600 font-sans text-base md:text-lg leading-relaxed">{t('aboutText')}</p>
          </ScrollReveal>
        </div>
      </section>

      {categories.length > 0 && (
        <section id="vine-section-categories" className="section-pad bg-parchment">
          <div className="container-narrow">
            <ScrollReveal><div className="text-center mb-12"><h2 className="font-serif text-3xl md:text-4xl text-forest-700 mb-3" style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)' }}>{t('categoriesTitle')}</h2><p className="text-forest-500 font-sans text-sm">{t('categoriesSubtitle')}</p></div></ScrollReveal>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {categories.map((cat, i) => (
                <ScrollReveal key={cat.id} delay={i * 0.08}>
                  <Link to={`/flowers?category=${cat.slug}`} className="card card-hover block group">
                    <div className="aspect-square overflow-hidden bg-forest-100 flex items-center justify-center">
                      {cat.image_url ? (
                        <img src={cat.image_url} alt={getCategoryName(cat, lang)} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="text-forest-300 group-hover:text-gold-400 transition-colors duration-500"><PeonyIllustration size={60} /></div>
                      )}
                    </div>
                    <div className="p-4 text-center"><h3 className="font-serif text-lg text-forest-700">{getCategoryName(cat, lang)}</h3></div>
                  </Link>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>
      )}

      <section id="vine-section-featured" className="section-pad bg-ivory-200">
        <div className="container-narrow">
          <ScrollReveal><div className="flex items-end justify-between mb-12 flex-wrap gap-4"><div><h2 className="font-serif text-3xl md:text-4xl text-forest-700 mb-2" style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)' }}>{t('featuredTitle')}</h2><p className="text-forest-500 font-sans text-sm">{t('featuredSubtitle')}</p></div><Link to="/flowers" className="btn-ghost">{t('browseAll')} →</Link></div></ScrollReveal>
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">{[...Array(4)].map((_, i) => (<div key={i} className="card"><div className="aspect-[4/5] skeleton" /><div className="p-4"><div className="h-5 w-3/4 skeleton rounded mb-2" /><div className="h-4 w-1/3 skeleton rounded" /></div></div>))}</div>
          ) : featured.length === 0 ? <EmptyState title={t('noFlowersTitle')} message={t('noFlowersText')} /> : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">{featured.map((flower, i) => <FlowerCard key={flower.id} flower={flower} index={i} />)}</div>
          )}
        </div>
      </section>

      {recentComments.length > 0 && (
        <section id="vine-section-social" className="section-pad bg-parchment">
          <div className="container-narrow">
            <ScrollReveal><div className="text-center mb-12"><h2 className="font-serif text-3xl md:text-4xl text-forest-700 mb-3" style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)' }}>{t('socialProofTitle')}</h2><p className="text-forest-500 font-sans text-sm">{t('socialProofSubtitle')}</p></div></ScrollReveal>
            <div className="grid md:grid-cols-2 gap-4 md:gap-6">
              {recentComments.map((comment, i) => (
                <ScrollReveal key={comment.id} delay={i * 0.1}>
                  <div className="card p-6">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-forest-100 text-forest-500 flex items-center justify-center font-serif text-sm shrink-0">{comment.profiles?.display_name?.charAt(0).toUpperCase() || '?'}</div>
                      <div className="flex-1 min-w-0"><p className="font-sans text-sm font-medium text-forest-700 truncate">{comment.profiles?.display_name || 'Anonymous'}</p><p className="text-xs text-forest-400">{timeAgo(comment.created_at, lang)}</p></div>
                      {comment.flower && <Link to={`/flower/${comment.flower.slug}`} className="text-xs text-gold-500 hover:text-gold-600 transition-colors shrink-0">{getFlowerName(comment.flower, lang)}</Link>}
                    </div>
                    <p className="text-forest-600 font-sans text-sm leading-relaxed line-clamp-3">"{comment.text}"</p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>
      )}

      <section id="vine-section-closing" className="section-pad bg-forest-700 relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center opacity-5 text-ivory-200 pointer-events-none"><PeonyIllustration size={300} /></div>
        <div className="relative container-narrow text-center">
          <ScrollReveal>
            <h2 className="font-serif text-3xl md:text-4xl text-ivory-200 mb-4" style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)' }}>{t('closingCtaTitle')}</h2>
            <p className="text-ivory-300/80 font-sans text-base md:text-lg max-w-2xl mx-auto mb-8 text-balance">{t('closingCtaText')}</p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link to="/flowers" className="btn-primary bg-ivory-200 text-forest-700 hover:bg-gold-400 hover:text-forest-800">{t('browseAll')}</Link>
              <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-6 py-3 border border-ivory-200/30 text-ivory-200 font-sans text-sm tracking-wide rounded-full hover:bg-forest-600 transition-all duration-300"><WhatsAppIcon size={18} />{t('orderWhatsApp')}</a>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </div>
  )
}
