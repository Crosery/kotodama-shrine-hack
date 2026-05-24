import { CHARACTERS } from '@/data/characters'
import { SCENE_CUTOUTS } from '@/data/cutouts'
import { SKELETON_OVERLAPS } from '@/data/overlapCutouts'
import { SCENE_ASSETS, asset } from '@/data/sceneAssets'

function collectUrls(): string[] {
  const urls = new Set<string>()
  urls.add(SCENE_ASSETS.background)
  for (const cfg of Object.values(CHARACTERS)) {
    for (const sheet of Object.values(cfg.states)) {
      if (!sheet) continue
      for (let i = 0; i < sheet.count; i++) {
        urls.add(sheet.frameUrl(i))
      }
    }
  }
  for (const c of SCENE_CUTOUTS) urls.add(asset(c.src))
  for (const c of SKELETON_OVERLAPS) urls.add(asset(c.src))
  return Array.from(urls)
}

// 串行节流预加载：每次最多 maxConcurrent 个 in-flight，按顺序排队
// 避免手机端一次性并发几十个图片请求把带宽和内存吃满，导致首屏卡死
function preloadQueue(urls: string[], maxConcurrent: number) {
  let i = 0
  function next() {
    if (i >= urls.length) return
    const url = urls[i++]
    const img = new Image()
    img.decoding = 'async'
    const done = () => { next() }
    img.onload = done
    img.onerror = done
    img.src = url
  }
  const n = Math.min(maxConcurrent, urls.length)
  for (let k = 0; k < n; k++) next()
}

function isMobileEnv(): boolean {
  if (typeof navigator === 'undefined') return false
  if (typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches) return true
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)
}

export function preloadGameAssets() {
  const urls = collectUrls()
  const mobile = isMobileEnv()
  // 手机端只预热背景 + 主角 sprite，其他延后到 idle 时再加载
  if (mobile) {
    const critical: string[] = [SCENE_ASSETS.background]
    const miko = CHARACTERS.miko
    for (const sheet of Object.values(miko.states)) {
      if (!sheet) continue
      for (let i = 0; i < sheet.count; i++) critical.push(sheet.frameUrl(i))
    }
    preloadQueue(critical, 3)
    const rest = urls.filter((u) => !critical.includes(u))
    const ric = (window as unknown as { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number }).requestIdleCallback
    const schedule = ric ?? ((cb: () => void) => window.setTimeout(cb, 2000))
    schedule(() => preloadQueue(rest, 2), { timeout: 5000 })
    return critical.length
  }
  // 桌面端可以更激进，6 并发
  preloadQueue(urls, 6)
  return urls.length
}
