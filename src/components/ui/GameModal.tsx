// 游戏内样式化模态框（替代浏览器 confirm/alert）
// 用 ReactDOM.createPortal 挂到 document.body，彻底脱离任何父级 stacking/transform/overflow
// 避免被外层 NpcDialogPanel 这种 fixed+transition+overflow:hidden 的容器困住

import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import type React from 'react'

export default function GameModal({
  title, body, primary, secondary, onPrimary, onCancel, accent = 'cyan',
}: {
  title: string
  body: React.ReactNode
  primary: string
  secondary?: string
  onPrimary: () => void
  onCancel: () => void
  accent?: 'cyan' | 'magenta'
}) {
  const rgb = accent === 'magenta' ? '255,46,154' : '46,230,230'

  // ESC 关闭，覆盖所有页面的 ESC 处理（capture）
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); onCancel() }
    }
    window.addEventListener('keydown', onKey, { capture: true })
    return () => window.removeEventListener('keydown', onKey, { capture: true } as EventListenerOptions)
  }, [onCancel])

  if (typeof document === 'undefined') return null

  const node = (
    <div
      onClick={onCancel}
      style={{
        position: 'fixed', inset: 0, zIndex: 99999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(7,5,13,0.62)', backdropFilter: 'blur(3px)',
        fontFamily: '"Microsoft YaHei", "PingFang SC", "Noto Sans SC", sans-serif',
      }}
    >
      <div
        className="k-pixel-panel"
        onClick={(e) => e.stopPropagation()}
        style={{ padding: '24px 30px', maxWidth: 480, width: '90vw', textAlign: 'center' }}
      >
        <div className="k-title" style={{ fontSize: 14, letterSpacing: '0.32em', marginBottom: 12, color: 'rgba(247,244,232,0.92)' }}>
          {title}
        </div>
        <div style={{ fontSize: 13, lineHeight: 1.9, letterSpacing: '0.06em', color: 'rgba(247,244,232,0.84)', marginBottom: 22 }}>
          {body}
        </div>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          {secondary ? (
            <button
              onClick={onCancel}
              className="k-pixel-bubble"
              style={{
                padding: '8px 18px',
                background: 'rgba(247,244,232,0.06)',
                border: '1px solid rgba(247,244,232,0.30)',
                color: 'rgba(247,244,232,0.82)',
                fontSize: 12, letterSpacing: '0.22em', cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              {secondary}
            </button>
          ) : null}
          <button
            onClick={onPrimary}
            className="k-pixel-bubble"
            style={{
              padding: '8px 22px',
              background: `rgba(${rgb},0.14)`,
              border: `1px solid rgba(${rgb},0.72)`,
              color: `rgba(${rgb},0.98)`,
              fontSize: 12, letterSpacing: '0.22em', cursor: 'pointer', fontFamily: 'inherit',
              boxShadow: `0 0 14px rgba(${rgb},0.28)`,
            }}
          >
            {primary}
          </button>
        </div>
      </div>
    </div>
  )

  return createPortal(node, document.body)
}
