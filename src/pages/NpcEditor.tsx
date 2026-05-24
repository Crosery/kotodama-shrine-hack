import { useEffect, useMemo, useRef, useState } from "react";
import { getCharacter } from "@/data/characters";
import {
  OBSTACLE_RECTS,
  PLAYER_FEET_OFFSET,
  PLAYER_SPAWN,
  SCENE_HEIGHT,
  SCENE_WIDTH,
  TRIGGER_ZONES,
  WALKABLE_RECTS,
} from "@/data/scene";
import {
  downloadNpcSpots,
  ensureNpcSpots,
  exportNpcSpotsJson,
  getNpcSpots,
  resetNpcSpotsRandom,
  setNpcSpots,
  subscribeNpcSpots,
  updateNpcSpot,
  type NpcSpot,
} from "@/data/npcStore";
import { getPainter, subscribePainter } from "@/lib/strokes";
import CharacterSprite from "@/components/character/CharacterSprite";

export default function NpcEditor() {
  const [spots, setSpots] = useState<NpcSpot[]>(() => getNpcSpots());
  const [painter, setPainter] = useState(() => getPainter());
  const [selected, setSelected] = useState<string | null>(spots[0]?.id ?? null);
  const [bgZoom, setBgZoom] = useState(1);
  const [showOverlay, setShowOverlay] = useState({
    walkable: true,
    obstacle: true,
    trigger: true,
    overlap: true,
    stroke: true,
  });

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [stageScaleBase, setStageScaleBase] = useState(0.35);
  const draggingRef = useRef<{ id: string; dx: number; dy: number } | null>(null);
  const [cursor, setCursor] = useState<[number, number] | null>(null);

  useEffect(() => {
    ensureNpcSpots();
    setSpots(getNpcSpots());
    const off = subscribeNpcSpots((v) => setSpots([...v]));
    return () => {
      off();
    };
  }, []);

  useEffect(() => {
    const off = subscribePainter((p) => setPainter(p));
    return () => {
      off();
    };
  }, []);

  useEffect(() => {
    function fit() {
      if (!wrapperRef.current) return;
      const w = wrapperRef.current.clientWidth - 32;
      setStageScaleBase(Math.max(0.15, Math.min(1.0, w / SCENE_WIDTH)));
    }
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  const scale = useMemo(() => stageScaleBase * bgZoom, [stageScaleBase, bgZoom]);
  const stageWidth = SCENE_WIDTH * scale;
  const stageHeight = SCENE_HEIGHT * scale;

  function eventToScene(ev: React.PointerEvent) {
    const rect = stageRef.current!.getBoundingClientRect();
    const x = Math.round((ev.clientX - rect.left) / scale);
    const y = Math.round((ev.clientY - rect.top) / scale);
    return [
      Math.max(0, Math.min(SCENE_WIDTH, x)),
      Math.max(0, Math.min(SCENE_HEIGHT, y)),
    ] as [number, number];
  }

  function onNpcPointerDown(ev: React.PointerEvent, spot: NpcSpot) {
    ev.stopPropagation();
    const target = ev.currentTarget as HTMLElement;
    target.setPointerCapture(ev.pointerId);
    const rect = stageRef.current!.getBoundingClientRect();
    const npcScreenX = rect.left + spot.x * scale;
    const npcScreenY = rect.top + spot.y * scale;
    draggingRef.current = {
      id: spot.id,
      dx: ev.clientX - npcScreenX,
      dy: ev.clientY - npcScreenY,
    };
    setSelected(spot.id);
  }

  function onNpcPointerMove(ev: React.PointerEvent) {
    const d = draggingRef.current;
    if (!d) {
      const p = eventToScene(ev);
      setCursor(p);
      return;
    }
    const rect = stageRef.current!.getBoundingClientRect();
    const screenX = ev.clientX - d.dx;
    const screenY = ev.clientY - d.dy;
    const sceneX = Math.max(0, Math.min(SCENE_WIDTH, Math.round((screenX - rect.left) / scale)));
    const sceneY = Math.max(0, Math.min(SCENE_HEIGHT, Math.round((screenY - rect.top) / scale)));
    updateNpcSpot(d.id, { x: sceneX, y: sceneY });
    setCursor([sceneX, sceneY]);
  }

  function onNpcPointerUp(ev: React.PointerEvent) {
    const d = draggingRef.current;
    if (!d) return;
    const target = ev.currentTarget as HTMLElement;
    try {
      target.releasePointerCapture(ev.pointerId);
    } catch {
      /* ignore */
    }
    const cur = getNpcSpots().find((s) => s.id === d.id);
    if (cur) {
      // eslint-disable-next-line no-console
      console.log(`[npc] ${d.id} -> (${cur.x}, ${cur.y})`);
    }
    draggingRef.current = null;
  }

  function onStagePointerMove(ev: React.PointerEvent) {
    if (draggingRef.current) return;
    const p = eventToScene(ev);
    setCursor(p);
  }

  function adjustRadius(delta: number) {
    if (!selected) return;
    const cur = getNpcSpots().find((s) => s.id === selected);
    if (!cur) return;
    const r = Math.max(40, Math.min(800, cur.talkRadius + delta));
    updateNpcSpot(selected, { talkRadius: r });
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.target as HTMLElement).tagName === "INPUT") return;
      if (e.key === "[") {
        e.preventDefault();
        adjustRadius(-20);
      } else if (e.key === "]") {
        e.preventDefault();
        adjustRadius(20);
      } else if (e.key === "Tab") {
        e.preventDefault();
        if (spots.length === 0) return;
        const idx = spots.findIndex((s) => s.id === selected);
        const next = spots[(idx + (e.shiftKey ? -1 : 1) + spots.length) % spots.length];
        setSelected(next.id);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, spots]);

  function copyJson() {
    navigator.clipboard?.writeText(exportNpcSpotsJson()).then(() => alert("已复制 npc-placements.json"));
  }

  async function importJson() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json,.json";
    input.onchange = async () => {
      const f = input.files?.[0];
      if (!f) return;
      try {
        const data = JSON.parse(await f.text()) as NpcSpot[];
        if (!Array.isArray(data)) throw new Error("not array");
        setNpcSpots(data);
      } catch (e) {
        alert("JSON 解析失败：" + e);
      }
    };
    input.click();
  }

  const selectedSpot = spots.find((s) => s.id === selected) ?? null;

  return (
    <div className="min-h-dvh bg-[#12081f] text-[rgba(247,244,232,0.92)]" ref={wrapperRef}>
      <header className="sticky top-0 z-30 flex flex-wrap items-center gap-2 border-b border-[rgba(247,244,232,0.12)] bg-[rgba(18,8,31,0.94)] px-4 py-2 text-sm">
        <strong className="mr-2 tracking-[0.18em]">NPC 摆放</strong>

        <span className="text-xs opacity-70">
          {spots.length} 个 NPC
          {selectedSpot ? ` · 选中：${getCharacter(selectedSpot.id).displayName} (${selectedSpot.x}, ${selectedSpot.y}) r=${selectedSpot.talkRadius}` : ""}
        </span>

        <span className="mx-2 opacity-50">|</span>
        <button className="annot-btn" onClick={() => adjustRadius(-20)} disabled={!selected}>对话半径 −</button>
        <button className="annot-btn" onClick={() => adjustRadius(20)} disabled={!selected}>对话半径 +</button>
        <span className="text-xs opacity-70">[ / ] 调半径 · Tab 切换 NPC</span>

        <span className="mx-2 opacity-50">|</span>
        <label className="text-xs opacity-80">缩放</label>
        <input type="range" min={0.5} max={3} step={0.05} value={bgZoom}
          onChange={(e) => setBgZoom(Number(e.target.value))} className="w-32" />
        <span className="text-xs opacity-70">{bgZoom.toFixed(2)}x</span>

        <span className="mx-2 opacity-50">|</span>
        <LayerToggle label="可走" on={showOverlay.walkable} onChange={(v) => setShowOverlay((s) => ({ ...s, walkable: v }))} />
        <LayerToggle label="障碍" on={showOverlay.obstacle} onChange={(v) => setShowOverlay((s) => ({ ...s, obstacle: v }))} />
        <LayerToggle label="触发区" on={showOverlay.trigger} onChange={(v) => setShowOverlay((s) => ({ ...s, trigger: v }))} />
        <LayerToggle label="重叠" on={showOverlay.overlap} onChange={(v) => setShowOverlay((s) => ({ ...s, overlap: v }))} />
        <LayerToggle label="障碍描线" on={showOverlay.stroke} onChange={(v) => setShowOverlay((s) => ({ ...s, stroke: v }))} />

        <span className="mx-2 opacity-50">|</span>
        <button className="annot-btn" onClick={copyJson}>复制 JSON</button>
        <button className="annot-btn" onClick={downloadNpcSpots}>下载 JSON</button>
        <button className="annot-btn" onClick={importJson}>导入 JSON</button>
        <button className="annot-btn danger" onClick={() => {
          if (confirm("随机重排所有 NPC？")) resetNpcSpotsRandom();
        }}>随机重置</button>
        <a href="/" className="annot-btn ml-auto">返回游戏</a>
      </header>

      <div className="px-4 pt-2 text-xs opacity-80">
        鼠标按住 NPC 拖动 → 自动保存进 localStorage['npc-placements.v1']。青色虚线圈 = 玩家走入即触发对话。鼠标
        <code className="text-cyan-300 ml-2 bg-black/40 px-2">{cursor ? `(${cursor[0]}, ${cursor[1]})` : "(-, -)"}</code>
      </div>

      <main className="p-4">
        <div
          ref={stageRef}
          className="relative mx-auto select-none overflow-hidden border border-[rgba(247,244,232,0.18)]"
          style={{
            width: stageWidth,
            height: stageHeight,
            backgroundImage: "url(/kotodama_bg.png)",
            backgroundSize: `${stageWidth}px ${stageHeight}px`,
            backgroundRepeat: "no-repeat",
            imageRendering: "pixelated",
            cursor: "default",
            touchAction: "none",
          }}
          onPointerMove={onStagePointerMove}
        >
          {/* 玩家 spawn 标记 */}
          <div
            style={{
              position: "absolute",
              left: PLAYER_SPAWN.x * scale + PLAYER_FEET_OFFSET.x * scale - 6,
              top: PLAYER_SPAWN.y * scale + PLAYER_FEET_OFFSET.y * scale - 6,
              width: 12,
              height: 12,
              borderRadius: "50%",
              background: "#ffe066",
              boxShadow: "0 0 10px rgba(255,224,102,0.9)",
              pointerEvents: "none",
            }}
            title="主角出生点"
          />

          {/* 各层覆盖 */}
          <svg
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
            viewBox={`0 0 ${SCENE_WIDTH} ${SCENE_HEIGHT}`}
            preserveAspectRatio="none"
          >
            {showOverlay.walkable && WALKABLE_RECTS.map((r, i) => (
              <rect key={`w${i}`} x={r.x} y={r.y} width={r.w} height={r.h}
                fill="rgba(120,255,160,0.10)" stroke="rgba(120,255,160,0.55)" strokeWidth={6} />
            ))}
            {showOverlay.obstacle && OBSTACLE_RECTS.map((r, i) => (
              <rect key={`o${i}`} x={r.x} y={r.y} width={r.w} height={r.h}
                fill="rgba(255,80,80,0.16)" stroke="rgba(255,80,80,0.85)" strokeWidth={6} />
            ))}
            {showOverlay.trigger && TRIGGER_ZONES.map((r) => (
              <rect key={`t${r.id}`} x={r.x} y={r.y} width={r.w} height={r.h}
                fill="rgba(46,230,230,0.10)" stroke="rgba(46,230,230,0.85)" strokeWidth={6}
                strokeDasharray="20 14" />
            ))}
            {showOverlay.stroke && painter.obstacle.map((s, i) => {
              if (s.length < 2) return null;
              const d = "M " + s.map(([x, y]) => `${x} ${y}`).join(" L ");
              return <path key={`s${i}`} d={d} fill="none" stroke="rgba(255,80,80,0.85)" strokeWidth={20} strokeLinecap="round" strokeLinejoin="round" />;
            })}
            {showOverlay.overlap && painter.overlap.map((s, i) => {
              if (s.length < 3) return null;
              const pts = s.map(([x, y]) => `${x},${y}`).join(" ");
              return <polygon key={`p${i}`} points={pts}
                fill="rgba(255,160,64,0.25)" stroke="rgba(255,160,64,0.95)" strokeWidth={5} />;
            })}

            {/* 对话范围圈 */}
            {spots.map((s) => (
              <circle key={`r${s.id}`} cx={s.x} cy={s.y} r={s.talkRadius}
                fill={selected === s.id ? "rgba(46,230,230,0.10)" : "rgba(46,230,230,0.04)"}
                stroke={selected === s.id ? "rgba(46,230,230,0.9)" : "rgba(46,230,230,0.4)"}
                strokeWidth={selected === s.id ? 8 : 4}
                strokeDasharray="20 14" />
            ))}
          </svg>

          {/* NPC sprite */}
          {spots.map((spot) => {
            const cfg = getCharacter(spot.id);
            const left = (spot.x - PLAYER_FEET_OFFSET.x) * scale;
            const top = (spot.y - PLAYER_FEET_OFFSET.y) * scale;
            const w = cfg.pixelWidth * scale;
            const h = cfg.pixelHeight * scale;
            const isSel = selected === spot.id;
            return (
              <div
                key={spot.id}
                onPointerDown={(ev) => onNpcPointerDown(ev, spot)}
                onPointerMove={onNpcPointerMove}
                onPointerUp={onNpcPointerUp}
                onPointerCancel={onNpcPointerUp}
                style={{
                  position: "absolute",
                  left,
                  top,
                  width: w,
                  height: h,
                  cursor: "grab",
                  touchAction: "none",
                  outline: isSel ? "2px solid rgba(46,230,230,0.9)" : "none",
                  outlineOffset: 2,
                }}
              >
                <div style={{ transform: `scale(${scale})`, transformOrigin: "top left", width: cfg.pixelWidth, height: cfg.pixelHeight, pointerEvents: "none" }}>
                  <CharacterSprite character={cfg} state="idle" />
                </div>
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: -22,
                    padding: "1px 6px",
                    background: "rgba(0,0,0,0.7)",
                    color: isSel ? "#2ee6e6" : "#ffe066",
                    fontSize: 11,
                    fontFamily: "ui-monospace, monospace",
                    whiteSpace: "nowrap",
                    pointerEvents: "none",
                  }}
                >
                  {cfg.displayName} ({spot.x},{spot.y}) r={spot.talkRadius}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      <style>{`
        .annot-btn {
          padding: 4px 10px;
          border: 1px solid rgba(247,244,232,0.2);
          background: rgba(18,8,31,0.7);
          color: rgba(247,244,232,0.92);
          border-radius: 2px;
          font-size: 12px;
          cursor: pointer;
          text-decoration: none;
          display: inline-block;
        }
        .annot-btn:hover { border-color: rgba(46,230,230,0.5); color: rgba(46,230,230,0.95); }
        .annot-btn[disabled] { opacity: 0.35; cursor: not-allowed; }
        .annot-btn.danger { color: rgba(255,168,201,0.92); border-color: rgba(255,168,201,0.4); }
      `}</style>
    </div>
  );
}

function LayerToggle({ label, on, onChange }: { label: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="text-xs opacity-80 flex items-center gap-1">
      <input type="checkbox" checked={on} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}
