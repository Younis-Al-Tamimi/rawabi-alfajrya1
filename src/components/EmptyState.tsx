import { ReactNode } from 'react'
import { PeonyIllustration } from './icons'

export function EmptyState({ title, message, action }: { title: string; message: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="text-forest-200 mb-6"><PeonyIllustration size={80} /></div>
      <h3 className="font-serif text-xl text-forest-600 mb-2">{title}</h3>
      {message && <p className="text-forest-400 text-sm max-w-sm mb-6">{message}</p>}
      {action}
    </div>
  )
}
