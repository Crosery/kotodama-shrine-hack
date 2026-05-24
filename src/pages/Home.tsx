import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ensureNpcSpots } from "@/data/npcStore";
import { preloadGameAssets } from "@/lib/preloadAssets";
import PixelShrineBackdrop from "@/components/chat/PixelShrineBackdrop";
import PlayerStage, { type NpcInteractInfo } from "@/components/character/PlayerStage";
import NpcStage from "@/components/character/NpcStage";
import ForegroundLayer from "@/components/character/ForegroundLayer";
import OverlapLayer from "@/components/character/OverlapLayer";
import IntroOverlay from "@/components/intro/IntroOverlay";
import NpcDialogPanel from "@/components/dialog/NpcDialogPanel";
import BgmPlayer from "@/components/audio/BgmPlayer";
import MobileControls from "@/components/mobile/MobileControls";
import OrientationLock from "@/components/mobile/OrientationLock";
import ToriiChoice from "@/components/ending/ToriiChoice";
import BadEndingSilent from "@/components/ending/BadEndingSilent";
import NightfallPrompt from "@/components/ending/NightfallPrompt";
import EndingScene, { type EndingScript } from "@/components/ending/EndingScene";
import { normalScript, trueScript, watchScript } from "@/components/ending/EndingScripts";
import KotodamaTriggerOverlay from "@/components/ending/KotodamaTriggerOverlay";
import GameModal from "@/components/ui/GameModal";
import { unlockEnding } from "@/lib/endingFlags";
import { anyTriggered, bumpWatch, clearLastTriggered, getLastTriggered, getState, getWatchCount, resetAll, subscribe, triggeredIds } from "@/lib/npcStateStore";
import type { LastTriggered } from "@/lib/npcStateStore";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useOrientation } from "@/hooks/useOrientation";
import type { TriggerZone } from "@/data/scene";
import { downloadNpcSpots, exportNpcSpotsJson, resetNpcSpotsRandom } from "@/data/npcStore";

export default function Home() {
  const params = useMemo(() => {
    if (typeof window === "undefined") return new URLSearchParams();
    return new URLSearchParams(window.location.search);
  }, []);
  const showDebug = params.get("debug") === "1";
  const skipIntro = params.get("skip-intro") === "1";
  const editNpc = params.get("edit-npc") === "1";
  const [introDone, setIntroDone] = useState(skipIntro);
  const [activeNpc, setActiveNpc] = useState<NpcInteractInfo | null>(null);
  const [toriiChoice, setToriiChoice] = useState(false);
  const [badEnding, setBadEnding] = useState(false);
  const [nightfallOpen, setNightfallOpen] = useState(false);
  // 夜幕之间需要继续聊够 NIGHTFALL_REARM 条才会再次弹出。lastPromptedAt = 上次弹出时的 totalTalk
  const [lastPromptedAt, setLastPromptedAt] = useState<number | null>(null);
  const [endingScript, setEndingScript] = useState<EndingScript | null>(null);
  const [stateTick, setStateTick] = useState(0);
  const [kotodamaEvent, setKotodamaEvent] = useState<LastTriggered | null>(null);
  const [confirmBack, setConfirmBack] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [confirmRandom, setConfirmRandom] = useState(false);
  const navigate = useNavigate();

  const NIGHTFALL_THRESHOLD = 10; // 首次"夜色将至"弹出的累计对话条数
  const NIGHTFALL_REARM = 4;      // 玩家选"再守望片刻"后，再聊 N 条才重新弹
  const WATCH_HIDDEN_AT = 2;      // 累计守望 N 次 → 第 N+1 次弹出时出现"永远守望下去"按钮
  const totalTalk = getState().totalTalk;
  const triggeredCount = triggeredIds().length;
  const watchCount = getWatchCount();

  // 每次 Home 挂载 = 新一局（刷新 /game / 主菜单点开始 / 直接打 URL 都会触发）
  // 全清：NPC 对话历史 / 言灵 manualLeft / talkCount / triggered / watchCount；endings flag 保留
  // 用 useState 初始化函数同步清，避免 useEffect 晚执行导致第一帧读到旧 totalTalk 立刻弹守望窗
  useState(() => { resetAll(); return true });

  useEffect(() => {
    const off = subscribe(() => {
      setStateTick((n) => n + 1);
      const last = getLastTriggered();
      if (last) setKotodamaEvent(last);
    });
    return off;
  }, []);

  useEffect(() => {
    if (nightfallOpen || endingScript || badEnding) return;
    // 首次：累计 ≥ THRESHOLD；之后每次：距上次弹出 ≥ REARM 条新对话
    const dueFirst = lastPromptedAt === null && totalTalk >= NIGHTFALL_THRESHOLD;
    const dueRearm = lastPromptedAt !== null && totalTalk - lastPromptedAt >= NIGHTFALL_REARM;
    if (dueFirst || dueRearm) {
      setNightfallOpen(true);
      setLastPromptedAt(totalTalk);
    }
  }, [stateTick, nightfallOpen, endingScript, badEnding, totalTalk, lastPromptedAt]);

  function keepWatching() {
    bumpWatch();
    setNightfallOpen(false);
  }

  function commitNightfall() {
    setNightfallOpen(false);
    const ids = triggeredIds();
    if (anyTriggered()) {
      unlockEnding("true-mender");
      setEndingScript(trueScript(ids));
    } else {
      unlockEnding("normal-missed");
      setEndingScript(normalScript());
    }
  }

  function commitForever() {
    setNightfallOpen(false);
    unlockEnding("hidden-watch");
    setEndingScript(watchScript());
  }

  function returnFromEnding() {
    resetAll(); // 清 NPC 状态与对话历史，玩家可以重玩；endings flag 保留
    setEndingScript(null);
    navigate("/");
  }
  const isMobile = useIsMobile();
  const orientation = useOrientation();
  // 手机竖屏时整树不渲染重型内容（视频/BGM/sprite/RAF），只显示提示
  // 横屏才 mount 完整游戏，避免竖屏阶段下载 + 解码大资源把手机卡死
  const blockedByPortrait = isMobile && orientation === "portrait";

  useEffect(() => {
    if (blockedByPortrait) return;
    ensureNpcSpots();
    const queued = preloadGameAssets();
    // eslint-disable-next-line no-console
    console.log(`[scene] 预加载 ${queued} 个资源`);
  }, [blockedByPortrait]);

  if (blockedByPortrait) {
    return <OrientationLock />;
  }

  function handleInteract(zone: TriggerZone) {
    if (zone.id === "torii") {
      setToriiChoice(true);
      return;
    }
    // eslint-disable-next-line no-console
    console.log("[trigger]", zone.id, zone.label);
  }

  function triggerBadEnding() {
    setToriiChoice(false);
    unlockEnding("bad-silent");
    setBadEnding(true);
  }

  function handleNpcInteract(npc: NpcInteractInfo) {
    setActiveNpc(npc);
  }

  function copyJsonToClipboard() {
    const text = exportNpcSpotsJson();
    navigator.clipboard?.writeText(text).then(() => setNotice("已复制 npc-placements.json"));
  }

  return (
    <div className="relative h-full min-h-dvh">
      <PixelShrineBackdrop motionLevel="medium" parallaxEnabled={false}>
        <NpcStage showDebug={showDebug} editMode={editNpc} />
        <PlayerStage
          onInteract={handleInteract}
          onNpcInteract={handleNpcInteract}
          showDebug={showDebug}
        />
        <ForegroundLayer />
        <OverlapLayer />
      </PixelShrineBackdrop>

      <div className="pointer-events-none fixed left-1/2 top-3 z-20 -translate-x-1/2">
        <div className="k-pixel-bubble border-[rgba(247,244,232,0.18)] bg-[rgba(18,8,31,0.55)] px-3 py-2 text-xs tracking-[0.18em] text-[rgba(247,244,232,0.78)]">
          {isMobile ? "左下摇杆 移动 · 右下 互动" : "WASD / 方向键 移动 · E / 空格 互动"}
          {editNpc ? " · NPC 编辑模式：拖动 NPC 调整位置，自动保存" : ""}
        </div>
      </div>

      {/* 返回主菜单：右上角，弃局即清空（点了走样式化弹窗确认，不是浏览器原生） */}
      <button
        type="button"
        onClick={() => setConfirmBack(true)}
        className="k-pixel-bubble border-[rgba(247,244,232,0.22)] bg-[rgba(18,8,31,0.72)] px-3 py-2 text-xs tracking-[0.18em] text-[rgba(247,244,232,0.82)] hover:border-[rgba(244,168,201,0.45)] hover:text-[rgba(244,168,201,0.92)]"
        style={{
          position: "fixed",
          top: 12,
          right: 12,
          zIndex: 25,
          fontFamily: "inherit",
          cursor: "pointer",
        }}
      >
        返回主菜单
      </button>

      {isMobile && introDone ? <MobileControls /> : null}

      {editNpc ? (
        <div className="fixed bottom-3 left-1/2 z-30 -translate-x-1/2 flex gap-2">
          <button
            onClick={copyJsonToClipboard}
            className="k-pixel-bubble border-[rgba(46,230,230,0.32)] bg-[rgba(18,8,31,0.78)] px-3 py-2 text-xs tracking-[0.12em] text-[rgba(46,230,230,0.92)] hover:bg-[rgba(46,230,230,0.12)]"
          >
            复制 JSON
          </button>
          <button
            onClick={downloadNpcSpots}
            className="k-pixel-bubble border-[rgba(46,230,230,0.32)] bg-[rgba(18,8,31,0.78)] px-3 py-2 text-xs tracking-[0.12em] text-[rgba(46,230,230,0.92)] hover:bg-[rgba(46,230,230,0.12)]"
          >
            下载 JSON
          </button>
          <button
            onClick={() => setConfirmRandom(true)}
            className="k-pixel-bubble border-[rgba(244,168,201,0.32)] bg-[rgba(18,8,31,0.78)] px-3 py-2 text-xs tracking-[0.12em] text-[rgba(244,168,201,0.92)] hover:bg-[rgba(244,168,201,0.12)]"
          >
            随机重置
          </button>
        </div>
      ) : null}

      <BgmPlayer ready={introDone} />

      {introDone ? null : <IntroOverlay onDone={() => setIntroDone(true)} />}

      {activeNpc ? (
        <NpcDialogPanel
          npcId={activeNpc.id}
          displayName={activeNpc.displayName}
          onClose={() => setActiveNpc(null)}
        />
      ) : null}

      {toriiChoice ? (
        <ToriiChoice
          onLeave={triggerBadEnding}
          onStay={() => setToriiChoice(false)}
        />
      ) : null}

      {badEnding ? (
        <BadEndingSilent onDone={() => navigate("/")} />
      ) : null}

      {nightfallOpen ? (
        <NightfallPrompt
          triggeredCount={triggeredCount}
          watchCount={watchCount}
          showHidden={watchCount >= WATCH_HIDDEN_AT}
          onClose={keepWatching}
          onWait={commitNightfall}
          onForever={commitForever}
        />
      ) : null}

      {endingScript ? (
        <EndingScene script={endingScript} onDone={returnFromEnding} />
      ) : null}

      {kotodamaEvent ? (
        <KotodamaTriggerOverlay
          event={kotodamaEvent}
          onDismiss={() => { setKotodamaEvent(null); clearLastTriggered(); }}
        />
      ) : null}

      {confirmBack ? (
        <GameModal
          title="▍ 回到主菜单？"
          body={<>这一局的对话与状态将全部清空。<br /><span style={{ opacity: 0.7 }}>结局解锁的 CG 保留。</span></>}
          primary="回主菜单"
          secondary="再守一会"
          accent="magenta"
          onPrimary={() => { setConfirmBack(false); navigate("/"); }}
          onCancel={() => setConfirmBack(false)}
        />
      ) : null}

      {confirmRandom ? (
        <GameModal
          title="重置 NPC 位置？"
          body="将随机重排所有 NPC 位置（编辑模式工具）。"
          primary="重排"
          secondary="取消"
          accent="magenta"
          onPrimary={() => { setConfirmRandom(false); resetNpcSpotsRandom(); }}
          onCancel={() => setConfirmRandom(false)}
        />
      ) : null}

      {notice ? (
        <GameModal
          title="提示"
          body={notice}
          primary="知道了"
          onPrimary={() => setNotice(null)}
          onCancel={() => setNotice(null)}
        />
      ) : null}
    </div>
  );
}
