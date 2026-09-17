import { WIN_SOUND } from "./media";

// Plays the win.mp3 asset. Kiosk browsers block audio until there's been a
// user gesture somewhere on the page; by the time a result modal can show,
// the player has already tapped through Predict Now/Spin, so this always has
// one to piggyback on.
export function playWinChime() {
  if (typeof window === "undefined") return;
  const audio = new Audio(WIN_SOUND);
  audio.play().catch(() => {});
}

// Same rationale as playWinChime — synthesized rather than an audio asset.
// A goofy "wrong answer" game-show buzzer: a honking square wave that
// warbles between two pitches, so a loss lands as playful rather than harsh.
export function playLossTone() {
  if (typeof window === "undefined") return;
  const Ctx = window.AudioContext ?? (window as any).webkitAudioContext;
  if (!Ctx) return;

  const ctx = new Ctx();
  const start = ctx.currentTime;
  const buzzDuration = 0.9;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "square";
  osc.frequency.value = 110; // A2, buzzer-ish base pitch

  // Fast warble between two pitches for the classic "honk-honk-honk" buzzer
  const warble = ctx.createOscillator();
  const warbleGain = ctx.createGain();
  warble.type = "square";
  warble.frequency.value = 11;
  warbleGain.gain.value = 35;
  warble.connect(warbleGain).connect(osc.frequency);
  warble.start(start);
  warble.stop(start + buzzDuration);

  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(0.18, start + 0.03);
  gain.gain.setValueAtTime(0.18, start + buzzDuration * 0.8);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + buzzDuration);

  osc.connect(gain).connect(ctx.destination);
  osc.start(start);
  osc.stop(start + buzzDuration + 0.05);

  setTimeout(() => ctx.close().catch(() => {}), buzzDuration * 1000 + 400);
}
