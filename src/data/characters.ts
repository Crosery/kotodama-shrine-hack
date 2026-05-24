export type SpriteState = 'idle' | 'walk-front' | 'walk-back' | 'walk-left' | 'walk-right'

export type StateSheet = {
  count: number
  fps?: number
  frameUrl: (i: number) => string
}

export type CharacterConfig = {
  id: string
  displayName: string
  pixelWidth: number
  pixelHeight: number
  states: Partial<Record<SpriteState, StateSheet>>
}

import { asset } from '@/data/sceneAssets'

const npcIdle = (id: string, count = 8): StateSheet => ({
  count,
  fps: 3,
  frameUrl: (i) => asset(`/characters/npc/${id}/${id}_idle_${String(i + 1).padStart(2, '0')}.png`),
})

const mikoFrames = (state: 'idle' | 'walk-front' | 'walk-back' | 'walk-left' | 'walk-right'): StateSheet => ({
  count: 3,
  fps: state === 'idle' ? 2 : 4,
  frameUrl: (i) => asset(`/characters/main/miko/frames/${state}/${String(i + 1).padStart(2, '0')}.png`),
})

export const CHARACTERS: Record<string, CharacterConfig> = {
  miko: {
    id: 'miko',
    displayName: '神社巫女',
    pixelWidth: 192,
    pixelHeight: 208,
    states: {
      idle: mikoFrames('idle'),
      'walk-front': mikoFrames('walk-front'),
      'walk-back': mikoFrames('walk-back'),
      'walk-left': mikoFrames('walk-left'),
      'walk-right': mikoFrames('walk-right'),
    },
  },
  warabe: {
    id: 'warabe',
    displayName: '若叶 · 童子',
    pixelWidth: 192,
    pixelHeight: 208,
    states: { idle: npcIdle('warabe') },
  },
  'miko-shrine': {
    id: 'miko-shrine',
    displayName: '神社巫女 · 见习',
    pixelWidth: 192,
    pixelHeight: 208,
    states: { idle: npcIdle('miko') },
  },
  'obaa-san': {
    id: 'obaa-san',
    displayName: '神社老妪',
    pixelWidth: 192,
    pixelHeight: 208,
    states: { idle: npcIdle('obaa-san') },
  },
  shokunin: {
    id: 'shokunin',
    displayName: '工匠',
    pixelWidth: 192,
    pixelHeight: 208,
    states: { idle: npcIdle('shokunin') },
  },
}

export const DEFAULT_NPC_ID = 'warabe'

export function getCharacter(id?: string): CharacterConfig {
  if (id && CHARACTERS[id]) return CHARACTERS[id]
  return CHARACTERS[DEFAULT_NPC_ID]
}

export function pickState(character: CharacterConfig, want: SpriteState): SpriteState {
  if (character.states[want]) return want
  return 'idle'
}
