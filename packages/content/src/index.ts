import seedRules from '../../../design-data/rules.v0.1.json' with { type: 'json' };
export const RULES = seedRules;
export const CONTENT_VERSION = '0.1.0';
export const SUITS = ['spear', 'cavalry', 'bow', 'scheme'] as const;
export type Suit = typeof SUITS[number];
export const SUIT_NAMES: Record<Suit, string> = { spear: '枪', cavalry: '骑', bow: '弓', scheme: '谋' };
export const HAND_NAMES = RULES.categories.map(c => c.name);
export const HAND_BONUS = RULES.categories.map(c => c.damageBonus);
export type TacticId = 'advance' | 'borrow-banner' | 'regroup' | 'star-reading' | 'fortify' | 'supply';
export type RelicId = 'spear-tassel' | 'common-banner' | 'scout-map' | 'white-horse' | 'tiger-seal' | 'green-bag';
export type EnemyId = 'yellow-blade' | 'yellow-scout' | 'yellow-guard' | 'yellow-captain' | 'zhang-jiao';
type TacticEffect = 'modify-rank' | 'change-suit' | 'exchange-two' | 'reserve-order' | 'gain-shield' | 'gain-command';
export const TACTICS: Record<TacticId, { name: string; text: string; effect: TacticEffect }> = {
  advance: { name: '顺势', text: '将一张阵牌的点数 +1（上限 9）', effect: 'modify-rank' },
  'borrow-banner': { name: '借旗', text: '将一张阵牌改为另一兵种', effect: 'change-suit' },
  regroup: { name: '重整', text: '同时换掉两张阵牌，不占换阵次数', effect: 'exchange-two' },
  'star-reading': { name: '观星', text: '查看余牌顶三张，选择一张置顶', effect: 'reserve-order' },
  fortify: { name: '固守', text: '本轮获得 4 护甲，抵挡亮阵伤害', effect: 'gain-shield' },
  supply: { name: '整军', text: '消耗后回复 2 军令，净增加 1', effect: 'gain-command' },
};
export const RELICS: Record<RelicId, { name: string; text: string }> = {
  'spear-tassel': { name: '亮银枪纂', text: '连阵或同袍连阵胜出，伤害 +2' },
  'common-banner': { name: '同袍战鼓', text: '同袍或同袍连阵胜出，伤害 +2' },
  'scout-map': { name: '行军图', text: '每轮侦察次数 +1' },
  'white-horse': { name: '白马', text: '每轮换阵次数 +1' },
  'tiger-seal': { name: '虎符', text: '战势 3 亮阵胜出，伤害 +2' },
  'green-bag': { name: '青囊', text: '战斗胜利后恢复 3 兵力' },
};
const enemyNames: Record<EnemyId, [string, string]> = {
  'yellow-blade': ['黄巾刀兵', '谨慎'], 'yellow-scout': ['黄巾游骑', '多疑'],
  'yellow-guard': ['黄巾甲士', '强硬'], 'yellow-captain': ['黄巾渠帅', '强硬'], 'zhang-jiao': ['张角', '死战'],
};
export type Enemy = { id: EnemyId; name: string; temperament: string; hp: number; yieldByCategoryGroup: number[]; hideAllEvery?: number; pressureTwoEvery?: number; neverYield?: boolean };
export const ENEMIES = Object.fromEntries(RULES.enemies.map(e => [e.id, { ...e, name: enemyNames[e.id as EnemyId][0], temperament: enemyNames[e.id as EnemyId][1] }])) as Record<EnemyId, Enemy>;
export type NodeKind = 'battle' | 'elite' | 'boss' | 'shop' | 'camp' | 'event';
export const ROUTE: NodeKind[][] = [['battle'], ['battle', 'event'], ['shop', 'camp'], ['battle'], ['elite', 'battle'], ['event', 'shop'], ['camp'], ['boss']];
export const NODE_NAMES: Record<NodeKind, string> = { battle: '遭遇战', elite: '挑战渠帅', boss: '决战张角', shop: '行军商队', camp: '扎营休整', event: '途中奇遇' };
export const EVENT_IDS = ['empty-granary', 'abandoned-banner', 'physician'] as const;
export type EventId = typeof EVENT_IDS[number];
export const EVENTS: Record<EventId, { name: string; story: string; options: [string, string] }> = {
  'empty-granary': { name: '荒村粮仓', story: '战火过后，村口仍有人守着最后一车军粮。', options: ['付 8 军资，恢复 8 兵力', '留给村民，继续前行'] },
  'abandoned-banner': { name: '无主军旗', story: '残破的军旗还在风中猎猎作响。穿过伏兵，也许能取回它。', options: ['损失 5 兵力，获得「借旗」', '绕路离开'] },
  physician: { name: '山中医者', story: '竹林里，一位医者为伤兵煮好了药。', options: ['最大兵力与当前兵力 +4', '接受资助，军资 +10'] },
};
export function validateContent(): void {
  if (new Set(SUITS).size !== 4 || RULES.deck.ranks.length !== 9) throw Error('Invalid deck');
  for (const e of Object.values(ENEMIES)) {
    if (e.hp <= 0 || e.yieldByCategoryGroup.length !== 3 || e.yieldByCategoryGroup.some(p => p < 0 || p > 1)) throw Error('Invalid enemy');
  }
  if (Object.keys(TACTICS).length !== 6 || Object.keys(RELICS).length !== 6 || ROUTE.length !== 8) throw Error('Invalid content');
}
validateContent();
export * from './forge';
