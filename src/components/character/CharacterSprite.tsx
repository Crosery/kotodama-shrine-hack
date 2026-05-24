import { useEffect, useMemo, useRef } from 'react'
import { cn } from '@/lib/utils'
import { pickState, type CharacterConfig, type SpriteState } from '@/data/characters'

// canvas 版 sprite：避免 DOM <img> opacity 切换在 GPU compositor 上引发的 repaint 闪烁
export default function CharacterSprite({
  character,
  className,
  scale = 1,
  state = 'idle',
  paused = false,
}: {
  character: CharacterConfig
  className?: string
  scale?: number
  state?: SpriteState
  paused?: boolean
}) {
  const effectiveState = pickState(character, state)
  const sheet = character.states[effectiveState]!
  const frames = useMemo(
    () => Array.from({ length: sheet.count }, (_, i) => sheet.frameUrl(i)),
    [sheet],
  )
  const fps = sheet.fps ?? 8

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const imagesRef = useRef<Map<string, HTMLImageElement>>(new Map())
  const frameRef = useRef(0)
  const lastRef = useRef<number | null>(null)
  const accRef = useRef(0)
  const rafRef = useRef<number | null>(null)
  const framesRef = useRef<string[]>(frames)
  const widthPx = character.pixelWidth * scale
  const heightPx = character.pixelHeight * scale

  // frames 引用始终同步到 ref，drawCurrent 永远读最新方向的帧
  // 不通过这一手时，walk-front → walk-left RAF 闭包会留在旧 frames 数组上
  useEffect(() => {
    framesRef.current = frames
  }, [frames])

  // 预加载所有 frame 并在加载完成时立刻重绘
  useEffect(() => {
    for (const url of frames) {
      if (imagesRef.current.has(url)) continue
      const img = new Image()
      img.decoding = 'sync'
      img.onload = () => {
        if (framesRef.current[frameRef.current] === url) drawCurrent()
      }
      img.src = url
      imagesRef.current.set(url, img)
    }
  }, [frames])

  // state 切换 → 帧重置 + 立即绘当前帧
  useEffect(() => {
    frameRef.current = 0
    lastRef.current = null
    accRef.current = 0
    drawCurrent()
  }, [effectiveState])

  // 切帧动画：deps 把 effectiveState 加上，方向切换时 RAF 重建避免引用旧 frames
  useEffect(() => {
    if (paused) return
    const tickMs = 1000 / fps
    function step(ts: number) {
      if (lastRef.current == null) lastRef.current = ts
      const dt = ts - lastRef.current
      lastRef.current = ts
      accRef.current += dt
      const total = framesRef.current.length
      let stepped = false
      while (accRef.current >= tickMs) {
        accRef.current -= tickMs
        frameRef.current = (frameRef.current + 1) % total
        stepped = true
      }
      if (stepped) drawCurrent()
      rafRef.current = requestAnimationFrame(step)
    }
    rafRef.current = requestAnimationFrame(step)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = null
      lastRef.current = null
      accRef.current = 0
    }
  }, [fps, paused, effectiveState])

  function drawCurrent() {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const url = framesRef.current[frameRef.current]
    const img = imagesRef.current.get(url)
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.imageSmoothingEnabled = false
    if (img && img.complete && img.naturalWidth > 0) {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    }
  }

  // 尺寸变化时重绘
  useEffect(() => {
    drawCurrent()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [widthPx, heightPx])

  return (
    <canvas
      ref={canvasRef}
      width={widthPx}
      height={heightPx}
      aria-label={character.displayName}
      className={cn('block select-none', className)}
      style={{
        width: widthPx,
        height: heightPx,
        imageRendering: 'pixelated',
        userSelect: 'none',
      }}
    />
  )
}
