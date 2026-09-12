export const SUITS = ['spear', 'cavalry', 'bow', 'scheme'] as const;
export type Suit = typeof SUITS[number];
export const SUIT_NAMES: Record<Suit, string> = {spear:'枪',cavalry:'骑',bow:'弓',scheme:'谋'};
export const HAND_NAMES = ['散阵','合击','连阵','同袍','同袍连阵','三军同心'] as const;

export * from './forge';
