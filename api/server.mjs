import http from "node:http";
import fs from "node:fs";
import path from "node:path";

function loadDotEnv(fileName) {
  try {
    const p = path.join(process.cwd(), fileName);
    if (!fs.existsSync(p)) return;
    const raw = fs.readFileSync(p, "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const s = line.trim();
      if (!s || s.startsWith("#")) continue;
      const idx = s.indexOf("=");
      if (idx <= 0) continue;
      const key = s.slice(0, idx).trim();
      if (process.env[key] != null) continue;
      let val = s.slice(idx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      process.env[key] = val;
    }
  } catch {
    return;
  }
}

loadDotEnv(".env.local");
loadDotEnv(".env");

const PORT = Number(process.env.PORT || 8787);
// local-first 默认只绑 127.0.0.1；公网部署必须显式 HOST=0.0.0.0
const HOST = process.env.HOST || "127.0.0.1";
const BASE_URL = process.env.OPENAI_COMPAT_BASE_URL || "https://api.deepseek.com";
const MODEL = process.env.OPENAI_COMPAT_MODEL || "deepseek-v4-flash";
const API_KEY = process.env.DEEPSEEK_API_KEY || process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY || "";

// 公网部署时设置 PROXY_TOKEN，前端 fetch 带 Authorization: Bearer <token>；本地开发可留空
const PROXY_TOKEN = process.env.PROXY_TOKEN || "";
// 可选：限制可用模型（逗号分隔）。留空 = 仅允许服务端 MODEL（最安全）
const ALLOWED_MODELS = (process.env.ALLOWED_MODELS || "").split(",").map((s) => s.trim()).filter(Boolean);
// 单请求最大 body（字节），防 OOM
const MAX_BODY_BYTES = Number(process.env.MAX_BODY_BYTES || 256 * 1024);
// messages 数组上限 + 单条 content 字符上限
const MAX_MESSAGES = Number(process.env.MAX_MESSAGES || 50);
const MAX_CONTENT_LEN = Number(process.env.MAX_CONTENT_LEN || 8000);
// 简易 per-IP rate limit：60s 滑窗内最多 N 次
const RATE_LIMIT_PER_MIN = Number(process.env.RATE_LIMIT_PER_MIN || 30);

const IS_DEEPSEEK = /api\.deepseek\.com/.test(BASE_URL);

function readJson(req, maxBytes) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let total = 0;
    let aborted = false;
    req.on("data", (chunk) => {
      if (aborted) return;
      total += chunk.length;
      if (total > maxBytes) {
        aborted = true;
        req.pause();
        const err = new Error("PAYLOAD_TOO_LARGE");
        err.code = 413;
        reject(err);
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      if (aborted) return;
      try { resolve(JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}")); }
      catch (e) { reject(e); }
    });
    req.on("error", (e) => { if (!aborted) reject(e); });
  });
}

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(body),
  });
  res.end(body);
}

function clamp(n, lo, hi) {
  if (!Number.isFinite(n)) return null;
  return Math.min(hi, Math.max(lo, n));
}

// per-IP 60s 滑窗计数（内存态，重启重置；公网请用 nginx/cf 兜底）
const rateBuckets = new Map();
function rateLimitHit(ip) {
  if (RATE_LIMIT_PER_MIN <= 0) return false;
  const now = Date.now();
  const arr = (rateBuckets.get(ip) || []).filter((t) => now - t < 60_000);
  if (arr.length >= RATE_LIMIT_PER_MIN) { rateBuckets.set(ip, arr); return true; }
  arr.push(now);
  rateBuckets.set(ip, arr);
  return false;
}

function clientIp(req) {
  return req.socket.remoteAddress || "unknown";
}

function authorized(req) {
  if (!PROXY_TOKEN) return true;
  const h = req.headers.authorization || "";
  return h === `Bearer ${PROXY_TOKEN}`;
}

async function handleChat(req, res) {
  if (!API_KEY) {
    sendJson(res, 500, { error: "Missing upstream API key" });
    return;
  }
  if (!authorized(req)) {
    sendJson(res, 401, { error: "Unauthorized" });
    return;
  }
  if (rateLimitHit(clientIp(req))) {
    sendJson(res, 429, { error: "Too Many Requests" });
    return;
  }

  let body;
  try {
    body = await readJson(req, MAX_BODY_BYTES);
  } catch (e) {
    if (e && e.code === 413) { sendJson(res, 413, { error: "Payload too large" }); return; }
    sendJson(res, 400, { error: "Invalid JSON" });
    return;
  }

  // model 白名单：未配 ALLOWED_MODELS 时只允许服务端默认 MODEL
  const reqModel = typeof body?.model === "string" && body.model ? body.model : MODEL;
  const modelAllowed = ALLOWED_MODELS.length === 0 ? reqModel === MODEL : ALLOWED_MODELS.includes(reqModel);
  if (!modelAllowed) {
    sendJson(res, 400, { error: "Model not allowed" });
    return;
  }

  const messages = Array.isArray(body?.messages) ? body.messages : [];
  if (messages.length === 0 || messages.length > MAX_MESSAGES) {
    sendJson(res, 400, { error: "Bad messages length" });
    return;
  }
  for (const m of messages) {
    if (!m || typeof m.role !== "string" || typeof m.content !== "string") {
      sendJson(res, 400, { error: "Bad message shape" });
      return;
    }
    if (m.content.length > MAX_CONTENT_LEN) {
      sendJson(res, 400, { error: "Message content too long" });
      return;
    }
  }

  const upstream = {
    model: reqModel,
    messages,
    temperature: clamp(body?.temperature, 0, 2) ?? 0.6,
    top_p: clamp(body?.top_p, 0, 1) ?? 0.9,
    stream: false,
  };
  if (IS_DEEPSEEK) {
    upstream.thinking = { type: "disabled" };
  }
  // response_format 白名单
  if (body?.response_format && typeof body.response_format === "object") {
    const t = body.response_format.type;
    if (t === "json_object" || t === "text") {
      upstream.response_format = { type: t };
    }
  }

  // DeepSeek 官方接口路径是 /chat/completions（不带 /v1）；OpenRouter 兼容路径是 /v1/chat/completions
  const url = IS_DEEPSEEK
    ? `${BASE_URL.replace(/\/$/, "")}/chat/completions`
    : `${BASE_URL.replace(/\/$/, "")}/chat/completions`.replace(/(?<!\/v1)\/chat\/completions$/, (m) =>
        /\/v1$/.test(BASE_URL.replace(/\/$/, "")) ? m : `/v1${m}`
      );

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${API_KEY}`,
      "x-title": "kotodama-h5-chat",
    },
    body: JSON.stringify(upstream),
  });

  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    // 上游错误细节仅写 stderr，客户端只拿 sanitized message
    process.stderr.write(`[upstream ${resp.status}] ${JSON.stringify(data).slice(0, 500)}\n`);
    sendJson(res, resp.status, { error: "Upstream error" });
    return;
  }

  const raw = data?.choices?.[0]?.message?.content ?? "";
  const content = stripReasoning(raw);
  sendJson(res, 200, { content });
}

function stripReasoning(text) {
  if (!text) return "";
  let s = text;
  s = s.replace(/<think[\s\S]*?<\/think>/gi, "");
  if (s.includes("</think>")) s = s.slice(s.lastIndexOf("</think>") + "</think>".length);
  return s.trim();
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === "POST" && req.url === "/api/chat") { await handleChat(req, res); return; }
    if (req.method === "GET" && req.url === "/api/health") { sendJson(res, 200, { ok: true }); return; }
    sendJson(res, 404, { error: "Not found" });
  } catch (e) {
    process.stderr.write(`[server] ${e instanceof Error ? e.stack || e.message : String(e)}\n`);
    sendJson(res, 500, { error: "Server error" });
  }
});

server.listen(PORT, HOST, () => {
  process.stdout.write(`api server listening on http://${HOST}:${PORT}\n`);
  process.stdout.write(`upstream model=${MODEL} thinking=${IS_DEEPSEEK ? "disabled" : "n/a"}\n`);
  process.stdout.write(`auth=${PROXY_TOKEN ? "on" : "off"} rate_limit=${RATE_LIMIT_PER_MIN}/min model_allowlist=${ALLOWED_MODELS.length || "default-only"}\n`);
});
