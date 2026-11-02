import { useEffect, useState } from 'react'
import ReactDOM from 'react-dom/client'
import { ErrorBoundary } from './components/ErrorBoundary'
import { StatusScreen } from './components/StatusScreen'
import { AcceptInvitePage, ForgotPasswordPage, ResetPasswordPage, SignInPage, SignUpPage } from './pages/AuthScreens'
import { CommandCentre } from './pages/CommandCentre'
import { OnboardingPage } from './pages/Onboarding'
import { Landing } from './pages/Landing'
import './index.css'

const known = new Set(['/', '/sign-in', '/sign-up', '/forgot-password', '/reset-password', '/accept-invite', '/onboarding', '/app', '/app/admin'])

function screenFor(path: string) {
  if (!known.has(path)) return <StatusScreen kind="missing" />
  if (path === '/') return <Landing />
  if (path === '/sign-in') return <SignInPage />
  if (path === '/sign-up') return <SignUpPage />
  if (path === '/forgot-password') return <ForgotPasswordPage />
  if (path === '/reset-password') return <ResetPasswordPage />
  if (path === '/accept-invite') return <AcceptInvitePage />
  if (path === '/onboarding') return <OnboardingPage />
  return <CommandCentre />
}

function Root() {
  const path = window.location.pathname.replace(/\/$/, '') || '/'
  const [offline, setOffline] = useState(!navigator.onLine)

  useEffect(() => {
    const goOffline = () => setOffline(true)
    const goOnline = () => setOffline(false)
    window.addEventListener('offline', goOffline)
    window.addEventListener('online', goOnline)
    window.addEventListener('planningpal-offline', goOffline)
    return () => {
      window.removeEventListener('offline', goOffline)
      window.removeEventListener('online', goOnline)
      window.removeEventListener('planningpal-offline', goOffline)
    }
  }, [])

  if (offline) return <StatusScreen kind="offline" onRetry={() => window.location.reload()} />
  return <ErrorBoundary>{screenFor(path)}</ErrorBoundary>
}

ReactDOM.createRoot(document.getElementById('root')!).render(<Root />)
