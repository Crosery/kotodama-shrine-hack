import { useEffect, useState } from 'react'
import { SCENE_ASSETS, asset } from '@/data/sceneAssets'

// 资源预载门：主界面渲染前先把所有可见资源拉到浏览器缓存
// bg + 4 个按钮 + 主界面 BGM metadata；其中 BGM 体积大单独计权重让进度条更平滑
const ASSETS: Array<{ url: string; type: 'image' | 'audio'; weight: number }> = [
  { url: asset('/ui/menu/background.webp'),    type: 'image', weight: 30 },
  { url: asset('/ui/menu/button-start.webp'),  type: 'image', weight: 12 },
  { url: asset('/ui/menu/button-music.webp'),  type: 'image', weight: 12 },
  { url: asset('/ui/menu/button-cg.webp'),     type: 'image', weight: 12 },
  { url: asset('/ui/menu/button-exit.webp'),   type: 'image', weight: 12 },
  { url: SCENE_ASSETS.menuBgm,                 type: 'audio', weight: 22 },
]

const TOTAL_WEIGHT = ASSETS.reduce((s, a) => s + a.weight, 0)

export default function PreloadGate({ children }: { children: React.ReactNode }) {
  const [loaded, setLoaded] = useState(0)
  const [done, setDone] = useState(false)
  const [fading, setFading] = useState(false)

  useEffect(() => {
    let cancelled = false
    let acc = 0

    function bump(weight: number) {
      if (cancelled) return
      acc += weight
      setLoaded(acc)
    }

    for (const item of ASSETS) {
      if (item.type === 'image') {
        const img = new Image()
        img.onload = () => bump(item.weight)
        img.onerror = () => bump(item.weight) // 失败也计数避免卡死
        img.src = item.url
      } else {
        const audio = new Audio()
        audio.preload = 'metadata'
        const onMeta = () => { audio.removeEventListener('loadedmetadata', onMeta); bump(item.weight) }
        const onErr = () => { audio.removeEventListener('error', onErr); bump(item.weight) }
        audio.addEventListener('loadedmetadata', onMeta)
        audio.addEventListener('error', onErr)
        audio.src = item.url
      }
    }

    // 超时兜底 8s：网慢直接强进，避免无限等
    const watchdog = window.setTimeout(() => {
      if (cancelled) return
      acc = TOTAL_WEIGHT
      setLoaded(TOTAL_WEIGHT)
    }, 8000)

    return () => {
      cancelled = true
      window.clearTimeout(watchdog)
    }
  }, [])

  useEffect(() => {
    if (loaded < TOTAL_WEIGHT || done) return
    // 进度满后 280ms 淡出再 unmount
    setFading(true)
    const t = window.setTimeout(() => setDone(true), 280)
    return () => window.clearTimeout(t)
  }, [loaded, done])

  const percent = Math.min(100, Math.round((loaded / TOTAL_WEIGHT) * 100))

  if (done) return <>{children}</>

  return (
    <>
      {/* 主界面先 mount 但被遮罩盖住，资源已经在后台拉，淡出后无白闪 */}
      <div style={{ opacity: 0, pointerEvents: 'none' }}>{children}</div>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          background: '#07050d',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'rgba(247,244,232,0.92)',
          fontFamily: '"Microsoft YaHei", "PingFang SC", "Noto Sans SC", sans-serif',
          opacity: fading ? 0 : 1,
          transition: 'opacity 280ms ease',
        }}
      >
        <div style={{
          fontSize: 28,
          letterSpacing: '0.4em',
          marginBottom: 8,
          textShadow: '0 0 14px rgba(46,230,230,0.32), 0 0 38px rgba(255,46,154,0.18)',
        }}>
          言灵神社
        </div>
        <div style={{
          fontSize: 11,
          letterSpacing: '0.36em',
          color: 'rgba(247,244,232,0.42)',
          marginBottom: 36,
        }}>
          KOTODAMA  SHRINE
        </div>

        <div style={{
          width: 'min(360px, 70vw)',
          height: 3,
          background: 'rgba(247,244,232,0.10)',
          borderRadius: 2,
          overflow: 'hidden',
          position: 'relative',
        }}>
          <div style={{
            position: 'absolute',
            inset: 0,
            width: `${percent}%`,
            background: 'linear-gradient(90deg, rgba(46,230,230,0.85), rgba(255,46,154,0.85))',
            transition: 'width 200ms ease',
            boxShadow: '0 0 12px rgba(46,230,230,0.45)',
          }} />
        </div>
        <div style={{
          marginTop: 14,
          fontSize: 11,
          letterSpacing: '0.28em',
          color: 'rgba(247,244,232,0.55)',
          fontVariantNumeric: 'tabular-nums',
        }}>
          载入中 {percent}%
        </div>
      </div>
    </>
  )
}
