// LLM 调用走后端 /api/chat 代理，model 等元数据在这里；实际 baseUrl / key 由
// api/server.mjs 从 .env.local 读取，前端不暴露
export const llmConfig = {
  enabled: true,
  provider: "openai-compat",
  model: "poolside/laguna-xs.2:free",
  topK: 3,
  minPromptLen: 0,
  summaryLang: "zh",
  sessionMode: "oneshot",
  sessionHistoryLimit: 20,
} as const;

