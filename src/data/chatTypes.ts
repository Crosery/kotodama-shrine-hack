export type MotionLevel = 'low' | 'medium' | 'high'

export type ChatSettings = {
  soundEnabled: boolean
  motionLevel: MotionLevel
  bgParallaxEnabled: boolean
  llmEnabled: boolean
}

export type ChatStatus = 'idle' | 'thinking' | 'error'

export function motionDelay(level: MotionLevel) {
  if (level === 'low') return 240
  if (level === 'high') return 620
  return 420
}

export function newMessageId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`
}
