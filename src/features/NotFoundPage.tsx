import { Link } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import { EmptyState } from '../components/EmptyState'

export function NotFoundPage() {
  const { t } = useLanguage()
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <EmptyState title={t('notFoundTitle')} message={t('notFoundText')} action={<Link to="/" className="btn-primary">{t('notFoundCta')}</Link>} />
    </div>
  )
}
