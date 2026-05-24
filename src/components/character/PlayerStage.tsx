import { useEffect, useRef, useState } from 'react'
import { CHARACTERS, type SpriteState } from '@/data/characters'
import {
  OBSTACLE_RECTS,
  PLAYER_FEET_OFFSET,
  PLAYER_SPAWN,
  PLAYER_SPEED,
  TRIGGER_ZONES,
  WALKABLE_RECTS,
  type TriggerZone,
} from '@/data/scene'
import { findTriggerUnder, tryMove } from '@/lib/collision'
import { sceneToScreen, type SceneViewport } from '@/lib/coords'
import { useKeyboardMovement } from '@/hooks/useKeyboardMovement'
import { useSceneViewport } from '@/hooks/useSceneViewport'
import CharacterSprite from '@/components/character/CharacterSprite'
import { getCharacter } from '@/data/characters'
import { getNpcSpots, type NpcSpot } from '@/data/npcStore'

type Facing = 'front' | 'back' | 'left' | 'right'

export type NpcInteractInfo = { id: string; displayName: string; x: number; y: number }

export default function PlayerStage({
  onInteract,
  onNpcInteract,
  showDebug,
}: {
  onInteract?: (zone: TriggerZone) => void
  onNpcInteract?: (npc: NpcInteractInfo) => void
  showDebug?: boolean
}) {
  const character = CHARACTERS.miko
  const { dirRef, actionRef } = useKeyboardMovement()
  const posRef = useRef({ ...PLAYER_SPAWN })
  const facingRef = useRef<Facing>('front')
  const movingRef = useRef(false)
  const wrapperRef = useRef<HTMLDivElement | null>(null)
  const viewport: SceneViewport = useSceneViewport()
  const [spriteState, setSpriteState] = useState<SpriteState>('idle')
  const [hint, setHint] = useState<TriggerZone | null>(null)
  const [npcHint, setNpcHint] = useState<NpcSpot | null>(null)

  useEffect(() => {
    let raf = 0
    let last: number | null = null
    function tick(ts: number) {
      const dt = last == null ? 0 : Math.min(0.05, (ts - last) / 1000)
      last = ts

      const d = dirRef.current
      let dx = (d.right ? 1 : 0) - (d.left ? 1 : 0)
      let dy = (d.down ? 1 : 0) - (d.up ? 1 : 0)
      if (dx !== 0 && dy !== 0) {
        dx *= Math.SQRT1_2
        dy *= Math.SQRT1_2
      }
      const step = PLAYER_SPEED * dt
      const moving = dx !== 0 || dy !== 0
      if (moving) {
        posRef.current = tryMove(posRef.current, dx * step, dy * step)
        let nextFacing = facingRef.current
        if (Math.abs(dx) >= Math.abs(dy)) nextFacing = dx > 0 ? 'right' : 'left'
        else nextFacing = dy > 0 ? 'front' : 'back'
        facingRef.current = nextFacing
      }

      const desired: SpriteState = moving ? (`walk-${facingRef.current}` as SpriteState) : 'idle'
      if (desired !== spriteState) setSpriteState(desired)
      if (moving !== movingRef.current) movingRef.current = moving

      if (wrapperRef.current) {
        const s = sceneToScreen(viewport, posRef.current.x, posRef.current.y)
        wrapperRef.current.style.transform = `translate3d(${s.x}px, ${s.y}px, 0) scale(${viewport.scale})`
      }

      const trigger = findTriggerUnder(posRef.current)
      setHint((prev) => (prev?.id === trigger?.id ? prev : trigger))

      // NPC 对话范围检测
      const feetX = posRef.current.x + PLAYER_FEET_OFFSET.x
      const feetY = posRef.current.y + PLAYER_FEET_OFFSET.y
      let nearestNpc: NpcSpot | null = null
      let bestDist = Infinity
      for (const s of getNpcSpots()) {
        const d2 = (feetX - s.x) ** 2 + (feetY - s.y) ** 2
        if (d2 <= s.talkRadius * s.talkRadius && d2 < bestDist) {
          bestDist = d2
          nearestNpc = s
        }
      }
      setNpcHint((prev) => (prev?.id === nearestNpc?.id ? prev : nearestNpc))

      if (actionRef.current.interactPressed) {
        // 消费后立即复位（共享自 inputBus.actionState）
        actionRef.current.interactPressed = false
        if (nearestNpc && onNpcInteract) {
          const cfg = getCharacter(nearestNpc.id)
          onNpcInteract({ id: nearestNpc.id, displayName: cfg.displayName, x: nearestNpc.x, y: nearestNpc.y })
        } else if (trigger && onInteract) {
          onInteract(trigger)
        }
      }

      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [viewport, dirRef, actionRef, onInteract, onNpcInteract, spriteState])

  const initialScreen = sceneToScreen(viewport, posRef.current.x, posRef.current.y)
  const feetScreen = sceneToScreen(
    viewport,
    posRef.current.x + PLAYER_FEET_OFFSET.x,
    posRef.current.y + PLAYER_FEET_OFFSET.y,
  )

  return (
    <>
      <div
        ref={wrapperRef}
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: character.pixelWidth,
          height: character.pixelHeight,
          transform: `translate3d(${initialScreen.x}px, ${initialScreen.y}px, 0) scale(${viewport.scale})`,
          transformOrigin: 'top left',
          willChange: 'transform',
          pointerEvents: 'none',
          zIndex: 10,
        }}
      >
        <CharacterSprite character={character} state={spriteState} scale={1} />
      </div>

      {hint ? (
        <div style={{ position: 'absolute', inset: 0, zIndex: 25, pointerEvents: 'none' }}>
          <TriggerHint
            zone={hint}
            screenX={feetScreen.x}
            screenY={feetScreen.y - 60 * viewport.scale}
          />
        </div>
      ) : null}

      {npcHint ? (
        <NpcHint viewport={viewport} npc={npcHint} />
      ) : null}

      {showDebug ? <DebugOverlay viewport={viewport} pos={posRef.current} hint={hint} /> : null}
    </>
  )
}

function NpcHint({ npc, viewport }: { npc: NpcSpot; viewport: SceneViewport }) {
  const cfg = getCharacter(npc.id)
  const headScene = { x: npc.x, y: npc.y - 220 }
  const s = sceneToScreen(viewport, headScene.x, headScene.y)
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 25, pointerEvents: 'none' }}>
      <div
        style={{
          position: 'absolute',
          left: s.x,
          top: s.y,
          transform: 'translate(-50%, -100%)',
        }}
        className="k-pixel-bubble border-[rgba(46,230,230,0.32)] bg-[rgba(18,8,31,0.78)] px-3 py-2 text-xs tracking-[0.12em] text-[rgba(46,230,230,0.92)] shadow-[0_0_0_1px_rgba(46,230,230,0.18),0_0_22px_rgba(46,230,230,0.16)] whitespace-nowrap"
      >
        <span className="mr-2 rounded-sm border border-current px-1 py-[1px] text-[10px]">E</span>
        与{cfg.displayName}对话
      </div>
    </div>
  )
}

function TriggerHint({ zone, screenX, screenY }: { zone: TriggerZone; screenX: number; screenY: number }) {
  return (
    <div
      style={{
        position: 'absolute',
        left: screenX,
        top: screenY,
        transform: 'translate(-50%, -100%)',
        pointerEvents: 'none',
      }}
      className="k-pixel-bubble border-[rgba(46,230,230,0.32)] bg-[rgba(18,8,31,0.78)] px-3 py-2 text-xs tracking-[0.12em] text-[rgba(46,230,230,0.92)] shadow-[0_0_0_1px_rgba(46,230,230,0.18),0_0_22px_rgba(46,230,230,0.16)] whitespace-nowrap"
    >
      <span className="mr-2 rounded-sm border border-current px-1 py-[1px] text-[10px]">E</span>
      {zone.label}
    </div>
  )
}

function DebugOverlay({
  viewport,
  pos,
  hint,
}: {
  viewport: SceneViewport
  pos: { x: number; y: number }
  hint: TriggerZone | null
}) {
  return (
    <div className="pointer-events-none absolute inset-0">
      {WALKABLE_RECTS.map((r, i) => {
        const s = sceneToScreen(viewport, r.x, r.y)
        return (
          <div
            key={`walk_${i}`}
            style={{
              position: 'absolute',
              left: s.x,
              top: s.y,
              width: r.w * viewport.scale,
              height: r.h * viewport.scale,
              border: '2px solid rgba(120,255,160,0.55)',
              background: 'rgba(120,255,160,0.08)',
            }}
          />
        )
      })}
      {OBSTACLE_RECTS.map((r, i) => {
        const s = sceneToScreen(viewport, r.x, r.y)
        return (
          <div
            key={`obs_${i}`}
            style={{
              position: 'absolute',
              left: s.x,
              top: s.y,
              width: r.w * viewport.scale,
              height: r.h * viewport.scale,
              border: '2px solid rgba(255,80,80,0.75)',
              background: 'rgba(255,80,80,0.18)',
            }}
          />
        )
      })}
      {TRIGGER_ZONES.map((z) => {
        const s = sceneToScreen(viewport, z.x, z.y)
        const active = hint?.id === z.id
        return (
          <div
            key={`tz_${z.id}`}
            style={{
              position: 'absolute',
              left: s.x,
              top: s.y,
              width: z.w * viewport.scale,
              height: z.h * viewport.scale,
              border: `3px dashed ${active ? '#2ee6e6' : 'rgba(46,230,230,0.80)'}`,
              background: active ? 'rgba(46,230,230,0.28)' : 'rgba(46,230,230,0.10)',
              boxShadow: active ? '0 0 18px rgba(46,230,230,0.6)' : 'none',
            }}
          />
        )
      })}
      <div
        style={{
          position: 'absolute',
          left: 12,
          top: 12,
          padding: '6px 10px',
          background: 'rgba(0,0,0,0.55)',
          color: '#f4a8c9',
          font: '12px ui-monospace, monospace',
          letterSpacing: '0.08em',
        }}
      >
        pos {Math.round(pos.x)},{Math.round(pos.y)} · scale {viewport.scale.toFixed(2)} · trigger {hint?.id ?? '-'}
      </div>
    </div>
  )
}
