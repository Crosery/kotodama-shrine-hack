import { RotateCcw, SlidersHorizontal, Volume2, VolumeX, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatSettings } from "@/stores/useChatStore";

export default function SettingsDrawer({
  open,
  settings,
  canExport,
  onClose,
  onReset,
  onExport,
  onChangeSettings,
  onClickSfx,
}: {
  open: boolean;
  settings: ChatSettings;
  canExport: boolean;
  onClose: () => void;
  onReset: () => void;
  onExport: () => void;
  onChangeSettings: (patch: Partial<ChatSettings>) => void;
  onClickSfx: () => void;
}) {
  return (
    <div className={cn("fixed inset-0 z-30", open ? "pointer-events-auto" : "pointer-events-none")}>
      <div
        className={cn(
          "absolute inset-0 transition",
          open ? "bg-[rgba(0,0,0,0.55)] backdrop-blur-[2px]" : "bg-transparent",
        )}
        onClick={() => {
          onClickSfx();
          onClose();
        }}
      />

      <div
        className={cn(
          "absolute right-0 top-0 h-full w-[min(420px,92vw)] transition",
          open ? "translate-x-0" : "translate-x-[102%]",
        )}
      >
        <div className="h-full k-pixel-panel border-l border-[rgba(247,244,232,0.10)]">
          <div className="flex items-center justify-between border-b border-[rgba(247,244,232,0.10)] px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="k-pixel-bubble border-[rgba(46,230,230,0.20)] bg-[rgba(46,230,230,0.08)] px-3 py-2 text-xs tracking-[0.18em] text-[rgba(46,230,230,0.92)]">
                <span className="inline-flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4" />
                  <span>设置</span>
                </span>
              </div>
              <div className="text-xs tracking-[0.16em] text-[rgba(247,244,232,0.56)]">像素神社 · 霓虹</div>
            </div>
            <button
              type="button"
              className="k-pixel-bubble border-[rgba(247,244,232,0.14)] bg-[rgba(18,8,31,0.55)] p-2 text-[rgba(247,244,232,0.78)] hover:border-[rgba(244,168,201,0.28)] hover:text-[rgba(244,168,201,0.92)]"
              onClick={() => {
                onClickSfx();
                onClose();
              }}
              aria-label="关闭"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex h-[calc(100%-64px)] flex-col gap-4 overflow-auto px-5 py-5">
            <div className="k-pixel-bubble border-[rgba(247,244,232,0.12)] bg-[rgba(18,8,31,0.45)] px-4 py-4">
              <div className="mb-3 text-xs tracking-[0.18em] text-[rgba(232,199,96,0.92)]">音效</div>
              <button
                type="button"
                className={cn(
                  "k-pixel-bubble flex w-full items-center justify-between px-4 py-3 text-sm transition",
                  settings.soundEnabled
                    ? "border-[rgba(46,230,230,0.22)] bg-[rgba(46,230,230,0.07)] text-[rgba(46,230,230,0.92)]"
                    : "border-[rgba(247,244,232,0.16)] bg-[rgba(18,8,31,0.55)] text-[rgba(247,244,232,0.72)]",
                )}
                onClick={() => {
                  onClickSfx();
                  onChangeSettings({ soundEnabled: !settings.soundEnabled });
                }}
              >
                <span className="tracking-[0.08em]">点击与发送</span>
                {settings.soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </button>
              <div className="mt-2 text-[11px] leading-relaxed text-[rgba(247,244,232,0.46)]">
                使用简易提示音（WebAudio），不依赖外部音频文件。
              </div>
            </div>

            <div className="k-pixel-bubble border-[rgba(247,244,232,0.12)] bg-[rgba(18,8,31,0.45)] px-4 py-4">
              <div className="mb-3 text-xs tracking-[0.18em] text-[rgba(232,199,96,0.92)]">动效强度</div>
              <div className="grid grid-cols-3 gap-2">
                {(["low", "medium", "high"] as const).map((level) => {
                  const active = settings.motionLevel === level;
                  const label = level === "low" ? "低" : level === "medium" ? "中" : "高";
                  return (
                    <button
                      key={level}
                      type="button"
                      className={cn(
                        "k-pixel-bubble px-3 py-3 text-sm tracking-[0.12em] transition",
                        active
                          ? "border-[rgba(255,46,154,0.32)] bg-[rgba(255,46,154,0.10)] text-[rgba(255,46,154,0.92)] shadow-[0_0_24px_rgba(255,46,154,0.10)]"
                          : "border-[rgba(247,244,232,0.16)] bg-[rgba(18,8,31,0.55)] text-[rgba(247,244,232,0.72)] hover:border-[rgba(46,230,230,0.26)] hover:text-[rgba(46,230,230,0.92)]",
                      )}
                      onClick={() => {
                        onClickSfx();
                        onChangeSettings({ motionLevel: level });
                      }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
              <div className="mt-2 text-[11px] leading-relaxed text-[rgba(247,244,232,0.46)]">
                影响“正在思考…”与 NPC 回复出现的节奏。
              </div>
            </div>

            <div className="k-pixel-bubble border-[rgba(247,244,232,0.12)] bg-[rgba(18,8,31,0.45)] px-4 py-4">
              <div className="mb-3 text-xs tracking-[0.18em] text-[rgba(232,199,96,0.92)]">对话</div>
              <button
                type="button"
                className={cn(
                  "k-pixel-bubble flex w-full items-center justify-between px-4 py-3 text-sm transition",
                  settings.llmEnabled
                    ? "border-[rgba(46,230,230,0.22)] bg-[rgba(46,230,230,0.07)] text-[rgba(46,230,230,0.92)]"
                    : "border-[rgba(247,244,232,0.16)] bg-[rgba(18,8,31,0.55)] text-[rgba(247,244,232,0.72)]",
                )}
                onClick={() => {
                  onClickSfx();
                  onChangeSettings({ llmEnabled: !settings.llmEnabled });
                }}
              >
                <span className="tracking-[0.08em]">LLM 对话</span>
                <span className="text-xs tracking-[0.18em] text-[rgba(247,244,232,0.56)]">
                  {settings.llmEnabled ? "开" : "关"}
                </span>
              </button>
              <div className="mt-2 text-[11px] leading-relaxed text-[rgba(247,244,232,0.46)]">
                开启后会通过本地 /api/chat 转发请求；请在后端环境变量中配置 KEY。
              </div>
            </div>

            <div className="k-pixel-bubble border-[rgba(247,244,232,0.12)] bg-[rgba(18,8,31,0.45)] px-4 py-4">
              <div className="mb-3 text-xs tracking-[0.18em] text-[rgba(232,199,96,0.92)]">背景</div>
              <button
                type="button"
                className={cn(
                  "k-pixel-bubble flex w-full items-center justify-between px-4 py-3 text-sm transition",
                  settings.bgParallaxEnabled
                    ? "border-[rgba(46,230,230,0.22)] bg-[rgba(46,230,230,0.07)] text-[rgba(46,230,230,0.92)]"
                    : "border-[rgba(247,244,232,0.16)] bg-[rgba(18,8,31,0.55)] text-[rgba(247,244,232,0.72)]",
                )}
                onClick={() => {
                  onClickSfx();
                  onChangeSettings({ bgParallaxEnabled: !settings.bgParallaxEnabled });
                }}
              >
                <span className="tracking-[0.08em]">轻微视差</span>
                <span className="text-xs tracking-[0.18em] text-[rgba(247,244,232,0.56)]">
                  {settings.bgParallaxEnabled ? "开" : "关"}
                </span>
              </button>
              <div className="mt-2 text-[11px] leading-relaxed text-[rgba(247,244,232,0.46)]">
                鼠标/触摸移动会让远景轻微漂移，营造“夜色呼吸”的感觉。
              </div>
            </div>

            <div className="k-pixel-bubble border-[rgba(247,244,232,0.12)] bg-[rgba(18,8,31,0.45)] px-4 py-4">
              <div className="mb-3 text-xs tracking-[0.18em] text-[rgba(232,199,96,0.92)]">数据</div>
              <button
                type="button"
                className="k-pixel-bubble flex w-full items-center justify-between border-[rgba(244,168,201,0.22)] bg-[rgba(244,168,201,0.06)] px-4 py-3 text-sm tracking-[0.08em] text-[rgba(244,168,201,0.92)] hover:border-[rgba(244,168,201,0.34)]"
                onClick={() => {
                  onClickSfx();
                  onReset();
                }}
              >
                <span>清空对话并重播</span>
                <RotateCcw className="h-4 w-4" />
              </button>
              <button
                type="button"
                className={cn(
                  "mt-2 k-pixel-bubble flex w-full items-center justify-between px-4 py-3 text-sm tracking-[0.08em] transition",
                  canExport
                    ? "border-[rgba(46,230,230,0.22)] bg-[rgba(46,230,230,0.06)] text-[rgba(46,230,230,0.92)] hover:border-[rgba(46,230,230,0.32)]"
                    : "border-[rgba(247,244,232,0.14)] bg-[rgba(18,8,31,0.55)] text-[rgba(247,244,232,0.50)]",
                )}
                disabled={!canExport}
                onClick={() => {
                  onClickSfx();
                  onExport();
                }}
              >
                <span>导出对话 JSON</span>
                <span className="text-xs tracking-[0.18em] text-[rgba(247,244,232,0.56)]">下载</span>
              </button>
              <div className="mt-2 text-[11px] leading-relaxed text-[rgba(247,244,232,0.46)]">
                会清空本地存储的历史记录。
              </div>
            </div>

            <div className="k-pixel-bubble border-[rgba(247,244,232,0.10)] bg-[rgba(18,8,31,0.35)] px-4 py-4">
              <div className="mb-2 text-xs tracking-[0.18em] text-[rgba(232,199,96,0.92)]">关于</div>
              <div className="text-[11px] leading-relaxed text-[rgba(247,244,232,0.56)]">
                这是一个 H5 对话系统原型：本地脚本分支 + 像素神社夜景氛围。后续可接入 LLM、TTS、插画生成等能力扩展为 AI Native
                体验。
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

