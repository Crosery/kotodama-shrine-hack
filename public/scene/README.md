# 场景素材清单

游戏启动时自动 fetch 本目录下的 JSON 文件并合并到运行时碰撞 / 遮挡数据中。

## 文件约定

| 文件 | 内容 | 必需 |
|---|---|---|
| `intro.mp4` | 进入游戏的过场动画（1280×720 H.264） | 可选，缺则黑屏 1s 后直接进场 |
| `obstacles.json` | 障碍线 strokes（不可走线条） | 可选 |
| `overlaps.json` | 重叠线 strokes（前景遮挡多边形） | 可选 |

## 启动流程

`/` 路径加载 → 黑屏 1s → 播放 `intro.mp4` → 视频结束（或按右下「跳过 ›」）→ 进入场景。
URL 加 `?skip-intro=1` 直接跳过过场（开发调试用）。

## JSON 格式（任一形式都识别）

裸 strokes 数组（每条线是 `[x,y]` 数组）：
```json
[
  [[100,200],[110,205],[120,210]],
  [[300,400],[310,395]]
]
```

或包一层 `{strokes: [...]}`：
```json
{ "strokes": [ [[100,200], ...] ] }
```

或完整 painter-web 导出 `{obstacle, overlap}`：
```json
{ "obstacle": [...], "overlap": [...] }
```

`obstacles.json` 默认读 obstacle 层，`overlaps.json` 默认读 overlap 层。

## 坐标系

原图 `kotodama_bg.png` 像素，左上角 (0,0)，3840×2160。

## 其它素材索引

- 背景：`../kotodama_bg.png`
- 人物 sprite：`../characters/` 软链 → `../../images/`
- cutout 前景：`../cutouts/`
- 标注工具：`../painter-web/` 软链 → `../../tools/painter-web/`
