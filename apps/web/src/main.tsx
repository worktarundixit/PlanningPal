import { useEffect, useState } from 'react'
import ReactDOM from 'react-dom/client'
import { ErrorBoundary } from './components/ErrorBoundary'
import { StatusScreen } from './components/StatusScreen'
import { supabase } from './lib/auth-client'
import { AcceptInvitePage, ForgotPasswordPage, ResetPasswordPage, SignInPage, SignUpPage } from './pages/AuthScreens'
import { CommandCentre } from './pages/CommandCentre'
import { SuperAdminDashboard } from './pages/SuperAdminDashboard'
import { OnboardingPage } from './pages/Onboarding'
import { Landing } from './pages/Landing'
import './index.css'

const known = new Set(['/', '/sign-in', '/sign-up', '/forgot-password', '/reset-password', '/accept-invite', '/onboarding', '/app', '/app/admin'])
const landingHosts = new Set(['planningpal.io', 'www.planningpal.io'])
const appHost = 'app.planningpal.io'
const appOrigin = 'https://app.planningpal.io'
const appRoutes = new Set(['/sign-in', '/sign-up', '/forgot-password', '/reset-password', '/accept-invite', '/onboarding', '/app'])

function isAppRoute(path: string) {
  return appRoutes.has(path) || path.startsWith('/app/')
}

function screenFor(path: string) {
  if (!known.has(path)) return <StatusScreen kind="missing" />
  if (path === '/') return <Landing />
  if (path === '/sign-in') return <SignInPage />
  if (path === '/sign-up') return <SignUpPage />
  if (path === '/forgot-password') return <ForgotPasswordPage />
  if (path === '/reset-password') return <ResetPasswordPage />
  if (path === '/accept-invite') return <AcceptInvitePage />
  if (path === '/onboarding') return <OnboardingPage />
  if (path === '/app/admin') return <SuperAdminDashboard />
  return <CommandCentre />
}

function Root() {
  const host = window.location.hostname.toLowerCase()
  const path = window.location.pathname.replace(/\/$/, '') || '/'
  const redirectToAppOrigin = landingHosts.has(host) && isAppRoute(path)
  const redirectAppHome = host === appHost && path === '/'
  const [offline, setOffline] = useState(!navigator.onLine)

  useEffect(() => {
    if (redirectToAppOrigin) {
      window.location.replace(`${appOrigin}${path}${window.location.search}${window.location.hash}`)
      return
    }
    if (redirectAppHome) {
      if (!supabase) {
        window.location.replace('/sign-in')
        return
      }
      let active = true
      void supabase.auth
        .getSession()
        .then(({ data }) => {
          if (!active) return
          window.location.replace(data.session ? '/app' : '/sign-in')
        })
        .catch(() => {
          if (!active) return
          window.location.replace('/sign-in')
        })
      return () => {
        active = false
      }
    }
  }, [path, redirectAppHome, redirectToAppOrigin])

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

  if (redirectToAppOrigin || redirectAppHome) return null
  if (offline) return <StatusScreen kind="offline" onRetry={() => window.location.reload()} />
  return <ErrorBoundary>{screenFor(path)}</ErrorBoundary>
}

ReactDOM.createRoot(document.getElementById('root')!).render(<Root />)
