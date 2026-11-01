import type { Scheme } from '@planningpal/shared'
import { api } from './api'

export function notify(message: string) {
  window.dispatchEvent(new CustomEvent('aec-notice', { detail: message }))
}

export async function exportSchemes(items: Scheme[]) {
  if (!items.length) {
    notify('There are no schemes to export')
    return
  }
  await api.exportLeads(items.map((item) => item.id))
  notify(`${items.length} schemes exported`)
}
