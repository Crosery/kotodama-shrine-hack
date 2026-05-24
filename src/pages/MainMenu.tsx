import { useNavigate } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { SCENE_ASSETS, asset } from '@/data/sceneAssets'
import { resetAll } from '@/lib/npcStateStore'

const BG = asset('/ui/menu/background.webp')
const BUTTONS = [
  { key: 'start', label: '开始游戏', img: asset('/ui/menu/button-start.webp'), route: '/game' },
  { key: 'music', label: '音乐鉴赏', img: asset('/ui/menu/button-music.webp'), route: '/music' },
  { key: 'cg',    label: 'CG 鉴赏', img: asset('/ui/menu/button-cg.webp'),    route: '/cg' },
  { key: 'exit',  label: '退出游戏', img: asset('/ui/menu/button-exit.webp'),  route: 'exit' },
] as const

export default function MainMenu() {
  const navigate = useNavigate()
  const [showExit, setShowExit] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // 主界面 BGM：muted autoplay 必中浏览器策略；监听任意用户动作（覆盖 down/up/move/wheel/key/touch/click/visibility）
  // 浏览器 autoplay 策略是 spec 级硬限制，无法 "解除"；只能让任何一次用户输入都立刻 unmute，把延迟降到 0
  useEffect(() => {
    const a = audioRef.current
    if (!a) return
    a.volume = 0.5
    a.muted = true
    // 反复尝试 muted 播放，应付浏览器初始化竞态
    function tryPlay() { if (a) a.play().catch(() => {}) }
    tryPlay()
    const retry = window.setInterval(() => { if (a && a.paused && a.muted) tryPlay() }, 800)

    let unlocked = false
    function unmute() {
      if (unlocked) return
      unlocked = true
      window.clearInterval(retry)
      const aa = audioRef.current
      if (!aa) return
      aa.muted = false
      aa.volume = 0.5
      if (aa.paused) aa.play().catch(() => {})
    }
    const events: Array<keyof WindowEventMap> = ['pointerdown', 'pointerup', 'pointermove', 'touchstart', 'touchend', 'keydown', 'click', 'wheel']
    events.forEach((ev) => window.addEventListener(ev, unmute, { once: true, capture: true } as AddEventListenerOptions))
    document.addEventListener('visibilitychange', unmute, { once: true })
    return () => {
      window.clearInterval(retry)
      events.forEach((ev) => window.removeEventListener(ev, unmute, { capture: true } as EventListenerOptions))
      document.removeEventListener('visibilitychange', unmute)
    }
  }, [])

  function handleClick(route: string) {
    if (route === 'exit') {
      setShowExit(true)
      return
    }
    // 离开主界面前停 BGM，避免和游戏内 BGM 叠播
    const a = audioRef.current
    if (a) { a.pause() }
    // 点"开始游戏"=新开一局：清掉上一局残留的 NPC 对话与状态机；endings flag 不清
    if (route === '/game') {
      resetAll()
    }
    navigate(route)
  }

  return (
    <>
      <style>{styles}</style>
      <audio ref={audioRef} loop preload="auto">
        <source src={SCENE_ASSETS.menuBgm} type='audio/ogg; codecs="opus"' />
        <source src={SCENE_ASSETS.menuBgmAac} type='audio/mp4; codecs="mp4a.40.2"' />
      </audio>
      <main className="title-screen" aria-label="言灵主题界面">
        <section className="menu-panel" aria-label="主菜单">
          {BUTTONS.map((b) => (
            <button
              key={b.key}
              type="button"
              className="menu-button"
              aria-label={b.label}
              onClick={() => handleClick(b.route)}
            >
              <img src={b.img} alt="" draggable={false} />
            </button>
          ))}
        </section>
      </main>

      {showExit ? (
        <div className="exit-overlay" onClick={() => setShowExit(false)}>
          <div className="exit-card" onClick={(e) => e.stopPropagation()}>
            <div className="exit-title">感谢游玩</div>
            <div className="exit-sub">关闭此页即可离开</div>
            <button className="exit-back" onClick={() => setShowExit(false)}>返回主界面</button>
          </div>
        </div>
      ) : null}
    </>
  )
}

const styles = `
.title-screen {
  position: relative;
  width: 100vw;
  height: 100vh;
  min-height: 520px;
  background-image:
    linear-gradient(90deg, rgba(10, 9, 10, 0.1), rgba(10, 9, 10, 0.08) 50%, rgba(10, 9, 10, 0.44)),
    url("${BG}");
  background-position: center;
  background-size: cover;
  background-repeat: no-repeat;
  font-family: "Microsoft YaHei", "PingFang SC", "Noto Sans SC", sans-serif;
  overflow: hidden;
}
.menu-panel {
  position: absolute;
  top: 50%;
  right: clamp(18px, 5vw, 86px);
  width: max(300px, min(52vw, calc(82vh * 1.51), 880px));
  aspect-ratio: 1.51;
  transform: translateY(-50%);
  user-select: none;
}
.menu-button {
  position: absolute;
  left: 50%;
  width: 67.2%;
  aspect-ratio: 4.74;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  filter: drop-shadow(0 12px 16px rgba(0, 0, 0, 0.32));
  transform-origin: center;
  transform: translateX(-50%);
  transition: transform 160ms ease, filter 160ms ease;
}
.menu-button:nth-of-type(1) { top: 0; }
.menu-button:nth-of-type(2) { top: 26.25%; }
.menu-button:nth-of-type(3) { top: 52.5%; }
.menu-button:nth-of-type(4) { top: 78.75%; }
.menu-button img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  pointer-events: none;
}
.menu-button:hover, .menu-button:focus-visible {
  outline: none;
  filter: drop-shadow(0 16px 20px rgba(0, 0, 0, 0.38));
  transform: translateX(-50%) scale(1.18);
}
.menu-button:active {
  transform: translateX(-50%) scale(1.18) translateY(2px);
}
@media (max-width: 860px) {
  .title-screen { min-height: 100svh; background-position: 34% center; }
  .menu-panel {
    top: auto;
    right: 50%;
    bottom: clamp(16px, 4vh, 34px);
    width: min(94vw, 620px);
    transform: translateX(50%);
  }
}
@media (max-height: 620px) and (min-width: 861px) {
  .menu-panel {
    width: min(46vw, calc(88vh * 1.51), 720px);
  }
}
.exit-overlay {
  position: fixed; inset: 0; z-index: 9999;
  display: flex; align-items: center; justify-content: center;
  background: rgba(10,8,12,0.72); backdrop-filter: blur(6px);
}
.exit-card {
  padding: 32px 48px;
  background: linear-gradient(180deg, rgba(18,8,31,0.96) 0%, rgba(12,6,22,0.96) 100%);
  border: 1px solid rgba(46,230,230,0.32);
  color: rgba(247,244,232,0.92);
  text-align: center;
  border-radius: 6px;
  box-shadow: 0 0 28px rgba(46,230,230,0.16);
}
.exit-title { font-size: 24px; letter-spacing: 0.22em; margin-bottom: 10px; }
.exit-sub { font-size: 13px; opacity: 0.7; letter-spacing: 0.12em; margin-bottom: 22px; }
.exit-back {
  padding: 10px 22px; background: rgba(46,230,230,0.18);
  border: 1px solid rgba(46,230,230,0.85); color: rgba(46,230,230,0.95);
  font-size: 13px; letter-spacing: 0.18em; cursor: pointer; font-family: inherit;
}
`
