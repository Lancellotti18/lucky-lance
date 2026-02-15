import type { Card, PokerVariant } from "./types";
import { createDeck, removeCards, shuffle, deal } from "./deck";
import { evaluateHand } from "./hand-evaluator";

export function calculateEquity(
  holeCards: Card[],
  boardCards: Card[],
  variant: PokerVariant = "texasHoldem",
  numSimulations: number = 20000
): number {
  const knownCards = [...holeCards, ...boardCards];
  const baseDeck = createDeck(variant);
  const remainingDeck = removeCards(baseDeck, knownCards);
  const cardsToComplete = 5 - boardCards.length;
  const oppHoleCount = variant === "omaha" || variant === "omahaHiLo" ? 4 : 2;

  let heroWins = 0;
  let ties = 0;

  for (let i = 0; i < numSimulations; i++) {
    const shuffled = shuffle(remainingDeck);

    // Deal opponent hole cards
    const { dealt: oppHole, remaining: afterOpp } = deal(shuffled, oppHoleCount);

    // Complete the board
    const { dealt: runout } = deal(afterOpp, cardsToComplete);
    const fullBoard = [...boardCards, ...runout];

    try {
      const heroResult = evaluateHand(holeCards, fullBoard, variant);
      const oppResult = evaluateHand(oppHole, fullBoard, variant);

      if (heroResult.rank > oppResult.rank) {
        heroWins++;
      } else if (heroResult.rank === oppResult.rank) {
        // Same hand rank, compare descriptions for kicker resolution
        // pokersolver's winners function handles this properly
        const Hand = require("pokersolver").Hand;
        const h1 = Hand.solve(
          [...holeCards, ...fullBoard].map(cardToPS),
          getGameType(variant)
        );
        const h2 = Hand.solve(
          [...oppHole, ...fullBoard].map(cardToPS),
          getGameType(variant)
        );
        const winners = Hand.winners([h1, h2]);
        if (winners.length === 2) {
          ties++;
        } else if (winners[0] === h1) {
          heroWins++;
        }
      }
    } catch {
      // Skip invalid hand combinations (rare edge cases)
      continue;
    }
  }

  return (heroWins + ties / 2) / numSimulations;
}

function cardToPS(card: Card): string {
  return `${card[0]}${card[1]}`;
}

function getGameType(variant: PokerVariant): string {
  if (variant === "omaha" || variant === "omahaHiLo") {
    return "omaha";
  }
  return "standard";
}
