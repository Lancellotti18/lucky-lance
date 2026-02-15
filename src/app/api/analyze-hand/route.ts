import { NextRequest, NextResponse } from "next/server";
import type { Card, PokerVariant, AnalysisResult } from "@/engine/types";
import { validateCards } from "@/engine/validation";
import { calculateEquity } from "@/engine/equity-calculator";
import { calculateOuts, getTotalOuts } from "@/engine/outs-calculator";
import { calculatePotOdds } from "@/engine/pot-odds";
import { getRecommendation, getTopActions } from "@/engine/gto-advisor";
import { calculateHandOdds } from "@/engine/hand-odds";
import { generateExplanation } from "@/engine/strategy-templates";
import { getHandName } from "@/engine/hand-evaluator";
import { getStreet } from "@/engine/deck";
import { analyzeHandStrength } from "@/engine/hand-strength";
import { analyzeWhatBeatsMe } from "@/engine/what-beats-me";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      holeCards,
      boardCards,
      variant = "texasHoldem",
      potSize,
      amountToCall,
      gtoMode = false,
    } = body as {
      holeCards: Card[];
      boardCards: Card[];
      variant: PokerVariant;
      potSize?: number;
      amountToCall?: number;
      gtoMode?: boolean;
    };

    // Validate cards
    const validation = validateCards(holeCards, boardCards, variant);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.errors.join("; "), code: "INVALID_CARDS" },
        { status: 400 }
      );
    }

    // Determine street
    const street = getStreet(boardCards);

    // Calculate equity (Monte Carlo)
    const equity = calculateEquity(holeCards, boardCards, variant);

    // Calculate outs
    const outs = calculateOuts(holeCards, boardCards, variant);
    const { totalClean, totalDirty } = getTotalOuts(outs);

    // Calculate pot odds
    let potOdds: number | null = null;
    if (potSize !== undefined && amountToCall !== undefined && amountToCall > 0) {
      potOdds = calculatePotOdds(potSize, amountToCall);
    }

    // Analyze hand strength (overpairs, nut flushes, etc.)
    const hsInfo = analyzeHandStrength(holeCards, boardCards, variant, outs);

    // Get GTO recommendation (hand-strength-aware)
    const recommendation = getRecommendation(
      equity,
      potOdds,
      street,
      outs,
      totalClean,
      hsInfo
    );

    // Get hand name
    const handName = getHandName(holeCards, boardCards, variant);

    // Determine what hand we'd improve to
    let improvedHandName: string | null = null;
    if (outs.length > 0) {
      // Find the best draw type and what it would make
      const drawDescriptions: Record<string, string> = {
        flushDraw: "Flush",
        openEndedStraightDraw: "Straight",
        gutshotStraightDraw: "Straight",
        overcards: "Top Pair",
        setDraw: "Three of a Kind",
        fullHouseDraw: "Full House",
        backdoorFlushDraw: "Flush",
        backdoorStraightDraw: "Straight",
      };
      const primaryDraw = outs.sort((a, b) => b.count - a.count)[0];
      if (primaryDraw) {
        improvedHandName = drawDescriptions[primaryDraw.type] || null;
      }
    }

    // Get top 3 GTO actions (hand-strength-aware)
    const topActions = getTopActions(equity, potOdds, street, totalClean, hsInfo);

    // Calculate hand improvement probabilities
    const handOdds = calculateHandOdds(holeCards, boardCards, variant, 5000);

    // Analyze what opponent hands beat us on the current board
    const whatBeatsMe = analyzeWhatBeatsMe(holeCards, boardCards, variant);

    // Build analysis result
    const result: AnalysisResult = {
      holeCards,
      boardCards,
      street,
      equity,
      outs,
      totalCleanOuts: totalClean,
      totalDirtyOuts: totalDirty,
      potOdds,
      recommendedAction: recommendation.action,
      topActions,
      handOdds,
      whatBeatsMe,
      handName,
      improvedHandName,
      explanation: "", // Will be filled below
      handStrength: {
        category: hsInfo.category,
        label: hsInfo.label,
        description: hsInfo.description,
        vulnerability: hsInfo.vulnerability,
        isNutted: hsInfo.isNutted,
        boardDescription: hsInfo.boardTexture.description,
        drawLabel: hsInfo.drawStrength?.label ?? null,
        isNutDraw: hsInfo.drawStrength?.isNutDraw ?? false,
      },
    };

    // Generate explanation
    result.explanation = generateExplanation(result, gtoMode);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Analysis error:", error);

    const message =
      error instanceof Error ? error.message : "Internal server error";

    return NextResponse.json(
      { error: message, code: "ANALYSIS_FAILED" },
      { status: 500 }
    );
  }
}
