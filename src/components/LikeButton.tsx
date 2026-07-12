import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { useUI } from '../context/UIContext'
import { useLanguage } from '../context/LanguageContext'
import { HeartIcon } from './icons'

interface LikeButtonProps {
  count: number
  liked: boolean
  onToggle: () => Promise<void>
  size?: 'sm' | 'md' | 'lg'
  variant?: 'light' | 'dark'
  showCount?: boolean
}

export function LikeButton({ count, liked, onToggle, size = 'md', variant = 'light', showCount = true }: LikeButtonProps) {
  const { user } = useAuth()
  const { openAuthModal } = useUI()
  const { t } = useLanguage()
  const [animating, setAnimating] = useState(false)
  const [optimisticLiked, setOptimisticLiked] = useState(liked)
  const [optimisticCount, setOptimisticCount] = useState(count)

  useEffect(() => {
    setOptimisticLiked(liked)
    setOptimisticCount(count)
  }, [liked, count])

  const sizes = { sm: { icon: 16, text: 'text-xs' }, md: { icon: 20, text: 'text-sm' }, lg: { icon: 24, text: 'text-base' } }
  const s = sizes[size]

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation()
    if (!user) { openAuthModal(t('signInToLike')); return }
    const newLiked = !optimisticLiked
    setOptimisticLiked(newLiked)
    setOptimisticCount(prev => newLiked ? prev + 1 : prev - 1)
    setAnimating(true)
    setTimeout(() => setAnimating(false), 400)
    try { await onToggle() } catch { setOptimisticLiked(!newLiked); setOptimisticCount(prev => newLiked ? prev - 1 : prev + 1) }
  }

  const colorClass = variant === 'light' ? (optimisticLiked ? 'text-gold-400' : 'text-ivory-200') : (optimisticLiked ? 'text-gold-500' : 'text-forest-500')

  return (
    <button onClick={handleClick} className={`flex items-center gap-1.5 ${colorClass} transition-colors group`} aria-label={t('like')} aria-pressed={optimisticLiked}>
      <motion.span animate={animating ? { scale: [1, 1.3, 1] } : {}} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }} className="inline-flex"><HeartIcon size={s.icon} filled={optimisticLiked} /></motion.span>
      {showCount && <span className={`font-sans ${s.text} tabular-nums`}>{optimisticCount}</span>}
    </button>
  )
}
