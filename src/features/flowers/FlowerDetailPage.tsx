import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../../lib/supabase'
import { useLanguage } from '../../context/LanguageContext'
import { useAuth } from '../../context/AuthContext'
import { useUI } from '../../context/UIContext'
import { LikeButton } from '../../components/LikeButton'
import { FlowerCard } from '../../components/FlowerCard'
import { EmptyState } from '../../components/EmptyState'
import { ScrollReveal } from '../../components/ScrollReveal'
import { ChevronLeftIcon, ChevronRightIcon, CloseIcon, LinkIcon, WhatsAppIcon, CommentIcon, PeonyIllustration, VineDivider } from '../../components/icons'
import { fetchFlowerBySlug, fetchFlowerImages, fetchRelatedFlowers, fetchComments, createComment, toggleFlowerLike, hasUserLikedFlower, toggleCommentLike, hasUserLikedComment, incrementFlowerView } from '../../lib/data'
import { formatPrice, getFlowerName, getFlowerDescription, timeAgo, buildWhatsAppOrderLink, buildCopyMessage, copyToClipboard, shareFlower, getInitials } from '../../lib/utils'
import type { Flower, FlowerImage, Comment } from '../../lib/types'

const COMMENTS_PER_PAGE = 10

export function FlowerDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const { t, lang, dir } = useLanguage()
  const { user } = useAuth()
  const { showToast, openAuthModal } = useUI()

  const [flower, setFlower] = useState<Flower | null>(null)
  const [images, setImages] = useState<FlowerImage[]>([])
  const [related, setRelated] = useState<Flower[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [currentImage, setCurrentImage] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [commentText, setCommentText] = useState('')
  const [postingComment, setPostingComment] = useState(false)
  const [commentSort, setCommentSort] = useState<'newest' | 'liked'>('newest')
  const [commentOffset, setCommentOffset] = useState(0)
  const [hasMoreComments, setHasMoreComments] = useState(false)
  const [branchModalOpen, setBranchModalOpen] = useState(false)
  const [commentLiked, setCommentLiked] = useState<Record<string, boolean>>({})

  const dragStartX = useRef(0)

  useEffect(() => {
    if (!slug) return
    setLoading(true); setCurrentImage(0)
    fetchFlowerBySlug(slug).then(async (f) => {
      if (!f) { setLoading(false); return }
      setFlower(f); setLikeCount(f.like_count || 0)
      const [imgs, relatedFlowers] = await Promise.all([fetchFlowerImages(f.id), fetchRelatedFlowers(f)])
      setImages(imgs); setRelated(relatedFlowers); setLoading(false)
      const viewedKey = `f9-viewed-${f.id}`
      if (!sessionStorage.getItem(viewedKey)) { sessionStorage.setItem(viewedKey, '1'); incrementFlowerView(f.id) }
      if (user) { hasUserLikedFlower(f.id, user.id).then(setLiked) } else { setLiked(false) }
    }).catch(() => setLoading(false))
  }, [slug, user])

  const loadComments = useCallback(async (reset = false) => {
    if (!flower) return
    const newComments = await fetchComments(flower.id, { sort: commentSort, limit: COMMENTS_PER_PAGE, offset: reset ? 0 : commentOffset })
    if (reset) { setComments(newComments); setCommentOffset(COMMENTS_PER_PAGE) } else { setComments(prev => [...prev, ...newComments]); setCommentOffset(prev => prev + newComments.length) }
    setHasMoreComments(newComments.length === COMMENTS_PER_PAGE)
    if (user) { const likedMap: Record<string, boolean> = {}; for (const c of newComments) likedMap[c.id] = await hasUserLikedComment(c.id, user.id); setCommentLiked(prev => ({ ...prev, ...likedMap })) }
  }, [flower, commentSort, commentOffset, user])

  useEffect(() => { if (flower) loadComments(true) }, [flower?.id, commentSort])

  useEffect(() => {
    if (!flower) return
    const channel = supabase.channel(`flower-${flower.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'comments', filter: `flower_id=eq.${flower.id}` }, () => loadComments(true))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'flower_likes', filter: `flower_id=eq.${flower.id}` }, async () => { const f = await fetchFlowerBySlug(slug!); if (f) setLikeCount(f.like_count) })
      .subscribe()
    return () => { channel.unsubscribe() }
  }, [flower?.id, slug])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (lightboxOpen) { if (e.key === 'Escape') setLightboxOpen(false); if (e.key === 'ArrowLeft') prevImage(); if (e.key === 'ArrowRight') nextImage() } }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightboxOpen, currentImage, images.length])

  const nextImage = () => { if (images.length > 0) setCurrentImage(prev => (prev + 1) % images.length) }
  const prevImage = () => { if (images.length > 0) setCurrentImage(prev => (prev - 1 + images.length) % images.length) }

  const handleLike = async () => {
    if (!user || !flower) return
    const nextLiked = !liked
    try {
      await toggleFlowerLike(flower.id, user.id, nextLiked)
      setLiked(nextLiked)
      setLikeCount(prev => nextLiked ? prev + 1 : prev - 1)
      const refreshedFlower = await fetchFlowerBySlug(slug!)
      if (refreshedFlower) setLikeCount(refreshedFlower.like_count || 0)
    } catch { showToast(t('errorLoading'), 'error') }
  }

  const handleCommentLike = async (commentId: string) => {
    if (!user) return
    const isLiked = commentLiked[commentId] || false
    const nextLiked = !isLiked
    try {
      await toggleCommentLike(commentId, user.id, nextLiked)
      setCommentLiked(prev => ({ ...prev, [commentId]: nextLiked }))
      setComments(prev => prev.map(c => c.id === commentId ? { ...c, like_count: nextLiked ? c.like_count + 1 : c.like_count - 1 } : c))
    } catch { showToast(t('errorLoading'), 'error') }
  }

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !flower || !commentText.trim()) return
    setPostingComment(true)
    try {
      const newComment = await createComment(flower.id, user.id, commentText.trim())
      setComments(prev => [newComment, ...prev])
      setCommentText('')
      showToast(t('commentPosted'))
    } catch (error: any) {
      console.error('Comment create failed:', error)
      showToast(error?.message ? `${t('commentFailed')} ${error.message}` : t('commentFailed'), 'error')
    } finally { setPostingComment(false) }
  }

  const handleCopyLink = async () => { if (!flower) return; const message = buildCopyMessage(flower, lang, window.location.origin); const success = await copyToClipboard(message); if (success) showToast(t('linkCopied')); else showToast(t('errorLoading'), 'error') }

  const handleShare = async () => {
    if (!flower) return
    const origin = window.location.origin
    const result = await shareFlower(flower, lang, origin, images[0]?.image_url)
    if (result === 'shared') { showToast(t('shareSuccess')) }
    else if (result === 'fallback') { const message = buildCopyMessage(flower, lang, origin); const success = await copyToClipboard(message); showToast(success ? t('shareFallbackCopied') : t('shareFailed'), success ? undefined : 'error') }
    else { showToast(t('shareCancelled'), 'error') }
  }

  const handleOpenBranchModal = () => { setBranchModalOpen(true) }
  const handleOrder = (phoneNumber: string) => {
    if (!flower) return
    const origin = window.location.origin
    const link = buildWhatsAppOrderLink(flower, lang, origin, phoneNumber)
    window.open(link, '_blank')
    setBranchModalOpen(false)
  }

  const handleDragStart = (e: React.TouchEvent | React.MouseEvent) => { dragStartX.current = 'touches' in e ? e.touches[0].clientX : e.clientX }
  const handleDragEnd = (e: React.TouchEvent | React.MouseEvent) => {
    const endX = 'touches' in e ? (e as React.TouchEvent).changedTouches[0].clientX : (e as React.MouseEvent).clientX
    const diff = endX - dragStartX.current
    if (Math.abs(diff) > 50) { if (dir === 'rtl') { diff > 0 ? prevImage() : nextImage() } else { diff > 0 ? prevImage() : nextImage() } }
  }

  if (loading) return <div className="pt-20 sm:pt-24 min-h-[60vh] flex items-center justify-center"><div className="text-brand-300 animate-pulse"><PeonyIllustration size={80} /></div></div>
  if (!flower) return <div className="pt-20 sm:pt-24 min-h-[60vh] flex items-center justify-center"><EmptyState title={t('notFoundTitle')} message={t('notFoundText')} action={<Link to="/flowers" className="btn-primary">{t('backToCatalogue')}</Link>} /></div>

  const description = getFlowerDescription(flower, lang)

  return (
    <div className="pt-20 sm:pt-24 w-full overflow-x-hidden">
      <div className="container-narrow px-4 sm:px-6 lg:px-8 py-4 w-full">
        <nav className="flex items-center gap-2 text-sm text-espresso-400 font-sans flex-wrap">
          <Link to="/" className="hover:text-brand-600 transition-colors">{t('breadcrumbHome')}</Link><span>/</span>
          <Link to="/flowers" className="hover:text-brand-600 transition-colors">{t('breadcrumbProducts')}</Link><span>/</span>
          <span className="text-brand-700 truncate">{getFlowerName(flower, lang)}</span>
        </nav>
      </div>

      <div className="container-narrow px-4 sm:px-6 lg:px-8 pb-16 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8 lg:gap-12">
          <div className="space-y-4 min-w-0">
            <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-cream-400 shadow-brand border border-saffron-400/30 w-full" onTouchStart={handleDragStart} onTouchEnd={handleDragEnd} onMouseDown={handleDragStart} onMouseUp={handleDragEnd}>
              <AnimatePresence mode="wait">
                {images.length > 0 && <motion.img key={currentImage} src={images[currentImage]?.image_url} alt={getFlowerName(flower, lang)} initial={{ opacity: 0, scale: 1.02 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }} className="w-full h-full object-cover cursor-zoom-in" onClick={() => setLightboxOpen(true)} draggable={false} />}
              </AnimatePresence>
              {images.length === 0 && <div className="w-full h-full flex items-center justify-center text-brand-300"><PeonyIllustration size={100} /></div>}
              {images.length > 1 && (<>
                <button onClick={prevImage} className="absolute top-1/2 -translate-y-1/2 start-2 w-10 h-10 rounded-full bg-cream-100/80 backdrop-blur-sm text-brand-700 flex items-center justify-center hover:bg-cream-100 transition-colors" aria-label={t('prevImage')}><ChevronLeftIcon size={20} className={dir === 'rtl' ? 'rtl-flip' : ''} /></button>
                <button onClick={nextImage} className="absolute top-1/2 -translate-y-1/2 end-2 w-10 h-10 rounded-full bg-cream-100/80 backdrop-blur-sm text-brand-700 flex items-center justify-center hover:bg-cream-100 transition-colors" aria-label={t('nextImage')}><ChevronRightIcon size={20} className={dir === 'rtl' ? 'rtl-flip' : ''} /></button>
              </>)}
            </div>
            {images.length > 1 && (<>
              <div className="w-full flex gap-2 overflow-x-auto pb-2">{images.map((img, i) => <button key={img.id} onClick={() => setCurrentImage(i)} className={`relative shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all duration-300 ${currentImage === i ? 'border-saffron-400' : 'border-transparent opacity-60 hover:opacity-100'}`}><img src={img.image_url} alt="" className="w-full h-full object-cover" /></button>)}</div>
              <div className="flex justify-center gap-1.5 sm:hidden">{images.map((_, i) => <button key={i} onClick={() => setCurrentImage(i)} className={`w-2 h-2 rounded-full transition-all duration-300 ${currentImage === i ? 'bg-saffron-400 w-6' : 'bg-brand-200'}`} aria-label={`Image ${i + 1}`} />)}</div>
            </>)}
          </div>

          <div className="space-y-6 min-w-0">
            <div>
              <h1 className="text-brand-800 mb-3 break-words" style={{ fontSize: 'clamp(1.5rem, 4vw, 2.5rem)' }}>{getFlowerName(flower, lang)}</h1>
              <div className="flex items-center gap-4 flex-wrap">
                <p className="font-sans text-2xl font-bold text-brand-600">{formatPrice(flower.price)}</p>
                <div className="flex items-center gap-3"><LikeButton count={likeCount} liked={liked} onToggle={handleLike} size="md" variant="dark" /><span className="text-espresso-400 text-sm">·</span><span className="text-espresso-500 text-sm font-sans">{flower.view_count} {t('viewCount')}</span></div>
              </div>
            </div>
            {description && <p className="text-espresso-700 font-sans text-base leading-relaxed">{description}</p>}
            <div className="flex flex-col sm:flex-row gap-3 pt-2 w-full">
              <button onClick={handleOpenBranchModal} className="btn-amber flex-1"><WhatsAppIcon size={18} />{t('orderWhatsApp')}</button>
              <button onClick={handleCopyLink} className="btn-secondary flex-1 sm:flex-none"><LinkIcon size={18} />{t('copyLink')}</button>
            </div>
            <div className="text-brand-300 py-2"><VineDivider className="w-full max-w-xs" /></div>
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-sans text-xl font-bold text-brand-800">{t('comments')}</h2>
                <select value={commentSort} onChange={(e) => setCommentSort(e.target.value as 'newest' | 'liked')} className="px-3 py-1.5 rounded-full bg-cream-100 border border-brand-200 text-espresso-900 font-sans text-sm focus:outline-none focus:border-brand-500"><option value="newest">{t('sortNewestComments')}</option><option value="liked">{t('sortMostLikedComments')}</option></select>
              </div>
              {user ? (
                <form onSubmit={handlePostComment} className="mb-6">
                  <textarea value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder={t('commentPlaceholder')} rows={3} className="input-field resize-none" dir={dir} />
                  <div className="flex justify-end mt-2"><button type="submit" disabled={!commentText.trim() || postingComment} className="btn-primary">{postingComment ? t('posting') : t('postComment')}</button></div>
                </form>
              ) : (
                <div className="mb-6 p-4 bg-brand-50 rounded-xl text-center"><p className="text-brand-600 text-sm mb-3">{t('commentSignInPrompt')}</p><button onClick={() => openAuthModal(t('signInToComment'))} className="btn-secondary text-sm">{t('signIn')}</button></div>
              )}
              {comments.length === 0 ? (
                <div className="text-center py-8"><div className="text-brand-200 mb-3 flex justify-center"><CommentIcon size={40} /></div><p className="text-espresso-400 text-sm">{t('commentEmpty')}</p></div>
              ) : (
                <div className="space-y-4">
                  <AnimatePresence>
                    {comments.map((comment, i) => (
                      <motion.div key={comment.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: i * 0.05 }} className="bg-cream-100 rounded-xl p-4 border border-brand-100/50">
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center font-sans text-sm font-bold shrink-0">{comment.profiles?.avatar_url ? <img src={comment.profiles.avatar_url} alt="" className="w-full h-full rounded-full object-cover" /> : getInitials(comment.profiles?.display_name || '?')}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1"><p className="font-sans text-sm font-semibold text-espresso-900">{comment.profiles?.display_name || 'Anonymous'}</p><p className="text-xs text-espresso-400">{timeAgo(comment.created_at, lang)}</p></div>
                            <p className="text-espresso-700 font-sans text-sm leading-relaxed" dir="auto">{comment.text}</p>
                            <div className="mt-2"><LikeButton count={comment.like_count} liked={commentLiked[comment.id] || false} onToggle={() => handleCommentLike(comment.id)} size="sm" variant="dark" /></div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {hasMoreComments && <button onClick={() => loadComments(false)} className="w-full py-3 text-brand-500 text-sm hover:text-brand-700 transition-colors">{t('loadMore')}</button>}
                </div>
              )}
            </div>
          </div>
        </div>
        {branchModalOpen && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-brand-950/80 backdrop-blur-sm p-3 overflow-hidden pt-20">
            <div className="relative mx-auto w-[min(100vw-1.5rem,420px)] max-h-[90vh] overflow-hidden rounded-[2rem] bg-cream-100/95 border border-white/70 shadow-[0_35px_90px_rgba(15,23,42,0.22)]">
              <div className="absolute inset-x-0 top-0 h-36 bg-gradient-to-r from-saffron-200 via-cream-100 to-saffron-200 opacity-95" />
              <div className="relative p-4 pt-8 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.24em] text-brand-700 font-semibold mb-2">{t('orderWhatsApp')}</p>
                    <h2 className={`font-sans ${lang === 'ar' ? 'text-xl sm:text-2xl md:text-4xl' : 'text-lg sm:text-xl md:text-2xl'} text-brand-800 font-bold leading-tight`}>{t('selectWhatsAppBranch')}</h2>
                    <p className="mt-2 max-w-[22rem] text-espresso-500 text-sm leading-6 tracking-tight">{t('selectWhatsAppBranchSubtitle')}</p>
                  </div>
                  <button onClick={() => setBranchModalOpen(false)} className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-brand-200 bg-white/90 text-brand-500 shadow-sm transition hover:bg-white hover:text-brand-700 flex-shrink-0">
                    <CloseIcon size={20} />
                  </button>
                </div>
                <div className="relative mt-8 overflow-hidden rounded-[1.75rem] border border-brand-100 bg-white shadow-sm">
                  <div className="grid gap-3 px-4 py-3.5">
                    <button onClick={() => handleOrder('+96876062999')} className="group w-full flex items-center gap-3 rounded-3xl border border-brand-100 bg-cream-100 px-4 py-4 text-left shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-saffron-200 hover:bg-saffron-50/70">
                      <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-saffron-100 to-saffron-200 text-brand-700 shadow-inner">
                        <WhatsAppIcon size={24} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-espresso-900 text-base">{t('branchNizwa')}</div>
                        <div className="mt-1 text-sm text-espresso-500">+968 7606 2999</div>
                      </div>
                      <span className="flex-shrink-0 rounded-full bg-saffron-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-brand-700">Nizwa</span>
                    </button>
                    <button onClick={() => handleOrder('+96877222686')} className="group w-full flex items-center gap-3 rounded-3xl border border-brand-100 bg-cream-100 px-4 py-4 text-left shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-saffron-200 hover:bg-saffron-50/70">
                      <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-saffron-100 to-saffron-200 text-brand-700 shadow-inner">
                        <WhatsAppIcon size={24} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-espresso-900 text-base whitespace-nowrap">{t('branchManah')}</div>
                        <div className="mt-1 text-sm text-espresso-500">+968 7722 2686</div>
                      </div>
                      <span className="flex-shrink-0 rounded-full bg-saffron-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-brand-700">Manah</span>
                    </button>
                    <div className="group relative w-full flex flex-col gap-4 rounded-[2rem] border-2 border-brand-300 bg-gradient-to-br from-brand-50 via-cream-100 to-saffron-50 px-4 py-5 text-left shadow-[0_18px_45px_rgba(15,23,42,0.08)] transition duration-300 hover:-translate-y-1 hover:border-saffron-400 hover:shadow-[0_28px_70px_rgba(15,23,42,0.15)]">
                      <div className="flex items-start gap-3.5">
                        <div className="relative flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-white to-cream-100 text-brand-600 shadow-md">
                          <span className="absolute inset-0 rounded-full bg-saffron-200/30 blur-lg" />
                          <LinkIcon size={20} className="relative" />
                        </div>
                        <div className="flex-1 min-w-0 pt-0.5">
                          <div className="font-semibold text-espresso-900 text-base leading-snug">{t('shareBranch')}</div>
                          <div className="mt-1 text-xs sm:text-sm text-espresso-600 leading-relaxed">{t('shareBranchSubtitle')}</div>
                        </div>
                      </div>
                      <button onClick={handleShare} className="inline-flex items-center justify-center rounded-full bg-brand-800 px-8 py-2.5 text-xs font-bold uppercase tracking-[0.18em] text-cream-100 shadow-md transition group-hover:bg-brand-700 group-hover:shadow-lg mx-auto">
                        {t('share')}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {related.length > 0 && (
        <section className="section-pad bg-cream-300">
          <div className="container-narrow">
            <ScrollReveal><h2 className="font-sans text-2xl md:text-3xl font-bold text-brand-800 mb-8 text-center">{t('relatedProducts')}</h2></ScrollReveal>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">{related.map((f, i) => <FlowerCard key={f.id} flower={f} index={i} />)}</div>
          </div>
        </section>
      )}

      <AnimatePresence>
        {lightboxOpen && images.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-brand-950/95 z-[100] flex items-center justify-center p-4" onClick={() => setLightboxOpen(false)}>
            <button onClick={() => setLightboxOpen(false)} className="absolute top-4 end-4 text-cream-100 p-2 hover:text-saffron-400 transition-colors" aria-label={t('closeLightbox')}><CloseIcon size={28} /></button>
            <motion.img key={currentImage} src={images[currentImage]?.image_url} alt={getFlowerName(flower, lang)} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }} className="max-w-full max-h-full object-contain" onClick={(e) => e.stopPropagation()} />
            {images.length > 1 && (<>
              <button onClick={(e) => { e.stopPropagation(); prevImage() }} className="absolute top-1/2 -translate-y-1/2 start-4 text-cream-100 p-2 hover:text-saffron-400 transition-colors" aria-label={t('prevImage')}><ChevronLeftIcon size={32} className={dir === 'rtl' ? 'rtl-flip' : ''} /></button>
              <button onClick={(e) => { e.stopPropagation(); nextImage() }} className="absolute top-1/2 -translate-y-1/2 end-4 text-cream-100 p-2 hover:text-saffron-400 transition-colors" aria-label={t('nextImage')}><ChevronRightIcon size={32} className={dir === 'rtl' ? 'rtl-flip' : ''} /></button>
            </>)}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
