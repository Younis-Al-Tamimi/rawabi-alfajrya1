import { useEffect, useRef, useState, ReactNode } from 'react'
import { motion } from 'framer-motion'

export function ScrollReveal({ children, delay = 0, className = '' }: { children: ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.unobserve(el) } }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return <motion.div ref={ref} initial={{ opacity: 0, y: 24 }} animate={visible ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }} className={className}>{children}</motion.div>
}
