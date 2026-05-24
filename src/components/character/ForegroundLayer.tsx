import { SCENE_CUTOUTS } from '@/data/cutouts'
import { asset } from '@/data/sceneAssets'
import { sceneToScreen } from '@/lib/coords'
import { useSceneViewport } from '@/hooks/useSceneViewport'

export default function ForegroundLayer() {
  const vp = useSceneViewport()

  return (
    <div className="pointer-events-none absolute inset-0" style={{ zIndex: 15 }}>
      {SCENE_CUTOUTS.map((c) => {
        const s = sceneToScreen(vp, c.sceneX, c.sceneY)
        return (
          <img
            key={c.id}
            src={asset(c.src)}
            alt=""
            draggable={false}
            style={{
              position: 'absolute',
              left: s.x,
              top: s.y,
              width: c.w * vp.scale,
              height: c.h * vp.scale,
              imageRendering: 'pixelated',
              willChange: 'transform',
            }}
          />
        )
      })}
    </div>
  )
}
