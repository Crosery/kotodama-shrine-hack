import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { asset } from '@/data/sceneAssets'
import { hasEnding } from '@/lib/endingFlags'

const BG = asset('/ui/cg/background.webp')

type Slot = { src: string; alt: string }

// 主界面图：永远解锁，作为本子的"封面"，让没玩过任何结局的玩家进来也有一张图看
const COVER: Slot = { src: asset('/ui/menu/background.webp'), alt: '言灵神社 · 主界面' }

// 每个未解锁结局给一个提示标签，让玩家知道这一格对应哪种结局还没拿到
type SlotOrLocked = Slot | { locked: true; hint: string }
function gallery(): Array<SlotOrLocked> {
  const bad: SlotOrLocked = hasEnding('bad-silent')
    ? { src: asset('/ui/cg/bad-end-silent.webp'), alt: 'BAD END · 沉默 — 巫女走过鸟居' }
    : { locked: true, hint: 'BAD END · 沉默' }
  const normal: SlotOrLocked = hasEnding('normal-missed')
    ? { src: asset('/ui/cg/normal-end-missed.webp'), alt: 'NORMAL END · 错过 — 雨夜山道' }
    : { locked: true, hint: 'NORMAL END · 错过' }
  const trueEnd: SlotOrLocked = hasEnding('true-mender')
    ? { src: asset('/ui/cg/true-end-mender.webp'), alt: 'TRUE END · 修复 — 一家人在镜前' }
    : { locked: true, hint: 'TRUE END · 修复' }
  const hidden: SlotOrLocked = hasEnding('hidden-watch')
    ? { src: asset('/ui/cg/hidden-watch.webp'), alt: 'HIDDEN END · 守望 — 永驻神社的言灵' }
    : { locked: true, hint: '??? · 隐藏' }
  // 5 格：封面 + 4 结局
  return [COVER, bad, normal, trueEnd, hidden]
}

export default function CgGallery() {
  const navigate = useNavigate()
  const [active, setActive] = useState<Slot | null>(null)
  const [slots] = useState<Array<SlotOrLocked>>(() => gallery())

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setActive(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <>
      <style>{styles}</style>
      <button className="back-btn" onClick={() => navigate('/')}>返回主菜单</button>

      <main className="gallery-shell" aria-label="言灵 CG 鉴赏">
        <section className="gallery-board" aria-label="图片展示区">
          <div className="gallery-grid">
            {slots.map((item, i) =>
              'locked' in item ? (
                <div key={i} className="gallery-item empty" aria-label={`尚未解锁 ${item.hint}`}>
                  <div className="locked-stamp">尚 未 解 锁</div>
                  <div className="locked-hint">{item.hint}</div>
                </div>
              ) : (
                <button
                  key={i}
                  type="button"
                  className="gallery-item"
                  aria-label={item.alt}
                  onClick={() => setActive(item)}
                >
                  <img src={item.src} alt={item.alt} draggable={false} />
                  <div className="gallery-caption">{item.alt}</div>
                </button>
              ),
            )}
          </div>
        </section>
      </main>

      <div
        className={`lightbox ${active ? 'active' : ''}`}
        aria-hidden={!active}
        onClick={() => setActive(null)}
      >
        {active ? <img className="lightbox-image" src={active.src} alt={active.alt} onClick={(e) => e.stopPropagation()} /> : null}
      </div>
    </>
  )
}

const styles = `
.gallery-shell {
  min-height: 100vh;
  display: flex; align-items: center; justify-content: center;
  padding: clamp(20px, 4vw, 56px);
  background: linear-gradient(rgba(12,13,17,0.30), rgba(12,13,17,0.30)), url("${BG}") center / cover fixed no-repeat;
  font-family: "Microsoft YaHei", "PingFang SC", "Noto Sans SC", Arial, sans-serif;
}
.gallery-board {
  width: min(82vw, 1100px);
  /* 高度按 2x2 + 16:10 自适应，板子整体接近 4:3 包裹，画面分布更均匀 */
  padding: clamp(20px, 2.6vw, 36px);
  background: rgba(255,255,255,0.94);
  border: 1px solid rgba(255,255,255,0.72);
  box-shadow: 0 24px 80px rgba(0,0,0,0.34), inset 0 0 0 1px rgba(70,45,48,0.08);
  backdrop-filter: blur(2px);
  border-radius: 6px;
}
.gallery-grid {
  display: grid;
  /* 3 列 × 2 行 = 6 格 */
  grid-template-columns: repeat(3, minmax(0, 1fr));
  grid-template-rows: repeat(2, minmax(0, 1fr));
  gap: clamp(14px, 1.6vw, 22px);
}
.gallery-item {
  position: relative;
  display: block; width: 100%; aspect-ratio: 16/10;
  padding: 0; overflow: hidden; cursor: pointer;
  background: #f8f5f2;
  border: 1px solid rgba(88,62,56,0.22);
  border-radius: 6px;
  box-shadow: 0 1px 0 rgba(255,255,255,0.88);
}
.gallery-item::after {
  content: ""; position: absolute; inset: 0; pointer-events: none;
  box-shadow: inset 0 0 0 1px rgba(255,255,255,0.38);
}
.gallery-item img {
  width: 100%; height: 100%; display: block; object-fit: cover;
  transition: transform 220ms ease, filter 220ms ease;
}
.gallery-item:hover img {
  transform: scale(1.04); filter: saturate(1.08) contrast(1.04);
}
.gallery-caption {
  position: absolute; left: 0; right: 0; bottom: 0;
  padding: 10px 14px;
  background: linear-gradient(0deg, rgba(10,8,12,0.78) 0%, rgba(10,8,12,0.0) 100%);
  color: rgba(255,255,255,0.94);
  font-size: 12px; letter-spacing: 0.18em;
  opacity: 0;
  transition: opacity 220ms ease;
}
.gallery-item:hover .gallery-caption { opacity: 1; }
.gallery-item.empty {
  cursor: default;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 8px;
  background:
    linear-gradient(135deg, rgba(122,87,82,0.10) 25%, transparent 25%) 0 0 / 18px 18px,
    linear-gradient(135deg, transparent 75%, rgba(122,87,82,0.10) 75%) 0 0 / 18px 18px,
    #f3eee8;
}
.locked-stamp {
  font-size: 14px;
  letter-spacing: 0.46em;
  color: rgba(122,87,82,0.72);
  padding: 6px 14px;
  border: 1.5px solid rgba(122,87,82,0.45);
  border-radius: 3px;
  user-select: none;
  text-shadow: 0 0 1px rgba(255,255,255,0.6);
}
.locked-hint {
  font-size: 10px;
  letter-spacing: 0.32em;
  color: rgba(122,87,82,0.55);
  user-select: none;
}
.lightbox {
  position: fixed; inset: 0; z-index: 10;
  display: grid; place-items: center;
  padding: clamp(20px, 4vw, 56px);
  pointer-events: none; opacity: 0;
  background: rgba(11,10,12,0.70);
  transition: opacity 160ms ease;
}
.lightbox.active { pointer-events: auto; opacity: 1; }
.lightbox-image {
  max-width: min(92vw, 1400px); max-height: 88vh; object-fit: contain;
  background: #fff; border: 10px solid rgba(255,255,255,0.96);
  border-radius: 6px; box-shadow: 0 28px 90px rgba(0,0,0,0.56);
  cursor: zoom-out;
}
.back-btn {
  position: fixed; top: 18px; left: 18px; z-index: 20;
  padding: 8px 16px;
  background: rgba(18,8,31,0.72);
  border: 1px solid rgba(46,230,230,0.55);
  color: rgba(46,230,230,0.95);
  font-size: 13px; letter-spacing: 0.18em; cursor: pointer;
  font-family: inherit; border-radius: 4px;
}
.back-btn:hover { background: rgba(46,230,230,0.18); }

@media (max-width: 760px) {
  .gallery-shell { padding: 16px; }
  .gallery-board { width: 100%; padding: 14px; }
  .gallery-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    grid-template-rows: repeat(3, minmax(0, 1fr));
    gap: 10px;
  }
  .lightbox-image { border-width: 6px; }
}
`
