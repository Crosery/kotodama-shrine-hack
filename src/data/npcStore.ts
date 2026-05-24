import { CHARACTERS } from '@/data/characters'
import {
  PLAYER_FEET_OFFSET,
  PLAYER_SPAWN,
  SCENE_HEIGHT,
  SCENE_WIDTH,
} from '@/data/scene'
import { placeNpcs } from '@/lib/npcPlacement'

// sprite 192×208，feet offset (96, 196)，feet 坐标允许范围保证 sprite 不出图
const FEET_MIN_X = PLAYER_FEET_OFFSET.x
const FEET_MAX_X = SCENE_WIDTH - PLAYER_FEET_OFFSET.x
const FEET_MIN_Y = PLAYER_FEET_OFFSET.y
const FEET_MAX_Y = SCENE_HEIGHT - (208 - PLAYER_FEET_OFFSET.y)

export function clampNpcFeet(x: number, y: number) {
  return {
    x: Math.max(FEET_MIN_X, Math.min(FEET_MAX_X, x)),
    y: Math.max(FEET_MIN_Y, Math.min(FEET_MAX_Y, y)),
  }
}

export type NpcSpot = {
  id: string
  x: number
  y: number
  talkRadius: number
}

const STORAGE_KEY = 'npc-placements.v1'
const DEFAULT_RADIUS = 220
const DEFAULT_IDS = ['warabe', 'obaa-san', 'shokunin', 'miko-shrine']

function readStorage(): NpcSpot[] | null {
  if (typeof localStorage === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    if (!Array.isArray(data)) return null
    const out: NpcSpot[] = []
    for (const item of data) {
      if (typeof item?.id !== 'string') continue
      if (!CHARACTERS[item.id]) continue
      const clamped = clampNpcFeet(Number(item.x) || 0, Number(item.y) || 0)
      out.push({
        id: item.id,
        x: clamped.x,
        y: clamped.y,
        talkRadius: Number(item.talkRadius) || DEFAULT_RADIUS,
      })
    }
    return out.length > 0 ? out : null
  } catch {
    return null
  }
}

function writeStorage(v: NpcSpot[]) {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(v))
  } catch {
    /* quota */
  }
}

function generateDefault(): NpcSpot[] {
  const ids = DEFAULT_IDS.filter((id) => CHARACTERS[id])
  const placed = placeNpcs(ids, { minDist: 260, awayFrom: [PLAYER_SPAWN] })
  const out: NpcSpot[] = []
  placed.forEach((topLeft, id) => {
    out.push({
      id,
      x: Math.round(topLeft.x + PLAYER_FEET_OFFSET.x),
      y: Math.round(topLeft.y + PLAYER_FEET_OFFSET.y),
      talkRadius: DEFAULT_RADIUS,
    })
  })
  return out
}

// 启动时只读 localStorage；远端 JSON 由 sceneLoader 在 mount 前注入；
// 若都为空，组件首次渲染时调 ensureNpcSpots() 触发随机生成。
let CURRENT: NpcSpot[] = readStorage() ?? []

const listeners = new Set<(v: NpcSpot[]) => void>()

export function getNpcSpots(): NpcSpot[] {
  return CURRENT
}

export function setNpcSpots(v: NpcSpot[], opts: { persist?: boolean } = {}) {
  CURRENT = v
  if (opts.persist ?? true) writeStorage(v)
  for (const fn of listeners) fn(CURRENT)
}

export function updateNpcSpot(id: string, patch: Partial<Omit<NpcSpot, 'id'>>) {
  setNpcSpots(
    CURRENT.map((s) => {
      if (s.id !== id) return s
      const merged = { ...s, ...patch }
      const clamped = clampNpcFeet(merged.x, merged.y)
      return { ...merged, x: clamped.x, y: clamped.y }
    }),
  )
}

export function subscribeNpcSpots(fn: (v: NpcSpot[]) => void) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function resetNpcSpotsRandom() {
  setNpcSpots(generateDefault())
}

export function ensureNpcSpots() {
  if (CURRENT.length === 0) {
    setNpcSpots(generateDefault())
  }
}

// 仅当本地没有任何数据时才接受外部覆盖（编辑器本地草稿优先于线上 JSON）
export function setNpcSpotsIfEmpty(v: NpcSpot[]) {
  if (CURRENT.length === 0 && v.length > 0) {
    setNpcSpots(v, { persist: false })
  }
}

export function exportNpcSpotsJson(): string {
  return JSON.stringify(CURRENT, null, 2)
}

export function downloadNpcSpots() {
  const blob = new Blob([exportNpcSpotsJson()], { type: 'application/json;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = 'npc-placements.json'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(a.href)
}
