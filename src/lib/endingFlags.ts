// 结局解锁状态：跨会话持久化（localStorage），CG 鉴赏页据此解锁对应槽位
const KEY = 'endings.v1'

export type EndingId =
  | 'bad-silent'    // 沉默 BAD END：玩家什么都没说就走过鸟居
  | 'normal-missed' // 错过 NORMAL END：聊完全部 NPC 但没点醒任何一个，妹妹离家失踪
  | 'true-mender'   // 修复 TRUE END：至少一个 NPC 被言灵点醒，改变了今晚行为
  | 'hidden-watch'  // 守望 HIDDEN END：连续选择"再守望片刻" ≥ 3 次后选"永远守望下去"

export type EndingState = Partial<Record<EndingId, true>>

export function loadEndings(): EndingState {
  if (typeof localStorage === 'undefined') return {}
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return {}
    const v = JSON.parse(raw)
    return v && typeof v === 'object' ? v : {}
  } catch { return {} }
}

export function unlockEnding(id: EndingId) {
  const s = loadEndings()
  if (s[id]) return
  s[id] = true
  try { localStorage.setItem(KEY, JSON.stringify(s)) } catch { /* ignore */ }
}

export function hasEnding(id: EndingId): boolean {
  return !!loadEndings()[id]
}
