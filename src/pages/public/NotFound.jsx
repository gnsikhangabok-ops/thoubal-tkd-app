import { Link } from 'react-router-dom'
import AuthShell from '../../components/site/AuthShell'
import { outlineButton, primaryButton } from '../../lib/ui'

export default function NotFound() {
  return (
    <AuthShell title="Page not found" subtitle="Error 404">
      <div className="flex flex-col gap-4">
        <p className="text-sm text-muted">
          The page you requested does not exist or may have been moved. Please check the address or use the links below.
        </p>
        <Link to="/" className={`${primaryButton} text-center`}>Go to homepage</Link>
        <Link to="/login" className={`${outlineButton} w-full text-center`}>Student &amp; Staff Login</Link>
      </div>
    </AuthShell>
  )
}
