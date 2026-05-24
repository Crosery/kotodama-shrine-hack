import { SCENE_ASSETS } from '@/data/sceneAssets'
import { getPainter, setPainter, type Stroke } from '@/lib/strokes'
import { setNpcSpots, type NpcSpot } from '@/data/npcStore'

type Layer = 'obstacle' | 'overlap'

function asStrokes(raw: unknown): Stroke[] | null {
  if (!raw) return null
  if (Array.isArray(raw)) {
    if (raw.length === 0) return []
    const first = raw[0]
    if (Array.isArray(first) && Array.isArray(first[0])) {
      return raw as Stroke[]
    }
    if (
      first &&
      typeof first === 'object' &&
      'points' in (first as Record<string, unknown>) &&
      Array.isArray((first as { points: unknown }).points)
    ) {
      return (raw as Array<{ points: Stroke }>).map((r) => r.points)
    }
  }
  return null
}

function pickLayer(raw: unknown, layer: Layer): Stroke[] {
  if (!raw) return []
  if (typeof raw === 'object' && raw !== null) {
    const r = raw as Record<string, unknown>
    const direct = asStrokes(r[layer])
    if (direct) return direct
    const wrapped = asStrokes(r.strokes)
    if (wrapped) return wrapped
  }
  const top = asStrokes(raw)
  return top ?? []
}

async function loadJson(url: string): Promise<unknown | null> {
  try {
    const r = await fetch(url, { cache: 'no-cache' })
    if (!r.ok) return null
    return await r.json()
  } catch {
    return null
  }
}

export async function loadNpcPlacements(): Promise<number> {
  const raw = await loadJson('/scene/npc-placements.json')
  if (!Array.isArray(raw)) return 0
  const spots: NpcSpot[] = []
  for (const item of raw) {
    if (item && typeof item.id === 'string' && Number.isFinite(item.x) && Number.isFinite(item.y)) {
      spots.push({
        id: item.id,
        x: Number(item.x),
        y: Number(item.y),
        talkRadius: Number(item.talkRadius) || 220,
      })
    }
  }
  if (spots.length > 0) {
    // JSON 是权威版本，强制覆盖 localStorage 旧草稿；编辑器拖动会即时写回 localStorage
    setNpcSpots(spots)
  }
  return spots.length
}

export async function loadSceneStrokes(): Promise<{ obstacle: number; overlap: number }> {
  const [obstacleRaw, overlapRaw] = await Promise.all([
    loadJson(SCENE_ASSETS.strokes.obstacles),
    loadJson(SCENE_ASSETS.strokes.overlaps),
  ])

  const fetched = {
    obstacle: pickLayer(obstacleRaw, 'obstacle'),
    overlap: pickLayer(overlapRaw, 'overlap'),
  }

  if (fetched.obstacle.length === 0 && fetched.overlap.length === 0) {
    return { obstacle: 0, overlap: 0 }
  }

  const current = getPainter()
  setPainter(
    {
      obstacle: [...fetched.obstacle, ...current.obstacle],
      overlap: [...fetched.overlap, ...current.overlap],
    },
    { persist: false },
  )

  return { obstacle: fetched.obstacle.length, overlap: fetched.overlap.length }
}
