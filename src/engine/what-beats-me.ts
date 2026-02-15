import type { Card, PokerVariant, WhatBeatsMeResult } from "./types";
import { createDeck, removeCards, cardToPokersolverFormat } from "./deck";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const Hand = require("pokersolver").Hand;

function getGameType(variant: PokerVariant): string {
  if (variant === "omaha" || variant === "omahaHiLo") {
    return "omaha";
  }
  return "standard";
}

export function analyzeWhatBeatsMe(
  holeCards: Card[],
  boardCards: Card[],
  variant: PokerVariant = "texasHoldem"
): WhatBeatsMeResult {
  const empty: WhatBeatsMeResult = {
    beatingGroups: [],
    totalBeatingCombos: 0,
    totalPossibleCombos: 0,
    beatingProbability: 0,
  };

  // Need at least a flop to analyze
  if (boardCards.length < 3) return empty;

  const gameType = getGameType(variant);
  const knownCards = [...holeCards, ...boardCards];
  const remaining = removeCards(createDeck(variant), knownCards);

  // Evaluate the player's hand once
  const heroCards = knownCards.map(cardToPokersolverFormat);
  const heroHand = Hand.solve(heroCards, gameType);

  // Track beating hands grouped by name
  const groups = new Map<
    string,
    { combos: number; examples: [Card, Card][] }
  >();

  let totalCombos = 0;
  let totalBeating = 0;

  // Enumerate all possible opponent 2-card combos
  for (let i = 0; i < remaining.length; i++) {
    for (let j = i + 1; j < remaining.length; j++) {
      totalCombos++;

      const oppHole: [Card, Card] = [remaining[i], remaining[j]];
      const oppAllCards = [...oppHole, ...boardCards].map(
        cardToPokersolverFormat
      );

      try {
        const oppHand = Hand.solve(oppAllCards, gameType);
        const winners = Hand.winners([heroHand, oppHand]);

        // Opponent wins (not a tie, and hero is not the winner)
        if (winners.length === 1 && winners[0] === oppHand) {
          totalBeating++;

          const name: string = oppHand.name;
          const existing = groups.get(name);
          if (existing) {
            existing.combos++;
            if (existing.examples.length < 3) {
              existing.examples.push(oppHole);
            }
          } else {
            groups.set(name, { combos: 1, examples: [oppHole] });
          }
        }
      } catch {
        // Skip invalid combos (rare edge cases)
        continue;
      }
    }
  }

  if (totalCombos === 0) return empty;

  const beatingGroups = Array.from(groups.entries())
    .map(([handName, data]) => ({
      handName,
      combos: data.combos,
      probability: data.combos / totalCombos,
      exampleHoldings: data.examples,
    }))
    .sort((a, b) => b.probability - a.probability);

  return {
    beatingGroups,
    totalBeatingCombos: totalBeating,
    totalPossibleCombos: totalCombos,
    beatingProbability: totalBeating / totalCombos,
  };
}
