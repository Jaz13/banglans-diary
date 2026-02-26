'use client'

function playTone(frequency: number, duration: number, volume: number = 0.15, type: OscillatorType = 'sine') {
  if (typeof window === 'undefined') return
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = frequency
    osc.type = type
    gain.gain.setValueAtTime(volume, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + duration)
  } catch {}
}

export function playLikeSound() { playTone(660, 0.12, 0.12, 'sine') }
export function playUnlikeSound() { playTone(440, 0.10, 0.08, 'sine') }
export function playSoftClick() { playTone(800, 0.06, 0.06, 'square') }
export function playSuccessSound() {
  playTone(523, 0.1, 0.1)
  setTimeout(() => playTone(659, 0.1, 0.1), 100)
  setTimeout(() => playTone(784, 0.15, 0.1), 200)
}
export function playShutterSound() { playTone(200, 0.08, 0.08, 'sawtooth') }
export function playVoteSound() {
  playTone(440, 0.08, 0.1, 'sine')
  setTimeout(() => playTone(550, 0.1, 0.1, 'sine'), 80)
}
