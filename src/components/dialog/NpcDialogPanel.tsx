import { useEffect, useMemo, useRef, useState } from 'react'
import { sendNpcMessage, type ChatMsg } from '@/lib/npcChat'
import { getStarters } from '@/data/personas/starters'
import GameModal from '@/components/ui/GameModal'
import { useIsMobile } from '@/hooks/useIsMobile'
import {
  bumpTalk, chargeManual, getNpc, getState, markTriggered, subscribe,
} from '@/lib/npcStateStore'

type Status = 'idle' | 'sending' | 'error'

const STORAGE_PREFIX = 'npc-dialog.v1.'
const SUGG_PREFIX = 'npc-suggest.v1.'
const MAX_KEEP = 200

function storageKey(npcId: string) { return STORAGE_PREFIX + npcId }
function suggestKey(npcId: string) { return SUGG_PREFIX + npcId }

function loadHistory(npcId: string): ChatMsg[] {
  if (typeof localStorage === 'undefined') return []
  try {
    const raw = localStorage.getItem(storageKey(npcId))
    if (!raw) return []
    const data = JSON.parse(raw)
    if (!Array.isArray(data)) return []
    return data.filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
  } catch { return [] }
}

function saveHistory(npcId: string, history: ChatMsg[]) {
  if (typeof localStorage === 'undefined') return
  try {
    const trimmed = history.length > MAX_KEEP ? history.slice(history.length - MAX_KEEP) : history
    localStorage.setItem(storageKey(npcId), JSON.stringify(trimmed))
  } catch { /* ignore */ }
}

function loadSuggestions(npcId: string): string[] {
  if (typeof localStorage === 'undefined') return []
  try {
    const raw = localStorage.getItem(suggestKey(npcId))
    if (!raw) return []
    const data = JSON.parse(raw)
    return Array.isArray(data) ? data.filter((s): s is string => typeof s === 'string') : []
  } catch { return [] }
}

function saveSuggestions(npcId: string, list: string[]) {
  if (typeof localStorage === 'undefined') return
  try { localStorage.setItem(suggestKey(npcId), JSON.stringify(list.slice(0, 3))) } catch { /* ignore */ }
}

function renderBold(text: string): React.ReactNode {
  const safe = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const html = safe.replace(/\*\*([^*\n]+?)\*\*/g, '<strong class="npc-bold">$1</strong>')
  return <span dangerouslySetInnerHTML={{ __html: html }} />
}

export default function NpcDialogPanel({
  npcId,
  displayName,
  onClose,
}: {
  npcId: string
  displayName: string
  onClose: () => void
}) {
  const [history, setHistory] = useState<ChatMsg[]>(() => loadHistory(npcId))
  const [input, setInput] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState<string | null>(null)
  const [triggered, setTriggered] = useState(() => getNpc(npcId).triggered)
  const [manualLeft, setManualLeft] = useState(() => getState().manualLeft)
  const [armed, setArmed] = useState(false)            // 言灵·上膛：下一句话强制注入
  const [confirmArm, setConfirmArm] = useState(false)  // 上膛前的样式化确认弹窗
  const [confirmReset, setConfirmReset] = useState(false)
  const [noticeText, setNoticeText] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<string[]>(() => {
    const saved = loadSuggestions(npcId)
    if (saved.length > 0) return saved
    return loadHistory(npcId).length === 0 ? getStarters(npcId) : []
  })
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLTextAreaElement | null>(null)
  const isMobile = useIsMobile()

  const starters = useMemo(() => getStarters(npcId), [npcId])

  useEffect(() => {
    const h = loadHistory(npcId)
    setHistory(h); setStatus('idle'); setError(null)
    setTriggered(getNpc(npcId).triggered)
    setArmed(false)
    const saved = loadSuggestions(npcId)
    setSuggestions(saved.length > 0 ? saved : (h.length === 0 ? getStarters(npcId) : []))
    inputRef.current?.focus()
  }, [npcId])

  useEffect(() => { saveHistory(npcId, history) }, [npcId, history])
  useEffect(() => { saveSuggestions(npcId, suggestions) }, [npcId, suggestions])

  useEffect(() => {
    const off = subscribe(() => {
      setTriggered(getNpc(npcId).triggered)
      setManualLeft(getState().manualLeft)
    })
    return off
  }, [npcId])

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [history.length, status])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (confirmArm || confirmReset || noticeText) return // 让 modal 自己处理
        e.preventDefault(); onClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, confirmArm, confirmReset, noticeText])

  async function sendText(text: string) {
    const t = text.trim()
    if (!t || status === 'sending') return
    const wasArmed = armed
    const nextHistory: ChatMsg[] = [...history, { role: 'user', content: t }]
    setHistory(nextHistory)
    setInput(''); setStatus('sending'); setError(null)
    setSuggestions([])
    if (wasArmed) setArmed(false) // 发出去就消耗
    bumpTalk(npcId)
    try {
      const reply = await sendNpcMessage(npcId, history, t, { kotodama: wasArmed })
      setHistory([...nextHistory, { role: 'assistant', content: reply.text }])
      setStatus('idle')
      setSuggestions(reply.suggestions ?? [])
      // 强制注入时即便 NPC 自己 reply 里没标 triggered，也认作言灵成功（system 指令已下达，玩家代价已付）
      if (wasArmed || reply.triggered) {
        markTriggered(
          npcId,
          wasArmed ? 'manual' : 'llm',
          reply.phrase ?? t,
          reply.action,
          displayName,
        )
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '请求失败')
      setStatus('error')
    }
  }

  // 打开"上膛"确认弹窗
  function openArmConfirm() {
    if (armed) { setArmed(false); return } // 已上膛点一次卸膛
    if (manualLeft <= 0) { setNoticeText('言灵传达已全部用完。'); return }
    setConfirmArm(true)
  }

  function commitArm() {
    setConfirmArm(false)
    if (!chargeManual()) { setNoticeText('言灵传达已全部用完。'); return }
    setArmed(true)
    inputRef.current?.focus()
  }

  function onKeyDownInput(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendText(input) }
  }

  function commitReset() {
    setConfirmReset(false)
    setHistory([]); setError(null); setStatus('idle')
    setSuggestions(starters)
    try { localStorage.removeItem(storageKey(npcId)) } catch { /* ignore */ }
    try { localStorage.removeItem(suggestKey(npcId)) } catch { /* ignore */ }
  }

  return (
    <div
      style={{
        position: 'fixed', right: 16, bottom: 16, zIndex: 50,
        width: 'min(460px, 92vw)', height: 'min(600px, 78vh)',
        display: 'flex', flexDirection: 'column',
        boxShadow: armed
          ? '0 0 0 1px rgba(255,46,154,0.85), 0 0 40px rgba(255,46,154,0.55), 0 0 90px rgba(46,230,230,0.32)'
          : triggered
            ? '0 0 0 1px rgba(255,46,154,0.55), 0 0 36px rgba(255,46,154,0.32)'
            : undefined,
        transition: 'box-shadow 240ms ease',
      }}
      className="k-pixel-panel overflow-hidden"
    >
      <style>{`
        .npc-bold {
          color: rgba(255,168,201,0.98);
          font-weight: 700;
          text-shadow: 0 0 8px rgba(255,46,154,0.32);
          padding: 0 1px;
        }
        @keyframes armedPulse {
          0%, 100% { opacity: 0.85; }
          50%      { opacity: 1; }
        }
      `}</style>

      <div className="flex items-center justify-between border-b border-[rgba(247,244,232,0.12)] px-4 py-2">
        <div className="k-title text-sm tracking-[0.22em] text-[rgba(247,244,232,0.92)]">
          {displayName}
          {triggered ? (
            <span className="ml-2 text-[10px] tracking-[0.18em] text-[rgba(255,168,201,0.92)]">心境已动</span>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          {history.length > 0 ? (
            <button onClick={() => setConfirmReset(true)} type="button"
              className="k-pixel-bubble border-[rgba(244,168,201,0.22)] bg-[rgba(18,8,31,0.55)] px-2 py-1 text-[10px] tracking-[0.18em] text-[rgba(244,168,201,0.82)] hover:border-[rgba(244,168,201,0.5)]">
              清空
            </button>
          ) : null}
          <button onClick={onClose} type="button"
            className="k-pixel-bubble border-[rgba(247,244,232,0.18)] bg-[rgba(18,8,31,0.55)] px-2 py-1 text-xs tracking-[0.18em] text-[rgba(247,244,232,0.78)] hover:border-[rgba(244,168,201,0.4)]">
            {isMobile ? '关闭' : 'ESC 关闭'}
          </button>
        </div>
      </div>

      <div ref={scrollRef} className="min-h-0 flex-1 overflow-auto px-4 py-3 text-sm leading-relaxed">
        {history.length === 0 ? (
          <div className="text-[rgba(247,244,232,0.55)]">
            （你眼前是 {displayName}。第一次见面 — 试着说点什么。下面有几个起头的话，也可以自己输入。）
          </div>
        ) : (
          <div className="mb-3 text-center text-[10px] tracking-[0.20em] text-[rgba(247,244,232,0.32)]">
            — 你和 {displayName} 之前说过的话 —
          </div>
        )}
        {history.map((m, i) => (
          <div key={i} className={`mb-2 flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={
              m.role === 'user'
                ? 'k-pixel-bubble max-w-[88%] border-[rgba(46,230,230,0.26)] bg-[rgba(46,230,230,0.07)] px-3 py-2 text-[rgba(247,244,232,0.92)]'
                : 'k-pixel-bubble max-w-[88%] border-[rgba(244,168,201,0.22)] bg-[rgba(244,168,201,0.06)] px-3 py-2 text-[rgba(247,244,232,0.92)]'
            }>
              <div className={`mb-1 text-[10px] tracking-[0.18em] ${m.role === 'user' ? 'text-[rgba(46,230,230,0.78)]' : 'text-[rgba(244,168,201,0.85)]'}`}>
                {m.role === 'user' ? '你' : displayName}
              </div>
              <div className="whitespace-pre-wrap">{m.role === 'assistant' ? renderBold(m.content) : m.content}</div>
            </div>
          </div>
        ))}
        {status === 'sending' ? (
          <div className="mb-2 flex justify-start">
            <div className="k-pixel-bubble border-[rgba(46,230,230,0.18)] bg-[rgba(18,8,31,0.55)] px-3 py-2 text-xs text-[rgba(46,230,230,0.85)]">
              {displayName} 正在思考…
            </div>
          </div>
        ) : null}
        {error ? (
          <div className="mb-2 flex justify-start">
            <div className="k-pixel-bubble border-[rgba(255,80,80,0.32)] bg-[rgba(255,80,80,0.08)] px-3 py-2 text-xs text-[rgba(255,168,168,0.92)]">
              出错：{error}
            </div>
          </div>
        ) : null}
      </div>

      {suggestions.length > 0 && status !== 'sending' ? (
        <div className="border-t border-[rgba(247,244,232,0.10)] bg-[rgba(18,8,31,0.55)] px-3 pt-2 pb-1">
          <div className="mb-1 text-[10px] tracking-[0.20em] text-[rgba(247,244,232,0.46)]">候选回复 · 点击直接送出</div>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s, i) => (
              <button key={`${s}-${i}`} type="button" onClick={() => sendText(s)}
                className="k-pixel-bubble border-[rgba(46,230,230,0.28)] bg-[rgba(46,230,230,0.06)] px-2 py-1 text-xs tracking-[0.06em] text-[rgba(247,244,232,0.92)] hover:border-[rgba(255,46,154,0.45)] hover:bg-[rgba(255,46,154,0.10)]">
                {s}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {/* 言灵已上膛 → 输入区上方常驻提示 */}
      {armed ? (
        <div
          className="border-t border-[rgba(255,46,154,0.45)] bg-[rgba(255,46,154,0.10)] px-3 py-2 text-center text-[11px] tracking-[0.22em] text-[rgba(255,168,201,0.96)]"
          style={{ animation: 'armedPulse 1600ms ease-in-out infinite' }}
        >
          ◇ 言灵已上膛 · 下一句话将强制 {displayName} 吐露真话 ◇
          <button
            type="button"
            onClick={() => setArmed(false)}
            className="ml-3 underline decoration-dotted text-[rgba(255,168,201,0.78)] hover:text-[rgba(255,168,201,1.0)]"
            style={{ fontSize: 10, letterSpacing: '0.18em', cursor: 'pointer' }}
          >
            取消
          </button>
        </div>
      ) : null}

      <div className="border-t border-[rgba(247,244,232,0.12)] bg-[rgba(18,8,31,0.55)] px-3 py-3">
        <div
          className="k-pixel-bubble flex items-end gap-2 px-3 py-2"
          style={{
            background: armed ? 'rgba(255,46,154,0.10)' : 'rgba(18,8,31,0.55)',
            borderColor: armed ? 'rgba(255,46,154,0.55)' : 'rgba(46,230,230,0.18)',
          }}
        >
          <textarea
            ref={inputRef} rows={1} value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDownInput}
            placeholder={armed
              ? `这一句将以"言灵"传达给 ${displayName}…`
              : isMobile ? `和 ${displayName} 说点什么…` : `和 ${displayName} 说点什么…（或点上面的候选）`}
            disabled={status === 'sending'}
            className="min-h-[36px] flex-1 resize-none bg-transparent text-sm leading-relaxed text-[rgba(247,244,232,0.92)] outline-none placeholder:text-[rgba(247,244,232,0.4)]"
          />
          <button type="button" onClick={() => sendText(input)}
            disabled={status === 'sending' || input.trim().length === 0}
            className="k-pixel-bubble px-3 py-2 text-xs tracking-[0.18em] disabled:opacity-40"
            style={{
              background: armed ? 'rgba(255,46,154,0.18)' : 'rgba(46,230,230,0.10)',
              borderColor: armed ? 'rgba(255,46,154,0.55)' : 'rgba(46,230,230,0.22)',
              color: armed ? 'rgba(255,168,201,0.95)' : 'rgba(46,230,230,0.92)',
            }}
          >
            {armed ? '言灵送出' : '发送'}
          </button>
        </div>

        <div className="mt-2 flex items-center justify-between">
          <button type="button" onClick={openArmConfirm}
            disabled={manualLeft <= 0 && !armed}
            title={armed ? '点一次卸膛，言灵不消耗' : `把下一句话以言灵传达（全局剩 ${manualLeft} 次）`}
            className="k-pixel-bubble border-[rgba(255,46,154,0.45)] bg-[rgba(255,46,154,0.08)] px-2 py-1 text-[10px] tracking-[0.22em] text-[rgba(255,168,201,0.96)] hover:bg-[rgba(255,46,154,0.18)] disabled:opacity-30"
            style={armed ? { background: 'rgba(255,46,154,0.32)', borderColor: 'rgba(255,46,154,0.85)' } : undefined}
          >
            {armed ? '取消上膛' : `言灵传达 · ${manualLeft}`}
          </button>
          <div className="text-[10px] tracking-[0.16em] text-[rgba(247,244,232,0.46)]">
            {isMobile ? `共 ${history.length} 条` : `Enter 发 · Shift+Enter 换行 · ESC 关闭 · 共 ${history.length} 条`}
          </div>
        </div>
      </div>

      {confirmArm ? (
        <GameModal
          title="▍ 上膛 · 言灵传达"
          accent="magenta"
          body={
            <>
              你将耗用 1 次「言灵传达」。<br />
              <strong style={{ color: 'rgba(255,168,201,0.95)' }}>下一句</strong>说出的话，{displayName} 将<strong>无法</strong>装糊涂、绕话或藏秘密，必须如实吐露。<br />
              <span style={{ opacity: 0.65, fontSize: 12 }}>全局剩余 {manualLeft} 次，用完不能恢复。</span>
            </>
          }
          primary="上膛"
          secondary="再想想"
          onPrimary={commitArm}
          onCancel={() => setConfirmArm(false)}
        />
      ) : null}

      {confirmReset ? (
        <GameModal
          title="清空记忆？"
          body={<>将清掉与 <strong>{displayName}</strong> 的全部对话记录。此操作不可撤销。</>}
          primary="清空"
          secondary="保留"
          onPrimary={commitReset}
          onCancel={() => setConfirmReset(false)}
          accent="magenta"
        />
      ) : null}

      {noticeText ? (
        <GameModal
          title="提示"
          body={noticeText}
          primary="知道了"
          onPrimary={() => setNoticeText(null)}
          onCancel={() => setNoticeText(null)}
        />
      ) : null}
    </div>
  )
}
