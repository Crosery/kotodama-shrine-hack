// 手机端检测：useIsMobile / useSceneViewport / 任何需要分平台的位置共用
// 当前策略：scene 全屏 contain 缩放，控制按钮悬浮在左右边缘，不再留底部空白带

export function detectIsMobile(): boolean {
  if (typeof window === 'undefined') return false
  const params = new URLSearchParams(window.location.search)
  if (params.get('mobile') === '1') return true
  if (params.get('desktop') === '1') return false

  const coarse = window.matchMedia('(pointer: coarse)').matches
  const noHover = window.matchMedia('(hover: none)').matches
  const ua = navigator.userAgent
  const uaMobile = /Android|iPhone|iPad|iPod|HarmonyOS|Mobile|Tablet/i.test(ua)
  const touchPoints = (navigator.maxTouchPoints || 0) > 0
  const shortEdge = Math.min(window.innerWidth, window.innerHeight)
  const smallScreen = shortEdge < 1024

  let score = 0
  if (coarse) score++
  if (noHover) score++
  if (uaMobile) score += 2
  if (touchPoints && smallScreen) score++
  return score >= 2
}
