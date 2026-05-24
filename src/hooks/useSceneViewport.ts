import { useEffect, useState } from 'react'
import { computeViewport, type SceneViewport } from '@/lib/coords'
import { SCENE_HEIGHT, SCENE_WIDTH } from '@/data/scene'

export function useSceneViewport(): SceneViewport {
  const [vp, setVp] = useState<SceneViewport>(() => {
    if (typeof window === 'undefined') return computeViewport(SCENE_WIDTH, SCENE_HEIGHT)
    return computeViewport(window.innerWidth, window.innerHeight)
  })

  useEffect(() => {
    function onResize() {
      setVp(computeViewport(window.innerWidth, window.innerHeight))
    }
    window.addEventListener('resize', onResize)
    window.addEventListener('orientationchange', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      window.removeEventListener('orientationchange', onResize)
    }
  }, [])

  return vp
}
