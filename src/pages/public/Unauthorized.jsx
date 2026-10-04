import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { homePathForRole, roleLabel } from '../../lib/roles'
import AuthShell from '../../components/site/AuthShell'
import { Alert } from '../../components/site/FormField'
import { outlineButton, primaryButton } from '../../lib/ui'
import { useT } from '../../lib/i18n'

export default function Unauthorized() {
  const { session, role, signOut } = useAuth()
  const home = homePathForRole(role)
  const { t } = useT()

  return (
    <AuthShell title={t('Access restricted')} subtitle={t('Error 403 · Not authorized')}>
      <div className="flex flex-col gap-4">
        <Alert>
          {session
            ? t('Your account ({role}) does not have permission to view this page.', { role: roleLabel(role) || 'no role' })
            : t('Please sign in to continue.')}
        </Alert>
        {session ? (
          <>
            {home && <Link to={home} className={`${primaryButton} text-center`}>{t('Go to my dashboard')}</Link>}
            <button type="button" onClick={signOut} className={`${outlineButton} w-full`}>{t('Sign out')}</button>
          </>
        ) : (
          <Link to="/login" className={`${primaryButton} text-center`}>{t('Sign in')}</Link>
        )}
      </div>
    </AuthShell>
  )
}
