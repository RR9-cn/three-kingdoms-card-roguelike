/** Mulberry32 v1. Each stream is a serializable uint32, with FNV-1a seeding. */
export type Stream = 'player' | 'enemy' | 'ai' | 'map' | 'reward';
export type RandomState = Record<Stream, number>;
export function hash(text: string): number { let n = 2166136261; for (let i = 0; i < text.length; i++) { n ^= text.charCodeAt(i); n = Math.imul(n, 16777619); } return n >>> 0; }
export function randomState(seed: string): RandomState { return Object.fromEntries(['player', 'enemy', 'ai', 'map', 'reward'].map(k => [k, hash(`${seed}:${k}`)])) as RandomState; }
export function random(state: RandomState, stream: Stream): number {
  let t = state[stream] = (state[stream] + 0x6D2B79F5) >>> 0;
  t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61);
  return ((t ^ t >>> 14) >>> 0) / 4294967296;
}
export function shuffle<T>(items: readonly T[], state: RandomState, stream: Stream): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(random(state, stream) * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; }
  return out;
}
