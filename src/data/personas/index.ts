// 通过 vite 的 ?raw 后缀把每个 .md 文件作为字符串静态导入
// 新增 NPC：在本目录加一个 <id>.md，然后在 NPC_PERSONAS 里登记
import warabe from './warabe.md?raw'
import obaasan from './obaa-san.md?raw'
import shokunin from './shokunin.md?raw'
import mikoShrine from './miko-shrine.md?raw'
import fallback from './_default.md?raw'

export const NPC_PERSONAS: Record<string, string> = {
  warabe,
  'obaa-san': obaasan,
  shokunin,
  'miko-shrine': mikoShrine,
}

export function getNpcPersona(id: string): string {
  return NPC_PERSONAS[id] ?? fallback
}
