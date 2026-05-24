import { ChevronDown, ChevronUp, Minus, RotateCcw, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

export default function TopBar({
  title,
  subtitle,
  historyOpen,
  onCollapsePanel,
  onToggleHistory,
  onOpenSettings,
  onReset,
  onClickSfx,
}: {
  title: string;
  subtitle: string | null;
  historyOpen: boolean;
  onCollapsePanel: () => void;
  onToggleHistory: () => void;
  onOpenSettings: () => void;
  onReset: () => void;
  onClickSfx: () => void;
}) {
  return (
    <div className="flex items-center justify-between border-b border-[rgba(247,244,232,0.10)] px-4 py-2">
      <div className="min-w-0">
        <div className="k-title text-sm tracking-[0.22em] text-[rgba(247,244,232,0.92)]">{title}</div>
        {subtitle ? (
          <div className="mt-1 truncate text-[11px] tracking-[0.18em] text-[rgba(247,244,232,0.52)]">{subtitle}</div>
        ) : null}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          className={cn(
            "k-pixel-bubble inline-flex h-9 w-9 items-center justify-center transition",
            "border-[rgba(247,244,232,0.14)] bg-[rgba(18,8,31,0.55)] text-[rgba(247,244,232,0.78)]",
            "hover:border-[rgba(244,168,201,0.28)] hover:bg-[rgba(244,168,201,0.08)] hover:text-[rgba(244,168,201,0.92)]",
          )}
          onClick={() => {
            onClickSfx();
            onCollapsePanel();
          }}
          aria-label="折叠对话框"
        >
          <Minus className="h-4 w-4" />
        </button>
        <button
          type="button"
          className={cn(
            "k-pixel-bubble inline-flex h-9 w-9 items-center justify-center transition",
            "border-[rgba(247,244,232,0.14)] bg-[rgba(18,8,31,0.55)] text-[rgba(247,244,232,0.78)]",
            "hover:border-[rgba(46,230,230,0.30)] hover:bg-[rgba(46,230,230,0.08)] hover:text-[rgba(46,230,230,0.92)]",
          )}
          onClick={() => {
            onClickSfx();
            onToggleHistory();
          }}
          aria-label={historyOpen ? "收起历史" : "展开历史"}
        >
          {historyOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </button>
        <button
          type="button"
          className={cn(
            "k-pixel-bubble inline-flex h-9 w-9 items-center justify-center transition",
            "border-[rgba(247,244,232,0.14)] bg-[rgba(18,8,31,0.55)] text-[rgba(247,244,232,0.78)]",
            "hover:border-[rgba(244,168,201,0.28)] hover:bg-[rgba(244,168,201,0.08)] hover:text-[rgba(244,168,201,0.92)]",
          )}
          onClick={() => {
            onClickSfx();
            onReset();
          }}
          aria-label="重播"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
        <button
          type="button"
          className={cn(
            "k-pixel-bubble inline-flex h-9 w-9 items-center justify-center transition",
            "border-[rgba(247,244,232,0.14)] bg-[rgba(18,8,31,0.55)] text-[rgba(247,244,232,0.78)]",
            "hover:border-[rgba(46,230,230,0.30)] hover:bg-[rgba(46,230,230,0.08)] hover:text-[rgba(46,230,230,0.92)]",
          )}
          onClick={() => {
            onClickSfx();
            onOpenSettings();
          }}
          aria-label="设置"
        >
          <Settings className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

