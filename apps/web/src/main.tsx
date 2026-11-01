import React from 'react'
import ReactDOM from 'react-dom/client'
import { CommandCentre } from './pages/CommandCentre'
import { Landing } from './pages/Landing'
import './index.css'

const path = window.location.pathname.replace(/\/$/, '') || '/'
const screen = path === '/' ? <Landing /> : <CommandCentre />

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>{screen}</React.StrictMode>,
)
