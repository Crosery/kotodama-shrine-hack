import {
  OBSTACLE_POLYGONS,
  OBSTACLE_RECTS,
  PLAYER_SPAWN,
  TRIGGER_ZONES,
  WALKABLE_RECTS,
  type Polygon,
  type Rect,
  type TriggerZone,
} from '@/data/scene'

const STORAGE_KEY = 'annotator.v2'

type Override = {
  walkable?: Rect[]
  obstacle?: Rect[]
  obstaclePolys?: Polygon[]
  trigger?: TriggerZone[]
  spawn?: { x: number; y: number }
}

function read(): Override | null {
  if (typeof localStorage === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as Override
  } catch {
    return null
  }
}

const override = read()

export const ACTIVE_WALKABLE: Rect[] = override?.walkable ?? WALKABLE_RECTS
export const ACTIVE_OBSTACLE: Rect[] = override?.obstacle ?? OBSTACLE_RECTS
export const ACTIVE_OBSTACLE_POLYGONS: Polygon[] = override?.obstaclePolys ?? OBSTACLE_POLYGONS
export const ACTIVE_TRIGGERS: TriggerZone[] = override?.trigger ?? TRIGGER_ZONES
export const ACTIVE_SPAWN = override?.spawn ?? PLAYER_SPAWN
export const hasOverride = override != null
