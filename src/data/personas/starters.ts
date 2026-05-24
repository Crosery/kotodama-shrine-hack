// 玩家第一次跟某 NPC 说话时显示的候选开场白
// LLM 还没产出 suggestions，这里兜底
export const STARTER_SUGGESTIONS: Record<string, string[]> = {
  'obaa-san': [
    '您是这神社的长辈吗',
    '今晚的雨好像要来了',
    '能听您讲段这神社的旧事吗',
  ],
  shokunin: [
    '您手里在修什么',
    '这镜子……看着年头不浅',
    '您一直住在这神社？',
  ],
  'miko-shrine': [
    '您是这神社的巫女吗',
    '您看起来有点累',
    '您一直一个人守着这里吗',
  ],
  warabe: [
    '你住在这里吗',
    '你今晚要去哪里吗',
    '你看起来好像有心事',
  ],
}

export function getStarters(npcId: string): string[] {
  return STARTER_SUGGESTIONS[npcId] ?? [
    '你好',
    '我能跟你说说话吗',
    '今晚的神社真安静',
  ]
}
