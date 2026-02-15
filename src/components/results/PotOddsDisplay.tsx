"use client";

import { motion } from "motion/react";
import { cn } from "@/utils/cn";
import { formatPotOddsRatio } from "@/engine/pot-odds";

interface PotOddsDisplayProps {
  potOdds: number | null;
  equity: number;
  potSize?: number | null;
  amountToCall?: number | null;
}

export default function PotOddsDisplay({
  potOdds,
  equity,
  potSize,
  amountToCall,
}: PotOddsDisplayProps) {
  if (potOdds === null) {
    return (
      <div>
        <h4 className="text-casino-muted text-xs uppercase tracking-wider mb-2">
          Pot Odds
        </h4>
        <p className="text-casino-muted text-sm">
          No pot odds calculated (no bet to call).
        </p>
      </div>
    );
  }

  const potOddsPct = (potOdds * 100).toFixed(1);
  const equityPct = (equity * 100).toFixed(1);
  const isProfitable = equity >= potOdds;
  const ratio =
    potSize && amountToCall
      ? formatPotOddsRatio(potSize, amountToCall)
      : null;

  return (
    <div>
      <h4 className="text-casino-muted text-xs uppercase tracking-wider mb-2">
        Pot Odds
      </h4>

      {/* Odds ratio */}
      {ratio && (
        <p className="text-casino-text text-sm mb-2">
          Pot odds:{" "}
          <span className="text-casino-blue font-semibold">{ratio}</span>
        </p>
      )}

      {/* Comparison bar */}
      <div className="relative w-full h-8 bg-casino-dark rounded-lg overflow-hidden mb-2">
        {/* Equity bar */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${equity * 100}%` }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className={cn(
            "absolute top-0 left-0 h-full rounded-lg opacity-60",
            isProfitable ? "bg-casino-green" : "bg-casino-red"
          )}
        />

        {/* Pot odds threshold line */}
        <motion.div
          initial={{ left: 0 }}
          animate={{ left: `${potOdds * 100}%` }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="absolute top-0 h-full w-0.5 bg-white z-10"
        />

        {/* Labels */}
        <div className="absolute inset-0 flex items-center justify-between px-3 z-20">
          <span className="text-white text-xs font-medium">
            Equity: {equityPct}%
          </span>
          <span className="text-white/80 text-xs">
            Need: {potOddsPct}%
          </span>
        </div>
      </div>

      <p className="text-casino-muted text-sm">
        You need{" "}
        <span className="text-casino-text font-medium">{potOddsPct}%</span>{" "}
        equity to call. You have{" "}
        <span
          className={cn(
            "font-medium",
            isProfitable ? "text-casino-green" : "text-casino-red"
          )}
        >
          {equityPct}%
        </span>
        .
      </p>
    </div>
  );
}
