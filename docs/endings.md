# 言灵神社 · 结局文案与机制

> 全部结局文案 + 触发条件 + 工程映射。代码侧实现见
> `src/components/ending/*` + `src/lib/endingFlags.ts` + `src/lib/npcStateStore.ts`。

主题锚：**修复 / 言灵 / AI 时代的自我修复**。
每个结局对应"言灵能力的某种使用姿态"。

---

## 核心灾难（被修复的对象）

**妹妹若叶今晚走山道离家 → 雨夜山路塌方 → 坠崖失踪**。

- 命运默认轨道：玩家什么都不做或没说对话 → 灾难发生 → 走 NORMAL END
- 阻止灾难的唯一方式：至少**一个家人 NPC** 在跟玩家对话中被"言灵"点醒，今晚因此做出不同的行为（拦人 / 说真相 / 给镜）

---

## BAD END · 沉默（`bad-silent`）

**触发**：玩家复活到鸟居旁后，直接走北侧两步抚摸鸟居（E），选"走过鸟居 · 离开" — 一句话都没说，一个人没影响，转身就走。

**对应主题**：放弃言灵能力 ≠ 自我修复，而是把"最坏的版本"留给别人去说。

### 文案（三段七句）

```
▍ 走这么快？
▍ ……好。结局成立。

▍ 言灵一字不说——沉默也会被补全。
▍ 你不写 "火"，火自己会来。
▍ 你不写 "罪"，罪会落在某个人身上。
▍ 你离开得越干净，结界写得越随便。

▍ ……下次出生，至少留一个词。
▍ 别把 "最坏的版本"，交给别人去说。
```

End Card：`言灵神社 · BAD END / 沉  默`

**解锁 CG**：`public/ui/cg/bad-end-silent.webp` — 巫女背影走过鸟居参道，雾合拢。

---

## NORMAL END · 错过（`normal-missed`）

**触发**：玩家累计对话 ≥ 10 条触发"夜色将至"提示，选"等待夜幕降临"时**没有任何 NPC 被点醒**。

**对应主题**：聊得多 ≠ 说到点。这是 AI 时代最常见的孤独 — 你说了一整天的话，没有一句被对的人听到。

### 文案（三段七句）

```
▍ 夜色压下来。神社的灯笼一盏盏点上。
▍ 你和家人聊了一整夜。话很多，雨却也越下越大。

▍ 妹妹背着小包袱，从后门轻轻走了出去。
▍ 没人看见她。也没人想到她会走山道。
▍ 第二天清早，村人在崖下找到一只绣着樱花的小包袱。

▍ 奶奶坐在廊下，第一次什么话都没说。
▍ 姐姐捧着那只包袱，跪了一夜。
▍ 爷爷修了一辈子东西，唯独这一件，修不回来。
```

End Card：`言灵神社 · NORMAL END / 错  过`  · 副标 `你聊了很多，却没说出能改变一件事的那一句`

**解锁 CG**：`public/ui/cg/normal-end-missed.webp` — 雨夜山道，小包袱坠在崖边，远处神社灯笼模糊。

---

## TRUE END · 修复（`true-mender`）

**触发**：玩家累计对话 ≥ 10 条触发"夜色将至"提示，选"等待夜幕降临"时**至少一个 NPC 被点醒**（LLM 判定 `kotodama_triggered=true` 或玩家用过"言灵传达"明示按钮）。

**对应主题**：一句对的话，能让另一个人今晚走不同的路。修复不靠多说，靠**对的那一句**。

### 文案（四段八/九句）

第 1 段 + 第 2 段第 1 句根据**哪个 NPC 被点中**做分支：

| 被点中的 NPC | Beat 2 首句 |
|---|---|
| warabe（妹妹自己） | `▍ 妹妹把包袱放回床脚，回到自己屋里。她不知道，今夜山道塌了。` |
| obaa-san（奶奶） | `▍ 奶奶推开妹妹房门，破了家规，把当年那件事一字一句告诉了她。` |
| shokunin（爷爷） | `▍ 爷爷把刚修好的镜送到妹妹手里。镜面映出一家人的脸。` |
| miko-shrine（姐姐） | `▍ 姐姐拦在房门口，第一次说："那年的镜子，不是你打碎的。"` |

固定文案：

```
▍ 夜色压下来。神社的灯笼一盏盏点上。
▍ 你说过的某一句话，被风带回某个人的心里。

<分支首句>
▍ 山道在午夜塌了 — 但那个本该走山道的人，今夜留下了。

▍ 第二天清早，碎了多年的镜在爷爷掌心合拢。
▍ 姐姐和妹妹在镜前并肩坐着，谁都没先开口。
▍ 镜子终于映出了完整的一家人。

▍ 你看着她们，自己一句话也没说。
▍ 言灵不是说得越多越好 ——
▍ 是有人，在对的那一刻，听到了对的那一句。
```

End Card：`言灵神社 · TRUE END / 修  复`  · 副标 `一句话，就能让另一个人今晚走不同的路`

**解锁 CG**：`public/ui/cg/true-end-mender.webp` — 神社室内暖灯，姐妹在镜前并肩坐，爷爷在旁修镜，氛围安宁。

---

## LLM 言灵判定机制（核心）

每个 NPC 的 system prompt = `persona/<id>.md` 内容 + 全局机制层（在 `src/lib/npcChat.ts` 的 `MECHANICS` 常量）。

机制层告诉 LLM：

1. 今夜灾难背景（妹妹走山道）
2. "言灵感知"的三条触发条件（A 说中秘密 / B 换角度看自己 / C 描述具体行动）
3. 判定要严，普通同情共情不算
4. 强制 JSON 输出 `{reply, kotodama_triggered, kotodama_phrase, kotodama_action}`

每个 persona md 中的"秘密层"是 LLM 用来判定 A 条件的事实集。

**容错**：
- LLM 不返回合法 JSON → 整段当文本回复，不触发 kotodama（不影响游戏继续）
- LLM 误判：玩家可点对话框底部 `言灵传达 · N` 按钮，强制把上一条玩家发言标记为该 NPC 的言灵。全局 3 次额度。

---

## 结局检测流程（`src/pages/Home.tsx`）

```
玩家每次发送消息 → bumpTalk(npcId) → totalTalk++
                                    → 该 NPC talkCount++

useEffect 监听 npcStateStore 订阅，每次 state 变：
  if (totalTalk >= 10 && !nightfallShown) → 弹 NightfallPrompt
                                            一次性，不会重复弹

NightfallPrompt 玩家点：
  "再守望片刻"   → 关闭，玩家继续探索
  "等待夜幕降临" → commitNightfall()
                  → anyTriggered() ?
                       TRUE END  → unlockEnding('true-mender') + EndingScene
                     :
                       NORMAL END → unlockEnding('normal-missed') + EndingScene
                  → 结局演完 → returnFromEnding()
                              → resetAll() 清 NPC 对话/状态（保留 endings flag）
                              → navigate('/')
```

`BAD END · 沉默` 走独立流程（不经 NightfallPrompt），直接由鸟居 trigger zone 走 `ToriiChoice` → `triggerBadEnding()`。

---

## 工程映射表

| 结局 id | 文件 | 触发位置 | 解锁产物 |
|---|---|---|---|
| `bad-silent` | `src/components/ending/BadEndingSilent.tsx` | `Home.tsx::handleInteract(zone.id==='torii')` → `ToriiChoice` 选离开 | CG 第 5 格 `bad-end-silent.webp` |
| `normal-missed` | `src/components/ending/EndingScene.tsx` + `EndingScripts.ts::normalScript()` | `Home.tsx::commitNightfall()` 当 `!anyTriggered()` | CG 第 6 格 `normal-end-missed.webp` |
| `true-mender` | `src/components/ending/EndingScene.tsx` + `EndingScripts.ts::trueScript(triggeredIds)` | `Home.tsx::commitNightfall()` 当 `anyTriggered()` | CG 第 7 格 `true-end-mender.webp` |

新增结局往 `src/lib/endingFlags.ts` 的 `EndingId` 联合类型里加，并在本文档登记。
