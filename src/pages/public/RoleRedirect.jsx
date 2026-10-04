import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { homePathForRole } from '../../lib/roles'
import AuthShell from '../../components/site/AuthShell'
import PageLoader from '../../components/site/PageLoader'
import { Alert } from '../../components/site/FormField'
import { outlineButton, primaryButton } from '../../lib/ui'
import { useT } from '../../lib/i18n'

// After login, this decides where each role lands.
export default function RoleRedirect() {
  const { session, role, loading, signOut, refreshProfile } = useAuth()
  const [checking, setChecking] = useState(false)
  const { t } = useT()

  if (loading) return <PageLoader label="Signing you in…" />
  if (!session) return <Navigate to="/login" replace />

  const home = homePathForRole(role)
  if (home) return <Navigate to={home} replace />

  // Signed in, but no profile/role yet — explain instead of silently bouncing to /login.
  async function checkAgain() {
    setChecking(true)
    await refreshProfile()
    setChecking(false)
  }

  return (
    <AuthShell title={t('Account setup pending')} subtitle={session.user.email}>
      <div className="flex flex-col gap-4">
        <Alert tone="info">
          {t("Your login works, but your academy profile hasn't been set up yet. Please contact the academy office and ask the admin to activate your account.")}
        </Alert>
        <button type="button" onClick={checkAgain} className={primaryButton} disabled={checking}>
          {checking ? t('Checking…') : t('Check again')}
        </button>
        <button type="button" onClick={signOut} className={`${outlineButton} w-full`}>{t('Sign out')}</button>
      </div>
    </AuthShell>
  )
}
