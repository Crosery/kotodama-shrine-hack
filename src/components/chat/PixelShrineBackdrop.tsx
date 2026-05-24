import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { SCENE_ASSETS } from '@/data/sceneAssets'
import {
  advancePetals,
  clamp,
  densityFor,
  drawPetals,
  lerp,
  pixelScaleFor,
  spawnPetals,
  type Petal,
} from '@/lib/petalSystem'

export default function PixelShrineBackdrop({
  className,
  imageSrc = SCENE_ASSETS.background,
  motionLevel = 'medium',
  parallaxEnabled = true,
  children,
}: {
  className?: string
  imageSrc?: string
  motionLevel?: 'low' | 'medium' | 'high'
  parallaxEnabled?: boolean
  children?: React.ReactNode
}) {
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const petalsRef = useRef<Petal[]>([])
  const rafRef = useRef<number | null>(null)
  const lastRef = useRef<number>(0)
  const parallaxRef = useRef({ x: 0, y: 0, tx: 0, ty: 0 })

  useEffect(() => {
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    if (!canvas || !wrap) return
    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    const dpr = clamp(window.devicePixelRatio || 1, 1, 2)
    let w = 0
    let h = 0

    function resize() {
      const vw = window.innerWidth
      const vh = window.innerHeight
      const scale = pixelScaleFor(vw, vh)
      w = Math.floor(vw / scale)
      h = Math.floor(vh / scale)
      canvas.width = Math.floor(w * dpr)
      canvas.height = Math.floor(h * dpr)
      canvas.style.width = `${vw}px`
      canvas.style.height = `${vh}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.imageSmoothingEnabled = false
      petalsRef.current = spawnPetals(w, h, densityFor(motionLevel))
    }

    function drawFrame(ts: number) {
      const dt = Math.min(40, ts - (lastRef.current || ts))
      lastRef.current = ts

      ctx.clearRect(0, 0, w, h)
      advancePetals(petalsRef.current, w, h, dt)
      drawPetals(ctx, petalsRef.current)

      if (parallaxEnabled) {
        const p = parallaxRef.current
        p.x = lerp(p.x, p.tx, 0.06)
        p.y = lerp(p.y, p.ty, 0.06)
        wrap.style.transform = `translate(${Math.round(p.x)}px, ${Math.round(p.y)}px)`
      } else {
        wrap.style.transform = 'translate(0px, 0px)'
      }

      rafRef.current = requestAnimationFrame(drawFrame)
    }

    function onMove(e: PointerEvent) {
      if (!parallaxEnabled) return
      const px = (e.clientX / Math.max(1, window.innerWidth) - 0.5) * 2
      const py = (e.clientY / Math.max(1, window.innerHeight) - 0.5) * 2
      const p = parallaxRef.current
      p.tx = px * 6
      p.ty = py * 6
    }

    resize()
    rafRef.current = requestAnimationFrame(drawFrame)
    window.addEventListener('resize', resize)
    window.addEventListener('orientationchange', resize)
    window.addEventListener('pointermove', onMove, { passive: true })

    return () => {
      window.removeEventListener('resize', resize)
      window.removeEventListener('orientationchange', resize)
      window.removeEventListener('pointermove', onMove)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [motionLevel, parallaxEnabled])

  return (
    <div className={cn('fixed inset-0 z-0 overflow-hidden', className)}>
      <div ref={wrapRef} className="absolute inset-0 will-change-transform">
        <img
          src={imageSrc}
          alt=""
          className="absolute inset-0 h-full w-full object-contain [image-rendering:pixelated]"
          draggable={false}
        />
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full [image-rendering:pixelated]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(1200px_700px_at_50%_70%,rgba(0,0,0,0.22),rgba(0,0,0,0.55))]" />
        {children ? <div className="pointer-events-none absolute inset-0">{children}</div> : null}
      </div>
    </div>
  )
}
