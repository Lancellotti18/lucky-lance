export type Suit = "h" | "d" | "c" | "s";
export type Rank =
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "T"
  | "J"
  | "Q"
  | "K"
  | "A";

export type Card = `${Rank}${Suit}`;

export type PokerVariant =
  | "texasHoldem"
  | "omaha"
  | "omahaHiLo"
  | "shortDeck";

export type Street = "preflop" | "flop" | "turn" | "river";

export type DrawType =
  | "flushDraw"
  | "openEndedStraightDraw"
  | "gutshotStraightDraw"
  | "overcards"
  | "setDraw"
  | "fullHouseDraw"
  | "backdoorFlushDraw"
  | "backdoorStraightDraw";

export interface OutInfo {
  type: DrawType;
  outs: Card[];
  count: number;
  isClean: boolean;
}

export type Action = "fold" | "call" | "raise" | "check";

export interface ActionOption {
  action: Action;
  label: string;
  reasoning: string;
  confidence: "strong" | "moderate" | "marginal";
  color: string;
}

export interface HandOddsEntry {
  handType: string;
  probability: number;
  currentlyHave: boolean;
}

export interface BeatingHandGroup {
  handName: string;
  combos: number;
  probability: number;
  exampleHoldings: [Card, Card][];
}

export interface WhatBeatsMeResult {
  beatingGroups: BeatingHandGroup[];
  totalBeatingCombos: number;
  totalPossibleCombos: number;
  beatingProbability: number;
}

export interface HandStrengthResult {
  category: "premium" | "strong" | "good" | "marginal" | "weak" | "trash";
  label: string;
  description: string;
  vulnerability: number;
  isNutted: boolean;
  boardDescription: string;
  drawLabel: string | null;
  isNutDraw: boolean;
}

export interface AnalysisResult {
  holeCards: Card[];
  boardCards: Card[];
  street: Street;
  equity: number;
  outs: OutInfo[];
  totalCleanOuts: number;
  totalDirtyOuts: number;
  potOdds: number | null;
  recommendedAction: Action;
  topActions: ActionOption[];
  handOdds: HandOddsEntry[];
  whatBeatsMe: WhatBeatsMeResult;
  explanation: string;
  handName: string;
  improvedHandName: string | null;
  handStrength: HandStrengthResult;
}

export type AppScreen =
  | "launch"
  | "main"
  | "camera"
  | "preview"
  | "potInput"
  | "loading"
  | "results";

export const VARIANT_LABELS: Record<PokerVariant, string> = {
  texasHoldem: "Texas Hold'em",
  omaha: "Omaha",
  omahaHiLo: "Omaha Hi-Lo",
  shortDeck: "Short Deck",
};

export const HOLE_CARD_COUNT: Record<PokerVariant, number> = {
  texasHoldem: 2,
  omaha: 4,
  omahaHiLo: 4,
  shortDeck: 2,
};
