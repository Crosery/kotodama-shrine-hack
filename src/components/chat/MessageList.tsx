import { useEffect, useMemo, useRef } from "react";
import type { DialogueMessage, DialogueStory } from "@/lib/dialogueEngine";
import MessageBubble from "@/components/chat/MessageBubble";

export default function MessageList({
  story,
  messages,
  thinking,
  showChapter,
}: {
  story: DialogueStory;
  messages: DialogueMessage[];
  thinking: boolean;
  showChapter?: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const chapter = useMemo(() => {
    const last = [...messages].reverse().find((m) => m.role === "npc" && m.nodeId);
    if (!last?.nodeId) return null;
    return story.nodes[last.nodeId]?.chapter ?? null;
  }, [messages, story]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [messages.length, thinking]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {showChapter === false ? null : (
        <div className="px-4 pt-4">
          <div className="k-pixel-bubble inline-flex items-center gap-2 border-[rgba(232,199,96,0.18)] bg-[rgba(232,199,96,0.06)] px-3 py-2 text-xs tracking-[0.18em] text-[rgba(232,199,96,0.92)] shadow-[0_0_0_1px_rgba(232,199,96,0.10)]">
            <span className="h-2 w-2 bg-current opacity-70" />
            <span className="leading-none">{chapter ?? "言灵神社 · 对话"}</span>
          </div>
        </div>
      )}

      <div ref={scrollRef} className="min-h-0 flex-1 overflow-auto px-4 pb-4 pt-3">
        <div className="flex flex-col gap-3">
          {messages.map((m) => (
            <MessageBubble key={m.id} message={m} />
          ))}
          {thinking ? (
            <div className="flex w-full justify-start">
              <div className="k-pixel-bubble border-[rgba(46,230,230,0.20)] bg-[rgba(18,8,31,0.55)] px-4 py-3 text-sm text-[rgba(247,244,232,0.78)] shadow-[0_0_0_1px_rgba(46,230,230,0.10),0_0_18px_rgba(46,230,230,0.10)]">
                <span className="inline-flex items-center gap-2">
                  <span className="k-dot h-2 w-2 bg-[rgba(46,230,230,0.92)]" />
                  <span className="k-dot h-2 w-2 bg-[rgba(244,168,201,0.9)]" style={{ animationDelay: "150ms" }} />
                  <span className="k-dot h-2 w-2 bg-[rgba(232,199,96,0.9)]" style={{ animationDelay: "300ms" }} />
                  <span className="ml-1">若叶正在思考…</span>
                </span>
              </div>
            </div>
          ) : null}
          <div ref={bottomRef} />
        </div>
      </div>
    </div>
  );
}

