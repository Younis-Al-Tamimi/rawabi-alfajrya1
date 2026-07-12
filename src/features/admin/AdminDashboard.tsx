import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useLanguage } from '../../context/LanguageContext'
import { fetchDashboardStats, fetchFlowers, fetchAllComments } from '../../lib/data'
import { getFlowerName, timeAgo, getPrimaryFlowerImage } from '../../lib/utils'
import { ScrollReveal } from '../../components/ScrollReveal'
import { FlowerIcon, CommentIcon, HeartIcon, EyeIcon, CategoryIcon, UserIcon } from '../../components/icons'
import type { Flower, Comment } from '../../lib/types'

export function AdminDashboard() {
  const { t, lang } = useLanguage()
  const [stats, setStats] = useState({ categories: 0, flowers: 0, comments: 0, likes: 0, views: 0, users: 0 })
  const [recentFlowers, setRecentFlowers] = useState<Flower[]>([])
  const [recentComments, setRecentComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([fetchDashboardStats(), fetchFlowers({ limit: 5, includeHidden: true }), fetchAllComments({ limit: 5 })])
      .then(([s, flowers, comments]) => { setStats(s); setRecentFlowers(flowers); setRecentComments(comments); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const statCards = [
    { key: 'categories', label: t('statCategories'), icon: CategoryIcon, value: stats.categories },
    { key: 'flowers', label: t('statFlowers'), icon: FlowerIcon, value: stats.flowers },
    { key: 'comments', label: t('statComments'), icon: CommentIcon, value: stats.comments },
    { key: 'likes', label: t('statLikes'), icon: HeartIcon, value: stats.likes },
    { key: 'views', label: t('statViews'), icon: EyeIcon, value: stats.views },
    { key: 'users', label: t('statUsers'), icon: UserIcon, value: stats.users },
  ]

  return (
    <div className="space-y-8">
      <div><h1 className="font-serif text-3xl text-forest-700 mb-1">{t('dashboard')}</h1><p className="text-forest-400 text-sm">{t('adminLoginSubtitle')}</p></div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((stat, i) => { const Icon = stat.icon; return (
          <ScrollReveal key={stat.key} delay={i * 0.05}>
            <div className="card p-5">
              <div className="flex items-center justify-between mb-3"><div className="w-10 h-10 rounded-full bg-forest-100 text-forest-600 flex items-center justify-center"><Icon size={18} /></div></div>
              <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.05, duration: 0.5 }} className="font-serif text-3xl text-forest-700 tabular-nums">{loading ? '—' : <CountUp value={stat.value} />}</motion.p>
              <p className="text-forest-400 text-xs tracking-wide mt-1">{stat.label}</p>
            </div>
          </ScrollReveal>
        )})}
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4"><h2 className="font-serif text-lg text-forest-700">{t('recentFlowers')}</h2><Link to="/admin/flowers" className="text-gold-500 text-sm hover:text-gold-600 transition-colors">{t('viewAll')} →</Link></div>
          <div className="space-y-3">
            {recentFlowers.map(flower => (
              <Link key={flower.id} to={`/admin/flowers/${flower.id}`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-forest-50 transition-colors">
                <div className="w-12 h-12 rounded-lg bg-forest-100 overflow-hidden shrink-0">{getPrimaryFlowerImage(flower.images)?.image_url ? <img src={getPrimaryFlowerImage(flower.images)?.image_url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-forest-300"><FlowerIcon size={20} /></div>}</div>
                <div className="flex-1 min-w-0"><p className="font-sans text-sm text-forest-700 truncate">{getFlowerName(flower, lang)}</p><p className="text-xs text-forest-400">{timeAgo(flower.created_at, lang)}</p></div>
                <div className="flex items-center gap-3 text-xs text-forest-400"><span className="flex items-center gap-1"><EyeIcon size={14} /> {flower.view_count}</span><span className="flex items-center gap-1"><HeartIcon size={14} /> {flower.like_count}</span></div>
              </Link>
            ))}
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4"><h2 className="font-serif text-lg text-forest-700">{t('recentComments')}</h2><Link to="/admin/comments" className="text-gold-500 text-sm hover:text-gold-600 transition-colors">{t('viewAll')} →</Link></div>
          <div className="space-y-3">
            {recentComments.map(comment => (
              <Link key={comment.id} to={comment.flower ? `/admin/flowers/${comment.flower.id}` : '/admin/comments'} className="block p-3 rounded-lg hover:bg-forest-50 transition-colors">
                <div className="flex items-center gap-2 mb-1"><p className="font-sans text-sm font-medium text-forest-700">{comment.profiles?.display_name || 'Anonymous'}</p><p className="text-xs text-forest-400">{timeAgo(comment.created_at, lang)}</p>{comment.is_hidden && <span className="text-xs bg-forest-100 text-forest-500 px-2 py-0.5 rounded-full">{t('hidden')}</span>}</div>
                <p className="text-forest-600 text-sm line-clamp-2">{comment.text}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function CountUp({ value }: { value: number }) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    const duration = 800; const start = Date.now()
    const animate = () => { const elapsed = Date.now() - start; const progress = Math.min(elapsed / duration, 1); const eased = 1 - Math.pow(1 - progress, 3); setDisplay(Math.floor(value * eased)); if (progress < 1) requestAnimationFrame(animate); else setDisplay(value) }
    requestAnimationFrame(animate)
  }, [value])
  return <>{display}</>
}
