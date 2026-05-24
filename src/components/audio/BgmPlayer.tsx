import { useEffect, useRef } from 'react'
import { SCENE_ASSETS } from '@/data/sceneAssets'

const DEFAULT_VOLUME = 0.45

export default function BgmPlayer({ ready }: { ready: boolean }) {
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // ready=true 后尝试播放；浏览器策略拒就等首次用户输入再启
  useEffect(() => {
    const a = audioRef.current
    if (!a) return
    a.volume = DEFAULT_VOLUME
  }, [])

  useEffect(() => {
    if (!ready) return
    const a = audioRef.current
    if (!a) return
    let started = false
    a.play().then(() => { started = true }).catch(() => { /* 等手势 */ })

    function kick() {
      if (started) return
      a.play().then(() => { started = true }).catch(() => {})
    }
    window.addEventListener('pointerdown', kick, { once: true })
    window.addEventListener('touchstart', kick, { once: true })
    window.addEventListener('keydown', kick, { once: true })
    return () => {
      window.removeEventListener('pointerdown', kick)
      window.removeEventListener('touchstart', kick)
      window.removeEventListener('keydown', kick)
    }
  }, [ready])

  return (
    <audio ref={audioRef} loop preload="none">
      <source src={SCENE_ASSETS.bgm} type='audio/ogg; codecs="opus"' />
      <source src={SCENE_ASSETS.bgmAac} type='audio/mp4; codecs="mp4a.40.2"' />
    </audio>
  )
}
