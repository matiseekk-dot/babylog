// scripts/shorts-music.mjs
//
// Własna, spokojna melodia w stylu pozytywki do Shorts (bez praw autorskich
// osób trzecich, więc pasuje też do Reels, TikToka i reklam). Syntezujemy ją
// w JS: pozytywka (sinus z alikwotami i szybkim wygaszaniem) gra rozłożone
// akordy C, Am, F, G w metrum 3/4, pod spodem cichy pad i bas. ffmpeg dokłada
// pogłos, łagodzi górę i wyrównuje głośność.

import fs from 'fs'
import { execFileSync } from 'child_process'

const SR = 44100
const BPM = 84
const EIGHTH = 60 / BPM / 2

const CHORDS = {
  C: [60, 64, 67],
  Am: [57, 60, 64],
  F: [53, 57, 60],
  G: [55, 59, 62],
}
// 12 taktów po 3/4, ok. 25,7 s: dwa razy C Am F G, na koniec F G C C.
const PROGRESSION = ['C', 'Am', 'F', 'G', 'C', 'Am', 'F', 'G', 'F', 'G', 'C', 'C']

const freq = midi => 440 * 2 ** ((midi - 69) / 12)

// Stałe "losowe" odchyłki (ludzkie wykonanie), zawsze takie same.
let seed = 7
const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)

function musicBox(L, R, t0, midi, vel, pan) {
  const f = freq(midi)
  const start = Math.round(t0 * SR)
  const len = Math.round(2.6 * SR)
  const w = 2 * Math.PI * f
  for (let i = 0; i < len && start + i < L.length; i++) {
    const t = i / SR
    const attack = t < 0.004 ? t / 0.004 : 1
    const s = attack * (
      0.55 * Math.sin(w * t) * Math.exp(-2.0 * t)
      + 0.20 * Math.sin(2 * w * t) * Math.exp(-3.4 * t)
      + 0.08 * Math.sin(3 * w * t) * Math.exp(-6 * t)
      + 0.035 * Math.sin(5.4 * w * t) * Math.exp(-11 * t)
    ) * vel
    L[start + i] += s * (1 - pan)
    R[start + i] += s * pan
  }
}

function pad(L, R, t0, dur, midi, amp) {
  const start = Math.round(t0 * SR)
  const len = Math.round((dur + 1.0) * SR)
  const wl = 2 * Math.PI * freq(midi) * (1 - 0.0009)
  const wr = 2 * Math.PI * freq(midi) * (1 + 0.0009)
  for (let i = 0; i < len && start + i < L.length; i++) {
    const t = i / SR
    const env = Math.min(1, t / 0.5) * (t > dur ? Math.max(0, 1 - (t - dur) / 1.0) : 1)
    L[start + i] += amp * env * Math.sin(wl * t)
    R[start + i] += amp * env * Math.sin(wr * t)
  }
}

export function buildMusic(outFile, ffmpeg) {
  const barLen = EIGHTH * 6
  const seconds = PROGRESSION.length * barLen + 3
  const n = Math.round(seconds * SR)
  const L = new Float32Array(n)
  const R = new Float32Array(n)

  PROGRESSION.forEach((name, bar) => {
    const [root, third, fifth] = CHORDS[name]
    const t0 = 0.15 + bar * barLen
    // Rozłożony akord w górze: pryma, tercja, kwinta, oktawa, kwinta, tercja.
    const notes = [root + 12, third + 12, fifth + 12, root + 24, fifth + 12, third + 12]
    notes.forEach((m, k) => {
      const t = t0 + k * EIGHTH + (rand() - 0.5) * 0.012
      const vel = (k === 0 ? 0.9 : k === 3 ? 0.8 : 0.62) * (0.92 + rand() * 0.16)
      musicBox(L, R, t, m, vel, k % 2 ? 0.62 : 0.38)
    })
    pad(L, R, t0, barLen, root - 12, 0.05)
    pad(L, R, t0, barLen, third, 0.018)
    pad(L, R, t0, barLen, fifth, 0.018)
  })

  let peak = 0
  for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]))
  const gain = 0.8 / peak
  const pcm = Buffer.alloc(n * 4)
  for (let i = 0; i < n; i++) {
    pcm.writeInt16LE(Math.round(L[i] * gain * 32767), i * 4)
    pcm.writeInt16LE(Math.round(R[i] * gain * 32767), i * 4 + 2)
  }
  const header = Buffer.alloc(44)
  header.write('RIFF', 0); header.writeUInt32LE(36 + pcm.length, 4); header.write('WAVE', 8)
  header.write('fmt ', 12); header.writeUInt32LE(16, 16); header.writeUInt16LE(1, 20); header.writeUInt16LE(2, 22)
  header.writeUInt32LE(SR, 24); header.writeUInt32LE(SR * 4, 28); header.writeUInt16LE(4, 32); header.writeUInt16LE(16, 34)
  header.write('data', 36); header.writeUInt32LE(pcm.length, 40)
  const raw = outFile.replace(/\.wav$/, '-raw.wav')
  fs.writeFileSync(raw, Buffer.concat([header, pcm]))

  execFileSync(ffmpeg, ['-y', '-i', raw,
    '-af', 'aecho=0.8:0.55:47|89|137:0.28|0.18|0.1,lowpass=f=7000,loudnorm=I=-17:TP=-2:LRA=9',
    '-ar', '48000', outFile], { stdio: ['ignore', 'ignore', 'pipe'] })
  return outFile
}
