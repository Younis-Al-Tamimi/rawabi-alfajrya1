import { useEffect, useRef, useState } from 'react'
import { motion, useScroll, useSpring } from 'framer-motion'
import { useLanguage } from '../context/LanguageContext'

interface VineSection { id: string }

export function GrowingVine({ sections }: { sections: VineSection[] }) {
  const { dir } = useLanguage()
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ['start start', 'end end'] })
  const pathLength = useSpring(scrollYProgress, { stiffness: 100, damping: 30 })
  const [bloomed, setBloomed] = useState<Set<string>>(new Set())
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mq.matches)
    const handler = () => setReducedMotion(mq.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  useEffect(() => {
    const observers: IntersectionObserver[] = []
    sections.forEach(section => {
      const el = document.getElementById(`vine-section-${section.id}`)
      if (!el) return
      const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) setBloomed(prev => new Set(prev).add(section.id)) }, { threshold: 0.3 })
      observer.observe(el)
      observers.push(observer)
    })
    return () => observers.forEach(o => o.disconnect())
  }, [sections])

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768
  const sideClass = isMobile ? 'left-4' : dir === 'rtl' ? 'right-4' : 'left-1/2 -translate-x-1/2'

  return (
    <div ref={containerRef} className={`fixed top-0 bottom-0 ${sideClass} w-px pointer-events-none z-10 hidden sm:block`} aria-hidden="true">
      <svg className="absolute top-0 left-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 2 1000">
        <motion.path d="M1 0 L1 1000" stroke="rgba(63, 75, 60, 0.2)" strokeWidth="1" fill="none" style={reducedMotion ? undefined : { pathLength }} />
      </svg>
      {sections.map((section, i) => {
        const top = ((i + 1) / (sections.length + 1)) * 100
        const isBloomed = bloomed.has(section.id)
        return (
          <motion.div key={section.id} className="absolute -translate-x-1/2 -translate-y-1/2 text-forest-500" style={{ top: `${top}%`, left: '50%' }} initial={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.5 }} animate={isBloomed ? (reducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }) : (reducedMotion ? { opacity: 0.5 } : { opacity: 0.3, scale: 0.7 })} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
              {isBloomed ? (<><circle cx="12" cy="9" r="2.5" /><path d="M12 6.5C10 4 7 4 5.5 6C4 8 5 11 7.5 11.5" /><path d="M12 6.5C14 4 17 4 18.5 6C20 8 19 11 16.5 11.5" /><path d="M12 4C11 2 9 1.5 7.5 2.5" /><path d="M12 4C13 2 15 1.5 16.5 2.5" /><path d="M12 12v10" /><path d="M12 16c-2-1-3 0-4 2" /><path d="M12 18c2-1 3 0 4 2" /></>) : (<><path d="M12 3C10 4 9 6 9.5 8C10 9 11 9.5 12 9.5C13 9.5 14 9 14.5 8C15 6 14 4 12 3Z" /><path d="M12 9.5v12" /><path d="M12 14c-1.5-0.5-2.5 0.5-3 2" /><path d="M12 17c1.5-0.5 2.5 0.5 3 2" /></>)}
            </svg>
          </motion.div>
        )
      })}
    </div>
  )
}
