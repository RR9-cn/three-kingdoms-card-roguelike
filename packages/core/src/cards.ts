import { SUITS, type Suit } from '@three-card/content';
export interface Card { id: string; suit: Suit; rank: number }
export interface Hand { category: number; key: number[] }
export function deck(): Card[] { return SUITS.flatMap(suit => Array.from({ length: 9 }, (_, i) => ({ id: `${suit}-${i + 1}`, suit, rank: i + 1 }))); }
export function evaluate(cards: readonly Card[]): Hand {
  if (cards.length !== 3 || new Set(cards.map(c => c.id)).size !== 3 || cards.some(c => !SUITS.includes(c.suit) || !Number.isInteger(c.rank) || c.rank < 1 || c.rank > 9)) throw Error('Invalid hand');
  const ranks = cards.map(c => c.rank).sort((a, b) => b - a);
  const unique = new Set(ranks).size;
  const flush = new Set(cards.map(c => c.suit)).size === 1;
  const straight = unique === 3 && ranks[0] - ranks[2] === 2;
  if (unique === 1) return { category: 5, key: [5, ranks[0]] };
  if (straight && flush) return { category: 4, key: [4, ranks[0]] };
  if (flush) return { category: 3, key: [3, ...ranks] };
  if (straight) return { category: 2, key: [2, ranks[0]] };
  if (unique === 2) { const pair = ranks[1]; return { category: 1, key: [1, pair, ranks.find(r => r !== pair)!] }; }
  return { category: 0, key: [0, ...ranks] };
}
export function compare(a: readonly Card[], b: readonly Card[]): number {
  const x = evaluate(a).key, y = evaluate(b).key;
  for (let i = 0; i < Math.max(x.length, y.length); i++) { const d = (x[i] ?? 0) - (y[i] ?? 0); if (d) return d > 0 ? 1 : -1; }
  return 0;
}
