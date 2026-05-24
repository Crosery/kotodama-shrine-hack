import { cn } from "@/lib/utils";
import type { DialogueReply } from "@/lib/dialogueEngine";

export default function QuickReplies({
  replies,
  disabled,
  onPick,
  onClickSfx,
}: {
  replies: DialogueReply[];
  disabled: boolean;
  onPick: (replyId: string) => void;
  onClickSfx: () => void;
}) {
  if (replies.length === 0) return null;

  return (
    <div className="flex w-full gap-2 overflow-x-auto pb-1 [scrollbar-width:thin]">
      {replies.map((r) => (
        <button
          key={r.id}
          type="button"
          className={cn(
            "k-pixel-bubble shrink-0 px-3 py-2 text-xs tracking-[0.12em] transition",
            "border-[rgba(247,244,232,0.14)] bg-[rgba(18,8,31,0.55)] text-[rgba(247,244,232,0.86)]",
            "hover:border-[rgba(46,230,230,0.30)] hover:bg-[rgba(46,230,230,0.08)] hover:text-[rgba(46,230,230,0.92)]",
            "disabled:cursor-not-allowed disabled:opacity-40",
          )}
          disabled={disabled}
          onClick={() => {
            onClickSfx();
            onPick(r.id);
          }}
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}

