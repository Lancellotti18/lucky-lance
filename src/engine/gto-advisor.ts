import type { Action, ActionOption, OutInfo, Street } from "./types";
import type { HandStrengthInfo } from "./hand-strength";

export interface Recommendation {
  action: Action;
  confidence: "strong" | "moderate" | "marginal";
}

export function getRecommendation(
  equity: number,
  potOdds: number | null,
  street: Street,
  outs: OutInfo[],
  totalCleanOuts: number,
  handStrength?: HandStrengthInfo | null
): Recommendation {
  if (potOdds === null || potOdds === 0) {
    // No bet to face
    if (equity > 0.55) return { action: "raise", confidence: "strong" };
    if (equity > 0.45) return { action: "raise", confidence: "moderate" };
    return { action: "check", confidence: "moderate" };
  }

  const equityThreshold = potOdds;

  if (equity > equityThreshold + 0.15) {
    return {
      action: "raise",
      confidence: equity > equityThreshold + 0.25 ? "strong" : "moderate",
    };
  }

  if (equity > equityThreshold) {
    return {
      action: "call",
      confidence: equity > equityThreshold + 0.05 ? "strong" : "moderate",
    };
  }

  // Consider outs-based calls on flop/turn
  if (
    equity > equityThreshold - 0.05 &&
    totalCleanOuts >= 8 &&
    (street === "flop" || street === "turn")
  ) {
    // Nut draws get a boost
    if (handStrength?.drawStrength?.isNutDraw) {
      return { action: "call", confidence: "moderate" };
    }
    return { action: "call", confidence: "marginal" };
  }

  if (equity > equityThreshold - 0.03) {
    return { action: "fold", confidence: "marginal" };
  }

  return {
    action: "fold",
    confidence: equity < equityThreshold - 0.1 ? "strong" : "moderate",
  };
}

const ACTION_COLORS: Record<Action, string> = {
  fold: "#dc2626",
  call: "#22c55e",
  raise: "#f59e0b",
  check: "#3b82f6",
};

// Adjust confidence based on hand strength category
function adjustConfidence(
  base: "strong" | "moderate" | "marginal",
  action: Action,
  hs: HandStrengthInfo | null | undefined
): "strong" | "moderate" | "marginal" {
  if (!hs) return base;

  const order: Record<string, number> = { marginal: 0, moderate: 1, strong: 2 };
  let level = order[base];

  if (action === "raise") {
    if (hs.category === "premium" || hs.isNutted) level = Math.min(2, level + 1);
    if (hs.category === "weak" || hs.category === "trash") level = Math.max(0, level - 1);
    // Vulnerable hands on wet boards shouldn't raise as confidently
    if (hs.vulnerability > 0.4 && hs.boardTexture.isWet) level = Math.max(0, level - 1);
  }

  if (action === "call") {
    if (hs.category === "premium" || hs.category === "strong") level = Math.min(2, level + 1);
    if (hs.category === "trash") level = Math.max(0, level - 1);
    // Nut draws are better calls
    if (hs.drawStrength?.isNutDraw) level = Math.min(2, level + 1);
    // Weak draws are worse calls
    if (hs.drawStrength && !hs.drawStrength.isNutDraw && hs.drawStrength.impliedOddsMultiplier < 0.9) {
      level = Math.max(0, level - 1);
    }
  }

  if (action === "fold") {
    // Strong/premium hands should have lower fold confidence
    if (hs.category === "premium" || hs.category === "strong") level = Math.max(0, level - 1);
    // Weak/trash should fold more confidently
    if (hs.category === "weak" || hs.category === "trash") level = Math.min(2, level + 1);
  }

  return (["marginal", "moderate", "strong"] as const)[level];
}

// Build contextual reasoning based on hand strength
function buildReasoning(
  action: Action,
  equityPct: string,
  potOddsPct: string | null,
  hs: HandStrengthInfo | null | undefined,
  totalCleanOuts: number,
  noBet: boolean
): string {
  const hsLabel = hs?.label || "your hand";
  const vulnerability = hs?.vulnerability ?? 0;
  const boardDesc = hs?.boardTexture?.description || "";
  const drawDesc = hs?.drawStrength?.label || "";

  if (action === "raise") {
    if (noBet) {
      if (hs?.category === "premium" || hs?.category === "strong") {
        return `Your ${hsLabel} gives you ${equityPct}% equity. Bet for value — charge draws and build the pot.${hs?.boardTexture?.isWet ? " Protect your hand on this wet board." : ""}`;
      }
      if (hs?.category === "good") {
        return `With ${hsLabel} (${equityPct}% equity), a bet builds the pot and denies free cards to opponents on draws.`;
      }
      // Bluff/semi-bluff
      if (drawDesc) {
        return `Semi-bluff with your ${drawDesc}. You can win immediately or improve to a strong hand.`;
      }
      return `A bet could win the pot immediately. Your ${equityPct}% equity supports a value bet.`;
    }

    // Facing a bet — raising
    if (hs?.isNutted) {
      return `Your ${hsLabel} is the nuts or near-nuts with ${equityPct}% equity. Raise for maximum value — you dominate this board.`;
    }
    if (hs?.category === "premium" || hs?.category === "strong") {
      return `Your ${hsLabel} (${equityPct}% equity) far exceeds the ${potOddsPct}% pot odds. Raise to extract value and deny draws.`;
    }
    if (drawDesc) {
      return `With your ${drawDesc} and ${equityPct}% equity (vs ${potOddsPct}% needed), a raise can win now or set up a big pot when you hit.`;
    }
    return `Your ${equityPct}% equity exceeds the ${potOddsPct}% needed. Raise for value.`;
  }

  if (action === "call") {
    if (hs?.drawStrength?.isNutDraw) {
      return `Your ${drawDesc} has excellent implied odds — when you hit, you'll have the best hand. ${equityPct}% equity supports calling the ${potOddsPct}% pot odds.`;
    }
    if (hs?.drawStrength && !hs.drawStrength.isNutDraw) {
      return `Your ${drawDesc} gives you ${equityPct}% equity vs ${potOddsPct}% needed, but be aware: even if you hit, a higher ${drawDesc.includes("Flush") ? "flush" : "straight"} could beat you.`;
    }
    if (hs?.category === "good" || hs?.category === "strong") {
      return `Your ${hsLabel} has ${equityPct}% equity against the ${potOddsPct}% pot odds. Calling is profitable.${vulnerability > 0.3 ? " But beware of draws completing on later streets." : ""}`;
    }
    if (totalCleanOuts >= 8) {
      return `With ${totalCleanOuts} outs${drawDesc ? ` (${drawDesc})` : ""}, implied odds justify a call despite slightly lacking the ${potOddsPct}% needed.`;
    }
    return `Your ${equityPct}% equity beats the ${potOddsPct}% pot odds. Calling is +EV.`;
  }

  if (action === "check") {
    if (hs?.category === "premium" || hs?.category === "strong") {
      return `Check-trapping with your ${hsLabel} can induce bluffs and disguise your ${equityPct}% equity hand.`;
    }
    if (hs?.category === "marginal" || hs?.category === "weak") {
      return `With ${hsLabel}, checking keeps the pot small and avoids tough decisions. See the next card for free.`;
    }
    return `Check to control the pot size and see the next card.`;
  }

  // FOLD
  if (hs?.category === "weak" || hs?.category === "trash") {
    return `Your ${hsLabel} has only ${equityPct}% equity, below the ${potOddsPct}% needed. ${hs.description}`;
  }
  if (hs?.drawStrength && !hs.drawStrength.isNutDraw) {
    return `Your ${drawDesc} has only ${equityPct}% equity vs ${potOddsPct}% needed, and even hitting could lose to a stronger hand. Fold and save chips.`;
  }
  if (vulnerability > 0.5) {
    return `Your ${hsLabel} is too vulnerable with ${equityPct}% equity below the ${potOddsPct}% threshold. Folding saves chips for better spots.`;
  }
  return `Your ${equityPct}% equity is below the ${potOddsPct}% needed. Folding is the disciplined play.`;
}

export function getTopActions(
  equity: number,
  potOdds: number | null,
  street: Street,
  totalCleanOuts: number,
  handStrength?: HandStrengthInfo | null
): ActionOption[] {
  const equityPct = (equity * 100).toFixed(1);
  const potOddsPct = potOdds ? (potOdds * 100).toFixed(1) : null;
  const options: ActionOption[] = [];

  const noBet = potOdds === null || potOdds === 0;
  const hs = handStrength ?? null;

  // --- RAISE ---
  if (noBet) {
    if (equity > 0.45) {
      const baseConf: "strong" | "moderate" = equity > 0.55 ? "strong" : "moderate";
      options.push({
        action: "raise",
        label: "RAISE",
        reasoning: buildReasoning("raise", equityPct, potOddsPct, hs, totalCleanOuts, true),
        confidence: adjustConfidence(baseConf, "raise", hs),
        color: ACTION_COLORS.raise,
      });
    } else {
      options.push({
        action: "raise",
        label: "RAISE (Bluff)",
        reasoning: buildReasoning("raise", equityPct, potOddsPct, hs, totalCleanOuts, true),
        confidence: adjustConfidence("marginal", "raise", hs),
        color: ACTION_COLORS.raise,
      });
    }
  } else {
    if (equity > (potOdds ?? 0) + 0.1) {
      const baseConf: "strong" | "moderate" =
        equity > (potOdds ?? 0) + 0.2 ? "strong" : "moderate";
      options.push({
        action: "raise",
        label: "RAISE",
        reasoning: buildReasoning("raise", equityPct, potOddsPct, hs, totalCleanOuts, false),
        confidence: adjustConfidence(baseConf, "raise", hs),
        color: ACTION_COLORS.raise,
      });
    }
  }

  // --- CALL ---
  if (!noBet) {
    if (equity >= (potOdds ?? 0)) {
      const baseConf: "strong" | "moderate" =
        equity > (potOdds ?? 0) + 0.05 ? "strong" : "moderate";
      options.push({
        action: "call",
        label: "CALL",
        reasoning: buildReasoning("call", equityPct, potOddsPct, hs, totalCleanOuts, false),
        confidence: adjustConfidence(baseConf, "call", hs),
        color: ACTION_COLORS.call,
      });
    } else if (
      totalCleanOuts >= 8 &&
      equity > (potOdds ?? 0) - 0.08 &&
      (street === "flop" || street === "turn")
    ) {
      options.push({
        action: "call",
        label: hs?.drawStrength?.isNutDraw ? "CALL (Nut Draw)" : "CALL (Drawing)",
        reasoning: buildReasoning("call", equityPct, potOddsPct, hs, totalCleanOuts, false),
        confidence: adjustConfidence("marginal", "call", hs),
        color: ACTION_COLORS.call,
      });
    }
  }

  // --- CHECK ---
  if (noBet) {
    const baseConf: "strong" | "moderate" = equity > 0.5 ? "moderate" : "strong";
    options.push({
      action: "check",
      label: "CHECK",
      reasoning: buildReasoning("check", equityPct, potOddsPct, hs, totalCleanOuts, true),
      confidence: adjustConfidence(baseConf, "check", hs),
      color: ACTION_COLORS.check,
    });
  }

  // --- FOLD ---
  if (!noBet) {
    if (equity < (potOdds ?? 0)) {
      const baseConf: "strong" | "marginal" =
        equity < (potOdds ?? 0) - 0.1 ? "strong" : "marginal";
      options.push({
        action: "fold",
        label: "FOLD",
        reasoning: buildReasoning("fold", equityPct, potOddsPct, hs, totalCleanOuts, false),
        confidence: adjustConfidence(baseConf, "fold", hs),
        color: ACTION_COLORS.fold,
      });
    }
  }

  // Sort: strong first, then moderate, then marginal
  const confidenceOrder = { strong: 0, moderate: 1, marginal: 2 };
  options.sort(
    (a, b) => confidenceOrder[a.confidence] - confidenceOrder[b.confidence]
  );

  return options.slice(0, 3);
}
