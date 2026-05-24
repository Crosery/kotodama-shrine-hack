import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SCENE_ASSETS, asset } from '@/data/sceneAssets'

const BG = asset('/ui/music/background.webp')

// 当前只一首曲：游戏内 BGM。取符合主题的名：言灵之庭
const SONG = {
  id: 'kotodama-niwa',
  title: '言 灵 之 庭',
  subtitle: '神 社 主 题 · 绫 野 家 夜 祷',
  composer: '言灵神社 · 原声',
  sources: [
    { src: SCENE_ASSETS.bgm, type: 'audio/ogg; codecs="opus"' },
    { src: SCENE_ASSETS.bgmAac, type: 'audio/mp4; codecs="mp4a.40.2"' },
  ],
}

function formatTime(s: number) {
  if (!Number.isFinite(s)) return '0:00'
  const m = Math.floor(s / 60)
  const ss = Math.floor(s % 60).toString().padStart(2, '0')
  return `${m}:${ss}`
}

export default function MusicGallery() {
  const navigate = useNavigate()
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const trackRef = useRef<HTMLDivElement | null>(null)
  const [playing, setPlaying] = useState(false)
  const [current, setCurrent] = useState(0)
  const [duration, setDuration] = useState(0)

  useEffect(() => {
    const a = audioRef.current
    if (!a) return
    function onTime() { setCurrent(a!.currentTime) }
    function onMeta() { setDuration(a!.duration || 0) }
    function onEnd() { a!.currentTime = 0; a!.play().catch(() => setPlaying(false)) } // loop
    function onPlay() { setPlaying(true) }
    function onPause() { setPlaying(false) }
    a.addEventListener('timeupdate', onTime)
    a.addEventListener('loadedmetadata', onMeta)
    a.addEventListener('durationchange', onMeta)
    a.addEventListener('ended', onEnd)
    a.addEventListener('play', onPlay)
    a.addEventListener('playing', onPlay)
    a.addEventListener('pause', onPause)
    // 从主菜单 navigate 过来，本次 navigation 算 user gesture，可以直接 autoplay 不需 muted
    a.volume = 0.6
    a.play().catch(() => { /* 浏览器拒绝就等用户点中心按钮 */ })
    return () => {
      a.removeEventListener('timeupdate', onTime)
      a.removeEventListener('loadedmetadata', onMeta)
      a.removeEventListener('durationchange', onMeta)
      a.removeEventListener('ended', onEnd)
      a.removeEventListener('play', onPlay)
      a.removeEventListener('playing', onPlay)
      a.removeEventListener('pause', onPause)
      a.pause()
    }
  }, [])

  function toggle() {
    const a = audioRef.current
    if (!a) return
    // 状态由 audio 自己的 play/pause 事件回写；这里只发起动作
    if (playing) { a.pause() }
    else { a.play().catch(() => {}) }
  }

  function seekFromEvent(clientX: number) {
    const a = audioRef.current
    const t = trackRef.current
    if (!a || !t || !duration) return
    const rect = t.getBoundingClientRect()
    const ratio = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1)
    a.currentTime = duration * ratio
    setCurrent(a.currentTime)
  }

  const percent = duration > 0 ? (current / duration) * 100 : 0

  return (
    <>
      <style>{styles}</style>
      <button className="back-btn" onClick={() => navigate('/')}>返回主菜单</button>

      <audio ref={audioRef} loop={false} preload="metadata">
        {SONG.sources.map((s) => <source key={s.src} src={s.src} type={s.type} />)}
      </audio>

      <main className="music-shell" aria-label="言灵之庭 · 音乐鉴赏">
        {/* 背景樱花随播放呼吸 */}
        <div className={`petals ${playing ? 'is-playing' : ''}`} aria-hidden="true">
          {Array.from({ length: 24 }).map((_, i) => (
            <span key={i} className={`petal p${i % 6}`} style={{ left: `${(i * 41) % 100}%`, animationDelay: `${(i * 0.7) % 9}s` }} />
          ))}
        </div>

        <section className="player">
          {/* 中心法阵 — 三层同心环按播放与否旋转 */}
          <div className={`rune-stage ${playing ? 'is-playing' : ''}`}>
            <svg className="rune ring-1" viewBox="-100 -100 200 200" aria-hidden="true">
              <circle cx="0" cy="0" r="92" fill="none" stroke="rgba(46,230,230,0.55)" strokeWidth="0.7" strokeDasharray="2 6" />
              <circle cx="0" cy="0" r="80" fill="none" stroke="rgba(255,46,154,0.32)" strokeWidth="0.5" />
            </svg>
            <svg className="rune ring-2" viewBox="-100 -100 200 200" aria-hidden="true">
              <circle cx="0" cy="0" r="66" fill="none" stroke="rgba(247,244,232,0.42)" strokeWidth="0.5" strokeDasharray="14 6 2 6" />
              {Array.from({ length: 8 }).map((_, i) => {
                const a = (i / 8) * Math.PI * 2
                const x = Math.cos(a) * 66
                const y = Math.sin(a) * 66
                return <circle key={i} cx={x} cy={y} r="1.8" fill="rgba(255,168,201,0.78)" />
              })}
            </svg>
            <svg className="rune ring-3" viewBox="-100 -100 200 200" aria-hidden="true">
              <circle cx="0" cy="0" r="48" fill="none" stroke="rgba(46,230,230,0.30)" strokeWidth="0.4" />
              <polygon
                points="0,-44 38.1,-22 38.1,22 0,44 -38.1,22 -38.1,-22"
                fill="none"
                stroke="rgba(255,46,154,0.55)"
                strokeWidth="0.6"
              />
              <text x="0" y="3" textAnchor="middle" fontSize="14" fill="rgba(247,244,232,0.55)" letterSpacing="2">言灵</text>
            </svg>

            {/* 中心大播放按钮 */}
            <button className="play-core" type="button" onClick={toggle} aria-label={playing ? '暂停' : '播放'}>
              {playing ? (
                <svg viewBox="0 0 24 24" width="34" height="34"><rect x="6" y="5" width="4" height="14" fill="currentColor" /><rect x="14" y="5" width="4" height="14" fill="currentColor" /></svg>
              ) : (
                <svg viewBox="0 0 24 24" width="38" height="38"><path d="M8 5v14l11-7z" fill="currentColor" /></svg>
              )}
            </button>
          </div>

          {/* 曲目信息 */}
          <div className="info">
            <div className="title">{SONG.title}</div>
            <div className="subtitle">{SONG.subtitle}</div>
            <div className="composer">{SONG.composer}</div>
          </div>

          {/* 进度条 */}
          <div className="progress-wrap">
            <span className="time">{formatTime(current)}</span>
            <div
              ref={trackRef}
              className="progress-track"
              role="slider"
              tabIndex={0}
              onClick={(e) => seekFromEvent(e.clientX)}
              onKeyDown={(e) => {
                const a = audioRef.current
                if (!a || !duration) return
                if (e.key === 'ArrowLeft') { a.currentTime = Math.max(0, a.currentTime - 5); setCurrent(a.currentTime) }
                if (e.key === 'ArrowRight') { a.currentTime = Math.min(duration, a.currentTime + 5); setCurrent(a.currentTime) }
              }}
              style={{ ['--p' as never]: `${percent}%` } as React.CSSProperties}
            >
              <div className="progress-fill" />
              <div className="progress-thumb" />
            </div>
            <span className="time">{formatTime(duration)}</span>
          </div>

          {/* 副控制行 */}
          <div className="meta-row">
            <div className="status-dot" style={{ background: playing ? 'rgba(46,230,230,0.95)' : 'rgba(247,244,232,0.30)' }} />
            <span className="status-text">{playing ? '正在播放' : '已停止'}</span>
            <span className="sep">·</span>
            <span className="status-text">点击中心 · 播放暂停</span>
            <span className="sep">·</span>
            <span className="status-text">点进度条 · 快进</span>
          </div>
        </section>
      </main>
    </>
  )
}

const styles = `
.music-shell {
  position: relative; min-height: 100vh;
  display: flex; align-items: center; justify-content: center;
  padding: clamp(24px, 4vw, 56px);
  font-family: "Microsoft YaHei", "PingFang SC", "Noto Sans SC", Arial, sans-serif;
  color: rgba(247,244,232,0.92);
  background: linear-gradient(rgba(7,5,13,0.55), rgba(7,5,13,0.78)), url("${BG}") center / cover no-repeat fixed;
  overflow: hidden;
}
.music-shell::before {
  position: absolute; inset: 0; z-index: 0; content: "";
  background:
    radial-gradient(800px 600px at 50% 45%, rgba(46,230,230,0.10), transparent 60%),
    radial-gradient(700px 500px at 80% 70%, rgba(255,46,154,0.10), transparent 60%);
  pointer-events: none;
}

/* 樱花 */
.petals { position: absolute; inset: 0; pointer-events: none; z-index: 0; overflow: hidden; }
.petal {
  position: absolute; top: -16px;
  width: 12px; height: 12px;
  border-radius: 60% 10% 60% 10%;
  background: rgba(255,168,201,0.55);
  filter: blur(0.4px);
  animation: petalFall 14s linear infinite;
  animation-play-state: paused;
  opacity: 0;
}
.petals.is-playing .petal { animation-play-state: running; opacity: 0.92; }
.petal.p0 { background: rgba(255,168,201,0.62); }
.petal.p1 { background: rgba(247,200,220,0.55); animation-duration: 18s; }
.petal.p2 { background: rgba(255,150,190,0.50); animation-duration: 11s; }
.petal.p3 { background: rgba(255,210,228,0.40); animation-duration: 16s; }
.petal.p4 { background: rgba(244,168,201,0.55); animation-duration: 13s; }
.petal.p5 { background: rgba(255,140,180,0.46); animation-duration: 20s; }
@keyframes petalFall {
  0%   { transform: translateY(-20px) translateX(0)    rotate(0deg);    opacity: 0; }
  10%  { opacity: 0.9; }
  100% { transform: translateY(110vh) translateX(80px) rotate(540deg); opacity: 0.2; }
}

/* 播放器 */
.player {
  position: relative; z-index: 2;
  display: flex; flex-direction: column; align-items: center;
  width: min(720px, 92vw);
  padding: clamp(28px, 4vw, 56px) clamp(24px, 4vw, 48px);
  background: rgba(7,5,13,0.62);
  border: 1px solid rgba(46,230,230,0.32);
  border-radius: 4px;
  box-shadow:
    0 0 0 1px rgba(46,230,230,0.16),
    0 24px 80px rgba(0,0,0,0.55),
    0 0 80px rgba(255,46,154,0.18);
  backdrop-filter: blur(6px);
}

/* 法阵 */
.rune-stage {
  position: relative;
  width: clamp(260px, 38vw, 380px);
  aspect-ratio: 1;
  display: grid; place-items: center;
  margin-bottom: clamp(20px, 3vw, 40px);
}
.rune { position: absolute; inset: 0; width: 100%; height: 100%; transform-origin: 50% 50%; }
.ring-1 { animation: spin 60s linear infinite; animation-play-state: paused; }
.ring-2 { animation: spinR 38s linear infinite; animation-play-state: paused; }
.ring-3 { animation: spin 24s linear infinite; animation-play-state: paused; }
.rune-stage.is-playing .rune { animation-play-state: running; }
@keyframes spin  { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
@keyframes spinR { from { transform: rotate(0deg); } to { transform: rotate(-360deg); } }

.play-core {
  position: relative;
  width: clamp(94px, 14vw, 120px);
  aspect-ratio: 1; border-radius: 50%;
  display: grid; place-items: center;
  color: rgba(247,244,232,0.96);
  background: radial-gradient(circle at 35% 30%, rgba(255,46,154,0.55), rgba(46,230,230,0.35) 70%, rgba(7,5,13,0.85));
  border: 2px solid rgba(247,244,232,0.55);
  cursor: pointer;
  box-shadow:
    inset 0 0 18px rgba(255,255,255,0.18),
    0 0 28px rgba(255,46,154,0.45),
    0 0 64px rgba(46,230,230,0.30);
  transition: transform 200ms ease, box-shadow 200ms ease;
  z-index: 2;
}
.play-core:hover { transform: scale(1.06); box-shadow: inset 0 0 18px rgba(255,255,255,0.24), 0 0 38px rgba(255,46,154,0.65), 0 0 90px rgba(46,230,230,0.45); }
.play-core:active { transform: scale(0.96); }

/* 信息 */
.info { text-align: center; margin-bottom: clamp(20px, 3vw, 36px); }
.title {
  font-size: clamp(28px, 4.4vw, 48px);
  letter-spacing: 0.32em;
  margin-bottom: 8px;
  text-shadow: 0 0 14px rgba(46,230,230,0.35), 0 0 38px rgba(255,46,154,0.22);
}
.subtitle {
  font-size: clamp(11px, 1.2vw, 13px);
  letter-spacing: 0.42em;
  color: rgba(247,244,232,0.62);
  margin-bottom: 6px;
}
.composer {
  font-size: clamp(10px, 1vw, 11px);
  letter-spacing: 0.32em;
  color: rgba(247,244,232,0.36);
}

/* 进度 */
.progress-wrap {
  width: 100%; display: flex; align-items: center; gap: 14px;
  margin-bottom: clamp(14px, 2vw, 22px);
}
.time {
  flex: 0 0 auto; min-width: 44px; text-align: center;
  font-variant-numeric: tabular-nums; font-size: 12px;
  color: rgba(247,244,232,0.62); letter-spacing: 0.10em;
}
.progress-track {
  position: relative; flex: 1 1 auto; height: 3px;
  background: rgba(247,244,232,0.14); border-radius: 999px;
  cursor: pointer;
  outline: none;
}
.progress-track:focus-visible {
  box-shadow: 0 0 0 3px rgba(46,230,230,0.30);
}
.progress-fill {
  position: absolute; inset: 0 auto 0 0; width: var(--p, 0%);
  background: linear-gradient(90deg, rgba(46,230,230,0.92), rgba(255,46,154,0.92));
  border-radius: inherit;
  box-shadow: 0 0 10px rgba(46,230,230,0.55);
}
.progress-thumb {
  position: absolute; top: 50%; left: var(--p, 0%);
  width: 12px; height: 12px; border-radius: 50%;
  background: rgba(247,244,232,0.98);
  border: 2px solid rgba(46,230,230,0.85);
  transform: translate(-50%, -50%);
  box-shadow: 0 0 10px rgba(46,230,230,0.65);
}

/* 状态 */
.meta-row {
  display: flex; align-items: center; gap: 10px;
  font-size: 11px; letter-spacing: 0.18em; color: rgba(247,244,232,0.55);
  flex-wrap: wrap; justify-content: center;
}
.status-dot {
  width: 7px; height: 7px; border-radius: 50%;
  box-shadow: 0 0 10px currentColor;
}
.status-text { color: rgba(247,244,232,0.65); }
.sep { color: rgba(247,244,232,0.30); }

/* 返回按钮 */
.back-btn {
  position: fixed; top: 18px; left: 18px; z-index: 20;
  padding: 8px 16px;
  background: rgba(7,5,13,0.78);
  border: 1px solid rgba(46,230,230,0.62);
  color: rgba(46,230,230,0.95);
  font-size: 13px; letter-spacing: 0.18em; cursor: pointer;
  font-family: inherit; border-radius: 4px;
}
.back-btn:hover { background: rgba(46,230,230,0.18); }

@media (max-width: 600px) {
  .player { padding: 24px 18px; }
  .title { letter-spacing: 0.22em; }
  .subtitle { letter-spacing: 0.28em; }
}
`
