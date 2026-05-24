import {
  getNode,
  resolveNextId,
  type DialogueMessage,
  type DialogueStory,
} from '@/lib/dialogueEngine'
import { requestNpcReply } from '@/lib/llmClient'
import { motionDelay, newMessageId, type MotionLevel } from '@/data/chatTypes'

export type NpcTurnInput = {
  story: DialogueStory
  currentNodeId: string
  history: DialogueMessage[]
  llmEnabled: boolean
  motionLevel: MotionLevel
  scriptedNextId: string | null
}

export type NpcTurnSuccess = {
  ok: true
  npcMessage: DialogueMessage
  nextNodeId: string
}

export type NpcTurnFailure = {
  ok: false
  error: string
}

export type NpcTurnResult = NpcTurnSuccess | NpcTurnFailure

export async function runNpcTurn(input: NpcTurnInput): Promise<NpcTurnResult> {
  const { story, currentNodeId, history, llmEnabled, motionLevel, scriptedNextId } = input

  if (llmEnabled) {
    try {
      const text = await requestNpcReply(history)
      return {
        ok: true,
        nextNodeId: currentNodeId,
        npcMessage: {
          id: newMessageId(),
          role: 'npc',
          text,
          createdAt: Date.now(),
          nodeId: currentNodeId,
        },
      }
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : 'LLM 请求失败' }
    }
  }

  const targetId = scriptedNextId
  if (!targetId) return { ok: false, error: '没有下一节点' }
  await delay(motionDelay(motionLevel))
  const nextNode = getNode(story, targetId)
  if (!nextNode) return { ok: false, error: `节点丢失: ${targetId}` }
  return {
    ok: true,
    nextNodeId: nextNode.id,
    npcMessage: {
      id: newMessageId(),
      role: 'npc',
      text: nextNode.npcText,
      createdAt: Date.now(),
      nodeId: nextNode.id,
    },
  }
}

export function pickFreeTextNextId(story: DialogueStory, currentNodeId: string): string | null {
  const node = getNode(story, currentNodeId)
  if (!node) return null
  return resolveNextId(story, node, null)
}

function delay(ms: number) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, ms))
}
