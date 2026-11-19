// Neutral, very short tones. Only used when the user enables sound (off by default).
let ctx: AudioContext | undefined;

export function playTone(good: boolean): void {
  try {
    ctx ??= new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = good ? 660 : 330;
    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.15);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.16);
  } catch {
    /* audio not available */
  }
}
