"use client";

import { motion } from "motion/react";
import type { AnalysisResult } from "@/engine/types";
import DetectedHand from "./DetectedHand";
import EquityDisplay from "./EquityDisplay";
import OutsDisplay from "./OutsDisplay";
import PotOddsDisplay from "./PotOddsDisplay";
import ActionRecommendation from "./ActionRecommendation";
import HandOddsDisplay from "./HandOddsDisplay";
import StrategyExplanation from "./StrategyExplanation";
import Button from "@/components/ui/Button";
import { useGameStore } from "@/stores/game-store";

interface ResultsScreenProps {
  result: AnalysisResult;
  onNewHand: () => void;
  aiExplanationLoading?: boolean;
}

export default function ResultsScreen({
  result,
  onNewHand,
  aiExplanationLoading = false,
}: ResultsScreenProps) {
  const { potSize, amountToCall } = useGameStore();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col gap-6 w-full max-w-lg mx-auto pb-8"
    >
      {/* Hand Name */}
      <div className="text-center">
        <span className="text-casino-muted text-xs uppercase tracking-wider">
          Current Hand
        </span>
        <h2 className="text-casino-text text-xl font-bold mt-1">
          {result.handName}
        </h2>
        {result.improvedHandName && (
          <p className="text-casino-blue text-sm mt-0.5">
            Drawing to: {result.improvedHandName}
          </p>
        )}
      </div>

      {/* Detected Cards */}
      <DetectedHand
        holeCards={result.holeCards}
        boardCards={result.boardCards}
      />

      {/* Divider */}
      <div className="border-t border-white/10" />

      {/* Action Recommendation - Top 3 */}
      <ActionRecommendation topActions={result.topActions} />

      {/* Equity */}
      <EquityDisplay equity={result.equity} />

      {/* Outs */}
      <OutsDisplay
        outs={result.outs}
        totalClean={result.totalCleanOuts}
        totalDirty={result.totalDirtyOuts}
      />

      {/* Hand Improvement Probabilities */}
      <HandOddsDisplay handOdds={result.handOdds} />

      {/* Pot Odds */}
      <PotOddsDisplay
        potOdds={result.potOdds}
        equity={result.equity}
        potSize={potSize}
        amountToCall={amountToCall}
      />

      {/* Divider */}
      <div className="border-t border-white/10" />

      {/* Strategy Explanation */}
      <StrategyExplanation
        explanation={result.explanation}
        isLoading={aiExplanationLoading}
      />

      {/* New Hand Button */}
      <Button fullWidth size="lg" onClick={onNewHand} className="mt-2">
        Analyze New Hand
      </Button>
    </motion.div>
  );
}
