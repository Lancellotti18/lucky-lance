import type { Card, PokerVariant, Rank, Suit } from "./types";
import { createFullDeck, createShortDeck } from "./constants";

export function createDeck(variant: PokerVariant): Card[] {
  if (variant === "shortDeck") {
    return createShortDeck();
  }
  return createFullDeck();
}

export function parseCard(card: Card): { rank: Rank; suit: Suit } {
  return {
    rank: card[0] as Rank,
    suit: card[1] as Suit,
  };
}

export function removeCards(deck: Card[], usedCards: Card[]): Card[] {
  const usedSet = new Set(usedCards);
  return deck.filter((card) => !usedSet.has(card));
}

export function shuffle(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function deal(deck: Card[], count: number): { dealt: Card[]; remaining: Card[] } {
  return {
    dealt: deck.slice(0, count),
    remaining: deck.slice(count),
  };
}

export function cardToPokersolverFormat(card: Card): string {
  const { rank, suit } = parseCard(card);
  const suitMap: Record<Suit, string> = {
    h: "h",
    d: "d",
    c: "c",
    s: "s",
  };
  return `${rank}${suitMap[suit]}`;
}

export function getStreet(boardCards: Card[]): "preflop" | "flop" | "turn" | "river" {
  switch (boardCards.length) {
    case 0:
      return "preflop";
    case 3:
      return "flop";
    case 4:
      return "turn";
    case 5:
      return "river";
    default:
      return "preflop";
  }
}
