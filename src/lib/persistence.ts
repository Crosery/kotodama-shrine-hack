import { readJson, removeKey, writeJson } from '@/lib/storage'
import type { DialogueMessage } from '@/lib/dialogueEngine'
import type { ChatSettings } from '@/data/chatTypes'

export const persistKey = 'persist.v1'

export type PersistedChat = {
  version: 1
  messages: DialogueMessage[]
  currentNodeId: string
  settings: ChatSettings
}

export function loadChat(): PersistedChat | null {
  const data = readJson<PersistedChat>(persistKey)
  if (!data || data.version !== 1) return null
  return data
}

export function saveChat(snapshot: Omit<PersistedChat, 'version'>) {
  writeJson(persistKey, { version: 1, ...snapshot } satisfies PersistedChat)
}

export function patchSettings(settings: ChatSettings) {
  const prev = loadChat()
  if (!prev) return
  saveChat({ ...prev, settings })
}

export function clearChat() {
  removeKey(persistKey)
}
