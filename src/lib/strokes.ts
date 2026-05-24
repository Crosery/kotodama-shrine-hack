export type Pt = [number, number]
export type Stroke = Pt[]

export type PainterData = {
  obstacle: Stroke[]
  overlap: Stroke[]
}

export const PAINTER_KEY = 'painter.v1'

export function emptyPainter(): PainterData {
  return { obstacle: [], overlap: [] }
}

export function loadPainter(): PainterData {
  if (typeof localStorage === 'undefined') return emptyPainter()
  try {
    const raw = localStorage.getItem(PAINTER_KEY)
    if (!raw) return emptyPainter()
    const data = JSON.parse(raw) as PainterData
    return {
      obstacle: Array.isArray(data.obstacle) ? data.obstacle : [],
      overlap: Array.isArray(data.overlap) ? data.overlap : [],
    }
  } catch {
    return emptyPainter()
  }
}

export function savePainter(d: PainterData) {
  try {
    localStorage.setItem(PAINTER_KEY, JSON.stringify(d))
  } catch {
    /* ignore */
  }
}

let CURRENT: PainterData = loadPainter()
type Listener = (d: PainterData) => void
const listeners = new Set<Listener>()

export function getPainter(): PainterData {
  return CURRENT
}

export function setPainter(d: PainterData, opts: { persist?: boolean } = {}) {
  CURRENT = d
  if (opts.persist ?? true) savePainter(d)
  for (const fn of listeners) fn(CURRENT)
}

export function mergePainter(extra: Partial<PainterData>) {
  setPainter({
    obstacle: [...(extra.obstacle ?? []), ...CURRENT.obstacle],
    overlap: [...(extra.overlap ?? []), ...CURRENT.overlap],
  }, { persist: false })
}

export function subscribePainter(fn: Listener) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function distPointSegment(px: number, py: number, ax: number, ay: number, bx: number, by: number) {
  const dx = bx - ax
  const dy = by - ay
  const len2 = dx * dx + dy * dy
  if (len2 < 1e-6) {
    const ex = px - ax
    const ey = py - ay
    return Math.sqrt(ex * ex + ey * ey)
  }
  let t = ((px - ax) * dx + (py - ay) * dy) / len2
  if (t < 0) t = 0
  else if (t > 1) t = 1
  const cx = ax + t * dx
  const cy = ay + t * dy
  const ex = px - cx
  const ey = py - cy
  return Math.sqrt(ex * ex + ey * ey)
}

export function strokeHitsPoint(stroke: Stroke, x: number, y: number, threshold: number) {
  for (let i = 1; i < stroke.length; i++) {
    const [ax, ay] = stroke[i - 1]
    const [bx, by] = stroke[i]
    if (distPointSegment(x, y, ax, ay, bx, by) <= threshold) return true
  }
  return false
}
