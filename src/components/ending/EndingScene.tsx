import { useEffect, useState } from 'react'

export type EndingScript = {
  variant: 'normal' | 'true'
  cgUrl?: string  // 背景 CG（已加载完才放）
  beats: Array<Array<string>>
  cardTop: string  // "言灵神社 · NORMAL END"
  cardTitle: string // "错过" / "修复"
  cardSub?: string
}

const LINE_DELAY_MS = 1600
const BEAT_GAP_MS = 1100

export default function EndingScene({
  script,
  onDone,
}: {
  script: EndingScript
  onDone: () => void
}) {
  const [beatIdx, setBeatIdx] = useState(0)
  const [revealed, setRevealed] = useState(0)
  const [phase, setPhase] = useState<'reveal' | 'gap' | 'card' | 'card-stay'>('reveal')

  useEffect(() => {
    if (phase !== 'reveal') return
    const beat = script.beats[beatIdx]
    if (revealed >= beat.length) {
      const t = window.setTimeout(() => setPhase('gap'), BEAT_GAP_MS)
      return () => window.clearTimeout(t)
    }
    const t = window.setTimeout(() => setRevealed((n) => n + 1), LINE_DELAY_MS)
    return () => window.clearTimeout(t)
  }, [phase, beatIdx, revealed, script])

  useEffect(() => {
    if (phase !== 'gap') return
    if (beatIdx + 1 >= script.beats.length) {
      setPhase('card')
      const t = window.setTimeout(() => setPhase('card-stay'), 800)
      return () => window.clearTimeout(t)
    }
    setBeatIdx((i) => i + 1)
    setRevealed(0)
    setPhase('reveal')
  }, [phase, beatIdx, script])

  function advance() {
    if (phase === 'card-stay') { onDone(); return }
    if (phase === 'card') return
    const beat = script.beats[beatIdx]
    if (revealed < beat.length) setRevealed(beat.length)
    else if (phase === 'reveal') setPhase('gap')
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === ' ' || e.key === 'Enter' || e.key === 'Escape') {
        e.preventDefault(); advance()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const titleColor = script.variant === 'true'
    ? '0 0 26px rgba(46,230,230,0.36), 0 0 64px rgba(46,230,230,0.20)'
    : '0 0 26px rgba(247,168,90,0.30), 0 0 64px rgba(180,90,60,0.18)'

  return (
    <div
      onClick={advance}
      style={{
        position: 'fixed', inset: 0, zIndex: 9998,
        background: script.cgUrl
          ? `linear-gradient(rgba(5,3,9,0.62), rgba(5,3,9,0.82)), url("${script.cgUrl}") center/cover no-repeat`
          : 'radial-gradient(900px 600px at 50% 60%, rgba(20,8,28,0.96), #050309 70%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        color: 'rgba(247,244,232,0.94)',
        fontFamily: '"Microsoft YaHei", "PingFang SC", "Noto Sans SC", sans-serif',
        padding: '40px 24px', cursor: 'pointer',
      }}
    >
      {/* 结局期间始终可见的"返回主菜单"按钮，不等 phase */}
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onDone() }}
        style={{
          position: 'fixed', top: 16, right: 16, zIndex: 9999,
          padding: '8px 18px',
          background: 'rgba(7,5,13,0.78)',
          border: '1px solid rgba(46,230,230,0.62)',
          color: 'rgba(46,230,230,0.95)',
          fontSize: 12, letterSpacing: '0.22em', cursor: 'pointer',
          fontFamily: 'inherit', borderRadius: 3,
          boxShadow: '0 0 14px rgba(46,230,230,0.20)',
        }}
      >
        返回主菜单
      </button>
      {phase === 'card' || phase === 'card-stay' ? (
        <>
          <div style={{ fontSize: 14, letterSpacing: '0.5em', color: 'rgba(247,244,232,0.42)', marginBottom: 22 }}>
            {script.cardTop}
          </div>
          <div style={{
            fontSize: 64, letterSpacing: '0.35em', fontWeight: 200,
            textShadow: titleColor,
          }}>
            {script.cardTitle}
          </div>
          {script.cardSub ? (
            <div style={{ marginTop: 18, fontSize: 13, letterSpacing: '0.20em', color: 'rgba(247,244,232,0.55)' }}>
              {script.cardSub}
            </div>
          ) : null}
          {phase === 'card-stay' ? (
            <div style={{ marginTop: 48, fontSize: 12, letterSpacing: '0.32em', color: 'rgba(247,244,232,0.46)' }}>
              点击任意处返回主界面
            </div>
          ) : null}
        </>
      ) : (
        <div style={{ maxWidth: 760, width: '92vw' }}>
          {script.beats[beatIdx].slice(0, revealed).map((line, i) => (
            <div
              key={`${beatIdx}-${i}`}
              style={{
                fontSize: 18, lineHeight: 2.2, letterSpacing: '0.10em',
                color: 'rgba(247,244,232,0.94)',
                opacity: 0,
                animation: 'endingFade 480ms ease forwards',
              }}
            >
              {line}
            </div>
          ))}
          <div style={{
            position: 'absolute', right: 24, bottom: 20,
            fontSize: 11, letterSpacing: '0.24em', color: 'rgba(247,244,232,0.38)',
          }}>
            点击屏幕  快进
          </div>
        </div>
      )}

      <style>{`
        @keyframes endingFade {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
