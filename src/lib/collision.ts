import {
  PLAYER_FEET_HALF,
  PLAYER_FEET_OFFSET,
  SCENE_HEIGHT,
  SCENE_WIDTH,
  type Polygon,
  type Rect,
  type TriggerZone,
} from '@/data/scene'
import {
  ACTIVE_OBSTACLE,
  ACTIVE_OBSTACLE_POLYGONS,
  ACTIVE_TRIGGERS,
  ACTIVE_WALKABLE,
} from '@/lib/annotationOverride'
import { getPainter, strokeHitsPoint } from '@/lib/strokes'

const STROKE_PAD = 14

export type Vec2 = { x: number; y: number }

export function pointInRect(p: Vec2, r: Rect) {
  return p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h
}

export function inAnyRect(p: Vec2, list: Rect[]) {
  for (const r of list) if (pointInRect(p, r)) return true
  return false
}

export function rectsOverlap(a: Rect, b: Rect) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
}

export function pointInPolygon(p: Vec2, poly: Polygon) {
  const pts = poly.points
  if (pts.length < 3) return false
  let inside = false
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const xi = pts[i].x, yi = pts[i].y
    const xj = pts[j].x, yj = pts[j].y
    const intersect =
      yi > p.y !== yj > p.y &&
      p.x < ((xj - xi) * (p.y - yi)) / (yj - yi || 1e-9) + xi
    if (intersect) inside = !inside
  }
  return inside
}

export function feetBox(spriteTopLeft: Vec2): Rect {
  const cx = spriteTopLeft.x + PLAYER_FEET_OFFSET.x
  const cy = spriteTopLeft.y + PLAYER_FEET_OFFSET.y
  return {
    x: cx - PLAYER_FEET_HALF.w,
    y: cy - PLAYER_FEET_HALF.h,
    w: PLAYER_FEET_HALF.w * 2,
    h: PLAYER_FEET_HALF.h * 2,
  }
}

function feetCorners(box: Rect): Vec2[] {
  return [
    { x: box.x, y: box.y },
    { x: box.x + box.w, y: box.y },
    { x: box.x, y: box.y + box.h },
    { x: box.x + box.w, y: box.y + box.h },
    { x: box.x + box.w / 2, y: box.y + box.h / 2 },
  ]
}

export function feetAllowed(spriteTopLeft: Vec2) {
  const box = feetBox(spriteTopLeft)
  const corners = feetCorners(box)
  // walkable 非空时走白名单；空时不约束（painter 障碍 stroke + 边界 clamp 即足够）
  if (ACTIVE_WALKABLE.length > 0) {
    for (const c of corners) if (!inAnyRect(c, ACTIVE_WALKABLE)) return false
  }
  for (const o of ACTIVE_OBSTACLE) if (rectsOverlap(box, o)) return false
  for (const poly of ACTIVE_OBSTACLE_POLYGONS) {
    for (const c of corners) if (pointInPolygon(c, poly)) return false
  }
  const painter = getPainter()
  for (const stroke of painter.obstacle) {
    for (const c of corners) {
      if (strokeHitsPoint(stroke, c.x, c.y, STROKE_PAD)) return false
    }
  }
  return true
}

function clampToScene(topLeft: Vec2): Vec2 {
  const minX = -PLAYER_FEET_OFFSET.x + PLAYER_FEET_HALF.w
  const maxX = SCENE_WIDTH - PLAYER_FEET_OFFSET.x - PLAYER_FEET_HALF.w
  const minY = -PLAYER_FEET_OFFSET.y + PLAYER_FEET_HALF.h
  const maxY = SCENE_HEIGHT - PLAYER_FEET_OFFSET.y - PLAYER_FEET_HALF.h
  return {
    x: Math.max(minX, Math.min(maxX, topLeft.x)),
    y: Math.max(minY, Math.min(maxY, topLeft.y)),
  }
}

export function tryMove(spriteTopLeft: Vec2, dx: number, dy: number): Vec2 {
  let next = { x: spriteTopLeft.x, y: spriteTopLeft.y }
  if (dx !== 0) {
    const cand = clampToScene({ x: next.x + dx, y: next.y })
    if (feetAllowed(cand)) next = cand
  }
  if (dy !== 0) {
    const cand = clampToScene({ x: next.x, y: next.y + dy })
    if (feetAllowed(cand)) next = cand
  }
  return next
}

export function findTriggerUnder(spriteTopLeft: Vec2): TriggerZone | null {
  const cx = spriteTopLeft.x + PLAYER_FEET_OFFSET.x
  const cy = spriteTopLeft.y + PLAYER_FEET_OFFSET.y
  for (const z of ACTIVE_TRIGGERS) if (pointInRect({ x: cx, y: cy }, z)) return z
  return null
}
