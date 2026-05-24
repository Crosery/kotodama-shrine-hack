import { cn } from "@/lib/utils";
import type { DialogueMessage } from "@/lib/dialogueEngine";

function RoleMark({ role }: { role: DialogueMessage["role"] }) {
  const label = role === "npc" ? "童子" : role === "player" ? "你" : "系统";
  const tone =
    role === "npc"
      ? "bg-[rgba(244,168,201,0.12)] text-[rgba(244,168,201,0.92)] shadow-[0_0_0_1px_rgba(244,168,201,0.18),0_0_22px_rgba(244,168,201,0.10)]"
      : role === "player"
        ? "bg-[rgba(46,230,230,0.10)] text-[rgba(46,230,230,0.92)] shadow-[0_0_0_1px_rgba(46,230,230,0.16),0_0_22px_rgba(46,230,230,0.10)]"
        : "bg-[rgba(232,199,96,0.08)] text-[rgba(232,199,96,0.92)] shadow-[0_0_0_1px_rgba(232,199,96,0.18)]";

  return (
    <div className={cn("k-pixel-bubble inline-flex items-center gap-2 px-3 py-2 text-xs tracking-[0.18em]", tone)}>
      <span className="h-2 w-2 bg-current opacity-70" />
      <span className="leading-none">{label}</span>
    </div>
  );
}

export default function MessageBubble({ message }: { message: DialogueMessage }) {
  const isPlayer = message.role === "player";
  const lines = message.text.split("\n");

  return (
    <div className={cn("flex w-full", isPlayer ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "k-pixel-bubble max-w-[min(680px,92%)] px-4 py-3 text-sm leading-relaxed",
          isPlayer
            ? "border-[rgba(46,230,230,0.26)] bg-[rgba(46,230,230,0.07)] shadow-[0_0_0_1px_rgba(46,230,230,0.10),0_0_26px_rgba(46,230,230,0.10)]"
            : "border-[rgba(244,168,201,0.22)] bg-[rgba(244,168,201,0.06)] shadow-[0_0_0_1px_rgba(244,168,201,0.10),0_0_26px_rgba(244,168,201,0.08)]",
        )}
      >
        <div className={cn("mb-2 flex items-center", isPlayer ? "justify-end" : "justify-start")}>
          <RoleMark role={message.role} />
        </div>
        <div className="text-[rgba(247,244,232,0.92)]">
          {lines.map((line, idx) => (
            <span key={`${message.id}_${idx}`}>
              {line}
              {idx < lines.length - 1 ? <br /> : null}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

