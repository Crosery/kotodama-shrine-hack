// NPC 状态机：跨会话持久化每个 NPC 是否被言灵点中、对话次数、全局明示言灵次数
// 用于结局判定（修复 vs 错过）

const KEY = 'npc.state.v1'
const MANUAL_LIMIT = 3

export type NpcOne = {
  talkCount: number
  triggered: boolean
  triggerPhrase?: string | null
  triggerAction?: string | null
  triggeredBy?: 'llm' | 'manual'
}

export type LastTriggered = {
  id: string
  displayName?: string
  phrase: string | null
  action: string | null
  by: 'llm' | 'manual'
  ts: number
}

export type NpcState = {
  totalTalk: number
  manualLeft: number
  watchCount: number  // 累计选过"再守望片刻"的次数；达 3 后解锁 守望 隐藏结局选项
  npcs: Record<string, NpcOne>
}

let lastTriggered: LastTriggered | null = null
export function getLastTriggered(): LastTriggered | null { return lastTriggered }
export function clearLastTriggered() { lastTriggered = null; listeners.forEach((l) => l()) }

function empty(): NpcState {
  return { totalTalk: 0, manualLeft: MANUAL_LIMIT, watchCount: 0, npcs: {} }
}

const listeners = new Set<() => void>()

function read(): NpcState {
  if (typeof localStorage === 'undefined') return empty()
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return empty()
    const data = JSON.parse(raw)
    if (!data || typeof data !== 'object') return empty()
    return {
      totalTalk: Number.isFinite(data.totalTalk) ? data.totalTalk : 0,
      manualLeft: Number.isFinite(data.manualLeft) ? data.manualLeft : MANUAL_LIMIT,
      watchCount: Number.isFinite(data.watchCount) ? data.watchCount : 0,
      npcs: data.npcs && typeof data.npcs === 'object' ? data.npcs : {},
    }
  } catch { return empty() }
}

function write(s: NpcState) {
  try { localStorage.setItem(KEY, JSON.stringify(s)) } catch { /* ignore */ }
  listeners.forEach((l) => l())
}

export function getState(): NpcState { return read() }

export function getNpc(id: string): NpcOne {
  const s = read()
  return s.npcs[id] ?? { talkCount: 0, triggered: false }
}

export function bumpTalk(id: string) {
  const s = read()
  const cur = s.npcs[id] ?? { talkCount: 0, triggered: false }
  cur.talkCount += 1
  s.npcs[id] = cur
  s.totalTalk += 1
  write(s)
}

export function markTriggered(id: string, by: 'llm' | 'manual', phrase: string | null, action: string | null, displayName?: string) {
  const s = read()
  const cur = s.npcs[id] ?? { talkCount: 0, triggered: false }
  if (cur.triggered) {
    // 已经触发过：不重写状态，但仍允许 overlay 重弹（用于"再次强制言灵问到更多秘密"的场景）
    lastTriggered = { id, displayName, phrase, action, by, ts: Date.now() }
    listeners.forEach((l) => l())
    return
  }
  cur.triggered = true
  cur.triggerPhrase = phrase
  cur.triggerAction = action
  cur.triggeredBy = by
  s.npcs[id] = cur
  // 注：manual 不在这里扣，扣额度的动作交给 chargeManual（在玩家"上膛"时即时扣，让代价前置）
  lastTriggered = { id, displayName, phrase, action, by, ts: Date.now() }
  write(s)
}

// 用于"言灵传达"按钮按下时即时扣 1 次额度，并返回是否扣成功
export function chargeManual(): boolean {
  const s = read()
  if (s.manualLeft <= 0) return false
  s.manualLeft -= 1
  write(s)
  return true
}

export function consumeManual(): boolean {
  // 兼容旧调用：仅检查是否还有额度
  const s = read()
  return s.manualLeft > 0
}

export function bumpWatch() {
  const s = read()
  s.watchCount += 1
  write(s)
}

export function getWatchCount(): number {
  return read().watchCount
}

export function anyTriggered(): boolean {
  const s = read()
  return Object.values(s.npcs).some((n) => n.triggered)
}

export function triggeredIds(): string[] {
  const s = read()
  return Object.entries(s.npcs).filter(([, v]) => v.triggered).map(([k]) => k)
}

export function resetAll() {
  try { localStorage.removeItem(KEY) } catch { /* ignore */ }
  // 同时清掉每个 NPC 的对话历史 + 候选回复缓存
  if (typeof localStorage !== 'undefined') {
    const toRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k && (k.startsWith('npc-dialog.v1.') || k.startsWith('npc-suggest.v1.'))) toRemove.push(k)
    }
    toRemove.forEach((k) => { try { localStorage.removeItem(k) } catch { /* ignore */ } })
  }
  listeners.forEach((l) => l())
}

export function subscribe(cb: () => void): () => void {
  listeners.add(cb)
  return () => { listeners.delete(cb) }
}
