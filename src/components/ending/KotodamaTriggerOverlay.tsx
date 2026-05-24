import { useEffect, useState } from 'react'
import type { LastTriggered } from '@/lib/npcStateStore'

// 言灵触发瞬间的全屏震撼弹窗：暗下背景 + 中心放大"言灵 · 已成" + 引用玩家原话 + 描述 NPC 改变行动
// 4 秒后淡出；玩家点击任意处可提前关闭
export default function KotodamaTriggerOverlay({
  event,
  onDismiss,
}: {
  event: LastTriggered
  onDismiss: () => void
}) {
  const [phase, setPhase] = useState<'enter' | 'hold' | 'leave'>('enter')

  useEffect(() => {
    const t1 = window.setTimeout(() => setPhase('hold'), 100)
    const t2 = window.setTimeout(() => setPhase('leave'), 3800)
    const t3 = window.setTimeout(() => onDismiss(), 4400)
    return () => { window.clearTimeout(t1); window.clearTimeout(t2); window.clearTimeout(t3) }
  }, [event.ts, onDismiss])

  function dismiss() {
    setPhase('leave')
    window.setTimeout(onDismiss, 320)
  }

  const opacity = phase === 'leave' ? 0 : 1
  const scale = phase === 'enter' ? 0.85 : phase === 'leave' ? 1.04 : 1

  return (
    <div
      onClick={dismiss}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: `radial-gradient(800px 600px at 50% 50%, rgba(46,230,230,0.20), rgba(7,5,13,0.85) 60%, rgba(7,5,13,0.96) 100%)`,
        opacity, transition: 'opacity 320ms ease',
        cursor: 'pointer',
        fontFamily: '"Microsoft YaHei", "PingFang SC", "Noto Sans SC", sans-serif',
      }}
    >
      {/* 旁边粉/青向中心冲击的光条 */}
      <div className="kt-beam kt-beam-l" />
      <div className="kt-beam kt-beam-r" />

      <div
        style={{
          transform: `scale(${scale})`,
          transition: 'transform 420ms cubic-bezier(0.2, 0.9, 0.3, 1.0)',
          padding: 'clamp(28px, 4vw, 56px) clamp(36px, 6vw, 84px)',
          background: 'rgba(7,5,13,0.78)',
          border: '1px solid rgba(46,230,230,0.45)',
          boxShadow: '0 0 0 1px rgba(46,230,230,0.30), 0 0 60px rgba(46,230,230,0.32), 0 0 140px rgba(255,46,154,0.28)',
          borderRadius: 4,
          textAlign: 'center',
          color: 'rgba(247,244,232,0.95)',
          maxWidth: 'min(720px, 92vw)',
        }}
      >
        <div style={{
          fontSize: 11, letterSpacing: '0.6em', color: 'rgba(46,230,230,0.78)',
          marginBottom: 14,
        }}>
          KOTODAMA · 言灵
        </div>

        <div style={{
          fontSize: 'clamp(36px, 6.5vw, 76px)',
          letterSpacing: '0.32em', fontWeight: 200,
          textShadow: '0 0 22px rgba(46,230,230,0.55), 0 0 64px rgba(255,46,154,0.32)',
          marginBottom: 22,
        }}>
          已 &nbsp; 成
        </div>

        {event.phrase ? (
          <div style={{
            fontSize: 14, lineHeight: 1.9, letterSpacing: '0.08em',
            color: 'rgba(247,244,232,0.88)',
            marginBottom: 16,
            fontStyle: 'italic',
          }}>
            <span style={{ color: 'rgba(46,230,230,0.78)', marginRight: 6 }}>「</span>
            {event.phrase}
            <span style={{ color: 'rgba(46,230,230,0.78)', marginLeft: 6 }}>」</span>
          </div>
        ) : null}

        <div style={{
          fontSize: 13, letterSpacing: '0.16em', color: 'rgba(255,168,201,0.92)',
          marginBottom: event.action ? 16 : 0,
        }}>
          —— 这句话，种入了 <strong style={{ color: 'rgba(255,168,201,1.0)' }}>{event.displayName ?? event.id}</strong> 的心 ——
        </div>

        {event.action ? (
          <div style={{
            marginTop: 8,
            padding: '12px 18px',
            background: 'rgba(46,230,230,0.10)',
            border: '1px solid rgba(46,230,230,0.42)',
            color: 'rgba(247,244,232,0.92)',
            fontSize: 13, lineHeight: 1.8, letterSpacing: '0.10em',
            borderRadius: 3,
          }}>
            今夜 ta 会： {event.action}
          </div>
        ) : null}

        <div style={{
          marginTop: 26,
          fontSize: 10, letterSpacing: '0.40em', color: 'rgba(247,244,232,0.46)',
        }}>
          点击任意处继续
        </div>
      </div>

      <style>{`
        .kt-beam {
          position: absolute;
          top: 50%;
          width: 38vw;
          height: 2px;
          transform: translateY(-50%);
          background: linear-gradient(90deg, rgba(46,230,230,0) 0%, rgba(46,230,230,0.85) 50%, rgba(255,46,154,0) 100%);
          box-shadow: 0 0 18px rgba(46,230,230,0.65), 0 0 38px rgba(255,46,154,0.42);
          opacity: 0;
          animation: ktBeam 1200ms ease-out forwards;
        }
        .kt-beam-l { left: -38vw; animation-name: ktBeamL; }
        .kt-beam-r { right: -38vw; animation-name: ktBeamR; }
        @keyframes ktBeamL {
          0%   { opacity: 0; transform: translate(-100%, -50%); }
          40%  { opacity: 1; }
          100% { opacity: 0; transform: translate(38vw, -50%); }
        }
        @keyframes ktBeamR {
          0%   { opacity: 0; transform: translate(100%, -50%); }
          40%  { opacity: 1; }
          100% { opacity: 0; transform: translate(-38vw, -50%); }
        }
      `}</style>
    </div>
  )
}
