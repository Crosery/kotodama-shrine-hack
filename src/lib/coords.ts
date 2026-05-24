import { SCENE_HEIGHT, SCENE_WIDTH } from '@/data/scene'

export type SceneViewport = {
  vw: number
  vh: number
  scale: number
  offX: number
  offY: number
}

// contain 模式：保证整张场景始终在视口内，比例不匹配时四周 letterbox。
// 之前用 max=cover，手机横屏比 16:9 更宽时上下会被裁掉，玩家看不到完整场景。
export function computeViewport(vw: number, vh: number): SceneViewport {
  const scale = Math.min(vw / SCENE_WIDTH, vh / SCENE_HEIGHT)
  const offX = (vw - SCENE_WIDTH * scale) / 2
  const offY = (vh - SCENE_HEIGHT * scale) / 2
  return { vw, vh, scale, offX, offY }
}

export function sceneToScreen(vp: SceneViewport, x: number, y: number) {
  return { x: vp.offX + x * vp.scale, y: vp.offY + y * vp.scale }
}
