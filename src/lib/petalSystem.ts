import type { MotionLevel } from '@/data/chatTypes'

export type Petal = {
  x: number
  y: number
  vx: number
  vy: number
  r: number
  a: number
  t: number
}

export function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v))
}

export function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

export function densityFor(level: MotionLevel) {
  if (level === 'high') return 1.15
  if (level === 'low') return 0.72
  return 1
}

export function pixelScaleFor(vw: number, vh: number) {
  return clamp(Math.floor(Math.min(vw / 140, vh / 78)), 5, 8)
}

export function spawnPetals(w: number, h: number, density: number): Petal[] {
  const count = Math.round(((w * h) / 1400) * density)
  const petals: Petal[] = []
  for (let i = 0; i < count; i++) {
    petals.push({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() * 0.25 + 0.08) * (Math.random() > 0.5 ? 1 : -1),
      vy: Math.random() * 0.23 + 0.08,
      r: Math.random() * 1.4 + 0.7,
      a: Math.random() * 0.55 + 0.2,
      t: Math.random() * Math.PI * 2,
    })
  }
  return petals
}

export function advancePetals(petals: Petal[], w: number, h: number, dt: number) {
  for (const p of petals) {
    p.t += dt * 0.0012
    p.x += p.vx * dt * 0.06 + Math.sin(p.t) * 0.01
    p.y += p.vy * dt * 0.06 + Math.cos(p.t * 0.7) * 0.01
    if (p.y > h + 2) p.y = -2
    if (p.x > w + 2) p.x = -2
    if (p.x < -2) p.x = w + 2
  }
}

export function drawPetals(ctx: CanvasRenderingContext2D, petals: Petal[], color = '#f4a8c9') {
  for (const p of petals) {
    ctx.globalAlpha = p.a
    ctx.fillStyle = color
    ctx.fillRect(Math.round(p.x), Math.round(p.y), Math.round(p.r), Math.round(p.r))
  }
  ctx.globalAlpha = 1
}
