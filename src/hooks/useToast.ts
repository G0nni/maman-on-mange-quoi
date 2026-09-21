import { useEffect, useState } from 'react'

/** Message éphémère (1,8 s), affiché par <Toast />. */
export function useToast() {
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!message) return
    const t = setTimeout(() => setMessage(null), 1800)
    return () => clearTimeout(t)
  }, [message])

  return [message, setMessage] as const
}
