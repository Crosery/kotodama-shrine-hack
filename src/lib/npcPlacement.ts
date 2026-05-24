import {
  PLAYER_FEET_OFFSET,
  SCENE_HEIGHT,
  SCENE_WIDTH,
  type Rect,
} from '@/data/scene'
import { ACTIVE_WALKABLE } from '@/lib/annotationOverride'
import { feetAllowed, type Vec2 } from '@/lib/collision'
import { getPainter } from '@/lib/strokes'

function pointInOverlap(x: number, y: number): boolean {
  const polys = getPainter().overlap
  for (const stroke of polys) {
    if (stroke.length < 3) continue
    let inside = false
    for (let i = 0, j = stroke.length - 1; i < stroke.length; j = i++) {
      const [xi, yi] = stroke[i]
      const [xj, yj] = stroke[j]
      const intersect =
        yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi || 1e-9) + xi
      if (intersect) inside = !inside
    }
    if (inside) return true
  }
  return false
}

function pickWeightedRect(rects: Rect[], rng: () => number): Rect {
  const total = rects.reduce((s, r) => s + r.w * r.h, 0)
  let pick = rng() * total
  for (const r of rects) {
    pick -= r.w * r.h
    if (pick <= 0) return r
  }
  return rects[rects.length - 1]
}

export function randomLegalSpawn(rng: () => number = Math.random, maxAttempts = 400): Vec2 | null {
  const useWhitelist = ACTIVE_WALKABLE.length > 0
  // walkable 空时整图均匀采样，留出 sprite 半宽 / 半高边距
  const PAD_X = PLAYER_FEET_OFFSET.x
  const PAD_Y = PLAYER_FEET_OFFSET.y
  for (let i = 0; i < maxAttempts; i++) {
    let cx: number
    let cy: number
    if (useWhitelist) {
      const r = pickWeightedRect(ACTIVE_WALKABLE, rng)
      cx = r.x + rng() * r.w
      cy = r.y + rng() * r.h
    } else {
      cx = PAD_X + rng() * (SCENE_WIDTH - PAD_X * 2)
      cy = PAD_Y + rng() * (SCENE_HEIGHT - PAD_Y - 12)
    }
    const topLeft = { x: cx - PLAYER_FEET_OFFSET.x, y: cy - PLAYER_FEET_OFFSET.y }
    if (!feetAllowed(topLeft)) continue
    // sprite 上半身像素在 (cx-72, cy-180) ~ (cx+72, cy) 范围内
    // 5 个采样点落入前景 overlap 内 = 会被遮挡看不见 → 拒绝
    const samples: Array<[number, number]> = [
      [cx, cy],
      [cx, cy - 90],
      [cx, cy - 180],
      [cx - 60, cy - 90],
      [cx + 60, cy - 90],
    ]
    let buried = 0
    for (const [sx, sy] of samples) if (pointInOverlap(sx, sy)) buried++
    if (buried >= 2) continue
    return topLeft
  }
  return null
}

function feetPos(topLeft: Vec2): Vec2 {
  return { x: topLeft.x + PLAYER_FEET_OFFSET.x, y: topLeft.y + PLAYER_FEET_OFFSET.y }
}

export function placeNpcs(
  ids: string[],
  opts: { minDist?: number; awayFrom?: Vec2[]; rng?: () => number } = {},
): Map<string, Vec2> {
  const { minDist = 240, awayFrom = [], rng = Math.random } = opts
  const placed = new Map<string, Vec2>()
  const occupiedFeet = awayFrom.map((tl) => feetPos(tl))
  for (const id of ids) {
    let chosen: Vec2 | null = null
    for (let attempt = 0; attempt < 80; attempt++) {
      const cand = randomLegalSpawn(rng)
      if (!cand) break
      const f = feetPos(cand)
      const tooClose = occupiedFeet.some((p) => Math.hypot(f.x - p.x, f.y - p.y) < minDist)
      if (!tooClose) {
        chosen = cand
        break
      }
    }
    if (!chosen) chosen = randomLegalSpawn(rng)
    if (chosen) {
      placed.set(id, chosen)
      occupiedFeet.push(feetPos(chosen))
    }
  }
  return placed
}
