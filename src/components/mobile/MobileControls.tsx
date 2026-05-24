import { useEffect, useRef, useState } from 'react'
import { pressInteract, resetDir, setStickDirection } from '@/lib/inputBus'

// 尺寸用 vmin（视口短边的百分比）让按钮按手机分辨率自适应；clamp 防极端机型过大过小
// iPhone landscape 393 短边 → 22vmin ≈ 86px；iPad 1024 短边 → clamp 到 128px 上限
const STICK_DIAMETER_CSS = 'clamp(88px, 22vmin, 128px)'
const KNOB_DIAMETER_CSS = 'clamp(40px, 10vmin, 60px)'
const BUTTON_DIAMETER_CSS = 'clamp(64px, 17vmin, 96px)'

export default function MobileControls() {
  const baseRef = useRef<HTMLDivElement | null>(null)
  const [knob, setKnob] = useState({ x: 0, y: 0 })
  const draggingRef = useRef(false)
  const pointerIdRef = useRef<number | null>(null)
  const centerRef = useRef<{ x: number; y: number; r: number } | null>(null)

  useEffect(() => () => resetDir(), [])

  function onPointerDown(ev: React.PointerEvent) {
    ev.preventDefault()
    const rect = baseRef.current!.getBoundingClientRect()
    // 每次按下时读取真实尺寸，半径跟随当前 CSS（vmin）渲染结果，math 永远对齐视觉
    centerRef.current = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
      r: rect.width / 2,
    }
    draggingRef.current = true
    pointerIdRef.current = ev.pointerId
    baseRef.current!.setPointerCapture(ev.pointerId)
    update(ev.clientX, ev.clientY)
  }

  function onPointerMove(ev: React.PointerEvent) {
    if (!draggingRef.current || ev.pointerId !== pointerIdRef.current) return
    update(ev.clientX, ev.clientY)
  }

  function onPointerUp(ev: React.PointerEvent) {
    if (ev.pointerId !== pointerIdRef.current) return
    draggingRef.current = false
    pointerIdRef.current = null
    try { baseRef.current!.releasePointerCapture(ev.pointerId) } catch { /* ignore */ }
    setKnob({ x: 0, y: 0 })
    resetDir()
  }

  function update(clientX: number, clientY: number) {
    const c = centerRef.current
    if (!c) return
    let dx = clientX - c.x
    let dy = clientY - c.y
    const len = Math.hypot(dx, dy)
    if (len > c.r) {
      dx = (dx / len) * c.r
      dy = (dy / len) * c.r
    }
    setKnob({ x: dx, y: dy })
    setStickDirection(dx / c.r, dy / c.r)
  }

  function onActionDown(ev: React.PointerEvent) {
    ev.preventDefault()
    pressInteract()
  }

  return (
    <>
      {/* 左侧虚拟摇杆，竖向居中悬浮在屏幕左缘 */}
      <div
        ref={baseRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{
          position: 'fixed',
          left: 'max(20px, env(safe-area-inset-left))',
          top: '50%',
          transform: 'translateY(-50%)',
          width: STICK_DIAMETER_CSS,
          height: STICK_DIAMETER_CSS,
          borderRadius: '50%',
          background: 'rgba(18,8,31,0.50)',
          border: '2px solid rgba(46,230,230,0.55)',
          boxShadow: '0 0 14px rgba(46,230,230,0.25)',
          zIndex: 41,
          touchAction: 'none',
          userSelect: 'none',
          WebkitUserSelect: 'none',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: KNOB_DIAMETER_CSS,
            height: KNOB_DIAMETER_CSS,
            transform: `translate(-50%, -50%) translate(${knob.x}px, ${knob.y}px)`,
            borderRadius: '50%',
            background: 'rgba(46,230,230,0.60)',
            border: '2px solid rgba(247,244,232,0.88)',
            pointerEvents: 'none',
          }}
        />
      </div>

      {/* 右侧互动按钮，竖向居中悬浮在屏幕右缘 */}
      <button
        type="button"
        onPointerDown={onActionDown}
        style={{
          position: 'fixed',
          right: 'max(20px, env(safe-area-inset-right))',
          top: '50%',
          transform: 'translateY(-50%)',
          width: BUTTON_DIAMETER_CSS,
          height: BUTTON_DIAMETER_CSS,
          borderRadius: '50%',
          background: 'rgba(255,46,154,0.22)',
          border: '2px solid rgba(255,46,154,0.85)',
          color: 'rgba(247,244,232,0.95)',
          fontSize: 'clamp(13px, 3.2vmin, 18px)',
          fontWeight: 600,
          letterSpacing: '0.12em',
          boxShadow: '0 0 14px rgba(255,46,154,0.30)',
          touchAction: 'none',
          zIndex: 41,
          WebkitUserSelect: 'none',
          userSelect: 'none',
        }}
      >
        互动
      </button>
    </>
  )
}
