import type { Card, PokerVariant } from "./types";
import { createDeck, removeCards, shuffle, deal } from "./deck";
import { evaluateHand } from "./hand-evaluator";

export interface HandOdds {
  handType: string;
  probability: number;
  currentlyHave: boolean;
}

const HAND_RANK_NAMES: Record<number, string> = {
  1: "High Card",
  2: "Pair",
  3: "Two Pair",
  4: "Three of a Kind",
  5: "Straight",
  6: "Flush",
  7: "Full House",
  8: "Four of a Kind",
  9: "Straight Flush",
  10: "Royal Flush",
};

export function calculateHandOdds(
  holeCards: Card[],
  boardCards: Card[],
  variant: PokerVariant = "texasHoldem",
  numSimulations: number = 10000
): HandOdds[] {
  const knownCards = [...holeCards, ...boardCards];
  const baseDeck = createDeck(variant);
  const remainingDeck = removeCards(baseDeck, knownCards);
  const cardsToComplete = 5 - boardCards.length;

  // If board is complete (river), just evaluate current hand
  if (cardsToComplete === 0) {
    const currentHand = evaluateHand(holeCards, boardCards, variant);
    return Object.entries(HAND_RANK_NAMES).map(([rank, name]) => ({
      handType: name,
      probability: currentHand.rank === Number(rank) ? 1 : 0,
      currentlyHave: currentHand.rank === Number(rank),
    }));
  }

  // Get current hand rank
  let currentRank = 0;
  if (boardCards.length >= 3) {
    currentRank = evaluateHand(holeCards, boardCards, variant).rank;
  }

  // Monte Carlo: simulate remaining board cards
  const handCounts: Record<number, number> = {};
  for (let r = 1; r <= 10; r++) handCounts[r] = 0;

  let validSims = 0;
  for (let i = 0; i < numSimulations; i++) {
    const shuffled = shuffle(remainingDeck);
    const { dealt: runout } = deal(shuffled, cardsToComplete);
    const fullBoard = [...boardCards, ...runout];

    try {
      const result = evaluateHand(holeCards, fullBoard, variant);
      handCounts[result.rank] = (handCounts[result.rank] || 0) + 1;
      validSims++;
    } catch {
      continue;
    }
  }

  if (validSims === 0) return [];

  return Object.entries(HAND_RANK_NAMES)
    .map(([rank, name]) => {
      const rankNum = Number(rank);
      return {
        handType: name,
        probability: (handCounts[rankNum] || 0) / validSims,
        currentlyHave: rankNum === currentRank,
      };
    })
    .filter((h) => h.probability > 0.001 || h.currentlyHave)
    .sort((a, b) => b.probability - a.probability);
}
