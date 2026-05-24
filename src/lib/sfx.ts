type SfxName = "click" | "send";

let audioCtx: AudioContext | null = null;

function getCtx() {
  if (audioCtx) return audioCtx;
  const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  audioCtx = new Ctx();
  return audioCtx;
}

async function ensureRunning(ctx: AudioContext) {
  if (ctx.state === "running") return;
  try {
    await ctx.resume();
  } catch {
    return;
  }
}

function playTone(name: SfxName) {
  const ctx = getCtx();
  void ensureRunning(ctx);

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  const cfg =
    name === "send"
      ? { f0: 660, f1: 880, dur: 0.08, a0: 0.0001, a1: 0.055 }
      : { f0: 420, f1: 520, dur: 0.05, a0: 0.0001, a1: 0.035 };

  osc.type = "triangle";
  osc.frequency.setValueAtTime(cfg.f0, now);
  osc.frequency.exponentialRampToValueAtTime(cfg.f1, now + cfg.dur);

  gain.gain.setValueAtTime(cfg.a0, now);
  gain.gain.exponentialRampToValueAtTime(cfg.a1, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(cfg.a0, now + cfg.dur);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + cfg.dur + 0.01);
}

export function sfxClick(enabled: boolean) {
  if (!enabled) return;
  playTone("click");
}

export function sfxSend(enabled: boolean) {
  if (!enabled) return;
  playTone("send");
}

