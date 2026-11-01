import React from 'react'
import ReactDOM from 'react-dom/client'
import { AcceptInvitePage, ForgotPasswordPage, ResetPasswordPage, SignInPage, SignUpPage } from './pages/AuthScreens'
import { CommandCentre } from './pages/CommandCentre'
import { Landing } from './pages/Landing'
import './index.css'

const path = window.location.pathname.replace(/\/$/, '') || '/'
const screen =
  path === '/' ? <Landing />
  : path === '/sign-in' ? <SignInPage />
  : path === '/sign-up' ? <SignUpPage />
  : path === '/forgot-password' ? <ForgotPasswordPage />
  : path === '/reset-password' ? <ResetPasswordPage />
  : path === '/accept-invite' ? <AcceptInvitePage />
  : <CommandCentre />

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>{screen}</React.StrictMode>,
)
