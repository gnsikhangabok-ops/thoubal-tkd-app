import { Link } from 'react-router-dom'
import AuthShell from '../../components/site/AuthShell'
import { outlineButton, primaryButton } from '../../lib/ui'
import { useT } from '../../lib/i18n'

export default function NotFound() {
  const { t } = useT()
  return (
    <AuthShell title={t('Page not found')} subtitle={t('Error 404')}>
      <div className="flex flex-col gap-4">
        <p className="text-sm text-muted">
          {t('The page you requested does not exist or may have been moved. Please check the address or use the links below.')}
        </p>
        <Link to="/" className={`${primaryButton} text-center`}>{t('Go to homepage')}</Link>
        <Link to="/login" className={`${outlineButton} w-full text-center`}>{t('Student & Staff Login')}</Link>
      </div>
    </AuthShell>
  )
}
