import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useLanguage } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'
import { formatPrice, getFlowerName, getPrimaryFlowerImage } from '../lib/utils'
import { toggleFlowerLike, hasUserLikedFlower } from '../lib/data'
import { LikeButton } from './LikeButton'
import { ProductIcon, HeartIcon } from './icons'
import type { Flower } from '../lib/types'

export function FlowerCard({ flower, index = 0 }: { flower: Flower; index?: number }) {
  const { lang } = useLanguage()
  const { user } = useAuth()
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(flower.like_count || 0)
  const primaryImage = getPrimaryFlowerImage(flower.images)
  const imageUrl = primaryImage?.image_url

  useEffect(() => {
    if (user) {
      hasUserLikedFlower(flower.id, user.id).then(setLiked)
    } else {
      setLiked(false)
    }
  }, [user, flower.id])

  const handleLike = async () => {
    await toggleFlowerLike(flower.id, user!.id, !liked)
    setLiked(!liked)
    setLikeCount(prev => !liked ? prev + 1 : prev - 1)
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-50px' }} transition={{ duration: 0.5, delay: (index % 4) * 0.08, ease: [0.16, 1, 0.3, 1] }}>
      <Link to={`/flower/${flower.slug}`} className="card card-hover block group">
        <div className="relative aspect-[4/5] overflow-hidden bg-brand-100">
          {imageUrl ? <img src={imageUrl} alt={getFlowerName(flower, lang)} loading="lazy" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" /> : <div className="w-full h-full flex items-center justify-center text-brand-300"><ProductIcon size={40} /></div>}
          <div className="absolute top-3 end-3 bg-brand-950/40 backdrop-blur-sm rounded-full px-2.5 py-1.5"><LikeButton count={likeCount} liked={liked} onToggle={handleLike} size="sm" variant="light" /></div>
          <div className="absolute inset-2 border border-cream-200/20 rounded-lg pointer-events-none" />
        </div>
        <div className="p-4">
          <h3 className="font-serif text-lg text-espresso-900 leading-tight mb-1 line-clamp-1">{getFlowerName(flower, lang)}</h3>
          <p className="font-sans text-sm text-saffron-500 font-medium tracking-wide">{formatPrice(flower.price)}</p>
        </div>
      </Link>
    </motion.div>
  )
}
