import type { Card, Rank, Suit } from "./types";

export const SUITS: Suit[] = ["h", "d", "c", "s"];
export const RANKS: Rank[] = [
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "T",
  "J",
  "Q",
  "K",
  "A",
];

export const SHORT_DECK_RANKS: Rank[] = [
  "6",
  "7",
  "8",
  "9",
  "T",
  "J",
  "Q",
  "K",
  "A",
];

export const RANK_VALUES: Record<Rank, number> = {
  "2": 2,
  "3": 3,
  "4": 4,
  "5": 5,
  "6": 6,
  "7": 7,
  "8": 8,
  "9": 9,
  T: 10,
  J: 11,
  Q: 12,
  K: 13,
  A: 14,
};

export const RANK_NAMES: Record<Rank, string> = {
  "2": "Two",
  "3": "Three",
  "4": "Four",
  "5": "Five",
  "6": "Six",
  "7": "Seven",
  "8": "Eight",
  "9": "Nine",
  T: "Ten",
  J: "Jack",
  Q: "Queen",
  K: "King",
  A: "Ace",
};

export const SUIT_NAMES: Record<Suit, string> = {
  h: "Hearts",
  d: "Diamonds",
  c: "Clubs",
  s: "Spades",
};

export const SUIT_SYMBOLS: Record<Suit, string> = {
  h: "\u2665",
  d: "\u2666",
  c: "\u2663",
  s: "\u2660",
};

export const SUIT_COLORS: Record<Suit, string> = {
  h: "#dc2626",
  d: "#dc2626",
  c: "#1a1a1a",
  s: "#1a1a1a",
};

export function createFullDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push(`${rank}${suit}` as Card);
    }
  }
  return deck;
}

export function createShortDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of SHORT_DECK_RANKS) {
      deck.push(`${rank}${suit}` as Card);
    }
  }
  return deck;
}

export const DRAW_TYPE_NAMES: Record<string, string> = {
  flushDraw: "Flush Draw",
  openEndedStraightDraw: "Open-Ended Straight Draw",
  gutshotStraightDraw: "Gutshot Straight Draw",
  overcards: "Overcards",
  setDraw: "Set Draw",
  fullHouseDraw: "Full House Draw",
  backdoorFlushDraw: "Backdoor Flush Draw",
  backdoorStraightDraw: "Backdoor Straight Draw",
};
