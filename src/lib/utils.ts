import { WHATSAPP_NUMBER } from './supabase'
import type { Flower, FlowerImage } from './types'
import type { Language } from './translations'

export function formatPrice(price: number): string { return `${price.toFixed(3)} OMR` }
export function getFlowerName(flower: Flower, lang: Language): string { return lang === 'ar' ? flower.name_ar : flower.name_en }
export function getFlowerDescription(flower: Flower, lang: Language): string | null { return lang === 'ar' ? flower.description_ar : flower.description_en }
export function getCategoryName(cat: { name_en: string; name_ar: string }, lang: Language): string { return lang === 'ar' ? cat.name_ar : cat.name_en }
export function getPrimaryFlowerImage(images?: FlowerImage[] | null): FlowerImage | undefined {
  if (!images?.length) return undefined
  return [...images].sort((a, b) => {
    const sortDiff = (a.sort_order ?? 0) - (b.sort_order ?? 0)
    if (sortDiff !== 0) return sortDiff
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  })[0]
}
export function slugify(text: string): string { return text.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '') }

export function timeAgo(dateString: string, lang: Language): string {
  const date = new Date(dateString)
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  const weeks = Math.floor(days / 7)
  const months = Math.floor(days / 30)
  const years = Math.floor(days / 365)
  if (lang === 'ar') {
    if (seconds < 60) return 'الآن'
    if (minutes < 2) return 'منذ دقيقة'
    if (minutes < 60) return `منذ ${minutes} دقيقة`
    if (hours < 2) return 'منذ ساعة'
    if (hours < 24) return `منذ ${hours} ساعة`
    if (days < 2) return 'منذ يوم'
    if (days < 7) return `منذ ${days} يوم`
    if (weeks < 2) return 'منذ أسبوع'
    if (weeks < 4) return `منذ ${weeks} أسبوع`
    if (months < 2) return 'منذ شهر'
    if (months < 12) return `منذ ${months} شهر`
    if (years < 2) return 'منذ سنة'
    return `منذ ${years} سنة`
  }
  if (seconds < 60) return 'just now'
  if (minutes < 2) return 'a minute ago'
  if (minutes < 60) return `${minutes} minutes ago`
  if (hours < 2) return 'an hour ago'
  if (hours < 24) return `${hours} hours ago`
  if (days < 2) return 'a day ago'
  if (days < 7) return `${days} days ago`
  if (weeks < 2) return 'a week ago'
  if (weeks < 4) return `${weeks} weeks ago`
  if (months < 2) return 'a month ago'
  if (months < 12) return `${months} months ago`
  if (years < 2) return 'a year ago'
  return `${years} years ago`
}

export function buildWhatsAppOrderLink(flower: Flower, lang: Language, origin: string, phoneNumber: string): string {
  const name = getFlowerName(flower, lang)
  const price = formatPrice(flower.price)
  const link = `${origin}/#/flower/${flower.slug}`
  const message = `${name} — ${price}\n\n${link}`
  const cleanNumber = phoneNumber.replace(/[^0-9]/g, '')
  return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`
}

export function buildCopyMessage(flower: Flower, lang: Language, origin: string): string {
  const name = getFlowerName(flower, lang)
  const price = formatPrice(flower.price)
  const link = `${origin}/#/flower/${flower.slug}`
  return `${name} — ${price}\n\n${link}`
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(text); return true }
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.focus()
    textarea.select()
    const success = document.execCommand('copy')
    document.body.removeChild(textarea)
    return success
  } catch { return false }
}

export async function shareFlower(flower: Flower, lang: Language, origin: string, imageUrl?: string): Promise<'shared' | 'fallback' | 'cancelled'> {
  const name = getFlowerName(flower, lang)
  const price = formatPrice(flower.price)
  const link = `${origin}/#/flower/${flower.slug}`
  const text = `${name} — ${price}\n\n${link}`
  if (navigator.share) {
    try {
      if (imageUrl && navigator.canShare) {
        try {
          const response = await fetch(imageUrl)
          const blob = await response.blob()
          const file = new File([blob], `${flower.slug}.jpg`, { type: blob.type })
          if (navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], text: text }); return 'shared' }
        } catch {}
      }
      await navigator.share({ text: text })
      return 'shared'
    } catch (err: any) { if (err.name === 'AbortError') return 'cancelled' }
  }
  return 'fallback'
}

export function getInitials(name: string): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}
