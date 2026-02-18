import type { Card, PokerVariant } from "./types";
import { createDeck, removeCards, shuffle, deal } from "./deck";
import { evaluateHand } from "./hand-evaluator";

export function calculateEquity(
  holeCards: Card[],
  boardCards: Card[],
  variant: PokerVariant = "texasHoldem",
  numSimulations: number = 5000,
  numOpponents: number = 1
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

    // Deal all opponents' hole cards
    let deckCursor = 0;
    const oppHands: Card[][] = [];
    for (let o = 0; o < numOpponents; o++) {
      oppHands.push(shuffled.slice(deckCursor, deckCursor + oppHoleCount));
      deckCursor += oppHoleCount;
    }

    // Complete the board
    const runout = shuffled.slice(deckCursor, deckCursor + cardsToComplete);
    const fullBoard = [...boardCards, ...runout];

    try {
      const heroResult = evaluateHand(holeCards, fullBoard, variant);

      let heroBeatAll = true;
      let allTied = true;

      for (const oppHole of oppHands) {
        const oppResult = evaluateHand(oppHole, fullBoard, variant);

        if (heroResult.rank < oppResult.rank) {
          heroBeatAll = false;
          allTied = false;
          break;
        } else if (heroResult.rank === oppResult.rank) {
          // Kicker comparison via pokersolver
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
          if (winners.length === 1 && winners[0] === h2) {
            heroBeatAll = false;
            allTied = false;
            break;
          } else if (winners.length === 2) {
            // Tied with this opponent, continue checking others
          } else {
            allTied = false;
          }
        } else {
          allTied = false;
        }
      }

      if (heroBeatAll && !allTied) {
        heroWins++;
      } else if (heroBeatAll && allTied) {
        ties++;
      }
    } catch {
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
