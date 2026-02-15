import type { Card, PokerVariant, Rank, Suit, OutInfo } from "./types";
import { RANK_VALUES } from "./constants";
import { parseCard } from "./deck";
import { evaluateHand } from "./hand-evaluator";

// Relative hand strength categories
export type HandStrengthCategory =
  | "premium" // Nut or near-nut hand (top set, nut flush, overpair AA/KK)
  | "strong" // Very good hand (overpair QQ+, TPTK, strong flush/straight)
  | "good" // Solid playable hand (top pair, middle two pair, non-nut flush)
  | "marginal" // Playable but vulnerable (middle pair, weak top pair, bottom two pair)
  | "weak" // Below average, caution needed (bottom pair, underpair, weak draws)
  | "trash"; // Very weak, usually fold (no pair, board pair only)

export interface BoardTexture {
  isWet: boolean; // Many draws possible
  isDry: boolean; // Few draws possible
  isPaired: boolean; // Board has a pair
  flushPossible: boolean; // 3+ of same suit on board
  flushDrawPossible: boolean; // 2 of same suit on board
  straightPossible: boolean; // 3+ connected cards
  highCard: number; // Highest board card value
  description: string;
}

export interface HandStrengthInfo {
  category: HandStrengthCategory;
  label: string; // e.g., "Premium Overpair", "Nut Flush", "Bottom Pair"
  description: string; // e.g., "Your pocket Aces are above all board cards"
  vulnerability: number; // 0-1, how vulnerable to being outdrawn/dominated
  kicker: "strong" | "weak" | "n/a";
  boardTexture: BoardTexture;
  isNutted: boolean; // Is this the best possible hand or close to it?
  drawStrength: DrawStrength | null; // If drawing, how strong is the draw?
}

export interface DrawStrength {
  isNutDraw: boolean; // Drawing to the nuts?
  label: string; // e.g., "Nut Flush Draw", "Weak Straight Draw"
  impliedOddsMultiplier: number; // 1.0 = normal, 1.3 = great implied odds, 0.7 = reverse implied odds concern
}

// ─── Main entry point ───────────────────────────────────────────────

export function analyzeHandStrength(
  holeCards: Card[],
  boardCards: Card[],
  variant: PokerVariant = "texasHoldem",
  outs: OutInfo[] = []
): HandStrengthInfo {
  if (boardCards.length === 0) {
    return analyzePreflopStrength(holeCards);
  }

  const evaluated = evaluateHand(holeCards, boardCards, variant);
  const boardTexture = analyzeBoardTexture(boardCards);
  const drawStrength = analyzeDrawStrength(holeCards, boardCards, outs);

  switch (evaluated.rank) {
    case 10: // Royal Flush
      return {
        category: "premium",
        label: "Royal Flush",
        description: "The absolute nuts. Unbeatable.",
        vulnerability: 0,
        kicker: "n/a",
        boardTexture,
        isNutted: true,
        drawStrength,
      };
    case 9: // Straight Flush
      return {
        category: "premium",
        label: "Straight Flush",
        description: "Near-nut hand, virtually unbeatable.",
        vulnerability: 0,
        kicker: "n/a",
        boardTexture,
        isNutted: true,
        drawStrength,
      };
    case 8: // Four of a Kind
      return analyzeQuads(holeCards, boardCards, boardTexture, drawStrength);
    case 7: // Full House
      return analyzeFullHouse(holeCards, boardCards, boardTexture, drawStrength);
    case 6: // Flush
      return analyzeFlush(holeCards, boardCards, boardTexture, drawStrength);
    case 5: // Straight
      return analyzeStraight(holeCards, boardCards, boardTexture, drawStrength);
    case 4: // Three of a Kind
      return analyzeTrips(holeCards, boardCards, boardTexture, drawStrength);
    case 3: // Two Pair
      return analyzeTwoPair(holeCards, boardCards, boardTexture, drawStrength);
    case 2: // Pair
      return analyzePairStrength(holeCards, boardCards, boardTexture, drawStrength);
    case 1: // High Card
    default:
      return analyzeHighCard(holeCards, boardCards, boardTexture, drawStrength);
  }
}

// ─── Board Texture ──────────────────────────────────────────────────

export function analyzeBoardTexture(boardCards: Card[]): BoardTexture {
  if (boardCards.length === 0) {
    return {
      isWet: false,
      isDry: true,
      isPaired: false,
      flushPossible: false,
      flushDrawPossible: false,
      straightPossible: false,
      highCard: 0,
      description: "Preflop",
    };
  }

  const ranks = boardCards.map((c) => RANK_VALUES[parseCard(c).rank]);
  const suits = boardCards.map((c) => parseCard(c).suit);

  // Check for paired board
  const rankCounts = new Map<number, number>();
  for (const r of ranks) {
    rankCounts.set(r, (rankCounts.get(r) || 0) + 1);
  }
  const isPaired = [...rankCounts.values()].some((count) => count >= 2);

  // Check for flush possibility
  const suitCounts = new Map<string, number>();
  for (const s of suits) {
    suitCounts.set(s, (suitCounts.get(s) || 0) + 1);
  }
  const maxSuitCount = Math.max(...suitCounts.values());
  const flushPossible = maxSuitCount >= 3;
  const flushDrawPossible = maxSuitCount >= 2;

  // Check for straight possibility (3+ connected cards within a 5-card window)
  const uniqueRanks = [...new Set(ranks)].sort((a, b) => a - b);
  let straightPossible = false;
  if (uniqueRanks.includes(14)) uniqueRanks.unshift(1); // Ace low
  for (let i = 0; i <= uniqueRanks.length - 3; i++) {
    if (uniqueRanks[i + 2] - uniqueRanks[i] <= 4) {
      straightPossible = true;
      break;
    }
  }

  const highCard = Math.max(...ranks);

  // Determine wetness
  let wetness = 0;
  if (flushDrawPossible) wetness += 2;
  if (flushPossible) wetness += 2;
  if (straightPossible) wetness += 2;
  if (!isPaired) wetness += 1; // Unpaired boards are wetter
  // Connected boards are wetter
  const sortedRanks = [...new Set(ranks)].sort((a, b) => a - b);
  for (let i = 1; i < sortedRanks.length; i++) {
    if (sortedRanks[i] - sortedRanks[i - 1] <= 2) wetness += 1;
  }

  const isWet = wetness >= 4;
  const isDry = wetness <= 2;

  const descriptions: string[] = [];
  if (isPaired) descriptions.push("paired");
  if (flushPossible) descriptions.push("flush-complete");
  else if (flushDrawPossible) descriptions.push("flush-draw possible");
  if (straightPossible) descriptions.push("connected");
  if (highCard >= 12) descriptions.push("high-card heavy");
  if (highCard <= 8) descriptions.push("low");

  const texture = isWet ? "Wet" : isDry ? "Dry" : "Medium";
  const description =
    descriptions.length > 0
      ? `${texture} board (${descriptions.join(", ")})`
      : `${texture} board`;

  return {
    isWet,
    isDry,
    isPaired,
    flushPossible,
    flushDrawPossible,
    straightPossible,
    highCard,
    description,
  };
}

// ─── Draw Strength ──────────────────────────────────────────────────

function analyzeDrawStrength(
  holeCards: Card[],
  boardCards: Card[],
  outs: OutInfo[]
): DrawStrength | null {
  if (outs.length === 0) return null;

  const holeRanks = holeCards.map((c) => ({
    rank: parseCard(c).rank,
    value: RANK_VALUES[parseCard(c).rank],
    suit: parseCard(c).suit,
  }));

  for (const out of outs) {
    if (out.type === "flushDraw") {
      // Determine flush draw strength by checking if we have the Ace of the suit
      const allCards = [...holeCards, ...boardCards];
      const suitCounts = new Map<Suit, number>();
      for (const c of allCards) {
        const s = parseCard(c).suit;
        suitCounts.set(s, (suitCounts.get(s) || 0) + 1);
      }
      // Find the flush draw suit
      let flushSuit: Suit | null = null;
      for (const [suit, count] of suitCounts) {
        if (count === 4) {
          flushSuit = suit;
          break;
        }
      }

      if (flushSuit) {
        const holeSuited = holeRanks.filter((h) => h.suit === flushSuit);
        const maxHoleFlushRank = Math.max(
          ...holeSuited.map((h) => h.value),
          0
        );

        if (maxHoleFlushRank === 14) {
          // Ace-high = nut flush draw
          return {
            isNutDraw: true,
            label: "Nut Flush Draw",
            impliedOddsMultiplier: 1.3,
          };
        } else if (maxHoleFlushRank >= 12) {
          // K or Q high
          return {
            isNutDraw: false,
            label: "Strong Flush Draw",
            impliedOddsMultiplier: 1.15,
          };
        } else {
          return {
            isNutDraw: false,
            label: "Weak Flush Draw",
            impliedOddsMultiplier: 0.8,
          };
        }
      }
    }

    if (
      out.type === "openEndedStraightDraw" ||
      out.type === "gutshotStraightDraw"
    ) {
      // Check if we're drawing to the nut straight
      const allRanks = [...holeCards, ...boardCards].map(
        (c) => RANK_VALUES[parseCard(c).rank]
      );
      const maxRank = Math.max(...allRanks);
      const holeMax = Math.max(...holeRanks.map((h) => h.value));

      // If our hole cards are at the top end of the straight, it's likely a nut draw
      const isNut = holeMax >= maxRank || holeMax >= 13;
      const drawType =
        out.type === "openEndedStraightDraw" ? "OESD" : "Gutshot";

      if (isNut) {
        return {
          isNutDraw: true,
          label: `Nut ${drawType}`,
          impliedOddsMultiplier: out.type === "openEndedStraightDraw" ? 1.2 : 1.0,
        };
      } else {
        return {
          isNutDraw: false,
          label: `Weak ${drawType}`,
          impliedOddsMultiplier: out.type === "openEndedStraightDraw" ? 0.95 : 0.75,
        };
      }
    }
  }

  return null;
}

// ─── Preflop Strength ───────────────────────────────────────────────

function analyzePreflopStrength(holeCards: Card[]): HandStrengthInfo {
  const boardTexture = analyzeBoardTexture([]);

  if (holeCards.length < 2) {
    return {
      category: "marginal",
      label: "Incomplete Hand",
      description: "Not enough cards to evaluate.",
      vulnerability: 0.5,
      kicker: "n/a",
      boardTexture,
      isNutted: false,
      drawStrength: null,
    };
  }

  const r1 = RANK_VALUES[parseCard(holeCards[0]).rank];
  const r2 = RANK_VALUES[parseCard(holeCards[1]).rank];
  const s1 = parseCard(holeCards[0]).suit;
  const s2 = parseCard(holeCards[1]).suit;
  const isPair = r1 === r2;
  const isSuited = s1 === s2;
  const highRank = Math.max(r1, r2);
  const lowRank = Math.min(r1, r2);
  const gap = highRank - lowRank;

  const rankLabel = (v: number) => {
    const names: Record<number, string> = {
      14: "Aces",
      13: "Kings",
      12: "Queens",
      11: "Jacks",
      10: "Tens",
      9: "Nines",
      8: "Eights",
      7: "Sevens",
      6: "Sixes",
      5: "Fives",
      4: "Fours",
      3: "Threes",
      2: "Twos",
    };
    return names[v] || String(v);
  };

  if (isPair) {
    if (highRank >= 13) {
      // AA, KK
      return {
        category: "premium",
        label: `Premium Pair (${rankLabel(highRank)})`,
        description: `Pocket ${rankLabel(highRank)} — a top-tier starting hand. Play aggressively.`,
        vulnerability: 0.1,
        kicker: "n/a",
        boardTexture,
        isNutted: highRank === 14,
        drawStrength: null,
      };
    }
    if (highRank >= 10) {
      // QQ, JJ, TT
      return {
        category: "strong",
        label: `Strong Pair (${rankLabel(highRank)})`,
        description: `Pocket ${rankLabel(highRank)} — strong but vulnerable to overcards on the flop.`,
        vulnerability: 0.25,
        kicker: "n/a",
        boardTexture,
        isNutted: false,
        drawStrength: null,
      };
    }
    if (highRank >= 7) {
      // 99-77
      return {
        category: "good",
        label: `Medium Pair (${rankLabel(highRank)})`,
        description: `Pocket ${rankLabel(highRank)} — set-mining hand. Strong if you hit a set, but vulnerable otherwise.`,
        vulnerability: 0.4,
        kicker: "n/a",
        boardTexture,
        isNutted: false,
        drawStrength: null,
      };
    }
    // 66-22
    return {
      category: "marginal",
      label: `Small Pair (${rankLabel(highRank)})`,
      description: `Pocket ${rankLabel(highRank)} — a weak pair preflop. Best used for set-mining.`,
      vulnerability: 0.55,
      kicker: "n/a",
      boardTexture,
      isNutted: false,
      drawStrength: null,
    };
  }

  // Non-pair hands
  if (highRank === 14 && lowRank >= 12) {
    // AK, AQ
    return {
      category: "strong",
      label: isSuited ? "Premium Suited Broadway" : "Premium Broadway",
      description: `Big broadway cards${isSuited ? " suited" : ""}. Strong top-pair potential with a dominant kicker.`,
      vulnerability: 0.3,
      kicker: "strong",
      boardTexture,
      isNutted: false,
      drawStrength: null,
    };
  }

  if (highRank >= 12 && lowRank >= 11 && gap <= 2) {
    // KQ, QJ, KJ
    return {
      category: "good",
      label: isSuited ? "Suited Broadway" : "Broadway Cards",
      description: `Connected high cards${isSuited ? " with flush potential" : ""}. Good top-pair and straight potential.`,
      vulnerability: 0.35,
      kicker: lowRank >= 12 ? "strong" : "weak",
      boardTexture,
      isNutted: false,
      drawStrength: null,
    };
  }

  if (highRank === 14 && isSuited) {
    // Ax suited
    return {
      category: "good",
      label: "Suited Ace",
      description: `Suited Ace — nut flush draw potential and top-pair with best kicker.`,
      vulnerability: 0.35,
      kicker: lowRank >= 10 ? "strong" : "weak",
      boardTexture,
      isNutted: false,
      drawStrength: null,
    };
  }

  if (isSuited && gap <= 2 && lowRank >= 6) {
    // Suited connectors 67s-JTs
    return {
      category: "good",
      label: "Suited Connector",
      description: `Suited connector — flush and straight draw potential. Plays well in position.`,
      vulnerability: 0.45,
      kicker: "weak",
      boardTexture,
      isNutted: false,
      drawStrength: null,
    };
  }

  if (highRank === 14) {
    // Ax offsuit
    return {
      category: "marginal",
      label: "Offsuit Ace",
      description: `Ace with a ${lowRank >= 10 ? "decent" : "weak"} kicker. Top-pair potential but kicker problems likely.`,
      vulnerability: lowRank >= 10 ? 0.4 : 0.55,
      kicker: lowRank >= 10 ? "strong" : "weak",
      boardTexture,
      isNutted: false,
      drawStrength: null,
    };
  }

  if (gap <= 2 && lowRank >= 5) {
    // Offsuit connectors
    return {
      category: "marginal",
      label: "Connected Cards",
      description: `Connected cards with straight potential, but limited flush potential.`,
      vulnerability: 0.5,
      kicker: "weak",
      boardTexture,
      isNutted: false,
      drawStrength: null,
    };
  }

  // Everything else is weak/trash
  if (highRank >= 10 || isSuited) {
    return {
      category: "weak",
      label: isSuited ? "Weak Suited" : "Weak High Card",
      description: `A weak starting hand. Difficult to make strong hands post-flop.`,
      vulnerability: 0.65,
      kicker: "weak",
      boardTexture,
      isNutted: false,
      drawStrength: null,
    };
  }

  return {
    category: "trash",
    label: "Trash Hand",
    description: `Very weak starting hand. Fold in most situations.`,
    vulnerability: 0.8,
    kicker: "weak",
    boardTexture,
    isNutted: false,
    drawStrength: null,
  };
}

// ─── Post-flop hand analysis ────────────────────────────────────────

function analyzeQuads(
  holeCards: Card[],
  boardCards: Card[],
  boardTexture: BoardTexture,
  drawStrength: DrawStrength | null
): HandStrengthInfo {
  return {
    category: "premium",
    label: "Four of a Kind",
    description: "Quads — an extremely rare and powerful hand. Extract maximum value.",
    vulnerability: 0.02,
    kicker: "n/a",
    boardTexture,
    isNutted: true,
    drawStrength,
  };
}

function analyzeFullHouse(
  holeCards: Card[],
  boardCards: Card[],
  boardTexture: BoardTexture,
  drawStrength: DrawStrength | null
): HandStrengthInfo {
  // Determine if we have the top full house or a lower one
  const holeRanks = holeCards.map((c) => RANK_VALUES[parseCard(c).rank]);
  const boardRanks = boardCards.map((c) => RANK_VALUES[parseCard(c).rank]);
  const maxBoardRank = Math.max(...boardRanks);

  // If our trips part is from a pocket pair, it's more concealed/stronger
  const isPocketPair = holeRanks.length >= 2 && holeRanks[0] === holeRanks[1];
  const pairRank = isPocketPair ? holeRanks[0] : 0;

  if (isPocketPair && pairRank >= maxBoardRank) {
    return {
      category: "premium",
      label: "Top Full House",
      description: `Top full house with a concealed set. Very difficult for opponents to read.`,
      vulnerability: 0.05,
      kicker: "n/a",
      boardTexture,
      isNutted: true,
      drawStrength,
    };
  }

  // Check if our hole card makes the trips portion of the full house
  const maxHole = Math.max(...holeRanks);
  if (maxHole >= maxBoardRank) {
    return {
      category: "strong",
      label: "Strong Full House",
      description: `A strong full house. Be cautious only of higher full houses on paired boards.`,
      vulnerability: 0.1,
      kicker: "n/a",
      boardTexture,
      isNutted: false,
      drawStrength,
    };
  }

  return {
    category: "good",
    label: "Bottom Full House",
    description: `A full house, but a lower one. Watch out for higher boats on this paired board.`,
    vulnerability: 0.2,
    kicker: "n/a",
    boardTexture,
    isNutted: false,
    drawStrength,
  };
}

function analyzeFlush(
  holeCards: Card[],
  boardCards: Card[],
  boardTexture: BoardTexture,
  drawStrength: DrawStrength | null
): HandStrengthInfo {
  // Find the flush suit
  const allCards = [...holeCards, ...boardCards];
  const suitCounts = new Map<Suit, Card[]>();
  for (const c of allCards) {
    const s = parseCard(c).suit;
    const list = suitCounts.get(s) || [];
    list.push(c);
    suitCounts.set(s, list);
  }

  let flushSuit: Suit | null = null;
  for (const [suit, cards] of suitCounts) {
    if (cards.length >= 5) {
      flushSuit = suit;
      break;
    }
  }

  if (!flushSuit) {
    return {
      category: "strong",
      label: "Flush",
      description: "You have a flush.",
      vulnerability: 0.15,
      kicker: "n/a",
      boardTexture,
      isNutted: false,
      drawStrength,
    };
  }

  // Check our highest hole card of the flush suit
  const holeSuitedCards = holeCards.filter(
    (c) => parseCard(c).suit === flushSuit
  );
  const holeSuitedRanks = holeSuitedCards.map(
    (c) => RANK_VALUES[parseCard(c).rank]
  );
  const maxHoleFlushRank = holeSuitedRanks.length > 0 ? Math.max(...holeSuitedRanks) : 0;

  // Check how many of the flush suit are on the board
  const boardFlushCards = boardCards.filter(
    (c) => parseCard(c).suit === flushSuit
  );

  if (holeSuitedCards.length === 0) {
    // Board flush - we don't contribute; very weak
    return {
      category: "weak",
      label: "Board Flush",
      description: `The flush is entirely on the board. Any opponent with a higher ${flushSuit === "h" ? "heart" : flushSuit === "d" ? "diamond" : flushSuit === "c" ? "club" : "spade"} beats you.`,
      vulnerability: 0.75,
      kicker: "weak",
      boardTexture,
      isNutted: false,
      drawStrength,
    };
  }

  if (maxHoleFlushRank === 14) {
    return {
      category: "premium",
      label: "Nut Flush",
      description: `Ace-high flush — the best possible flush. Play for maximum value.`,
      vulnerability: 0.05,
      kicker: "n/a",
      boardTexture,
      isNutted: true,
      drawStrength,
    };
  }

  if (maxHoleFlushRank >= 12) {
    // K or Q high flush
    return {
      category: "strong",
      label: "Strong Flush",
      description: `${maxHoleFlushRank === 13 ? "King" : "Queen"}-high flush. Very strong, but the nut flush (Ace-high) could beat you.`,
      vulnerability: 0.15,
      kicker: "n/a",
      boardTexture,
      isNutted: false,
      drawStrength,
    };
  }

  if (maxHoleFlushRank >= 9) {
    return {
      category: "good",
      label: "Medium Flush",
      description: `A made flush, but not the strongest. Higher flushes are possible. Play cautiously against heavy action.`,
      vulnerability: 0.3,
      kicker: "n/a",
      boardTexture,
      isNutted: false,
      drawStrength,
    };
  }

  return {
    category: "marginal",
    label: "Weak Flush",
    description: `A low flush. Vulnerable to any higher flush. Be very cautious if facing large bets.`,
    vulnerability: 0.5,
    kicker: "n/a",
    boardTexture,
    isNutted: false,
    drawStrength,
  };
}

function analyzeStraight(
  holeCards: Card[],
  boardCards: Card[],
  boardTexture: BoardTexture,
  drawStrength: DrawStrength | null
): HandStrengthInfo {
  const holeRanks = holeCards.map((c) => RANK_VALUES[parseCard(c).rank]);
  const boardRanks = boardCards.map((c) => RANK_VALUES[parseCard(c).rank]);
  const allRanks = [...holeRanks, ...boardRanks].sort((a, b) => b - a);

  // Find the straight: 5 consecutive ranks
  const uniqueRanks = [...new Set(allRanks)].sort((a, b) => b - a);
  // Include Ace as 1 for wheel
  if (uniqueRanks.includes(14)) uniqueRanks.push(1);

  let straightHigh = 0;
  for (let i = 0; i <= uniqueRanks.length - 5; i++) {
    if (uniqueRanks[i] - uniqueRanks[i + 4] === 4) {
      straightHigh = uniqueRanks[i];
      break;
    }
  }

  // Determine if a higher straight is possible
  // Check if there's a set of board cards that could combine with hole cards to make a higher straight
  const maxPossibleStraightHigh = Math.min(14, Math.max(...boardRanks) + 2);

  // Check if we're using both hole cards in the straight (more concealed)
  const holeSorted = [...holeRanks].sort((a, b) => b - a);
  const usesBothHoleCards =
    holeSorted.length >= 2 &&
    holeSorted[0] !== holeSorted[1] &&
    holeSorted[0] - holeSorted[1] <= 4;

  // Is this the nut straight? Check if any higher straight is possible
  const boardMax = Math.max(...boardRanks);
  const holeMax = Math.max(...holeRanks);
  const isNutStraight = straightHigh >= 14 || holeMax > boardMax;

  // Check for flush-possible board (straight on flushy board = vulnerable)
  const flushVulnerability = boardTexture.flushPossible ? 0.35 : boardTexture.flushDrawPossible ? 0.15 : 0;

  if (isNutStraight && !boardTexture.flushPossible) {
    return {
      category: "premium",
      label: "Nut Straight",
      description: `The highest possible straight${usesBothHoleCards ? " using both hole cards (well-disguised)" : ""}. No higher straight exists.`,
      vulnerability: 0.05 + flushVulnerability,
      kicker: "n/a",
      boardTexture,
      isNutted: true,
      drawStrength,
    };
  }

  if (isNutStraight && boardTexture.flushPossible) {
    return {
      category: "good",
      label: "Nut Straight (Flush Possible)",
      description: `You have the best straight, but a flush is possible on this board. Proceed with caution.`,
      vulnerability: 0.35,
      kicker: "n/a",
      boardTexture,
      isNutted: false,
      drawStrength,
    };
  }

  // Non-nut straight
  if (straightHigh >= 12) {
    return {
      category: "good",
      label: "Strong Straight",
      description: `A high straight, but a higher straight could exist. Watch for opponents with higher connectors.`,
      vulnerability: 0.25 + flushVulnerability,
      kicker: "n/a",
      boardTexture,
      isNutted: false,
      drawStrength,
    };
  }

  // Low-end straight or "idiot end"
  if (holeMax <= Math.min(...boardRanks.filter((r) => r <= straightHigh && r >= straightHigh - 4))) {
    return {
      category: "marginal",
      label: "Bottom-End Straight",
      description: `You have the low end of the straight (the "idiot end"). Any opponent with a higher card makes a better straight.`,
      vulnerability: 0.5 + flushVulnerability,
      kicker: "n/a",
      boardTexture,
      isNutted: false,
      drawStrength,
    };
  }

  return {
    category: "good",
    label: "Straight",
    description: `A made straight. Be aware of higher straights and flush possibilities.`,
    vulnerability: 0.2 + flushVulnerability,
    kicker: "n/a",
    boardTexture,
    isNutted: false,
    drawStrength,
  };
}

function analyzeTrips(
  holeCards: Card[],
  boardCards: Card[],
  boardTexture: BoardTexture,
  drawStrength: DrawStrength | null
): HandStrengthInfo {
  const holeRanks = holeCards.map((c) => RANK_VALUES[parseCard(c).rank]);
  const boardRanks = boardCards.map((c) => RANK_VALUES[parseCard(c).rank]);
  const maxBoardRank = Math.max(...boardRanks);

  // Check if it's a set (pocket pair + one on board) vs trips (one hole card + two on board)
  const isPocketPair = holeRanks.length >= 2 && holeRanks[0] === holeRanks[1];

  if (isPocketPair) {
    // SET - pocket pair hit a card on the board (very concealed)
    const setRank = holeRanks[0];
    if (setRank >= maxBoardRank) {
      return {
        category: "premium",
        label: "Top Set",
        description: `Top set — the best possible three of a kind. Extremely well-disguised and powerful.`,
        vulnerability: boardTexture.isWet ? 0.2 : 0.08,
        kicker: "n/a",
        boardTexture,
        isNutted: true,
        drawStrength,
      };
    }
    if (setRank >= boardRanks.sort((a, b) => b - a)[1] || boardRanks.length <= 3) {
      return {
        category: "strong",
        label: "Middle Set",
        description: `Middle set — very strong but a higher set is possible if an opponent has a higher pocket pair.`,
        vulnerability: boardTexture.isWet ? 0.25 : 0.12,
        kicker: "n/a",
        boardTexture,
        isNutted: false,
        drawStrength,
      };
    }
    return {
      category: "good",
      label: "Bottom Set",
      description: `Bottom set — still strong, but vulnerable to higher sets. Play carefully on wet boards.`,
      vulnerability: boardTexture.isWet ? 0.35 : 0.18,
      kicker: "n/a",
      boardTexture,
      isNutted: false,
      drawStrength,
    };
  }

  // TRIPS - one hole card + pair on board (less concealed, opponents may also have trips)
  const tripRank = holeRanks.find((r) =>
    boardRanks.filter((br) => br === r).length >= 1 &&
    boardRanks.filter((br) => br === boardRanks.find((b) => boardRanks.filter((x) => x === b).length >= 2)!).length >= 2
  );

  // Simplified: just check kicker quality
  const maxHole = Math.max(...holeRanks);
  const otherHoleRanks = holeRanks.filter((r) => r !== maxHole);
  const kickerRank = otherHoleRanks.length > 0 ? Math.max(...otherHoleRanks) : maxHole;

  if (maxHole >= 12) {
    return {
      category: "strong",
      label: "Trips (Strong Kicker)",
      description: `Trips with a strong kicker. Good hand but less concealed than a set — opponents can also have trips with the board pair.`,
      vulnerability: 0.25,
      kicker: "strong",
      boardTexture,
      isNutted: false,
      drawStrength,
    };
  }

  return {
    category: "good",
    label: "Trips (Weak Kicker)",
    description: `Trips but with a weak kicker. An opponent with the same trips and a higher kicker dominates you.`,
    vulnerability: 0.4,
    kicker: "weak",
    boardTexture,
    isNutted: false,
    drawStrength,
  };
}

function analyzeTwoPair(
  holeCards: Card[],
  boardCards: Card[],
  boardTexture: BoardTexture,
  drawStrength: DrawStrength | null
): HandStrengthInfo {
  const holeRanks = holeCards.map((c) => RANK_VALUES[parseCard(c).rank]);
  const boardRanks = boardCards
    .map((c) => RANK_VALUES[parseCard(c).rank])
    .sort((a, b) => b - a);
  const maxBoardRank = boardRanks[0];
  const secondBoardRank = boardRanks.length > 1 ? boardRanks[1] : 0;

  // Check if both hole cards pair with the board (true two pair using both hole cards)
  const holeMatchesBoard = holeRanks.filter((hr) =>
    boardRanks.includes(hr)
  );

  if (holeMatchesBoard.length >= 2) {
    // Both hole cards pair with board cards
    const pairRanks = [...holeMatchesBoard].sort((a, b) => b - a);

    if (pairRanks[0] >= maxBoardRank && pairRanks[1] >= secondBoardRank) {
      return {
        category: "strong",
        label: "Top Two Pair",
        description: `Top two pair — both hole cards paired with the highest board cards. Strong hand.`,
        vulnerability: boardTexture.isWet ? 0.3 : 0.15,
        kicker: "n/a",
        boardTexture,
        isNutted: false,
        drawStrength,
      };
    }

    if (pairRanks[0] >= maxBoardRank) {
      return {
        category: "good",
        label: "Top and Bottom Two Pair",
        description: `Two pair with top pair, but the second pair is low. Vulnerable to higher two pairs.`,
        vulnerability: boardTexture.isWet ? 0.35 : 0.2,
        kicker: "n/a",
        boardTexture,
        isNutted: false,
        drawStrength,
      };
    }

    return {
      category: "marginal",
      label: "Bottom Two Pair",
      description: `Bottom two pair — any opponent pairing a higher board card has a better two pair. Vulnerable.`,
      vulnerability: boardTexture.isWet ? 0.5 : 0.35,
      kicker: "n/a",
      boardTexture,
      isNutted: false,
      drawStrength,
    };
  }

  // Pocket pair + board pair or one hole card pairing
  return {
    category: "good",
    label: "Two Pair",
    description: `Two pair. Watch out for higher two pairs and sets.`,
    vulnerability: boardTexture.isWet ? 0.35 : 0.2,
    kicker: "n/a",
    boardTexture,
    isNutted: false,
    drawStrength,
  };
}

function analyzePairStrength(
  holeCards: Card[],
  boardCards: Card[],
  boardTexture: BoardTexture,
  drawStrength: DrawStrength | null
): HandStrengthInfo {
  const holeRanks = holeCards.map((c) => ({
    rank: parseCard(c).rank,
    value: RANK_VALUES[parseCard(c).rank],
  }));
  const boardRanks = boardCards
    .map((c) => ({
      rank: parseCard(c).rank,
      value: RANK_VALUES[parseCard(c).rank],
    }))
    .sort((a, b) => b.value - a.value);

  const maxBoardValue = boardRanks[0]?.value ?? 0;
  const minBoardValue = boardRanks[boardRanks.length - 1]?.value ?? 0;

  const rankLabel = (v: number) => {
    const names: Record<number, string> = {
      14: "Aces", 13: "Kings", 12: "Queens", 11: "Jacks",
      10: "Tens", 9: "Nines", 8: "Eights", 7: "Sevens",
      6: "Sixes", 5: "Fives", 4: "Fours", 3: "Threes", 2: "Twos",
    };
    return names[v] || String(v);
  };

  // --- Pocket pair? ---
  if (holeRanks.length >= 2 && holeRanks[0].value === holeRanks[1].value) {
    const pairValue = holeRanks[0].value;

    if (pairValue > maxBoardValue) {
      // OVERPAIR
      if (pairValue >= 13) {
        // AA or KK overpair
        return {
          category: "premium",
          label: "Premium Overpair",
          description: `Pocket ${rankLabel(pairValue)} — an overpair above every board card. Extremely strong. Bet for value and protection.`,
          vulnerability: boardTexture.isWet ? 0.2 : 0.1,
          kicker: "n/a",
          boardTexture,
          isNutted: pairValue === 14,
          drawStrength,
        };
      }
      if (pairValue >= 10) {
        // QQ, JJ, TT overpair
        return {
          category: "strong",
          label: "Overpair",
          description: `Pocket ${rankLabel(pairValue)} over the board. Strong but watch for opponents with higher pocket pairs or sets.`,
          vulnerability: boardTexture.isWet ? 0.3 : 0.18,
          kicker: "n/a",
          boardTexture,
          isNutted: false,
          drawStrength,
        };
      }
      // 99-22 overpair on a very low board
      return {
        category: "good",
        label: "Low Overpair",
        description: `Pocket ${rankLabel(pairValue)} over a low board. Currently ahead, but vulnerable to any overcard.`,
        vulnerability: boardTexture.isWet ? 0.4 : 0.3,
        kicker: "n/a",
        boardTexture,
        isNutted: false,
        drawStrength,
      };
    }

    // UNDERPAIR - pocket pair below board cards
    if (pairValue < minBoardValue) {
      return {
        category: "weak",
        label: "Underpair",
        description: `Pocket ${rankLabel(pairValue)} below all board cards. Very weak — any opponent with a higher card likely has you beat. Consider folding to heavy action.`,
        vulnerability: 0.7,
        kicker: "n/a",
        boardTexture,
        isNutted: false,
        drawStrength,
      };
    }

    // Middle pocket pair (between board cards)
    return {
      category: "marginal",
      label: "Middle Pocket Pair",
      description: `Pocket ${rankLabel(pairValue)} sits between board cards. Marginal — opponents pairing higher board cards beat you.`,
      vulnerability: 0.55,
      kicker: "n/a",
      boardTexture,
      isNutted: false,
      drawStrength,
    };
  }

  // --- One hole card paired with the board ---
  // Find which hole card matched
  for (let i = 0; i < holeRanks.length; i++) {
    const hc = holeRanks[i];
    const matchesBoardIdx = boardRanks.findIndex((br) => br.value === hc.value);

    if (matchesBoardIdx !== -1) {
      // We paired this hole card with the board
      const otherHole = holeRanks.filter((_, idx) => idx !== i);
      const kickerValue = otherHole.length > 0 ? otherHole[0].value : 0;
      const kickerStrength: "strong" | "weak" =
        kickerValue >= 12 ? "strong" : "weak";

      if (matchesBoardIdx === 0) {
        // TOP PAIR
        if (kickerStrength === "strong") {
          return {
            category: "good",
            label: "Top Pair, Top Kicker",
            description: `Top pair with a ${rankLabel(kickerValue).slice(0, -1)} kicker — a strong made hand. Bet for value, but beware of two pair and sets.`,
            vulnerability: boardTexture.isWet ? 0.35 : 0.2,
            kicker: "strong",
            boardTexture,
            isNutted: false,
            drawStrength,
          };
        }
        return {
          category: "marginal",
          label: "Top Pair, Weak Kicker",
          description: `Top pair but with a weak kicker. Vulnerable to opponents who also paired the top card with a better kicker (kicker domination).`,
          vulnerability: boardTexture.isWet ? 0.5 : 0.35,
          kicker: "weak",
          boardTexture,
          isNutted: false,
          drawStrength,
        };
      }

      if (matchesBoardIdx === boardRanks.length - 1) {
        // BOTTOM PAIR
        return {
          category: "weak",
          label: "Bottom Pair",
          description: `Bottom pair — the weakest pair on the board. Almost any opponent pairing a higher card beats you. Fold to significant action.`,
          vulnerability: 0.65,
          kicker: kickerStrength,
          boardTexture,
          isNutted: false,
          drawStrength,
        };
      }

      // MIDDLE PAIR
      return {
        category: "marginal",
        label: "Middle Pair",
        description: `Middle pair — a marginal hand. You beat bottom pair and missed hands, but lose to top pair and better.`,
        vulnerability: boardTexture.isWet ? 0.55 : 0.45,
        kicker: kickerStrength,
        boardTexture,
        isNutted: false,
        drawStrength,
      };
    }
  }

  // Board paired itself — we don't contribute
  return {
    category: "weak",
    label: "Board Pair (No Connection)",
    description: `The pair is on the board and your hole cards don't connect. Essentially playing high cards. Very weak.`,
    vulnerability: 0.7,
    kicker: "weak",
    boardTexture,
    isNutted: false,
    drawStrength,
  };
}

function analyzeHighCard(
  holeCards: Card[],
  boardCards: Card[],
  boardTexture: BoardTexture,
  drawStrength: DrawStrength | null
): HandStrengthInfo {
  const holeRanks = holeCards.map((c) => RANK_VALUES[parseCard(c).rank]);
  const maxHole = Math.max(...holeRanks);

  if (drawStrength && drawStrength.isNutDraw) {
    return {
      category: "marginal",
      label: `High Card (${drawStrength.label})`,
      description: `No made hand yet, but you have a ${drawStrength.label}. Drawing to a very strong hand.`,
      vulnerability: 0.6,
      kicker: maxHole >= 12 ? "strong" : "weak",
      boardTexture,
      isNutted: false,
      drawStrength,
    };
  }

  if (drawStrength) {
    return {
      category: "weak",
      label: `High Card (${drawStrength.label})`,
      description: `No made hand. You're drawing, but even if you hit, your hand may not be the best.`,
      vulnerability: 0.7,
      kicker: maxHole >= 12 ? "strong" : "weak",
      boardTexture,
      isNutted: false,
      drawStrength,
    };
  }

  if (maxHole >= 14) {
    return {
      category: "weak",
      label: "Ace High",
      description: `Just Ace high — no pair, no draw. You might win at showdown against missed draws, but fold to any meaningful bet.`,
      vulnerability: 0.75,
      kicker: "strong",
      boardTexture,
      isNutted: false,
      drawStrength: null,
    };
  }

  return {
    category: "trash",
    label: "High Card (Nothing)",
    description: `No pair, no draw, no showdown value. Fold to any action.`,
    vulnerability: 0.9,
    kicker: "weak",
    boardTexture,
    isNutted: false,
    drawStrength: null,
  };
}
