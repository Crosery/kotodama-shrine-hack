// 素材索引：通过 VITE_ASSETS_BASE 切换本地与远程 CDN
//   默认（不配置环境变量）   走本地 public/ 原 PNG，最简
//   配置 VITE_ASSETS_BASE   指向远程公网前缀（CDN / OSS / 任意静态托管）
//                          所有 .png 自动改后缀走 .webp，需自行做 PNG→WebP 转码 + 上传

const RAW_BASE = (import.meta.env.VITE_ASSETS_BASE ?? '') as string
export const ASSETS_BASE = RAW_BASE.replace(/\/$/, '')
export const USE_REMOTE = ASSETS_BASE.length > 0

export function asset(p: string): string {
  let url = p.startsWith('/') ? p : `/${p}`
  if (USE_REMOTE && /\.png$/i.test(url)) {
    url = url.replace(/\.png$/i, '.webp')
  }
  return `${ASSETS_BASE}${url}`
}

export const SCENE_ASSETS = {
  background: asset('/kotodama_bg.png'),
  charactersBase: ASSETS_BASE + '/characters',
  cutoutsBase: ASSETS_BASE + '/cutouts',
  sceneDir: '/scene',
  introVideo: asset('/scene/intro.mp4'),
  bgm: asset('/scene/bgm.opus'),
  // iOS Safari < 18.4 不原生支持 Opus；AAC m4a 作为通用兜底
  bgmAac: asset('/scene/bgm.m4a'),
  menuBgm: asset('/ui/menu/bgm.opus'),
  menuBgmAac: asset('/ui/menu/bgm.m4a'),
  strokes: {
    obstacles: '/scene/obstacles.json',
    overlaps: '/scene/overlaps.json',
  },
} as const

export const INTRO_BLACK_MS = 1000
