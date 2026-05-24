export const SCENE_WIDTH = 3840
export const SCENE_HEIGHT = 2160

export type Rect = { x: number; y: number; w: number; h: number }
export type TriggerZone = Rect & { id: string; label: string; characterId?: string }
export type Polygon = { points: Array<{ x: number; y: number }> }

// 旧的手画框框（walkable/obstacle rect/polygon/trigger）已废弃
// 现在障碍/重叠完全由 public/scene/obstacles.json + overlaps.json 提供（painter strokes）
// walkable 为空 → collision 不再用白名单，玩家可在整图内自由移动，仅受 painter 障碍 stroke + 场景边界限制
export const WALKABLE_RECTS: Rect[] = []
export const OBSTACLE_POLYGONS: Polygon[] = []
export const OBSTACLE_RECTS: Rect[] = []
export const TRIGGER_ZONES: TriggerZone[] = [
  // 鸟居：在出生点北方约 200px，玩家需要主动往上走几步到鸟居正下方才能 E 互动
  { id: 'torii', label: '抚摸鸟居', x: 3070, y: 660, w: 260, h: 180 },
]

export const PLAYER_SPAWN = { x: 3100, y: 760 }
export const PLAYER_FEET_OFFSET = { x: 96, y: 196 }
export const PLAYER_FEET_HALF = { w: 28, h: 14 }
export const PLAYER_SPEED = 360
