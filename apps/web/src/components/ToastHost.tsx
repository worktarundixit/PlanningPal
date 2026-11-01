import { useEffect, useState } from 'react'

export function ToastHost() {
  const [message, setMessage] = useState('')
  useEffect(() => {
    const listener = (event: Event) => {
      setMessage((event as CustomEvent<string>).detail)
      window.setTimeout(() => setMessage(''), 3200)
    }
    window.addEventListener('aec-notice', listener)
    return () => window.removeEventListener('aec-notice', listener)
  }, [])
  if (!message) return null
  return <div className="fixed bottom-5 left-1/2 z-[80] flex -translate-x-1/2 items-center gap-3 rounded-xl bg-[#172554] px-4 py-3 text-[10px] font-semibold text-white shadow-2xl"><span className="grid h-5 w-5 place-items-center rounded-full bg-[#38BDF8] text-[#172554]">✓</span>{message}</div>
}
