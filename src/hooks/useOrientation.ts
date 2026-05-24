import { useEffect, useState } from 'react'

export type Orientation = 'portrait' | 'landscape'

function read(): Orientation {
  if (typeof window === 'undefined') return 'landscape'
  if (window.matchMedia('(orientation: portrait)').matches) return 'portrait'
  return window.innerHeight > window.innerWidth ? 'portrait' : 'landscape'
}

export function useOrientation(): Orientation {
  const [o, setO] = useState<Orientation>(() => read())
  useEffect(() => {
    const mq = window.matchMedia('(orientation: portrait)')
    function update() { setO(read()) }
    mq.addEventListener('change', update)
    window.addEventListener('resize', update)
    window.addEventListener('orientationchange', update)
    return () => {
      mq.removeEventListener('change', update)
      window.removeEventListener('resize', update)
      window.removeEventListener('orientationchange', update)
    }
  }, [])
  return o
}
