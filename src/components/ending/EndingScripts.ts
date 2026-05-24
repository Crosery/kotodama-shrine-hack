// 普通结局 / 真结局 的文案剧本
// 真结局的 beat 1 末句会根据哪个 NPC 被点中略改

import type { EndingScript } from './EndingScene'
import { asset } from '@/data/sceneAssets'

const NPC_LINE: Record<string, string> = {
  warabe: '▍ 妹妹把包袱放回床脚，回到自己屋里。她不知道，今夜山道塌了。',
  'obaa-san': '▍ 奶奶推开妹妹房门，破了家规，把当年那件事一字一句告诉了她。',
  shokunin: '▍ 爷爷把刚修好的镜送到妹妹手里。镜面映出一家人的脸。',
  'miko-shrine': '▍ 姐姐拦在房门口，第一次说："那年的镜子，不是你打碎的。"',
}

export function normalScript(): EndingScript {
  return {
    variant: 'normal',
    cgUrl: asset('/ui/cg/normal-end-missed.webp'),
    cardTop: '言灵神社 · NORMAL END',
    cardTitle: '错  过',
    cardSub: '你聊了很多，却没说出能改变一件事的那一句',
    beats: [
      [
        '▍ 夜色压下来。神社的灯笼一盏盏点上。',
        '▍ 你和家人聊了一整夜。话很多，雨却也越下越大。',
      ],
      [
        '▍ 妹妹背着小包袱，从后门轻轻走了出去。',
        '▍ 没人看见她。也没人想到她会走山道。',
        '▍ 第二天清早，村人在崖下找到一只绣着樱花的小包袱。',
      ],
      [
        '▍ 奶奶坐在廊下，第一次什么话都没说。',
        '▍ 姐姐捧着那只包袱，跪了一夜。',
        '▍ 爷爷修了一辈子东西，唯独这一件，修不回来。',
      ],
    ],
  }
}

export function watchScript(): EndingScript {
  return {
    variant: 'true', // 共用 cyan/glow 配色
    cgUrl: asset('/ui/cg/hidden-watch.webp'),
    cardTop: '言灵神社 · HIDDEN END',
    cardTitle: '守  望',
    cardSub: '当你选择不打扰，你已经成为了她们的神',
    beats: [
      [
        '▍ 夜色一次次压下来。每一次，你都留下了。',
        '▍ 你说不上来为什么。也许，只是想再看一会。',
      ],
      [
        '▍ 看妹妹笑。看姐姐扫殿。',
        '▍ 看奶奶抄祝词。看爷爷修镜。',
        '▍ 看这家人在不知道命运的夜里，照常生活。',
      ],
      [
        '▍ 然后你低头——发现自己的影子，已经和神社的鸟居重叠了。',
        '▍ 言灵神说：「你已经守了太久了。」',
        '▍ 「今夜以后，你就是这座神社的言灵。」',
      ],
      [
        '▍ 妹妹不会走山道。但你也再不能离开。',
        '▍ 你成了她们没察觉的、永远在场的眼睛。',
        '▍ 修复不一定要改变什么 ——',
        '▍ 守望本身，就是一种修复。',
      ],
    ],
  }
}

export function trueScript(triggeredIds: string[]): EndingScript {
  // 取第一个被点中的 NPC 作为本结局的"行动者"叙述
  const primary = triggeredIds.find((id) => NPC_LINE[id]) ?? null
  const branchLine = primary ? NPC_LINE[primary] : '▍ 有人，在最后的时刻做了不一样的事。'
  return {
    variant: 'true',
    cgUrl: asset('/ui/cg/true-end-mender.webp'),
    cardTop: '言灵神社 · TRUE END',
    cardTitle: '修  复',
    cardSub: '一句话，就能让另一个人今晚走不同的路',
    beats: [
      [
        '▍ 夜色压下来。神社的灯笼一盏盏点上。',
        '▍ 你说过的某一句话，被风带回某个人的心里。',
      ],
      [
        branchLine,
        '▍ 山道在午夜塌了 — 但那个本该走山道的人，今夜留下了。',
      ],
      [
        '▍ 第二天清早，碎了多年的镜在爷爷掌心合拢。',
        '▍ 姐姐和妹妹在镜前并肩坐着，谁都没先开口。',
        '▍ 镜子终于映出了完整的一家人。',
      ],
      [
        '▍ 你看着她们，自己一句话也没说。',
        '▍ 言灵不是说得越多越好 ——',
        '▍ 是有人，在对的那一刻，听到了对的那一句。',
      ],
    ],
  }
}
