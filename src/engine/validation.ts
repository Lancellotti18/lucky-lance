import type { Card, PokerVariant, Rank, Suit } from "./types";
import { HOLE_CARD_COUNT } from "./types";
import { RANKS as ALL_RANKS, SUITS as ALL_SUITS, SHORT_DECK_RANKS } from "./constants";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateCards(
  holeCards: Card[],
  boardCards: Card[],
  variant: PokerVariant = "texasHoldem"
): ValidationResult {
  const errors: string[] = [];

  // Check hole card count
  const expectedHoleCards = HOLE_CARD_COUNT[variant];
  if (holeCards.length !== expectedHoleCards) {
    errors.push(
      `Expected ${expectedHoleCards} hole cards for ${variant}, got ${holeCards.length}`
    );
  }

  // Check board card count
  if (![0, 3, 4, 5].includes(boardCards.length)) {
    errors.push(
      `Board must have 0, 3, 4, or 5 cards, got ${boardCards.length}`
    );
  }

  // Validate each card format
  const allCards = [...holeCards, ...boardCards];
  const validRanks = variant === "shortDeck" ? SHORT_DECK_RANKS : ALL_RANKS;

  for (const card of allCards) {
    if (card.length !== 2) {
      errors.push(`Invalid card format: "${card}"`);
      continue;
    }

    const rank = card[0] as Rank;
    const suit = card[1] as Suit;

    if (!validRanks.includes(rank)) {
      errors.push(`Invalid rank "${rank}" in card "${card}"`);
    }

    if (!ALL_SUITS.includes(suit)) {
      errors.push(`Invalid suit "${suit}" in card "${card}"`);
    }
  }

  // Check for duplicates
  const seen = new Set<string>();
  for (const card of allCards) {
    if (seen.has(card)) {
      errors.push(`Duplicate card detected: ${card}`);
    }
    seen.add(card);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function isValidCard(card: string): card is Card {
  if (card.length !== 2) return false;
  const rank = card[0] as Rank;
  const suit = card[1] as Suit;
  return ALL_RANKS.includes(rank) && ALL_SUITS.includes(suit);
}
