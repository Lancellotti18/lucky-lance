import type { Card, PokerVariant } from "./types";
import { cardToPokersolverFormat } from "./deck";

// pokersolver doesn't have types, so we declare what we need
// eslint-disable-next-line @typescript-eslint/no-require-imports
const Hand = require("pokersolver").Hand;

export interface EvaluatedHand {
  rank: number;
  name: string;
  description: string;
  cards: string[];
}

export function evaluateHand(
  holeCards: Card[],
  boardCards: Card[],
  variant: PokerVariant = "texasHoldem"
): EvaluatedHand {
  const allCards = [...holeCards, ...boardCards].map(cardToPokersolverFormat);

  let gameType = "standard";
  if (variant === "omaha" || variant === "omahaHiLo") {
    gameType = "omaha";
  }

  const hand = Hand.solve(allCards, gameType);

  return {
    rank: hand.rank,
    name: hand.name,
    description: hand.descr,
    cards: hand.cards.map((c: { value: string; suit: string }) => `${c.value}${c.suit}`),
  };
}

export function compareHands(
  hand1HoleCards: Card[],
  hand1Board: Card[],
  hand2HoleCards: Card[],
  hand2Board: Card[],
  variant: PokerVariant = "texasHoldem"
): -1 | 0 | 1 {
  const allCards1 = [...hand1HoleCards, ...hand1Board].map(cardToPokersolverFormat);
  const allCards2 = [...hand2HoleCards, ...hand2Board].map(cardToPokersolverFormat);

  let gameType = "standard";
  if (variant === "omaha" || variant === "omahaHiLo") {
    gameType = "omaha";
  }

  const h1 = Hand.solve(allCards1, gameType);
  const h2 = Hand.solve(allCards2, gameType);

  const winners = Hand.winners([h1, h2]);

  if (winners.length === 2) return 0;
  if (winners[0] === h1) return 1;
  return -1;
}

export function getHandName(
  holeCards: Card[],
  boardCards: Card[],
  variant: PokerVariant = "texasHoldem"
): string {
  if (boardCards.length === 0) {
    // Preflop - describe the hole cards
    const h = holeCards.map(cardToPokersolverFormat);
    if (h.length === 2) {
      const r1 = h[0][0];
      const r2 = h[1][0];
      const s1 = h[0][1];
      const s2 = h[1][1];
      if (r1 === r2) return `Pocket ${rankName(r1)}s`;
      const suited = s1 === s2 ? "suited" : "offsuit";
      return `${rankName(r1)}-${rankName(r2)} ${suited}`;
    }
    return "Starting Hand";
  }

  const result = evaluateHand(holeCards, boardCards, variant);
  return result.name;
}

function rankName(r: string): string {
  const names: Record<string, string> = {
    "2": "Twos",
    "3": "Threes",
    "4": "Fours",
    "5": "Fives",
    "6": "Sixes",
    "7": "Sevens",
    "8": "Eights",
    "9": "Nines",
    T: "Tens",
    J: "Jacks",
    Q: "Queens",
    K: "Kings",
    A: "Aces",
  };
  return names[r] || r;
}
