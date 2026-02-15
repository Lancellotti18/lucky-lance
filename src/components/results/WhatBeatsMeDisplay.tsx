"use client";

import { motion } from "motion/react";
import { cn } from "@/utils/cn";
import type { WhatBeatsMeResult } from "@/engine/types";
import CardIcon from "@/components/cards/CardIcon";

interface WhatBeatsMeDisplayProps {
  whatBeatsMe: WhatBeatsMeResult;
}

export default function WhatBeatsMeDisplay({
  whatBeatsMe,
}: WhatBeatsMeDisplayProps) {
  const { beatingGroups, totalPossibleCombos, beatingProbability } = whatBeatsMe;

  // Don't render if no board (preflop)
  if (totalPossibleCombos === 0) return null;

  const totalPct = (beatingProbability * 100).toFixed(1);

  // Nothing beats us
  if (beatingGroups.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55 }}
      >
        <h4 className="text-casino-muted text-xs uppercase tracking-wider mb-3">
          What Beats You
        </h4>
        <div className="bg-casino-dark rounded-xl border border-casino-green/30 p-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-casino-green/20 flex items-center justify-center shrink-0">
            <svg
              className="w-5 h-5 text-casino-green"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <div>
            <p className="text-casino-green font-semibold text-sm">
              You have the nuts!
            </p>
            <p className="text-casino-muted text-xs">
              No possible opponent hand beats you on this board.
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.55 }}
    >
      <div className="flex items-baseline justify-between mb-3">
        <h4 className="text-casino-muted text-xs uppercase tracking-wider">
          What Beats You
        </h4>
        <span
          className={cn(
            "text-xs font-mono font-semibold px-2 py-0.5 rounded",
            beatingProbability > 0.3
              ? "bg-casino-red/20 text-casino-red"
              : beatingProbability > 0.15
                ? "bg-casino-gold/20 text-casino-gold"
                : "bg-casino-green/20 text-casino-green"
          )}
        >
          {totalPct}% of hands
        </span>
      </div>

      <div className="bg-casino-dark rounded-xl border border-white/10 overflow-hidden">
        {beatingGroups.map((group, index) => {
          const pct = (group.probability * 100).toFixed(1);

          return (
            <div
              key={group.handName}
              className={cn(
                "px-4 py-3",
                index < beatingGroups.length - 1 && "border-b border-white/5"
              )}
            >
              {/* Hand name + bar + percentage */}
              <div className="flex items-center gap-3 mb-2">
                <span className="text-sm text-casino-text w-32 shrink-0">
                  {group.handName}
                </span>

                <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{
                      width: `${Math.min(group.probability * 100, 100)}%`,
                    }}
                    transition={{
                      delay: 0.65 + index * 0.05,
                      duration: 0.5,
                    }}
                    className={cn(
                      "h-full rounded-full",
                      group.probability > 0.15
                        ? "bg-casino-red"
                        : group.probability > 0.05
                          ? "bg-casino-gold"
                          : "bg-casino-muted/50"
                    )}
                  />
                </div>

                <span className="text-sm font-mono text-casino-muted w-14 text-right">
                  {pct}%
                </span>
              </div>

              {/* Example holdings + combo count */}
              <div className="flex items-center gap-3 ml-0.5">
                <span className="text-[10px] text-casino-muted">
                  {group.combos} combo{group.combos !== 1 ? "s" : ""}
                </span>

                {group.exampleHoldings.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-casino-muted">e.g.</span>
                    {group.exampleHoldings.slice(0, 2).map((holding, hi) => (
                      <div key={hi} className="flex gap-0.5">
                        <CardIcon card={holding[0]} size="sm" />
                        <CardIcon card={holding[1]} size="sm" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
