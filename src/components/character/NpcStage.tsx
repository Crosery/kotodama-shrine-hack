import { useEffect, useRef, useState } from 'react'
import { getCharacter } from '@/data/characters'
import {
  PLAYER_FEET_OFFSET,
  SCENE_HEIGHT,
  SCENE_WIDTH,
} from '@/data/scene'
import {
  getNpcSpots,
  subscribeNpcSpots,
  updateNpcSpot,
  type NpcSpot,
} from '@/data/npcStore'
import { sceneToScreen } from '@/lib/coords'
import { useSceneViewport } from '@/hooks/useSceneViewport'
import CharacterSprite from '@/components/character/CharacterSprite'

export default function NpcStage({
  showDebug,
  editMode,
}: {
  showDebug?: boolean
  editMode?: boolean
}) {
  const vp = useSceneViewport()
  const [spots, setSpots] = useState<NpcSpot[]>(() => getNpcSpots())

  useEffect(() => {
    setSpots(getNpcSpots())
    const off = subscribeNpcSpots((v) => setSpots([...v]))
    return () => {
      off()
    }
  }, [])

  const draggingRef = useRef<{ id: string; dx: number; dy: number } | null>(null)

  function clampScene(v: number, max: number) {
    return Math.max(0, Math.min(max, v))
  }

  function handlePointerDown(ev: React.PointerEvent, spot: NpcSpot) {
    if (!editMode) return
    ev.stopPropagation()
    ev.preventDefault()
    const target = ev.currentTarget as HTMLElement
    target.setPointerCapture(ev.pointerId)
    const scr = sceneToScreen(vp, spot.x, spot.y)
    draggingRef.current = {
      id: spot.id,
      dx: ev.clientX - scr.x,
      dy: ev.clientY - scr.y,
    }
  }

  function handlePointerMove(ev: React.PointerEvent) {
    const d = draggingRef.current
    if (!d) return
    const screenX = ev.clientX - d.dx
    const screenY = ev.clientY - d.dy
    const sceneX = clampScene(Math.round((screenX - vp.offX) / vp.scale), SCENE_WIDTH)
    const sceneY = clampScene(Math.round((screenY - vp.offY) / vp.scale), SCENE_HEIGHT)
    updateNpcSpot(d.id, { x: sceneX, y: sceneY })
  }

  function handlePointerUp(ev: React.PointerEvent) {
    const d = draggingRef.current
    if (!d) return
    const target = ev.currentTarget as HTMLElement
    try {
      target.releasePointerCapture(ev.pointerId)
    } catch {
      /* ignore */
    }
    const current = getNpcSpots().find((s) => s.id === d.id)
    if (current) {
      // eslint-disable-next-line no-console
      console.log(`[npc] ${d.id} -> (${current.x}, ${current.y})`)
    }
    draggingRef.current = null
  }

  return (
    <>
      {spots.map((spot) => {
        const cfg = getCharacter(spot.id)
        const spriteTopLeftX = spot.x - PLAYER_FEET_OFFSET.x
        const spriteTopLeftY = spot.y - PLAYER_FEET_OFFSET.y
        const screen = sceneToScreen(vp, spriteTopLeftX, spriteTopLeftY)
        return (
          <div
            key={spot.id}
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: cfg.pixelWidth,
              height: cfg.pixelHeight,
              transform: `translate3d(${screen.x}px, ${screen.y}px, 0) scale(${vp.scale})`,
              transformOrigin: 'top left',
              willChange: 'transform',
              pointerEvents: editMode ? 'auto' : 'none',
              cursor: editMode ? 'grab' : 'default',
              zIndex: 5,
              touchAction: 'none',
            }}
            onPointerDown={(ev) => handlePointerDown(ev, spot)}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            <CharacterSprite character={cfg} state="idle" />
            {(showDebug || editMode) ? (
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  top: -28,
                  padding: '2px 6px',
                  background: 'rgba(0,0,0,0.7)',
                  color: editMode ? '#2ee6e6' : '#ffe066',
                  fontSize: 12,
                  fontFamily: 'ui-monospace, monospace',
                  whiteSpace: 'nowrap',
                  pointerEvents: 'none',
                }}
              >
                {cfg.displayName} ({Math.round(spot.x)},{Math.round(spot.y)})
              </div>
            ) : null}
          </div>
        )
      })}
    </>
  )
}
