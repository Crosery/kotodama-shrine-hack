import { useEffect, useRef, useState } from 'react'
import { INTRO_BLACK_MS, SCENE_ASSETS } from '@/data/sceneAssets'

type Phase = 'black' | 'playing' | 'done'

export default function IntroOverlay({ onDone }: { onDone?: () => void }) {
  const [phase, setPhase] = useState<Phase>('black')
  const videoRef = useRef<HTMLVideoElement | null>(null)

  useEffect(() => {
    if (phase !== 'black') return
    const t = window.setTimeout(() => setPhase('playing'), INTRO_BLACK_MS)
    return () => window.clearTimeout(t)
  }, [phase])

  useEffect(() => {
    if (phase !== 'playing') return
    const v = videoRef.current
    if (!v) return

    // 先按原声播；浏览器 autoplay 策略拒就降级静音，并挂一次性手势监听器，
    // 用户首次任意输入（点击/触摸/按键）自动 unmute，无需弹按钮
    let cleanup: (() => void) | null = null
    v.muted = false
    v.play().catch(() => {
      v.muted = true
      v.play().catch(() => finish())
      const unmute = () => {
        const vv = videoRef.current
        if (vv) vv.muted = false
        cleanup?.()
      }
      window.addEventListener('pointerdown', unmute, { once: true, capture: true })
      window.addEventListener('touchstart', unmute, { once: true, capture: true })
      window.addEventListener('keydown', unmute, { once: true, capture: true })
      cleanup = () => {
        window.removeEventListener('pointerdown', unmute, { capture: true } as EventListenerOptions)
        window.removeEventListener('touchstart', unmute, { capture: true } as EventListenerOptions)
        window.removeEventListener('keydown', unmute, { capture: true } as EventListenerOptions)
      }
    })

    // 5s watchdog：开播失败或卡 metadata 直接跳过避免黑屏卡死
    const watchdog = window.setTimeout(() => {
      if (v.currentTime === 0) finish()
    }, 5000)
    return () => {
      window.clearTimeout(watchdog)
      cleanup?.()
    }
  }, [phase])

  function finish() {
    if (phase === 'done') return
    setPhase('done')
    onDone?.()
  }

  if (phase === 'done') return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'black',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {phase !== 'black' ? (
        <video
          ref={videoRef}
          src={SCENE_ASSETS.introVideo}
          playsInline
          autoPlay
          preload="metadata"
          disablePictureInPicture
          disableRemotePlayback
          controlsList="nodownload nofullscreen noremoteplayback noplaybackrate"
          {...({
            'x5-video-player-type': 'h5',
            'x5-video-player-fullscreen': 'false',
            'x5-video-orientation': 'landscape',
            'webkit-playsinline': 'true',
          } as Record<string, string>)}
          onEnded={finish}
          onError={finish}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            background: 'black',
            pointerEvents: 'none',
          }}
        />
      ) : null}

      {phase === 'playing' ? (
        <button
          type="button"
          onClick={finish}
          style={{
            position: 'absolute',
            right: 16,
            bottom: 16,
            padding: '6px 14px',
            background: 'rgba(18,8,31,0.78)',
            border: '1px solid rgba(247,244,232,0.32)',
            color: 'rgba(247,244,232,0.9)',
            fontSize: 12,
            letterSpacing: '0.18em',
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          跳过 ›
        </button>
      ) : null}
    </div>
  )
}
