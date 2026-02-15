"use client";

import { motion } from "motion/react";
import { cn } from "@/utils/cn";
import type { HandOddsEntry } from "@/engine/types";

interface HandOddsDisplayProps {
  handOdds: HandOddsEntry[];
}

export default function HandOddsDisplay({ handOdds }: HandOddsDisplayProps) {
  if (handOdds.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
    >
      <h4 className="text-casino-muted text-xs uppercase tracking-wider mb-3">
        Improvement Probabilities
      </h4>
      <div className="bg-casino-dark rounded-xl border border-white/10 overflow-hidden">
        {handOdds.map((entry, index) => {
          const pct = (entry.probability * 100).toFixed(1);

          return (
            <div
              key={entry.handType}
              className={cn(
                "flex items-center gap-3 px-4 py-2.5",
                index < handOdds.length - 1 && "border-b border-white/5"
              )}
            >
              {/* Hand type name */}
              <span
                className={cn(
                  "text-sm w-32 shrink-0",
                  entry.currentlyHave
                    ? "text-casino-blue font-semibold"
                    : "text-casino-text"
                )}
              >
                {entry.handType}
                {entry.currentlyHave && (
                  <span className="text-[10px] text-casino-blue ml-1">
                    (current)
                  </span>
                )}
              </span>

              {/* Progress bar */}
              <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(entry.probability * 100, 100)}%` }}
                  transition={{ delay: 0.6 + index * 0.05, duration: 0.5 }}
                  className={cn(
                    "h-full rounded-full",
                    entry.currentlyHave
                      ? "bg-casino-blue"
                      : entry.probability > 0.3
                        ? "bg-casino-green"
                        : entry.probability > 0.1
                          ? "bg-casino-gold"
                          : "bg-casino-red/60"
                  )}
                />
              </div>

              {/* Percentage */}
              <span
                className={cn(
                  "text-sm font-mono w-14 text-right",
                  entry.currentlyHave
                    ? "text-casino-blue font-semibold"
                    : "text-casino-muted"
                )}
              >
                {pct}%
              </span>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
