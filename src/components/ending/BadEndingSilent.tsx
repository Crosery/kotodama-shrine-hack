import { useEffect, useState } from 'react'
import { asset } from '@/data/sceneAssets'

const CG_URL = asset('/ui/cg/bad-end-silent.webp')

// 沉默 BAD END：鸟居在参道里说的话，一句一句浮出来
// 队友写的原稿太散，凝练 3 段 7 句；玩家点击/键入可加速跳过当前段
const BEATS: Array<Array<string>> = [
  [
    '▍ 走这么快？',
    '▍ ……好。结局成立。',
  ],
  [
    '▍ 言灵一字不说——沉默也会被补全。',
    '▍ 你不写 "火"，火自己会来。',
    '▍ 你不写 "罪"，罪会落在某个人身上。',
    '▍ 你离开得越干净，结界写得越随便。',
  ],
  [
    '▍ ……下次出生，至少留一个词。',
    '▍ 别把 "最坏的版本"，交给别人去说。',
  ],
]

const LINE_DELAY_MS = 1600
const BEAT_GAP_MS = 1100

export default function BadEndingSilent({ onDone }: { onDone: () => void }) {
  const [beatIdx, setBeatIdx] = useState(0)
  const [revealed, setRevealed] = useState(0) // 当前 beat 内已显示行数
  const [phase, setPhase] = useState<'reveal' | 'gap' | 'card' | 'card-stay'>('reveal')

  // 自动逐行揭示
  useEffect(() => {
    if (phase !== 'reveal') return
    const beat = BEATS[beatIdx]
    if (revealed >= beat.length) {
      const t = window.setTimeout(() => setPhase('gap'), BEAT_GAP_MS)
      return () => window.clearTimeout(t)
    }
    const t = window.setTimeout(() => setRevealed((n) => n + 1), LINE_DELAY_MS)
    return () => window.clearTimeout(t)
  }, [phase, beatIdx, revealed])

  // gap 到下一 beat 或 card
  useEffect(() => {
    if (phase !== 'gap') return
    if (beatIdx + 1 >= BEATS.length) {
      setPhase('card')
      const t = window.setTimeout(() => setPhase('card-stay'), 800)
      return () => window.clearTimeout(t)
    }
    setBeatIdx((i) => i + 1)
    setRevealed(0)
    setPhase('reveal')
  }, [phase, beatIdx])

  // 点击/键入：跳过当前段到尾，再次点击进入下一段；card 阶段任意点击关闭
  function advance() {
    if (phase === 'card-stay') { onDone(); return }
    if (phase === 'card') return
    const beat = BEATS[beatIdx]
    if (revealed < beat.length) {
      setRevealed(beat.length)
    } else if (phase === 'reveal') {
      setPhase('gap')
    }
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === ' ' || e.key === 'Enter' || e.key === 'Escape') {
        e.preventDefault()
        advance()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  return (
    <div
      onClick={advance}
      style={{
        position: 'fixed', inset: 0, zIndex: 9998,
        background: `linear-gradient(rgba(5,3,9,0.66), rgba(5,3,9,0.86)), url("${CG_URL}") center/cover no-repeat`,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        color: 'rgba(247,244,232,0.92)',
        fontFamily: '"Microsoft YaHei", "PingFang SC", "Noto Sans SC", sans-serif',
        padding: '40px 24px', cursor: 'pointer',
      }}
    >
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
          <div style={{
            fontSize: 14, letterSpacing: '0.5em', color: 'rgba(247,244,232,0.42)', marginBottom: 22,
          }}>
            言灵神社 · BAD END
          </div>
          <div style={{
            fontSize: 64, letterSpacing: '0.35em', fontWeight: 200,
            textShadow: '0 0 26px rgba(255,46,154,0.32), 0 0 64px rgba(46,230,230,0.18)',
          }}>
            沉&nbsp;默
          </div>
          {phase === 'card-stay' ? (
            <div style={{
              marginTop: 48, fontSize: 12, letterSpacing: '0.32em', color: 'rgba(247,244,232,0.46)',
            }}>
              点击任意处返回主界面
            </div>
          ) : null}
        </>
      ) : (
        <div style={{ maxWidth: 720, width: '90vw' }}>
          {BEATS[beatIdx].slice(0, revealed).map((line, i) => (
            <div
              key={`${beatIdx}-${i}`}
              style={{
                fontSize: 18,
                lineHeight: 2.2,
                letterSpacing: '0.10em',
                color: 'rgba(247,244,232,0.94)',
                opacity: 0,
                animation: 'badEndFade 480ms ease forwards',
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
        @keyframes badEndFade {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
