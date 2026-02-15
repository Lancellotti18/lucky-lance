import type { AnalysisResult } from "./types";
import { DRAW_TYPE_NAMES } from "./constants";

export function generateExplanation(
  result: AnalysisResult,
  gtoMode: boolean = false
): string {
  const equityPct = (result.equity * 100).toFixed(1);
  const potOddsPct = result.potOdds
    ? (result.potOdds * 100).toFixed(1)
    : null;
  const { recommendedAction, totalCleanOuts, totalDirtyOuts, outs, handName } =
    result;

  const drawNames = outs
    .filter((o) => o.count > 0)
    .map((o) => DRAW_TYPE_NAMES[o.type] || o.type);

  let explanation = "";

  // Build explanation based on scenario
  if (recommendedAction === "raise" && result.equity > 0.6) {
    // Strong value hand
    explanation = `You hold ${handName} with ${equityPct}% equity against a balanced range. This is a strong hand that should be raised for value.`;
    if (totalCleanOuts > 0) {
      explanation += ` You also have ${totalCleanOuts} clean outs to improve further.`;
    }
  } else if (recommendedAction === "raise") {
    // Moderate value raise
    explanation = `Your ${handName} gives you ${equityPct}% equity. This exceeds the required threshold significantly, making a raise profitable to build the pot.`;
  } else if (
    recommendedAction === "call" &&
    drawNames.length > 0 &&
    potOddsPct
  ) {
    // Drawing hand call
    explanation = `You have ${drawNames.join(" and ")} with ${totalCleanOuts} clean outs${totalDirtyOuts > 0 ? ` (${totalDirtyOuts} dirty)` : ""}. Your equity of ${equityPct}% exceeds the ${potOddsPct}% required by pot odds, making this a profitable call.`;
  } else if (recommendedAction === "call" && potOddsPct) {
    // Made hand call
    explanation = `Your ${handName} gives you ${equityPct}% equity. With pot odds requiring ${potOddsPct}%, you have sufficient equity to call.`;
  } else if (recommendedAction === "call") {
    explanation = `Your ${handName} has ${equityPct}% equity against a balanced range. This is strong enough to continue.`;
  } else if (recommendedAction === "check") {
    // Check
    explanation = `Your ${handName} gives you ${equityPct}% equity. With no bet to call, checking allows you to see the next card and re-evaluate.`;
    if (drawNames.length > 0) {
      explanation += ` You have ${drawNames.join(" and ")} to potentially improve.`;
    }
  } else if (recommendedAction === "fold") {
    // Fold
    if (potOddsPct) {
      explanation = `Your ${handName} gives you only ${equityPct}% equity. With pot odds requiring ${potOddsPct}%, you don't have sufficient equity to call. This is a disciplined fold.`;
    } else {
      explanation = `Your ${handName} only provides ${equityPct}% equity against a balanced range. Folding preserves your stack for better spots.`;
    }
  }

  // Add GTO-specific context
  if (gtoMode) {
    explanation += getGTOContext(result, potOddsPct);
  }

  return explanation;
}

function getGTOContext(
  result: AnalysisResult,
  potOddsPct: string | null
): string {
  const equityPct = (result.equity * 100).toFixed(1);
  let gtoText = "";

  if (potOddsPct) {
    const ev =
      result.potOdds !== null
        ? (result.equity - result.potOdds) * 100
        : 0;
    const evSign = ev >= 0 ? "+" : "";
    gtoText += ` From a GTO perspective, this spot has an expected value of ${evSign}${ev.toFixed(1)}% equity spread.`;
  }

  if (result.outs.length > 0 && result.street !== "river") {
    const rule = result.street === "flop" ? "rule of 4" : "rule of 2";
    const multiplier = result.street === "flop" ? 4 : 2;
    const approxEquity = result.totalCleanOuts * multiplier;
    gtoText += ` Using the ${rule}, ${result.totalCleanOuts} outs gives approximately ${approxEquity}% equity to improve.`;
  }

  if (result.recommendedAction === "raise") {
    gtoText += ` In a balanced GTO strategy, raising this hand maintains an optimal value-to-bluff ratio.`;
  }

  return gtoText;
}
