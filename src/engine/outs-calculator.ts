import type { Card, DrawType, OutInfo, PokerVariant, Suit } from "./types";
import { RANK_VALUES, SUITS } from "./constants";
import { createDeck, parseCard, removeCards } from "./deck";
import { evaluateHand } from "./hand-evaluator";

export function calculateOuts(
  holeCards: Card[],
  boardCards: Card[],
  variant: PokerVariant = "texasHoldem"
): OutInfo[] {
  if (boardCards.length === 0 || boardCards.length === 5) {
    return []; // No outs on preflop or river
  }

  const allKnown = [...holeCards, ...boardCards];
  const remaining = removeCards(createDeck(variant), allKnown);
  const currentEval = evaluateHand(holeCards, boardCards, variant);
  const outs: OutInfo[] = [];

  // Check flush draw
  const flushOuts = checkFlushDraw(holeCards, boardCards, remaining);
  if (flushOuts) outs.push(flushOuts);

  // Check backdoor flush draw (only on flop)
  if (boardCards.length === 3) {
    const backdoorFlush = checkBackdoorFlushDraw(holeCards, boardCards);
    if (backdoorFlush) outs.push(backdoorFlush);
  }

  // Check straight draws
  const straightOuts = checkStraightDraws(holeCards, boardCards, remaining);
  outs.push(...straightOuts);

  // Check overcards
  const overcardOuts = checkOvercards(holeCards, boardCards, remaining, currentEval.rank);
  if (overcardOuts) outs.push(overcardOuts);

  // Check set draw (pocket pair needing third)
  const setOuts = checkSetDraw(holeCards, boardCards, remaining, currentEval.rank);
  if (setOuts) outs.push(setOuts);

  // Check full house draw
  const fhOuts = checkFullHouseDraw(holeCards, boardCards, remaining, currentEval.rank);
  if (fhOuts) outs.push(fhOuts);

  // Determine clean vs dirty for each out
  return outs.map((out) => ({
    ...out,
    isClean: isOutClean(out, holeCards, boardCards, variant),
  }));
}

function checkFlushDraw(
  holeCards: Card[],
  boardCards: Card[],
  remaining: Card[]
): OutInfo | null {
  const allCards = [...holeCards, ...boardCards];

  for (const suit of SUITS) {
    const suitedCount = allCards.filter((c) => parseCard(c).suit === suit).length;
    if (suitedCount === 4) {
      const flushOuts = remaining.filter((c) => parseCard(c).suit === suit);
      return {
        type: "flushDraw",
        outs: flushOuts,
        count: flushOuts.length,
        isClean: true,
      };
    }
  }
  return null;
}

function checkBackdoorFlushDraw(
  holeCards: Card[],
  boardCards: Card[]
): OutInfo | null {
  const allCards = [...holeCards, ...boardCards];

  for (const suit of SUITS) {
    const suitedCount = allCards.filter((c) => parseCard(c).suit === suit).length;
    // Need at least one hole card of the suit for a backdoor flush draw
    const holeHasSuit = holeCards.some((c) => parseCard(c).suit === suit);
    if (suitedCount === 3 && holeHasSuit) {
      return {
        type: "backdoorFlushDraw",
        outs: [],
        count: 1.5, // Effective outs
        isClean: true,
      };
    }
  }
  return null;
}

function checkStraightDraws(
  holeCards: Card[],
  boardCards: Card[],
  remaining: Card[]
): OutInfo[] {
  const allCards = [...holeCards, ...boardCards];
  const rankValues = [...new Set(allCards.map((c) => RANK_VALUES[parseCard(c).rank]))].sort(
    (a, b) => a - b
  );

  // Also handle Ace as low (value 1) for wheel straights
  if (rankValues.includes(14)) {
    rankValues.unshift(1);
  }

  const results: OutInfo[] = [];
  let foundOESD = false;
  let foundGutshot = false;

  // Check all possible 5-card straight windows
  for (let high = 5; high <= 14; high++) {
    const window = [high - 4, high - 3, high - 2, high - 1, high];
    const haveCount = window.filter((v) => rankValues.includes(v)).length;

    if (haveCount === 4) {
      // Find the missing value
      const missing = window.filter((v) => !rankValues.includes(v));

      if (missing.length === 1) {
        const missingVal = missing[0];
        const isEnd = missingVal === window[0] || missingVal === window[4];

        // Check if this is open-ended (missing on either end)
        // For OESD, we need to check if there are two possible cards to complete
        if (isEnd && !foundOESD) {
          // Check if the other end also works
          const otherEnd =
            missingVal === window[0] ? high + 1 : high - 5;
          const otherEndWorks =
            otherEnd >= 1 && otherEnd <= 14 && !rankValues.includes(otherEnd);

          // Not a true OESD from this window alone, but check adjacent windows
        }

        const outCards = remaining.filter((c) => {
          const val = RANK_VALUES[parseCard(c).rank];
          return val === missingVal || (missingVal === 1 && val === 14);
        });

        if (outCards.length > 0) {
          // Determine if open-ended or gutshot
          // Open-ended: missing card is at either end of the sequence
          if (isEnd && !foundOESD) {
            // Check the complementary window for OESD
            const complementMissing =
              missingVal === window[0] ? high + 1 : high - 5;
            if (
              complementMissing >= 2 &&
              complementMissing <= 14
            ) {
              const complementOuts = remaining.filter((c) => {
                const val = RANK_VALUES[parseCard(c).rank];
                return val === complementMissing;
              });
              if (complementOuts.length > 0) {
                foundOESD = true;
                results.push({
                  type: "openEndedStraightDraw",
                  outs: [...outCards, ...complementOuts],
                  count: outCards.length + complementOuts.length,
                  isClean: true,
                });
                continue;
              }
            }
          }

          if (!foundGutshot && !foundOESD) {
            foundGutshot = true;
            results.push({
              type: "gutshotStraightDraw",
              outs: outCards,
              count: outCards.length,
              isClean: true,
            });
          }
        }
      }
    }
  }

  return results;
}

function checkOvercards(
  holeCards: Card[],
  boardCards: Card[],
  remaining: Card[],
  currentRank: number
): OutInfo | null {
  // Only relevant if current hand is high card or pair-level
  if (currentRank > 2) return null;

  const boardMaxValue = Math.max(
    ...boardCards.map((c) => RANK_VALUES[parseCard(c).rank])
  );

  const overcards = holeCards.filter(
    (c) => RANK_VALUES[parseCard(c).rank] > boardMaxValue
  );

  if (overcards.length === 0) return null;

  // Outs are cards that pair our overcards
  const outCards: Card[] = [];
  for (const oc of overcards) {
    const ocRank = parseCard(oc).rank;
    const matchingCards = remaining.filter(
      (c) => parseCard(c).rank === ocRank
    );
    outCards.push(...matchingCards);
  }

  if (outCards.length === 0) return null;

  return {
    type: "overcards",
    outs: outCards,
    count: outCards.length,
    isClean: true,
  };
}

function checkSetDraw(
  holeCards: Card[],
  boardCards: Card[],
  remaining: Card[],
  currentRank: number
): OutInfo | null {
  // Only for pocket pairs that haven't hit a set
  if (holeCards.length < 2) return null;
  const r1 = parseCard(holeCards[0]).rank;
  const r2 = parseCard(holeCards[1]).rank;

  if (r1 !== r2) return null;
  if (currentRank >= 4) return null; // Already have trips or better

  const outCards = remaining.filter((c) => parseCard(c).rank === r1);

  if (outCards.length === 0) return null;

  return {
    type: "setDraw",
    outs: outCards,
    count: outCards.length,
    isClean: true,
  };
}

function checkFullHouseDraw(
  holeCards: Card[],
  boardCards: Card[],
  remaining: Card[],
  currentRank: number
): OutInfo | null {
  // Relevant when we have trips and need a full house
  if (currentRank !== 4) return null; // rank 4 = Three of a kind in pokersolver

  const allCards = [...holeCards, ...boardCards];
  const outCards: Card[] = [];

  // Cards that pair the board or our hand to make a full house
  for (const card of remaining) {
    const testBoard = [...boardCards, card];
    try {
      const newEval = evaluateHand(holeCards, testBoard, "texasHoldem");
      if (newEval.rank > currentRank) {
        outCards.push(card);
      }
    } catch {
      continue;
    }
  }

  if (outCards.length === 0) return null;

  return {
    type: "fullHouseDraw",
    outs: outCards,
    count: outCards.length,
    isClean: true,
  };
}

function isOutClean(
  outInfo: OutInfo,
  holeCards: Card[],
  boardCards: Card[],
  variant: PokerVariant
): boolean {
  if (outInfo.outs.length === 0) return true;

  // Sample a few outs to check if they also improve typical opponent hands
  const samplesToCheck = Math.min(outInfo.outs.length, 3);
  let dirtyCount = 0;

  for (let i = 0; i < samplesToCheck; i++) {
    const outCard = outInfo.outs[i];
    const newBoard = [...boardCards, outCard];

    // Check against a few random opponent hands
    const remaining = removeCards(createDeck(variant), [
      ...holeCards,
      ...boardCards,
      outCard,
    ]);

    let oppImproved = 0;
    const oppTests = Math.min(20, Math.floor(remaining.length / 2));

    for (let j = 0; j < oppTests; j++) {
      const opp1 = remaining[j * 2];
      const opp2 = remaining[j * 2 + 1];
      if (!opp1 || !opp2) break;

      try {
        const oppOld = evaluateHand([opp1, opp2], boardCards, variant);
        const oppNew = evaluateHand([opp1, opp2], newBoard, variant);
        const heroNew = evaluateHand(holeCards, newBoard, variant);

        if (oppNew.rank > oppOld.rank && oppNew.rank >= heroNew.rank) {
          oppImproved++;
        }
      } catch {
        continue;
      }
    }

    if (oppImproved / oppTests > 0.3) {
      dirtyCount++;
    }
  }

  return dirtyCount < samplesToCheck / 2;
}

export function getTotalOuts(outs: OutInfo[]): {
  totalClean: number;
  totalDirty: number;
} {
  // Deduplicate outs across draw types
  const cleanCards = new Set<Card>();
  const dirtyCards = new Set<Card>();

  for (const out of outs) {
    for (const card of out.outs) {
      if (out.isClean) {
        cleanCards.add(card);
      } else {
        dirtyCards.add(card);
      }
    }
  }

  // Remove cards that appear as both clean and dirty (keep as clean)
  for (const card of cleanCards) {
    dirtyCards.delete(card);
  }

  return {
    totalClean: cleanCards.size,
    totalDirty: dirtyCards.size,
  };
}
