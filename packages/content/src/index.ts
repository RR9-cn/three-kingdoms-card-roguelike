export const SUITS = ['spear', 'cavalry', 'bow', 'scheme'] as const;
export type Suit = typeof SUITS[number];
export const SUIT_NAMES: Record<Suit, string> = {spear:'器',cavalry:'画',bow:'典',scheme:'诡'};
export const HAND_NAMES = ['散件','成对藏品','年代序列','主题专场','连号专场','传世三件套'] as const;

export * from './forge';
