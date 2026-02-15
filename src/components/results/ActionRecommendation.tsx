"use client";

import { motion } from "motion/react";
import { cn } from "@/utils/cn";
import type { ActionOption } from "@/engine/types";

interface ActionRecommendationProps {
  topActions: ActionOption[];
}

const CONFIDENCE_BADGE: Record<
  string,
  { label: string; bg: string }
> = {
  strong: { label: "Strong", bg: "bg-green-600" },
  moderate: { label: "Moderate", bg: "bg-yellow-600" },
  marginal: { label: "Marginal", bg: "bg-red-600" },
};

export default function ActionRecommendation({
  topActions,
}: ActionRecommendationProps) {
  if (topActions.length === 0) return null;

  return (
    <div>
      <h4 className="text-casino-muted text-xs uppercase tracking-wider mb-3">
        Top Actions
      </h4>
      <div className="flex flex-col gap-3">
        {topActions.map((action, index) => {
          const badge = CONFIDENCE_BADGE[action.confidence];
          const isFirst = index === 0;

          return (
            <motion.div
              key={`${action.action}-${index}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + index * 0.15 }}
              className={cn(
                "rounded-xl border p-4",
                isFirst
                  ? "border-white/20 bg-casino-dark shadow-[0_0_20px_rgba(255,255,255,0.05)]"
                  : "border-white/10 bg-casino-dark/50"
              )}
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-casino-muted text-xs font-mono w-4">
                  #{index + 1}
                </span>

                <span
                  className={cn(
                    "px-3 py-1 rounded-lg font-black tracking-wider",
                    isFirst ? "text-lg" : "text-sm"
                  )}
                  style={{
                    backgroundColor: action.color,
                    color: action.action === "raise" ? "#000" : "#fff",
                  }}
                >
                  {action.label}
                </span>

                <span
                  className={cn(
                    "px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider text-white",
                    badge.bg
                  )}
                >
                  {badge.label}
                </span>

                {isFirst && (
                  <span className="ml-auto text-[10px] text-casino-blue uppercase tracking-wider font-semibold">
                    Best Option
                  </span>
                )}
              </div>

              <p className="text-casino-muted text-xs leading-relaxed ml-7">
                {action.reasoning}
              </p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
