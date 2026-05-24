# 2D RPG 场景碰撞与移动 落地说明

## 业界做法（按场景类型分）

| 场景 | 主流做法 | 代表作 |
|---|---|---|
| Tile-based 地图 | 每 tile 标 walkable / solid + tile-based pathfinding | Pokemon / Stardew Valley / RPG Maker MV |
| 单张背景图 | walkable polygon / NavMesh 2D + obstacle AABB | 老式 AVG / 类银河战士零碎 ARPG |
| 复杂物理 | box2d / Unity Physics2D / Godot PhysicsBody2D | Hollow Knight / Celeste |

我们场景是 3840×2160 单张静态背景，没有 tile，选 polygon-style：**walkable rect 白名单 + obstacle rect 黑名单**。

## 五条核心选型

1. **Feet hitbox**：碰撞用脚下 56×28 像素矩形，不是整 sprite。原因：人物头部可以穿过灯笼上半截的"树冠"区，只有脚是接触地面的。Stardew / RPG Maker 默认做法。
2. **Walkable 白名单**：背景图非 tilemap，逐像素 mask 内存占用大。改用 5 个 walkable rect 联合（参道/坡道/鸟居平台/前广场/小摊空地）。脚下任一角不在白名单 = 拒绝移动。
3. **Obstacle 黑名单**：在 walkable 内还要剔除狛犬底座、灯笼基座、主殿墙根，用小 AABB 列。
4. **Axis-separated movement**：dx / dy 独立 try。撞墙时另一轴还能滑，体感不卡死。教科书做法，Constructing a 2D Platformer / Game Programming Patterns 都讲。
5. **Trigger zone**：互动点用更大的 AABB（赛钱箱 320×100、绘马架 700×200）。脚进入显示提示，按 E 触发。

## 代码位置

| 关注点 | 文件 | 实现 |
|---|---|---|
| 场景常量、walkable、obstacle、trigger | `src/data/scene.ts` | rect 列表 + spawn 点 |
| 视口换算 | `src/lib/coords.ts` | `computeViewport` cover 模式 + `sceneToScreen` |
| 碰撞判定 | `src/lib/collision.ts` | `feetBox` / `tryMove` 轴分离 / `findTriggerUnder` |
| 输入 | `src/hooks/useKeyboardMovement.ts` | WASD/方向键 + E/Space/Enter |
| 玩家组件 | `src/components/character/PlayerStage.tsx` | RAF tick + DOM transform 直写避 React rerender |
| sprite 多状态 | `src/data/characters.ts` + `CharacterSprite.tsx` | idle / walk-front/back/left/right |

## 调参入口

- `PLAYER_SPEED`：场景像素/秒，默认 360
- `PLAYER_FEET_HALF`：脚 hitbox 半宽半高 28×14
- `WALKABLE_RECTS` / `OBSTACLE_RECTS`：rect 列表，用 `?debug=1` 在浏览器里可视化看
- `TRIGGER_ZONES`：互动 AABB + label

## 调试

```
http://localhost:5173/?debug=1
```

屏幕左上角显示 `pos x,y / scale / trigger id`；trigger AABB 用青色虚线框；进入区域时框填实色。

## 画线工具 /annotator

最常用工具：在场景图上画自由曲线，两种类型：

| 类型 | 用途 | 实现 |
|---|---|---|
| 障碍线（红） | 不可走边界 | 玩家脚 4 角到任一线段距离 < `STROKE_PAD`(14px) 即拒绝 |
| 重叠线（橙） | 前景遮挡 | 线条闭合为 polygon，SVG `clipPath` 把背景图 polygon 区域重画在玩家之上 |

操作：

| 操作 | 按键 |
|---|---|
| 切换层 | 1 / 2 |
| 画笔粗细 ± | [ / ] |
| 撤销 / 重做 | Cmd-Z / Cmd-Shift-Z（容量 200） |
| 删除某条线 | hover 行首小红圈 × |
| 清当前层 / 清全部 | 顶部按钮 |
| 导入 / 导出 JSON | 顶部按钮 |

数据流：

```
Painter UI ── 鼠标 stroke ──▶ localStorage 'painter.v1'
                                    │
                       ┌────────────┴────────────┐
                       ▼                         ▼
src/lib/collision.ts            src/components/character/OverlapLayer.tsx
  feetAllowed 多检查              SVG clipPath + image href=/kotodama_bg.png
  obstacle stroke 段距离          polygon 区域复刻背景到 z=15 玩家上方
```

游戏端读取时机：模块首次加载，画完切回 `/` 按 F5 即生效。

## 旧 rect/polygon 标注器（保留）

旧的 walkable/obstacle rect + polygon 标注通过 `src/lib/annotationOverride.ts` 同时支持。两套数据并存，碰撞检测同时跑两份。如果不需要可在标注页"清 localStorage" 清掉。



可视化画 walkable / obstacle / trigger / polygon obstacle，自动写 localStorage 覆盖源码默认值。

入口：游戏右上角"打开标注器"，或直接 `http://localhost:5173/annotator`。

| 操作 | 工具 |
|---|---|
| 1 / 2 / 4 | 切到可走矩形 / 不可走矩形 / 触发区 |
| 3 | 切到不可走多边形 |
| 左键拖拽 | 画矩形（rect 模式） |
| 左键点击 | 多边形加点（polygon 模式） |
| Enter / 双击 | 闭合多边形 |
| Backspace | 删除最后一个 polygon 点 |
| Esc | 取消草稿 / 当前拖拽 |
| Cmd-Z / Cmd-Shift-Z | 撤销 / 重做（容量 100 步） |
| hover 矩形 | 显示红色 × 删除按钮 |
| 以光标设 spawn | 把当前光标位置存为玩家出生点 |
| 导出 TS / JSON | 下载文件 |
| 导入 JSON | 从外部 JSON 恢复 |
| 清 localStorage | 删除覆盖、恢复源码值 |

数据流：

```
Annotator UI ── 每次变更 ──▶ localStorage 'annotator.v2'
                                    │
                                    ▼
src/lib/annotationOverride.ts ── module load ──▶ ACTIVE_WALKABLE / ACTIVE_OBSTACLE / ACTIVE_OBSTACLE_POLYGONS / ACTIVE_TRIGGERS / ACTIVE_SPAWN
                                    │
                                    ▼
src/lib/collision.ts ── feetAllowed / findTriggerUnder
```

游戏端读取时机：模块首次加载（即页面刷新时）。在标注器画完，切回游戏标签按 F5 / 刷新即生效。

碰撞规则：
- 脚 hitbox 4 角 + 中心，全在某 ACTIVE_WALKABLE 矩形内 = 合法
- 任一角 / 矩形相交 ACTIVE_OBSTACLE 矩形 = 拒绝
- 任一角落在 ACTIVE_OBSTACLE_POLYGONS 任一多边形内（射线法 pointInPolygon） = 拒绝
