import { useEffect, useRef, useState } from 'react'

export function FormError({ message }: { message: string | null }) {
  const [displayText, setDisplayText] = useState(message ?? '')
  const [visible, setVisible] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)

    if (message) {
      setDisplayText(message)
      // Two rAF passes so CSS transition fires from the initial (hidden) state
      const id = requestAnimationFrame(() =>
        requestAnimationFrame(() => setVisible(true))
      )
      return () => cancelAnimationFrame(id)
    } else {
      setVisible(false)
      timerRef.current = setTimeout(() => setDisplayText(''), 260)
    }
  }, [message])

  return (
    <div
      role="status"
      aria-live="polite"
      aria-hidden={!visible}
      className={`form-error${visible ? ' form-error--visible' : ''}`}
    >
      {displayText}
    </div>
  )
}
