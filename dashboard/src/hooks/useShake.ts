import { useCallback, useEffect, useRef } from 'react'

const AMP = 10
const FREQ = 22
const DECAY = 8

export function useShake(elementRef: React.RefObject<HTMLElement | null>) {
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return useCallback(() => {
    const el = elementRef.current
    if (!el) return
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return

    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      el.style.transform = ''
    }

    const start = performance.now()

    function frame(now: number) {
      const t = (now - start) / 1000
      const x = Math.sin(t * FREQ * Math.PI) * AMP * Math.exp(-DECAY * t)
      el!.style.transform = `translate3d(${x.toFixed(2)}px,0,0)`

      if (t < 0.65) {
        rafRef.current = requestAnimationFrame(frame)
      } else {
        rafRef.current = null
        el!.style.transform = ''
      }
    }
    rafRef.current = requestAnimationFrame(frame)
  }, [elementRef])
}
