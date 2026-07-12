import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useLanguage } from '../../context/LanguageContext'
import { useUI } from '../../context/UIContext'
import { fetchAllComments, toggleCommentHidden, deleteComment, fetchFlowers } from '../../lib/data'
import { timeAgo, getFlowerName } from '../../lib/utils'
import { SearchIcon, EyeIcon, EyeOffIcon, TrashIcon } from '../../components/icons'
import { EmptyState } from '../../components/EmptyState'
import type { Comment, Flower } from '../../lib/types'

export function AdminComments() {
  const { t, lang } = useLanguage()
  const { showToast } = useUI()
  const [searchParams, setSearchParams] = useSearchParams()
  const [comments, setComments] = useState<Comment[]>([])
  const [flowers, setFlowers] = useState<Flower[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const flowerFilter = searchParams.get('flower') || 'all'

  useEffect(() => {
    Promise.all([fetchAllComments({ limit: 200 }), fetchFlowers({ includeHidden: true, limit: 200 })])
      .then(([c, f]) => { setComments(c); setFlowers(f); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const handleToggleHidden = async (comment: Comment) => {
    try {
      await toggleCommentHidden(comment.id, !comment.is_hidden)
      setComments(prev => prev.map(c => c.id === comment.id ? { ...c, is_hidden: !c.is_hidden } : c))
      showToast(comment.is_hidden ? t('commentUnhidden') : t('commentHidden'))
    } catch { showToast(t('errorLoading'), 'error') }
  }

  const handleDeleteComment = async (comment: Comment) => {
    try { await deleteComment(comment.id); setComments(prev => prev.filter(c => c.id !== comment.id)); showToast('Comment deleted') } catch { showToast(t('errorLoading'), 'error') }
  }

  const filtered = comments.filter(c => { const matchesSearch = !search || c.text.toLowerCase().includes(search.toLowerCase()); const matchesFlower = flowerFilter === 'all' || c.flower_id === flowerFilter; return matchesSearch && matchesFlower })
  const setFlowerFilter = (value: string) => { if (value === 'all') searchParams.delete('flower'); else searchParams.set('flower', value); setSearchParams(searchParams) }

  return (
    <div className="space-y-6">
      <div><h1 className="font-sans text-3xl font-bold text-brand-800 mb-1">{t('commentsModeration')}</h1><p className="text-espresso-400 text-sm">{t('commentsModerationSubtitle')}</p></div>
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]"><SearchIcon size={18} className="absolute top-1/2 -translate-y-1/2 start-3 text-espresso-400" /><input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('searchComments')} className="input-field ps-10" /></div>
        <select value={flowerFilter} onChange={(e) => setFlowerFilter(e.target.value)} className="input-field w-auto"><option value="all">{t('allProducts')}</option>{flowers.map(f => <option key={f.id} value={f.id}>{getFlowerName(f, lang)}</option>)}</select>
      </div>
      {loading ? <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="card p-4 h-24 skeleton" />)}</div>
      : filtered.length === 0 ? <EmptyState title={t('noComments')} message="" />
      : (
        <div className="space-y-3">
          {filtered.map((comment, i) => (
            <motion.div key={comment.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className={`card p-4 ${comment.is_hidden ? 'opacity-60' : ''}`}>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-500 flex items-center justify-center font-serif text-sm shrink-0">{comment.profiles?.display_name?.charAt(0).toUpperCase() || '?'}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap"><p className="font-sans text-sm font-medium text-brand-800">{comment.profiles?.display_name || 'Anonymous'}</p><p className="text-xs text-espresso-400">{timeAgo(comment.created_at, lang)}</p>{comment.is_hidden && <span className="text-xs bg-brand-100 text-brand-500 px-2 py-0.5 rounded-full">{t('hidden')}</span>}</div>
                  <p className="text-espresso-600 text-sm mb-2">{comment.text}</p>
                  <div className="flex items-center gap-3 text-xs text-espresso-400">{comment.flower && <Link to={`/admin/flowers/${comment.flower.id}`} className="hover:text-saffron-500 transition-colors">{getFlowerName(comment.flower, lang)}</Link>}<span>·</span><span>{comment.like_count} {t('likes')}</span></div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => handleToggleHidden(comment)} className={`p-2 rounded-lg transition-colors ${comment.is_hidden ? 'text-espresso-500 hover:bg-brand-50' : 'text-saffron-600 hover:bg-saffron-50'}`} title={comment.is_hidden ? t('unhide') : t('hide')}>{comment.is_hidden ? <EyeIcon size={18} /> : <EyeOffIcon size={18} />}</button>
                  <button onClick={() => handleDeleteComment(comment)} className="p-2 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors" title="Delete comment"><TrashIcon size={18} /></button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
