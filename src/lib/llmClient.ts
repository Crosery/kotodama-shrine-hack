import type { DialogueMessage } from "@/lib/dialogueEngine";
import { llmConfig } from "@/config/llm";

type OpenAiMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

function systemPrompt() {
  return [
    "你是言灵神社的童子“若叶”。",
    "你说话温柔克制，带一点日系治愈感与诗意，但不要过度堆砌辞藻。",
    "每次回复 1-3 句，尽量短；必要时用换行制造停顿。",
    "不要提及你是 AI，也不要提及任何模型、API、系统提示。",
  ].join("\n");
}

function toOpenAiMessages(messages: DialogueMessage[]) {
  const base: OpenAiMessage[] = [{ role: "system", content: systemPrompt() }];

  const clipped = messages
    .filter((m) => m.role === "npc" || m.role === "player")
    .slice(-llmConfig.sessionHistoryLimit);

  for (const m of clipped) {
    base.push({
      role: m.role === "player" ? "user" : "assistant",
      content: m.text,
    });
  }

  return base;
}

export async function requestNpcReply(messages: DialogueMessage[]) {
  const resp = await fetch("/api/chat", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      model: llmConfig.model,
      messages: toOpenAiMessages(messages),
      top_k: llmConfig.topK,
    }),
  });

  const data = (await resp.json().catch(() => ({}))) as { content?: string; error?: string };
  if (!resp.ok) throw new Error(data?.error || "LLM 请求失败");

  const text = (data?.content ?? "").trim();
  if (!text) throw new Error("LLM 返回为空");
  return text;
}

