// No audio asset needed — synthesizes a short "ta-da" arpeggio via the Web
// Audio API when a player wins. Kiosk browsers block audio until there's been
// a user gesture somewhere on the page; by the time a result modal can show,
// the player has already tapped through Predict Now/Spin, so this always has
// one to piggyback on.
export function playWinChime() {
  if (typeof window === "undefined") return;
  const Ctx = window.AudioContext ?? (window as any).webkitAudioContext;
  if (!Ctx) return;

  const ctx = new Ctx();
  const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
  const noteDuration = 0.16;

  notes.forEach((freq, i) => {
    const start = ctx.currentTime + i * noteDuration;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.value = freq;

    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.25, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + noteDuration * 1.8);

    osc.connect(gain).connect(ctx.destination);
    osc.start(start);
    osc.stop(start + noteDuration * 2);
  });

  const closeAt = notes.length * noteDuration * 1000 + 400;
  setTimeout(() => ctx.close().catch(() => {}), closeAt);
}
