import { create } from 'zustand'
import storyJson from '@/scripts/dialogue.story.json'
import {
  getNode,
  validateStory,
  type DialogueMessage,
  type DialogueStory,
} from '@/lib/dialogueEngine'
import { llmConfig } from '@/config/llm'
import {
  clearChat,
  loadChat,
  patchSettings,
  saveChat,
} from '@/lib/persistence'
import {
  newMessageId,
  type ChatSettings,
  type ChatStatus,
} from '@/data/chatTypes'
import { pickFreeTextNextId, runNpcTurn } from '@/services/turnEngine'

type ChatState = {
  story: DialogueStory
  status: ChatStatus
  errorMessage: string | null
  settingsOpen: boolean
  settings: ChatSettings
  messages: DialogueMessage[]
  currentNodeId: string
  boot: () => void
  reset: () => void
  setSettings: (patch: Partial<ChatSettings>) => void
  setSettingsOpen: (open: boolean) => void
  sendReply: (replyId: string) => void
  sendFreeText: (text: string) => void
}

const story = storyJson as unknown as DialogueStory

const defaultSettings: ChatSettings = {
  soundEnabled: true,
  motionLevel: 'medium',
  bgParallaxEnabled: true,
  llmEnabled: llmConfig.enabled,
}

function makeOpeningMessage(): DialogueMessage {
  const startNode = getNode(story, story.startId)
  if (!startNode) throw new Error(`找不到开场节点: ${story.startId}`)
  return {
    id: newMessageId(),
    role: 'npc',
    text: startNode.npcText,
    createdAt: Date.now(),
    nodeId: startNode.id,
  }
}

export const useChatStore = create<ChatState>((set, get) => ({
  story,
  status: 'idle',
  errorMessage: null,
  settingsOpen: false,
  settings: defaultSettings,
  messages: [],
  currentNodeId: story.startId,

  boot: () => {
    const validation = validateStory(story)
    if (validation.ok === false) {
      set({ status: 'error', errorMessage: validation.errors.join('\n') })
      return
    }

    const persisted = loadChat()
    if (persisted?.messages?.length) {
      set({
        status: 'idle',
        errorMessage: null,
        messages: persisted.messages,
        currentNodeId: persisted.currentNodeId,
        settings: { ...get().settings, ...(persisted.settings ?? {}) },
      })
      return
    }

    try {
      const first = makeOpeningMessage()
      set({ status: 'idle', errorMessage: null, messages: [first], currentNodeId: story.startId })
      saveChat({
        messages: [first],
        currentNodeId: story.startId,
        settings: get().settings,
      })
    } catch (e) {
      set({ status: 'error', errorMessage: e instanceof Error ? e.message : '启动失败' })
    }
  },

  reset: () => {
    try {
      const first = makeOpeningMessage()
      clearChat()
      set({ status: 'idle', errorMessage: null, messages: [first], currentNodeId: story.startId })
      saveChat({
        messages: [first],
        currentNodeId: story.startId,
        settings: get().settings,
      })
    } catch (e) {
      set({ status: 'error', errorMessage: e instanceof Error ? e.message : '重置失败' })
    }
  },

  setSettings: (patch) => {
    const next = { ...get().settings, ...patch }
    set({ settings: next })
    patchSettings(next)
  },

  setSettingsOpen: (open) => set({ settingsOpen: open }),

  sendReply: (replyId) => {
    const { story, currentNodeId, status, settings } = get()
    if (status !== 'idle') return

    const node = getNode(story, currentNodeId)
    if (!node) {
      set({ status: 'error', errorMessage: `节点丢失: ${currentNodeId}` })
      return
    }

    const reply = node.replies.find((r) => r.id === replyId)
    if (!reply) return

    const playerText = (reply.emitText ?? reply.label).trim()
    if (!playerText) return

    const playerMsg: DialogueMessage = {
      id: newMessageId(),
      role: 'player',
      text: playerText,
      createdAt: Date.now(),
      nodeId: currentNodeId,
    }

    const nextMessages = [...get().messages, playerMsg]
    set({ messages: nextMessages, status: 'thinking' })
    saveChat({ messages: nextMessages, currentNodeId, settings })

    void runNpcTurn({
      story,
      currentNodeId,
      history: nextMessages,
      llmEnabled: settings.llmEnabled,
      motionLevel: settings.motionLevel,
      scriptedNextId: reply.nextId,
    }).then((result) => {
      if (result.ok === false) {
        set({ status: 'error', errorMessage: result.error })
        return
      }
      const after = [...get().messages, result.npcMessage]
      set({ status: 'idle', currentNodeId: result.nextNodeId, messages: after })
      saveChat({ messages: after, currentNodeId: result.nextNodeId, settings: get().settings })
    })
  },

  sendFreeText: (text) => {
    const { story, currentNodeId, status, settings } = get()
    if (status === 'error') return
    const value = text.trim()
    if (!value) return

    const playerMsg: DialogueMessage = {
      id: newMessageId(),
      role: 'player',
      text: value,
      createdAt: Date.now(),
      nodeId: currentNodeId,
    }
    const after = [...get().messages, playerMsg]
    set({ messages: after })
    saveChat({ messages: after, currentNodeId, settings })

    if (status !== 'idle') return

    const scriptedNextId = settings.llmEnabled ? null : pickFreeTextNextId(story, currentNodeId)
    if (!settings.llmEnabled && !scriptedNextId) return

    set({ status: 'thinking' })

    void runNpcTurn({
      story,
      currentNodeId,
      history: after,
      llmEnabled: settings.llmEnabled,
      motionLevel: settings.motionLevel,
      scriptedNextId,
    }).then((result) => {
      if (result.ok === false) {
        set({ status: 'error', errorMessage: result.error })
        return
      }
      const finalMessages = [...get().messages, result.npcMessage]
      set({ status: 'idle', currentNodeId: result.nextNodeId, messages: finalMessages })
      saveChat({
        messages: finalMessages,
        currentNodeId: result.nextNodeId,
        settings: get().settings,
      })
    })
  },
}))

export type { ChatSettings } from '@/data/chatTypes'
