# painter-web

纯 HTML + JS 单文件场景画线标注器。零依赖，零构建。

## 用法

两种打开方式：

**方式 A（同源，推荐）** — 跟游戏跑在同一个 vite dev server 下

```bash
# 已经做好软链 public/painter-web -> ../tools/painter-web
# 启动游戏 dev server
npm run dev:all
# 浏览器访问
http://localhost:5173/painter-web/index.html
```

同源访问下：
- 自动 fetch `/kotodama_bg.png` 加载默认背景
- 点「写入游戏 localStorage」直接把标注写到游戏的 `localStorage['painter.v1']`
- 切回游戏 `http://localhost:5173/` 按 F5 立即生效

**方式 B（独立 file://）** — 双击 index.html

```bash
open tools/painter-web/index.html
```

需要：
- 手动「选背景图」选本地 PNG，或者拖拽到画布
- 点「下载 JSON」拿到 strokes 文件
- 把 JSON 内容粘到游戏页面 devtools console：
  ```js
  localStorage.setItem('painter.v1', JSON.stringify(/* 粘贴 JSON */))
  ```

## 操作

| 操作 | 快捷键 |
|---|---|
| 切层 障碍 / 重叠 | 1 / 2 |
| 撤销 / 重做（200 步） | Cmd-Z / Cmd-Shift-Z |
| 画笔粗细 ± | [ / ] |
| 下载 JSON | S |
| 写入游戏 localStorage | L |
| 拖动左键 | 画自由曲线 |
| 起点小红/橙圆 | 点击删除该线 |

## 1:1 坐标

所有 stroke 存为原图整数像素：

```json
{
  "obstacle": [ [[x,y],[x,y],...], ... ],
  "overlap":  [ [[x,y],[x,y],...], ... ]
}
```

显示缩放只影响 canvas 渲染，不影响坐标。HUD 实时显示鼠标的原图坐标，验证 1:1。

## 自动草稿

每次操作自动写 `localStorage['painter-draft.v1']`（独立的草稿 key），下次打开自动恢复。要分发给游戏走「下载 JSON」或「写入游戏 localStorage」。

## 队友协作

把整个 `tools/painter-web/` 文件夹打 zip 发出去即可，对方双击 `index.html` 就能用，标完用「下载 JSON」回传。
