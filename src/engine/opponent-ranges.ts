import type { Card, PokerVariant, Rank, Suit } from "./types";
import { RANKS, SUITS, SHORT_DECK_RANKS } from "./constants";

// Default balanced ranges for heads-up play
// Represented as arrays of starting hand combos

// Texas Hold'em heads-up: ~top 50% of hands
const HOLDEM_RANGE_RANKS: [Rank, Rank][] = [
  // Pocket pairs
  ["A", "A"], ["K", "K"], ["Q", "Q"], ["J", "J"], ["T", "T"],
  ["9", "9"], ["8", "8"], ["7", "7"], ["6", "6"], ["5", "5"],
  ["4", "4"], ["3", "3"], ["2", "2"],
  // Suited aces
  ["A", "K"], ["A", "Q"], ["A", "J"], ["A", "T"], ["A", "9"],
  ["A", "8"], ["A", "7"], ["A", "6"], ["A", "5"], ["A", "4"],
  ["A", "3"], ["A", "2"],
  // Suited kings
  ["K", "Q"], ["K", "J"], ["K", "T"], ["K", "9"], ["K", "8"],
  ["K", "7"], ["K", "6"], ["K", "5"], ["K", "4"], ["K", "3"], ["K", "2"],
  // Suited queens+
  ["Q", "J"], ["Q", "T"], ["Q", "9"], ["Q", "8"], ["Q", "7"], ["Q", "6"],
  // Suited jacks+
  ["J", "T"], ["J", "9"], ["J", "8"], ["J", "7"],
  // Suited connectors
  ["T", "9"], ["T", "8"],
  ["9", "8"], ["9", "7"],
  ["8", "7"],
  ["7", "6"],
  ["6", "5"],
  ["5", "4"],
];

export function getDefaultRange(variant: PokerVariant): [Rank, Rank][] {
  switch (variant) {
    case "texasHoldem":
      return HOLDEM_RANGE_RANKS;
    case "shortDeck":
      // Filter to only include ranks in short deck
      return HOLDEM_RANGE_RANKS.filter(
        ([r1, r2]) =>
          SHORT_DECK_RANKS.includes(r1) && SHORT_DECK_RANKS.includes(r2)
      );
    case "omaha":
    case "omahaHiLo":
      // Omaha ranges are much wider - return full range
      return HOLDEM_RANGE_RANKS;
    default:
      return HOLDEM_RANGE_RANKS;
  }
}

export function isHandInRange(
  holeCards: Card[],
  range: [Rank, Rank][]
): boolean {
  if (holeCards.length < 2) return false;

  const r1 = holeCards[0][0] as Rank;
  const r2 = holeCards[1][0] as Rank;

  return range.some(
    ([a, b]) => (r1 === a && r2 === b) || (r1 === b && r2 === a)
  );
}
