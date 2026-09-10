import { RULES, TACTICS, RELICS, ENEMIES, HAND_BONUS, HAND_NAMES, SUITS, type TacticId, type RelicId, type EnemyId, type Suit } from '@three-card/content';
import { deck, evaluate, compare, type Card } from './cards';
import { random, randomState, shuffle, type RandomState } from './random';

export type BattlePhase = 'arrange' | 'star' | 'roundEnd' | 'battleEnd';
export type Outcome = 'win' | 'loss' | 'tie' | 'enemy_yield' | 'player_withdraw';
export interface Resolution { outcome: Outcome; pressure: number; playerDamage: number; enemyDamage: number; rawDamage: number; shieldBlocked: number; exhaustion: number; detail: string }
export interface BattleState {
  seq: number; seed: string; rng: RandomState; phase: BattlePhase; round: number; enemyId: EnemyId;
  playerHp: number; maxHp: number; enemyHp: number; player: Card[]; enemy: Card[];
  reserve: Card[]; enemyReserve: Card[]; seen: number[]; aiRoll: number;
  command: number; pressure: number; shield: number; exchanges: number; scouts: number;
  tactics: TacticId[]; relics: RelicId[]; used: TacticId[]; tacticUsed: boolean;
  tutorial: boolean; result: Resolution | null; victory: boolean | null; log: string[];
  stats: { rounds: number; maxDamage: number; pressureWins: number; pressureLosses: number; yields: number; hands: number[] };
}
export interface BattleAction {
  type: 'exchange' | 'scout' | 'tactic' | 'star-select' | 'commit' | 'next';
  seq: number; slot?: number; slots?: number[]; tactic?: TacticId; suit?: Suit;
  mode?: 'show' | 'press' | 'withdraw'; pressure?: number;
}
export class RuleError extends Error {}
export function requireRule(condition: unknown, message: string): asserts condition { if (!condition) throw new RuleError(message); }
export function copy<T>(x: T): T { return JSON.parse(JSON.stringify(x)); }
const validSlot = (slot: unknown): slot is number => Number.isInteger(slot) && Number(slot) >= 0 && Number(slot) < 3;
export const exchangeLimit = (s: Pick<BattleState, 'relics'>) => RULES.round.exchangeLimit + Number(s.relics.includes('white-horse'));
export const scoutLimit = (s: Pick<BattleState, 'relics'>) => RULES.round.scoutLimit + Number(s.relics.includes('scout-map'));
const record = (s: BattleState, text: string) => { s.log.push(text); s.log = s.log.slice(-40); };

export function newBattle(seed: string, options: { enemyId?: EnemyId; hp?: number; maxHp?: number; tactics?: TacticId[]; relics?: RelicId[]; tutorial?: boolean } = {}): BattleState {
  const enemyId = options.enemyId ?? 'yellow-blade';
  requireRule(Object.hasOwn(ENEMIES, enemyId), '未知敌人');
  const tactics = options.tactics ?? ['advance'], relics = options.relics ?? [];
  requireRule(tactics.length <= 3 && new Set(tactics).size === tactics.length && tactics.every(t => Object.hasOwn(TACTICS, t)), '锦囊配置错误');
  requireRule(relics.length <= 4 && new Set(relics).size === relics.length && relics.every(r => Object.hasOwn(RELICS, r)), '军宝配置错误');
  const maxHp = options.maxHp ?? 40, hp = options.hp ?? maxHp;
  requireRule(Number.isInteger(hp) && Number.isInteger(maxHp) && hp > 0 && hp <= maxHp, '兵力配置错误');
  const s: BattleState = {
    seq: 0, seed, rng: randomState(seed), phase: 'arrange', round: 0, enemyId,
    playerHp: hp, maxHp, enemyHp: ENEMIES[enemyId].hp, player: [], enemy: [], reserve: [], enemyReserve: [], seen: [], aiRoll: 0,
    command: 2, pressure: 1, shield: 0, exchanges: 0, scouts: 0, tactics: [...tactics], relics: [...relics], used: [], tacticUsed: false,
    tutorial: options.tutorial ?? false, result: null, victory: null, log: [],
    stats: { rounds: 0, maxDamage: 0, pressureWins: 0, pressureLosses: 0, yields: 0, hands: [0,0,0,0,0,0] },
  };
  deal(s); return s;
}
function tutorialDeck(ids: string[], top?: string): Card[] {
  const all = deck(); const front = [...ids, ...(top ? [top] : [])];
  return [...front.map(id => all.find(c => c.id === id)!), ...all.filter(c => !front.includes(c.id))];
}
function deal(s: BattleState): void {
  s.round++; s.phase = 'arrange'; s.result = null; s.shield = 0; s.command = RULES.round.commandPoints;
  s.exchanges = 0; s.scouts = 0; s.tacticUsed = false; s.pressure = 1;
  let p = shuffle(deck(), s.rng, 'player'), e = shuffle(deck(), s.rng, 'enemy');
  if (s.tutorial && s.round === 1) { p = tutorialDeck(['spear-2','cavalry-3','bow-4']); e = tutorialDeck(['spear-1','cavalry-1','bow-5']); }
  if (s.tutorial && s.round === 2) { p = tutorialDeck(['spear-8','cavalry-3','bow-5'], 'cavalry-8'); e = tutorialDeck(['spear-2','bow-4','cavalry-6']); }
  s.player = p.slice(0,3); s.reserve = p.slice(3); s.enemy = e.slice(0,3); s.enemyReserve = e.slice(3);
  s.seen = [0]; s.aiRoll = random(s.rng, 'ai');
  const enemy = ENEMIES[s.enemyId];
  if (enemy.hideAllEvery && s.round % enemy.hideAllEvery === 0) s.seen = [];
  if (enemy.pressureTwoEvery && s.round % enemy.pressureTwoEvery === 0) s.pressure = 2;
  record(s, `第 ${s.round} 轮 · ${s.pressure === 2 ? '雷鼓催阵，最低战势 2' : s.seen.length === 0 ? '疑兵：敌方全部藏牌' : '三军列阵'}`);
}

export interface AIView { hand: Card[]; publicPlayer: (Card | null)[]; enemyId: EnemyId }
export function aiView(s: BattleState): AIView { return copy({ hand: s.enemy, publicPlayer: s.player.map((c,i) => i === 0 ? c : null), enemyId: s.enemyId }); }
export function enemyYields(v: AIView, pressure: number, roll: number): boolean {
  const config = ENEMIES[v.enemyId]; if (config.neverYield) return false;
  const category = evaluate(v.hand).category;
  const probability = Math.min(RULES.ai.yieldCap, config.yieldByCategoryGroup[Math.min(category,2)] + (pressure === 3 ? RULES.ai.pressureThreeYieldBonus : 0));
  return roll < probability;
}
export function playerDamageBonus(s: Pick<BattleState, 'relics'>, category: number, pressure: number): number {
  return Number(s.relics.includes('spear-tassel') && [2,4].includes(category)) * 2
    + Number(s.relics.includes('common-banner') && [3,4].includes(category)) * 2
    + Number(s.relics.includes('tiger-seal') && pressure === 3) * 2;
}
function resolve(s: BattleState, mode: 'show' | 'press' | 'withdraw'): void {
  const pressure = s.pressure;
  let outcome: Outcome, playerDamage = 0, enemyDamage = 0, rawDamage = 0, shieldBlocked = 0, exhaustion = 0, detail = '';
  if (mode === 'withdraw') {
    outcome = 'player_withdraw'; playerDamage = RULES.damage.playerWithdraw; detail = '撤阵保存实力 · 兵力 −3（护甲不减免）';
  } else if (mode === 'press' && enemyYields(aiView(s), pressure, s.aiRoll)) {
    outcome = 'enemy_yield'; enemyDamage = RULES.damage.enemyYieldBase + pressure;
    detail = `敌军退让 · 2 + 战势 ${pressure} = ${enemyDamage} 伤害`; s.stats.yields++;
  } else {
    s.seen = [0,1,2]; const p = evaluate(s.player), e = evaluate(s.enemy), comparison = compare(s.player, s.enemy);
    if (!comparison) { outcome = 'tie'; playerDamage = enemyDamage = pressure; detail = `同型同点 · 双方各损失 ${pressure} 兵力`; }
    else {
      outcome = comparison > 0 ? 'win' : 'loss'; const winner = comparison > 0 ? p : e;
      const bonus = comparison > 0 ? playerDamageBonus(s, p.category, pressure) : 0;
      rawDamage = RULES.damage.base + RULES.damage.perPressure * pressure + HAND_BONUS[winner.category] + bonus;
      shieldBlocked = comparison < 0 ? Math.min(rawDamage, s.shield) : 0;
      if (comparison > 0) enemyDamage = rawDamage; else playerDamage = rawDamage - shieldBlocked;
      detail = `${HAND_NAMES[winner.category]}胜出 · 4 + 2×${pressure} + 牌型 ${HAND_BONUS[winner.category]}${bonus ? ` + 军宝 ${bonus}` : ''} = ${rawDamage}${shieldBlocked ? `，护甲抵挡 ${shieldBlocked}` : ''}`;
      if (mode === 'press') { if (comparison > 0) s.stats.pressureWins++; else s.stats.pressureLosses++; }
    }
    s.stats.hands[p.category]++;
  }
  s.playerHp = Math.max(0, s.playerHp - playerDamage); s.enemyHp = Math.max(0, s.enemyHp - enemyDamage);
  if (s.round >= RULES.damage.exhaustionStartRound && s.playerHp > 0 && s.enemyHp > 0) {
    exhaustion = RULES.damage.exhaustionDamage; s.playerHp = Math.max(0, s.playerHp - exhaustion); s.enemyHp = Math.max(0, s.enemyHp - exhaustion);
    detail += `；久战疲敝，双方再失 ${exhaustion}`;
  }
  s.result = { outcome, pressure, playerDamage, enemyDamage, rawDamage, shieldBlocked, exhaustion, detail };
  s.stats.rounds++; s.stats.maxDamage = Math.max(s.stats.maxDamage, enemyDamage); record(s, detail);
  s.phase = 'roundEnd';
  if (s.playerHp === 0 || s.enemyHp === 0) {
    s.phase = 'battleEnd'; s.victory = s.playerHp > 0;
    if (s.victory && s.relics.includes('green-bag')) { s.playerHp = Math.min(s.maxHp, s.playerHp + 3); record(s, '青囊 · 胜后恢复 3 兵力'); }
  }
}

function apply(s: BattleState, a: BattleAction): void {
  requireRule(a.seq === s.seq, '行动已处理，请以当前局面为准');
  if (a.type === 'next') { requireRule(s.phase === 'roundEnd', '此时不能进入下一轮'); deal(s); return; }
  if (a.type === 'star-select') {
    requireRule(s.phase === 'star' && validSlot(a.slot), '请选择一张观星牌');
    const [card] = s.reserve.splice(a.slot, 1); s.reserve.unshift(card); s.phase = 'arrange'; record(s, '观星 · 已调整下一张援军'); return;
  }
  requireRule(s.phase === 'arrange', '本轮已决断，不能再布阵');
  const lesson = s.tutorial && s.round <= 2;
  if (lesson) {
    requireRule((a.type === 'commit' && a.mode === 'show' && (s.round === 1 || s.exchanges === 1)) || (s.round === 2 && a.type === 'exchange' && a.slot === 1 && s.exchanges === 0), s.round === 1 ? '演练：先点击亮阵' : '演练：选择中间的骑3，免费换阵后亮阵');
  }
  if (a.type === 'exchange') {
    requireRule(validSlot(a.slot), '请选择己方阵牌');
    requireRule(s.exchanges < exchangeLimit(s) && s.reserve.length > 0, '本轮换阵次数已用完');
    const cost = s.exchanges === 0 ? 0 : 1; requireRule(s.command >= cost, '军令不足');
    s.command -= cost; s.exchanges++; s.player[a.slot] = s.reserve.shift()!; record(s, `龙胆换阵 · ${cost === 0 ? '首次免费' : '消耗 1 军令'}`); return;
  }
  if (a.type === 'scout') {
    requireRule(validSlot(a.slot) && !s.seen.includes(a.slot), '请选择敌方暗牌');
    requireRule(s.command >= 1 && s.scouts < scoutLimit(s), '军令或侦察次数不足');
    s.command--; s.scouts++; s.seen.push(a.slot); record(s, `侦察 · 敌方第 ${a.slot + 1} 张牌已公开`); return;
  }
  if (a.type === 'tactic') {
    const id = a.tactic;
    requireRule(id && Object.hasOwn(TACTICS,id) && s.tactics.includes(id), '未携带这张锦囊');
    requireRule(s.command >= 1 && !s.tacticUsed && !s.used.includes(id), '锦囊已用或军令不足');
    switch (TACTICS[id].effect) {
      case 'modify-rank': requireRule(validSlot(a.slot) && s.player[a.slot].rank < 9, '选择点数小于 9 的己方牌'); s.player[a.slot].rank++; break;
      case 'change-suit': requireRule(validSlot(a.slot) && a.suit && SUITS.includes(a.suit) && s.player[a.slot].suit !== a.suit, '请选择不同兵种'); s.player[a.slot].suit = a.suit; break;
      case 'exchange-two': {
        requireRule(a.slots?.length === 2 && new Set(a.slots).size === 2 && a.slots.every(validSlot) && s.reserve.length >= 2, '请选择两张不同的己方牌');
        for (const slot of [...a.slots].sort((x,y) => x-y)) s.player[slot] = s.reserve.shift()!;
        break;
      }
      case 'reserve-order': requireRule(s.reserve.length >= 3, '余牌不足'); s.phase = 'star'; break;
      case 'gain-shield': s.shield += 4; break;
      case 'gain-command': requireRule(s.command < RULES.round.commandCap, '军令已满'); s.command += 2; break;
    }
    s.command = Math.min(RULES.round.commandCap, s.command - 1); s.tacticUsed = true; s.used.push(id); record(s, `锦囊 · ${TACTICS[id].name}`); return;
  }
  if (a.type === 'commit') {
    requireRule(a.mode === 'show' || a.mode === 'press' || a.mode === 'withdraw', '请选择决断');
    if (a.mode === 'press') { requireRule(a.pressure && [2,3].includes(a.pressure) && a.pressure > s.pressure, '请选择更高战势'); s.pressure = a.pressure; }
    resolve(s, a.mode); return;
  }
  throw new RuleError('未知行动');
}
export function battleAction(state: BattleState, action: BattleAction): { state: BattleState; error?: string } {
  const s = copy(state);
  try { apply(s, action); s.seq++; return { state: s }; }
  catch (e) { if (e instanceof RuleError) return { state, error: e.message }; throw e; }
}
export function playerView(s: BattleState) {
  return copy({ seq:s.seq, phase:s.phase, round:s.round, enemyId:s.enemyId, playerHp:s.playerHp, maxHp:s.maxHp, enemyHp:s.enemyHp,
    player:s.player, enemy:s.enemy.map((c,i) => s.seen.includes(i) ? c : null), command:s.command, pressure:s.pressure, shield:s.shield,
    exchanges:s.exchanges, scouts:s.scouts, exchangeLimit:exchangeLimit(s), scoutLimit:scoutLimit(s),
    tactics:s.tactics, relics:s.relics, used:s.used, tacticUsed:s.tacticUsed, tutorial:s.tutorial,
    result:s.result, victory:s.victory, log:s.log, stats:s.stats, star:s.phase === 'star' ? s.reserve.slice(0,3) : [],
  });
}
export type PlayerView = ReturnType<typeof playerView>;
