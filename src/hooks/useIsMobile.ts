import { useEffect, useState } from 'react'
import { detectIsMobile } from '@/lib/mobileLayout'

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState<boolean>(() => detectIsMobile())

  useEffect(() => {
    const mqCoarse = window.matchMedia('(pointer: coarse)')
    const mqHover = window.matchMedia('(hover: none)')
    function update() {
      setIsMobile(detectIsMobile())
    }
    mqCoarse.addEventListener('change', update)
    mqHover.addEventListener('change', update)
    window.addEventListener('resize', update)
    window.addEventListener('orientationchange', update)
    return () => {
      mqCoarse.removeEventListener('change', update)
      mqHover.removeEventListener('change', update)
      window.removeEventListener('resize', update)
      window.removeEventListener('orientationchange', update)
    }
  }, [])

  return isMobile
}
