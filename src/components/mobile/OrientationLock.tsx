import { useEffect, useState } from 'react'

const IS_IOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as unknown as { MSStream?: unknown }).MSStream

export default function OrientationLock() {
  const [portrait, setPortrait] = useState(() => isPortrait())
  const [tip, setTip] = useState<string | null>(null)

  useEffect(() => {
    const mq = window.matchMedia('(orientation: portrait)')
    function update() { setPortrait(isPortrait()) }
    mq.addEventListener('change', update)
    window.addEventListener('resize', update)
    window.addEventListener('orientationchange', update)
    return () => {
      mq.removeEventListener('change', update)
      window.removeEventListener('resize', update)
      window.removeEventListener('orientationchange', update)
    }
  }, [])

  if (!portrait) return null

  async function enterFullscreenAndLock() {
    setTip(null)
    let fsOk = false
    try {
      await document.documentElement.requestFullscreen()
      fsOk = true
    } catch {
      /* iOS Safari 不支持 requestFullscreen */
    }
    try {
      // @ts-expect-error orientation.lock 实验 API
      await screen.orientation.lock('landscape')
      // 成功：等待 orientationchange 触发关闭
    } catch {
      if (IS_IOS) {
        setTip('iOS 浏览器无法自动横屏：请手动开启系统的「屏幕旋转」并把手机转 90°')
      } else if (fsOk) {
        setTip('全屏已开启，请手动旋转设备 90°')
      } else {
        setTip('请手动旋转设备 90° 进入横屏')
      }
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'linear-gradient(180deg, #1b0a2a 0%, #12081f 100%)',
        color: 'rgba(247,244,232,0.92)',
        zIndex: 9000,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 18,
        padding: 24,
        textAlign: 'center',
        fontFamily: 'inherit',
      }}
    >
      <div
        style={{
          width: 110,
          height: 70,
          border: '4px solid rgba(46,230,230,0.85)',
          borderRadius: 12,
          transform: 'rotate(-25deg)',
          boxShadow: '0 0 28px rgba(46,230,230,0.45)',
          marginBottom: 12,
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            right: -22,
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'rgba(46,230,230,0.85)',
            fontSize: 28,
            lineHeight: 1,
          }}
        >
          ↻
        </div>
      </div>

      <div style={{ fontSize: 20, letterSpacing: '0.22em', fontWeight: 600 }}>请横屏游玩</div>
      <div style={{ fontSize: 13, opacity: 0.65, letterSpacing: '0.14em', maxWidth: 320, lineHeight: 1.7 }}>
        把手机顺时针旋转 90°<br />
        或点下方按钮自动进入横屏全屏
      </div>

      <button
        type="button"
        onClick={enterFullscreenAndLock}
        style={{
          marginTop: 8,
          padding: '14px 32px',
          background: 'rgba(46,230,230,0.18)',
          border: '2px solid rgba(46,230,230,0.85)',
          color: 'rgba(46,230,230,0.95)',
          fontSize: 15,
          letterSpacing: '0.22em',
          cursor: 'pointer',
          borderRadius: 4,
          fontWeight: 600,
          boxShadow: '0 0 18px rgba(46,230,230,0.35)',
        }}
      >
        全屏 + 横屏 进入游戏
      </button>

      {tip ? (
        <div
          style={{
            marginTop: 16,
            padding: '10px 16px',
            background: 'rgba(255,46,154,0.10)',
            border: '1px solid rgba(255,46,154,0.45)',
            color: 'rgba(255,168,201,0.95)',
            fontSize: 12,
            letterSpacing: '0.10em',
            maxWidth: 340,
            lineHeight: 1.7,
            borderRadius: 4,
          }}
        >
          {tip}
        </div>
      ) : null}

      <div style={{ marginTop: 24, fontSize: 11, opacity: 0.4, letterSpacing: '0.12em' }}>
        言灵神社 · {IS_IOS ? 'iOS' : 'Android / 其他'}
      </div>
    </div>
  )
}

function isPortrait() {
  if (typeof window === 'undefined') return false
  if (window.matchMedia('(orientation: portrait)').matches) return true
  return window.innerHeight > window.innerWidth
}
