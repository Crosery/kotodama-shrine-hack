import { SCENE_HEIGHT, SCENE_WIDTH } from '@/data/scene'
import { SCENE_ASSETS, asset } from '@/data/sceneAssets'
import { sceneToScreen } from '@/lib/coords'
import { useSceneViewport } from '@/hooks/useSceneViewport'
import { SKELETON_OVERLAPS, SOLID_OVERLAPS } from '@/data/overlapCutouts'

const CLIP_ID = 'painter-overlap-clip'

export default function OverlapLayer() {
  const vp = useSceneViewport()

  return (
    <div className="pointer-events-none absolute inset-0" style={{ zIndex: 15 }}>
      {/* 实心遮挡：SVG clipPath 把背景按 polygon 区域重画到玩家上方 */}
      {SOLID_OVERLAPS.length > 0 ? (
        <svg
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
          }}
          viewBox={`0 0 ${SCENE_WIDTH} ${SCENE_HEIGHT}`}
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <clipPath id={CLIP_ID} clipPathUnits="userSpaceOnUse">
              {SOLID_OVERLAPS.map((o) => {
                const pts = o.points.map(([x, y]) => `${x},${y}`).join(' ')
                return <polygon key={o.id} points={pts} />
              })}
            </clipPath>
          </defs>
          <image
            href={SCENE_ASSETS.background}
            x={0}
            y={0}
            width={SCENE_WIDTH}
            height={SCENE_HEIGHT}
            clipPath={`url(#${CLIP_ID})`}
            style={{ imageRendering: 'pixelated' } as React.CSSProperties}
          />
        </svg>
      ) : null}

      {/* 骨架遮挡：边缘 Canny mask PNG，物件镂空处玩家可见 */}
      {SKELETON_OVERLAPS.map((c) => {
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
