import { useEffect, useRef, useState } from "react";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DialogueReply } from "@/lib/dialogueEngine";
import QuickReplies from "@/components/chat/QuickReplies";

export default function Composer({
  replies,
  disabled,
  onPickReply,
  onSendText,
  onClickSfx,
  onSendSfx,
}: {
  replies: DialogueReply[];
  disabled: boolean;
  onPickReply: (replyId: string) => void;
  onSendText: (text: string) => void;
  onClickSfx: () => void;
  onSendSfx: () => void;
}) {
  const [text, setText] = useState("");
  const ref = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!disabled) ref.current?.focus();
  }, [disabled]);

  function submit() {
    const value = text.trim();
    if (!value) return;
    onSendSfx();
    onSendText(value);
    setText("");
  }

  return (
    <div className="border-t border-[rgba(247,244,232,0.10)] bg-[rgba(18,8,31,0.50)] px-4 pb-4 pt-3">
      <div className="mb-3">
        <QuickReplies replies={replies} disabled={disabled} onPick={onPickReply} onClickSfx={onClickSfx} />
      </div>

      <div className="k-pixel-bubble flex items-end gap-2 border-[rgba(46,230,230,0.18)] bg-[rgba(18,8,31,0.55)] px-3 py-3 shadow-[0_0_0_1px_rgba(46,230,230,0.10),0_0_22px_rgba(46,230,230,0.08)]">
        <textarea
          ref={ref}
          value={text}
          placeholder="在此输入言灵…"
          rows={1}
          className={cn(
            "min-h-[40px] flex-1 resize-none bg-transparent text-sm leading-relaxed text-[rgba(247,244,232,0.92)] outline-none placeholder:text-[rgba(247,244,232,0.40)]",
            "selection:bg-[rgba(255,46,154,0.32)]",
          )}
          disabled={disabled}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onClickSfx();
              submit();
            }
          }}
        />

        <button
          type="button"
          className={cn(
            "k-pixel-bubble inline-flex h-10 w-10 items-center justify-center transition",
            "border-[rgba(46,230,230,0.20)] bg-[rgba(46,230,230,0.10)] text-[rgba(46,230,230,0.92)] shadow-[0_0_0_1px_rgba(46,230,230,0.10)]",
            "hover:border-[rgba(255,46,154,0.32)] hover:bg-[rgba(255,46,154,0.10)] hover:text-[rgba(255,46,154,0.92)] hover:shadow-[0_0_0_1px_rgba(255,46,154,0.16),0_0_24px_rgba(255,46,154,0.10)]",
            "disabled:cursor-not-allowed disabled:opacity-40",
          )}
          disabled={disabled || text.trim().length === 0}
          onClick={() => {
            onClickSfx();
            submit();
          }}
          aria-label="发送"
        >
          <ArrowUp className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-2 flex items-center justify-between text-[11px] tracking-[0.16em] text-[rgba(247,244,232,0.46)]">
        <span>Enter 发送 · Shift+Enter 换行</span>
        <span className="text-[rgba(46,230,230,0.72)]">您说什么 他们成为什么</span>
      </div>
    </div>
  );
}

