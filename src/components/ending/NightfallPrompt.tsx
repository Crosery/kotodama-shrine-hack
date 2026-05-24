import { useEffect } from 'react'

// 夜幕将至：玩家累计对话 ≥ 阈值时浮出，让玩家决定继续探索还是收束今夜
// 当 showHidden=true 时多出一个"永远守望下去"按钮 → HIDDEN 守望 ENDING
export default function NightfallPrompt({
  onWait,
  onClose,
  onForever,
  triggeredCount,
  watchCount,
  showHidden,
}: {
  onWait: () => void
  onClose: () => void
  onForever?: () => void
  triggeredCount: number
  watchCount: number
  showHidden: boolean
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 80,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(7,5,13,0.62)', backdropFilter: 'blur(3px)',
      }}
    >
      <div className="k-pixel-panel" style={{ padding: '28px 36px', maxWidth: 540, textAlign: 'center' }}>
        <div className="k-title" style={{ fontSize: 16, letterSpacing: '0.32em', marginBottom: 10, color: 'rgba(247,244,232,0.92)' }}>
          ▍ 夜色将至
        </div>
        <div style={{ fontSize: 13, lineHeight: 1.9, letterSpacing: '0.08em', color: 'rgba(247,244,232,0.82)', marginBottom: 8 }}>
          你跟家人说了挺多话了。<br/>
          再等一会，夜幕就要落下，今晚就要成定数。
        </div>
        <div style={{ fontSize: 11, lineHeight: 1.8, letterSpacing: '0.10em', color: 'rgba(247,244,232,0.52)', marginBottom: 8 }}>
          {triggeredCount > 0
            ? `已点中 ${triggeredCount} 颗心 — ta 们今晚会做出不一样的事。`
            : '还没有人因你而改变 — 命运按原样发生。'}
        </div>
        <div style={{ fontSize: 10, letterSpacing: '0.20em', color: 'rgba(247,244,232,0.38)', marginBottom: 24 }}>
          你已经守望 {watchCount} 个夜了
        </div>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={onClose}
            className="k-pixel-bubble"
            style={{
              padding: '10px 22px',
              background: 'rgba(46,230,230,0.10)',
              border: '1px solid rgba(46,230,230,0.62)',
              color: 'rgba(46,230,230,0.95)',
              fontSize: 13, letterSpacing: '0.22em', cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            再守望片刻
          </button>
          <button
            onClick={onWait}
            className="k-pixel-bubble"
            style={{
              padding: '10px 22px',
              background: 'rgba(255,46,154,0.12)',
              border: '1px solid rgba(255,46,154,0.62)',
              color: 'rgba(255,168,201,0.95)',
              fontSize: 13, letterSpacing: '0.22em', cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            等待夜幕降临
          </button>
          {showHidden && onForever ? (
            <button
              onClick={onForever}
              className="k-pixel-bubble"
              style={{
                padding: '10px 22px',
                background: 'rgba(232,199,96,0.14)',
                border: '1px solid rgba(232,199,96,0.72)',
                color: 'rgba(255,228,138,0.96)',
                fontSize: 13, letterSpacing: '0.22em', cursor: 'pointer', fontFamily: 'inherit',
                boxShadow: '0 0 18px rgba(232,199,96,0.28)',
              }}
            >
              永远守望下去
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
