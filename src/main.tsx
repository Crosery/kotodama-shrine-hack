import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import { loadNpcPlacements, loadSceneStrokes } from '@/lib/sceneLoader'

const root = createRoot(document.getElementById('root')!)

root.render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// 异步合并外部标注，不阻塞首屏渲染；手机弱网下 JSON 可能要 5-15s，
// 阻塞 mount 会导致白屏看不到 OrientationLock 等任何 UI
Promise.allSettled([loadSceneStrokes(), loadNpcPlacements()]).then((res) => {
  const strokes = res[0].status === 'fulfilled' ? res[0].value : { obstacle: 0, overlap: 0 }
  const npcs = res[1].status === 'fulfilled' ? res[1].value : 0
  if (strokes.obstacle + strokes.overlap > 0) {
    // eslint-disable-next-line no-console
    console.log(`[scene] 已合并外部标注：障碍 ${strokes.obstacle} 条 + 重叠 ${strokes.overlap} 条`)
  }
  if (npcs > 0) {
    // eslint-disable-next-line no-console
    console.log(`[scene] 已合并 NPC 位置：${npcs} 个`)
  }
})
