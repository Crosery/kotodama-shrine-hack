import { useEffect } from 'react'

export default function ToriiChoice({
  onLeave,
  onStay,
}: {
  onLeave: () => void
  onStay: () => void
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onStay()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onStay])

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 80,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(7,5,13,0.62)', backdropFilter: 'blur(3px)',
      }}
    >
      <div className="k-pixel-panel" style={{ padding: '28px 36px', maxWidth: 520, textAlign: 'center' }}>
        <div className="k-title" style={{ fontSize: 16, letterSpacing: '0.32em', marginBottom: 10, color: 'rgba(247,244,232,0.92)' }}>
          ▍ 鸟居
        </div>
        <div style={{ fontSize: 13, lineHeight: 1.9, letterSpacing: '0.08em', color: 'rgba(247,244,232,0.82)', marginBottom: 26 }}>
          风从参道里吹回来。<br/>
          要现在就走过这道鸟居，离开神社吗？
        </div>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button
            onClick={onLeave}
            className="k-pixel-bubble"
            style={{
              padding: '10px 22px',
              background: 'rgba(255,46,154,0.14)',
              border: '1px solid rgba(255,46,154,0.62)',
              color: 'rgba(255,168,201,0.95)',
              fontSize: 13, letterSpacing: '0.22em', cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            走过鸟居 · 离开
          </button>
          <button
            onClick={onStay}
            className="k-pixel-bubble"
            style={{
              padding: '10px 22px',
              background: 'rgba(46,230,230,0.10)',
              border: '1px solid rgba(46,230,230,0.62)',
              color: 'rgba(46,230,230,0.95)',
              fontSize: 13, letterSpacing: '0.22em', cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            留下来 · 不走
          </button>
        </div>
        <div style={{ marginTop: 16, fontSize: 10, letterSpacing: '0.22em', color: 'rgba(247,244,232,0.38)' }}>
          点空白处 · 留下
        </div>
      </div>
    </div>
  )
}
