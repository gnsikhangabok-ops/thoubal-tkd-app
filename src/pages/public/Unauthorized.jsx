import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { homePathForRole, roleLabel } from '../../lib/roles'
import AuthShell from '../../components/site/AuthShell'
import { Alert } from '../../components/site/FormField'
import { outlineButton, primaryButton } from '../../lib/ui'

export default function Unauthorized() {
  const { session, role, signOut } = useAuth()
  const home = homePathForRole(role)

  return (
    <AuthShell title="Access restricted" subtitle="Error 403 · Not authorized">
      <div className="flex flex-col gap-4">
        <Alert>
          {session
            ? `Your account (${roleLabel(role) || 'no role'}) does not have permission to view this page.`
            : 'Please sign in to continue.'}
        </Alert>
        {session ? (
          <>
            {home && <Link to={home} className={`${primaryButton} text-center`}>Go to my dashboard</Link>}
            <button type="button" onClick={signOut} className={`${outlineButton} w-full`}>Sign out</button>
          </>
        ) : (
          <Link to="/login" className={`${primaryButton} text-center`}>Sign in</Link>
        )}
      </div>
    </AuthShell>
  )
}
